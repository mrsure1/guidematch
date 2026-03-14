import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:/MrSure/guidematch/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUserSecret(email) {
    console.log(`Checking details for: ${email}`);
    
    // Using Admin API to see user data
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
        console.log('User not found.');
        return;
    }

    console.log('User Found:', user.id);
    console.log('Confirmed At:', user.email_confirmed_at);
    console.log('Confirmation Sent At:', user.confirmation_sent_at);
    
    /* 
       Note: Supabase doesn't expose the actual verification link or token via public API 
       for security. It's usually stored in the auth.users table in the 'confirmation_token' column.
       We can't easily read that via the standard client unless we use a direct SQL query (not available here).
    */
    
    console.log('\n--- DIAGNOSIS ---');
    if (user.confirmation_sent_at && !user.email_confirmed_at) {
        console.log('PROBLEM: Confirmation email was sent/queued by Supabase, but the user hasn\'t clicked it.');
        console.log('This strongly suggests the mail is being blocked or sitting in Spam.');
    }
}

// Check the last debug user
const timestamp = 1773499002823; // From previous run
checkUserSecret(`debug_${timestamp}@gmail.com`);
