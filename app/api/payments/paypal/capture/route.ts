import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { buildTrackingContextFromHeaders, trackServerConversion } from '@/lib/analytics/server';
import { reportError, reportMessage } from '@/lib/monitoring/report';

const PAYPAL_ENV = process.env.PAYPAL_ENV || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL ||
    (PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

async function getPayPalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials are not configured');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(`PayPal auth failed: ${errorBody.error || response.status}`);
    }

    const data = await response.json();
    return data.access_token as string;
}

async function fetchPayPalOrder(orderId: string, accessToken: string) {
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(`PayPal order fetch failed: ${errorBody.name || response.status}`);
    }

    return response.json();
}

async function capturePayPalOrder(orderId: string, accessToken: string) {
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(`PayPal capture failed: ${errorBody.name || response.status}`);
    }

    return response.json();
}

export async function POST(request: Request) {
    try {
        const { orderID, bookingId } = await request.json();

        console.log("--- PayPal Capture Request ---", { orderID, bookingId });

        if (!orderID || !bookingId) {
            return NextResponse.json({ error: 'Missing orderID or bookingId' }, { status: 400 });
        }

        const supabase = await createClient();

        // Security check: ensure the user making the request owns the booking
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('id, traveler_id, status, total_price, payment_intent_id')
            .eq('id', bookingId)
            .single();

        if (fetchError || !booking || booking.traveler_id !== user.id) {
            return NextResponse.json({ error: 'Invalid booking' }, { status: 403 });
        }

        if (booking.status === 'paid' || booking.status === 'completed') {
            return NextResponse.json({ success: true, orderID, alreadyPaid: true });
        }

        if (booking.status !== 'confirmed') {
            await reportMessage('PayPal capture blocked due to invalid booking status', {
                source: 'api/payments/paypal/capture:invalid-status',
                level: 'warning',
                request,
                extra: { bookingId, status: booking.status },
            });
            return NextResponse.json({ error: 'Booking is not in a payable state' }, { status: 400 });
        }

        if (booking.payment_intent_id && booking.payment_intent_id !== orderID) {
            await reportMessage('PayPal capture blocked due to linked payment intent mismatch', {
                source: 'api/payments/paypal/capture:intent-mismatch',
                level: 'warning',
                request,
                extra: { bookingId, existing: booking.payment_intent_id, incoming: orderID },
            });
            return NextResponse.json({ error: 'Booking is already linked to another payment' }, { status: 409 });
        }

        const expectedUsdAmount = (Number(booking.total_price) / 1400).toFixed(2);

        const accessToken = await getPayPalAccessToken();
        const order = await fetchPayPalOrder(orderID, accessToken);

        const orderStatus = order?.status;
        const purchaseUnit = order?.purchase_units?.[0];
        const orderAmount = purchaseUnit?.amount;
        const orderValue = orderAmount?.value;
        const orderCurrency = orderAmount?.currency_code;

        if (!orderValue || !orderCurrency) {
            return NextResponse.json({ error: 'Invalid PayPal order data' }, { status: 502 });
        }

        if (orderCurrency !== 'USD' || orderValue !== expectedUsdAmount) {
            return NextResponse.json({ error: 'PayPal amount mismatch' }, { status: 400 });
        }

        let captureResponse = order;
        if (orderStatus !== 'COMPLETED') {
            if (orderStatus !== 'APPROVED') {
                return NextResponse.json({ error: 'PayPal order is not approved' }, { status: 400 });
            }
            captureResponse = await capturePayPalOrder(orderID, accessToken);
        }

        const captureStatus = captureResponse?.status;
        const captureUnit = captureResponse?.purchase_units?.[0]?.payments?.captures?.[0];
        const captureAmount = captureUnit?.amount?.value;
        const captureCurrency = captureUnit?.amount?.currency_code;

        if (captureStatus !== 'COMPLETED' || !captureAmount || !captureCurrency) {
            return NextResponse.json({ error: 'PayPal capture not completed' }, { status: 502 });
        }

        if (captureCurrency !== 'USD' || captureAmount !== expectedUsdAmount) {
            return NextResponse.json({ error: 'PayPal capture amount mismatch' }, { status: 400 });
        }

        // Update booking status in database
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'paid',
                payment_intent_id: orderID,
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error("Database update failed after PayPal payment:", updateError);
            await reportError(updateError, {
                source: 'api/payments/paypal/capture:update-failed',
                request,
                extra: { bookingId, orderID },
            });
            return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
        }

        await trackServerConversion(
            'payment_success',
            {
                bookingId,
                userId: user.id,
                value: Number(booking.total_price),
                currency: 'KRW',
                paymentProvider: 'paypal',
                paymentIntentId: orderID,
                eventId: `payment_success:paypal:${bookingId}:${orderID}`,
            },
            buildTrackingContextFromHeaders(
                request.headers,
                `${new URL(request.url).origin}/traveler/bookings`,
            ),
        );

        // Revalidate paths
        revalidatePath('/traveler/bookings');
        revalidatePath('/admin/payments');

        return NextResponse.json({ success: true, orderID });

    } catch (error: any) {
        console.error("PayPal Capture Error:", error);
        await reportError(error, {
            source: 'api/payments/paypal/capture:exception',
            request,
        });
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
