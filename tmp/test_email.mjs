import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: 'd:/MrSure/guidematch/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testResetPassword(email) {
  console.log(`Testing password reset for: ${email}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:3000/auth/callback?next=/update-password',
  });

  if (error) {
    console.error("Error sending reset password email:");
    console.error(JSON.stringify(error, null, 2));
    
    if (error.status === 429) {
      console.log("\n[ANALYSIS] Error 429: Too Many Requests. You have exceeded the email rate limit (usually 3 emails per hour per user).");
    } else if (error.message.includes("Email not confirmed")) {
      console.log("\n[ANALYSIS] The email address is not confirmed in Supabase Auth.");
    }
  } else {
    console.log("Success! Supabase returned a successful response.");
    console.log(JSON.stringify(data, null, 2));
    console.log("\n[ANALYSIS] Supabase claims the email was sent. If it didn't arrive:");
    console.log("1. Check spam folder.");
    console.log("2. Check Supabase Dashboard -> Auth -> Email Templates to ensure SMTP is working.");
    console.log("3. If using default SMTP, check if you've hit the daily/hourly global limit.");
  }
}

// Get email from command line or use a default test one
const testEmail = process.argv[2] || 'leeyob@gmail.com';
testResetPassword(testEmail);
