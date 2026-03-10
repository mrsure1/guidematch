import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function main() {
    const { data, error } = await supabase.from('bookings').insert({
        guide_id: '11111111-1111-1111-1111-111111111111',
        traveler_id: '38d6dfc7-21db-4c32-8996-19df14a60719',
        start_date: '2026-04-01',
        end_date: '2026-04-01',
        total_price: 150000,
        status: 'pending',
        guests: 2
    }).select();
    console.log("Error:", error);
}
main();
