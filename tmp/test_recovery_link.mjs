import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:/MrSure/guidematch/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testRecoveryLink(email) {
  console.log(`Generating recovery link for: ${email}`);
  
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: email,
    options: {
      redirectTo: 'http://localhost:3000/auth/callback?next=/update-password'
    }
  });

  if (error) {
    console.error("Error generating link:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Link generated:");
    console.log(JSON.stringify(data, null, 2));
    console.log("\n[ANALYSIS] If link generation succeeded but resetPasswordForEmail failed with 500, it confirms the issue is likely with the automated email dispatch service (SMTP/Template) in Supabase.");
  }
}

const testEmail = process.argv[2] || 'leeyob@gmail.com';
testRecoveryLink(testEmail);
