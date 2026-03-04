import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CheckoutClient from "@/app/traveler/bookings/components/CheckoutClient";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
            *,
            traveler:traveler_id (full_name, email),
            guide:guide_id (full_name, avatar_url, guides_detail(location, languages, rating)),
            tour:tour_id (title, photo, duration, max_guests, region)
        `)
        .eq('id', id)
        .eq('traveler_id', user.id)
        .single();

    if (error || !booking) {
        console.error("Booking not found or error:", error);
        notFound();
    }

    // Only confirmed bookings can be paid for
    if (booking.status !== 'confirmed') {
        redirect('/traveler/bookings');
    }

    return <CheckoutClient booking={booking} />;
}
