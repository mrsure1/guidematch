'use server';

import { createClient } from "@/lib/supabase/server";

export async function fetchToursAction({
    keyword = "",
    page = 0,
    pageSize = 10
}: {
    keyword?: string,
    page?: number,
    pageSize?: number
}) {
    const supabase = await createClient();
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('tours')
        .select(`
            *,
            profiles (
                full_name,
                avatar_url,
                guides_detail (
                    rating,
                    review_count,
                    languages
                )
            )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,region.ilike.%${keyword}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching tours:", error);
        return [];
    }

    return data || [];
}
