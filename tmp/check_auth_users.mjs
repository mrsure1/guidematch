import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: 'd:/MrSure/guidematch/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing service role key.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  console.log(`Found ${users.length} users in auth.users:`);
  users.forEach(u => {
    console.log(`- Email: ${u.email} | Confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'} | Last Sign In: ${u.last_sign_in_at}`);
  });
}

checkUsers();
