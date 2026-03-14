import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: 'd:/MrSure/guidematch/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testResetPassword(email) {
  console.log(`Testing password reset (NO REDIRECT) for: ${email}`);
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("Error:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("Success! (Without redirectTo)");
    console.log(JSON.stringify(data, null, 2));
  }
}

const testEmail = process.argv[2] || 'leeyob@gmail.com';
testResetPassword(testEmail);
