import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('full_name', 'Alex_Lee');
    
  if (error) {
    console.error('Update failed with error:', error);
  } else {
    console.log('Update successful! Data:', data);
  }
}

testUpsert();
