import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:/MrSure/guidematch/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function forceVerifyUser(email) {
    console.log(`Force verifying user: ${email}`);
    
    // 1. Get user ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error(listError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.log('User not found.');
        return;
    }

    // 2. Update user to be confirmed
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
    });

    if (error) {
        console.error('Error verifying user:', error);
    } else {
        console.log(`Successfully verified: ${email}`);
        console.log('Now you can login with this account.');
    }
}

// Usage: node force_verify.mjs <email>
const emailArg = process.argv[2];
if (emailArg) {
    forceVerifyUser(emailArg);
} else {
    console.log('Please provide an email as argument: node force_verify.mjs user@example.com');
}
