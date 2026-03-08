import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingsClient from "./BookingsClient";

function getTwentyFourHoursAgoIso(): string {
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

export default async function TravelerBookings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // [Lazy Cleanup] 24시간 내 미결제된 확정(confirmed) 예약 자동 취소 처리
    const twentyFourHoursAgo = getTwentyFourHoursAgoIso();

    await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('status', 'confirmed')
        .eq('traveler_id', user.id)
        .lt('updated_at', twentyFourHoursAgo);

    // 1. Fetch bookings first (after cleanup)
    const { data: rawBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('traveler_id', user.id)
        .eq('is_hidden_by_traveler', false)
        .order('created_at', { ascending: false });

    if (bookingsError) {
        console.error("Error fetching bookings table:", bookingsError);
    }

    let processedBookings: any[] = [];

    if (rawBookings && rawBookings.length > 0) {
        // 2. Extract unique guide IDs
        const guideIds = Array.from(new Set(rawBookings.map(b => b.guide_id)));

        // 3. Fetch guide profiles and details for these IDs
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                avatar_url,
                guides_detail (
                    rating,
                    location,
                    languages
                )
            `)
            .in('id', guideIds);

        if (profilesError) {
            console.error("Error fetching guide profiles for bookings:", profilesError);
        }

        // 4. Manual Join: Merge profiles into bookings
        processedBookings = rawBookings.map(booking => {
            const profile = profiles?.find(p => p.id === booking.guide_id);
            if (profile) {
                const detail = Array.isArray(profile.guides_detail)
                    ? profile.guides_detail[0]
                    : profile.guides_detail;

                return {
                    ...booking,
                    guide: {
                        ...profile,
                        guides_detail: detail || {}
                    }
                };
            }
            return { ...booking, guide: null };
        });
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <BookingsClient bookings={processedBookings} />
        </div>
    );
}
