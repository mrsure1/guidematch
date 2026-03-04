import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testQuery() {
    // 1. Get confirmed bookings
    const { data: confirmedBookings, error: err1 } = await supabase
        .from('bookings')
        .select(`
            id, start_date, end_date, total_price, status, created_at, guide_id,
            traveler:profiles!traveler_id ( full_name, avatar_url )
        `)
        .eq('status', 'confirmed');

    if (err1) {
        console.error("Dashboard Query Error:", err1);
        return;
    }

    if (!confirmedBookings || confirmedBookings.length === 0) {
        console.log("No confirmed bookings found.");
        return;
    }

    console.log(`Found ${confirmedBookings.length} confirmed bookings.`);
    const tour = confirmedBookings[0];
    console.log("Testing with tour ID:", tour.id, "Guide ID:", tour.guide_id);

    // 2. Query exactly as [id]/page.tsx does
    const { data: booking, error: err2 } = await supabase
        .from('bookings')
        .select(`
            *,
            traveler:profiles!traveler_id (
                id,
                full_name,
                avatar_url,
                email
            )
        `)
        .eq('id', tour.id)
        .eq('guide_id', tour.guide_id)
        .single();

    if (err2 || !booking) {
        console.error("Booking Details API Error:", err2, "Booking:", booking);
    } else {
        console.log("Successfully retrieved booking details.");
    }
}

testQuery();
