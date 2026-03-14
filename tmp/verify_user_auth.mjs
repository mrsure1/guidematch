import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:/MrSure/guidematch/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUserExistence(email) {
  console.log(`Checking existence of ${email} in Auth.users...`);
  
  // listUsers has some limits, let's search specifically
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  const user = users.find(u => u.email === email);
  
  if (user) {
    console.log("User FOUND in Auth system:");
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Confirmed: ${!!user.email_confirmed_at}`);
  } else {
    console.log("User NOT FOUND in Auth system.");
    console.log("Total users found in list:", users.length);
  }
}

const testEmail = process.argv[2] || 'leeyob@gmail.com';
checkUserExistence(testEmail);
