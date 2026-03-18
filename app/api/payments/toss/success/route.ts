import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildTrackingContextFromHeaders, trackServerConversion } from "@/lib/analytics/server";
import { reportError, reportMessage } from "@/lib/monitoring/report";

const widgetSecretKey = process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

type QueryValue = string | number | undefined;

function buildUrl(origin: string, path: string, params: Record<string, QueryValue> = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return `${origin}${path}${query ? `?${query}` : ""}`;
}

function successRedirect(origin: string, popup: boolean, orderId: string) {
  if (popup) {
    return NextResponse.redirect(
      buildUrl(origin, "/payment-popup", {
        status: "success",
        bookingId: orderId,
      }),
    );
  }

  return NextResponse.redirect(buildUrl(origin, "/traveler/bookings", { payment: "success" }));
}

function errorRedirect(
  origin: string,
  popup: boolean,
  orderId: string | null,
  error: string,
  message?: string,
) {
  if (popup) {
    if (!orderId) {
      return NextResponse.redirect(
        buildUrl(origin, "/payment-popup", {
          status: "error",
          message: error,
        }),
      );
    }

    return NextResponse.redirect(
      buildUrl(origin, `/payment-popup/${orderId}`, {
        error,
        message: message || error,
      }),
    );
  }

  if (!orderId) {
    return NextResponse.redirect(buildUrl(origin, "/traveler/bookings", { error }));
  }

  return NextResponse.redirect(
    buildUrl(origin, `/traveler/bookings/checkout/${orderId}`, {
      error,
    }),
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amountParam = searchParams.get("amount");
  const popup = searchParams.get("popup") === "1";

  if (!paymentKey || !orderId || !amountParam) {
    await reportMessage("Toss callback missing required params", {
      source: "api/payments/toss/success:missing-params",
      level: "warning",
      request,
      extra: {
        hasPaymentKey: Boolean(paymentKey),
        hasOrderId: Boolean(orderId),
        hasAmount: Boolean(amountParam),
      },
    });

    return errorRedirect(origin, popup, orderId, "invalid");
  }

  const amount = Number(amountParam);
  if (!Number.isFinite(amount) || amount <= 0) {
    await reportMessage("Toss callback has invalid amount", {
      source: "api/payments/toss/success:invalid-amount",
      level: "warning",
      request,
      extra: { orderId, amountParam },
    });

    return errorRedirect(origin, popup, orderId, "invalid");
  }

  try {
    const supabase = await createClient();

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, traveler_id, total_price, status, payment_intent_id")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !booking) {
      await reportError(fetchError || new Error("Booking not found"), {
        source: "api/payments/toss/success:booking-not-found",
        request,
        extra: { orderId },
      });

      return errorRedirect(origin, popup, orderId, "booking_not_found");
    }

    if (Number(booking.total_price) !== amount) {
      await reportMessage("Toss amount mismatch against booking", {
        source: "api/payments/toss/success:amount-mismatch",
        level: "warning",
        request,
        extra: {
          orderId,
          expected: Number(booking.total_price),
          received: amount,
        },
      });

      return errorRedirect(origin, popup, orderId, "amount_mismatch");
    }

    if (booking.status === "paid" || booking.status === "completed") {
      if (booking.payment_intent_id === paymentKey) {
        return successRedirect(origin, popup, orderId);
      }

      await reportMessage("Toss callback rejected for already paid booking", {
        source: "api/payments/toss/success:already-paid",
        level: "warning",
        request,
        extra: {
          orderId,
          status: booking.status,
          existingPaymentIntentId: booking.payment_intent_id,
          incomingPaymentKey: paymentKey,
        },
      });

      return errorRedirect(origin, popup, orderId, "invalid_booking_state");
    }

    if (booking.status !== "confirmed") {
      await reportMessage("Toss callback rejected due to invalid booking status", {
        source: "api/payments/toss/success:invalid-status",
        level: "warning",
        request,
        extra: {
          orderId,
          status: booking.status,
        },
      });

      return errorRedirect(origin, popup, orderId, "invalid_booking_state");
    }

    if (booking.payment_intent_id && booking.payment_intent_id !== paymentKey) {
      await reportMessage("Toss callback rejected due to linked payment intent mismatch", {
        source: "api/payments/toss/success:intent-mismatch",
        level: "warning",
        request,
        extra: {
          orderId,
          existingPaymentIntentId: booking.payment_intent_id,
          incomingPaymentKey: paymentKey,
        },
      });

      return errorRedirect(origin, popup, orderId, "invalid_booking_state");
    }

    const encryptedSecretKey = `Basic ${Buffer.from(`${widgetSecretKey}:`).toString("base64")}`;
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
        "Idempotency-Key": `${orderId}:${paymentKey}`,
      },
      body: JSON.stringify({
        orderId,
        amount,
        paymentKey,
      }),
    });

    const tossData = await response.json().catch(() => ({} as Record<string, unknown>));

    if (!response.ok) {
      const errorCode = String((tossData as { code?: string }).code || "TOSS_CONFIRM_FAILED");
      const errorMessage = String((tossData as { message?: string }).message || errorCode);

      if (errorCode === "ALREADY_PROCESSED_PAYMENT") {
        const { data: latestBooking } = await supabase
          .from("bookings")
          .select("status, payment_intent_id")
          .eq("id", orderId)
          .maybeSingle();

        if (latestBooking?.status === "paid" && latestBooking.payment_intent_id === paymentKey) {
          return successRedirect(origin, popup, orderId);
        }
      }

      await reportMessage("Toss confirm API rejected the payment", {
        source: "api/payments/toss/success:confirm-failed",
        level: "warning",
        request,
        extra: {
          orderId,
          paymentKey,
          errorCode,
          errorMessage,
        },
      });

      return errorRedirect(origin, popup, orderId, errorCode, errorMessage);
    }

    const tossStatus = String((tossData as { status?: string }).status || "");
    const tossTotalAmount = Number(
      (tossData as { totalAmount?: number; balanceAmount?: number }).totalAmount ??
        (tossData as { totalAmount?: number; balanceAmount?: number }).balanceAmount,
    );

    if (tossStatus && tossStatus !== "DONE") {
      await reportMessage("Toss confirm returned a non-final status", {
        source: "api/payments/toss/success:not-done",
        level: "warning",
        request,
        extra: { orderId, tossStatus },
      });

      return errorRedirect(origin, popup, orderId, "payment_not_done");
    }

    if (!Number.isFinite(tossTotalAmount) || tossTotalAmount !== amount) {
      await reportMessage("Toss confirm amount mismatch", {
        source: "api/payments/toss/success:confirm-amount-mismatch",
        level: "warning",
        request,
        extra: {
          orderId,
          expectedAmount: amount,
          confirmedAmount: tossTotalAmount,
        },
      });

      return errorRedirect(origin, popup, orderId, "amount_mismatch");
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "paid",
        payment_intent_id: paymentKey,
      })
      .eq("id", orderId)
      .eq("status", "confirmed")
      .select("id")
      .maybeSingle();

    if (updateError) {
      await reportError(updateError, {
        source: "api/payments/toss/success:update-failed",
        request,
        extra: {
          orderId,
          paymentKey,
        },
      });

      return errorRedirect(origin, popup, orderId, "internal");
    }

    if (!updatedBooking) {
      const { data: latestBooking } = await supabase
        .from("bookings")
        .select("status, payment_intent_id")
        .eq("id", orderId)
        .maybeSingle();

      if (latestBooking?.status === "paid" && latestBooking.payment_intent_id === paymentKey) {
        return successRedirect(origin, popup, orderId);
      }

      await reportMessage("Booking state transition to paid was rejected", {
        source: "api/payments/toss/success:state-transition-rejected",
        level: "warning",
        request,
        extra: {
          orderId,
          latestStatus: latestBooking?.status,
          latestPaymentIntentId: latestBooking?.payment_intent_id,
          incomingPaymentKey: paymentKey,
        },
      });

      return errorRedirect(origin, popup, orderId, "invalid_booking_state");
    }

    await trackServerConversion(
      "payment_success",
      {
        bookingId: orderId,
        userId: booking.traveler_id,
        value: amount,
        currency: "KRW",
        paymentProvider: "toss",
        paymentIntentId: paymentKey,
        eventId: `payment_success:toss:${orderId}:${paymentKey}`,
      },
      buildTrackingContextFromHeaders(request.headers, `${origin}/traveler/bookings`),
    );

    revalidatePath("/traveler/bookings");
    revalidatePath("/admin/payments");

    return successRedirect(origin, popup, orderId);
  } catch (error) {
    await reportError(error, {
      source: "api/payments/toss/success:exception",
      request,
      extra: { orderId, paymentKey },
    });

    return errorRedirect(origin, popup, orderId, "internal");
  }
}
