import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
        return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update is_hidden_by_traveler to true
    const { data: updatedData, error } = await supabase
        .from('bookings')
        .update({ is_hidden_by_traveler: true })
        .eq('id', bookingId)
        .eq('traveler_id', user.id)
        .select();

    if (error) {
        console.error("Hiding error (Supabase):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedData || updatedData.length === 0) {
        return NextResponse.json({ error: 'Booking not found or not authorized' }, { status: 404 });
    }

    revalidatePath('/traveler/bookings');

    return NextResponse.json({ success: true });
}
