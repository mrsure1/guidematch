import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:/MrSure/guidematch/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugSignup(testEmail) {
    console.log(`\n--- Starting signup debug for: ${testEmail} ---`);
    console.log(`Supabase URL: ${supabaseUrl}`);
    
    const startTime = Date.now();
    
    // In many cases, Supabase returns 200 even if email sending fails (it queues it)
    // However, we can check if a user is created in the auth.users table
    const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'Password123!',
        options: {
            data: {
                full_name: 'Debug User',
                role: 'traveler'
            }
        }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
        console.error('Signup Error Returned:', error);
        console.log('Status Code:', error.status);
    } else {
        console.log('Signup Success Response (Code 200/201)');
        console.log('User ID:', data.user?.id);
        console.log('User Confirmation Sent At:', data.user?.confirmation_sent_at);
        console.log('Session Created:', !!data.session);
        
        if (data.session) {
            console.log('WARNING: Session created immediately. "Confirm Email" might be OFF in Supabase settings.');
        } else {
            console.log('Confirmation email should be queued for delivery.');
        }
    }
    
    console.log(`Operation took ${duration}ms`);
}

// You can replace this with a real email if provided by the user, 
// but for now we test with a generated one to avoid conflicts.
const timestamp = Date.now();
debugSignup(`debug_${timestamp}@gmail.com`);
