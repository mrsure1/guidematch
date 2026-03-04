import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SearchClient from "./SearchClient";

export default async function TravelerSearch() {
    const supabase = await createClient();

    // We don't strictly require login to search, but if required:
    // const { data: { user } } = await supabase.auth.getUser();

    // Fetch all guides with their details, using !inner to only get those with detail data
    const { data: guides, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            avatar_url,
            guides_detail (
                id,
                location,
                languages,
                bio,
                hourly_rate,
                rate_type,
                rating,
                review_count,
                is_verified
            )
        `)
        .eq('role', 'guide');

    if (error) {
        console.error("Error fetching guides:", error);
    }

    // Process guides to handle array relation return in supabase
    const processedGuides = (guides || []).map(g => {
        const guideDetail = g.guides_detail as any;
        if (guideDetail && Array.isArray(guideDetail)) {
            g.guides_detail = guideDetail[0] || {};
        }
        return g;
    });

    const { data: tours, error: toursError } = await supabase
        .from('tours')
        .select(`
            id,
            guide_id,
            title,
            description,
            region,
            duration,
            price,
            max_guests,
            photo,
            is_active,
            profiles (
                id,
                full_name,
                avatar_url,
                guides_detail (
                    rating,
                    review_count,
                    languages
                )
            )
        `)
        .eq('is_active', true);

    if (toursError) {
        console.error("Error fetching tours:", toursError);
    }

    // Process tours to match profile structure safely
    const processedTours = (tours || []).map(t => {
        const profile = t.profiles as any;
        if (profile && profile.guides_detail && Array.isArray(profile.guides_detail)) {
            profile.guides_detail = profile.guides_detail[0] || {};
        }
        return t;
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <SearchClient guides={processedGuides} tours={processedTours} />
        </div>
    );
}
