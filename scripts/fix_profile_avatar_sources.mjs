import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing');
}

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const updates = [
  {
    full_name: '이진영',
    avatar_url:
      'https://k.kakaocdn.net/dn/bpAwu1/btsQ4ll9NTj/ODgi0OUmksFXMkgysUzMVK/img_640x640.jpg',
  },
];

for (const update of updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: update.avatar_url })
    .eq('full_name', update.full_name)
    .select('id, full_name, avatar_url')
    .single();

  if (error) {
    throw error;
  }

  console.log(JSON.stringify(data, null, 2));
}
