import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function main() {
    const { data: cols, error } = await supabase.from('tours').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else if (cols && cols.length > 0) {
        console.log("Columns:", Object.keys(cols[0]));
        console.log("Sample Data:", cols[0]);
    } else {
        console.log("No tours found.");
    }
}
main();
