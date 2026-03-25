import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const mapping = [
  { id: 'fe22b416-03cd-4c3a-a9d9-3ea070d87bc9', avatar: '/images/guides/guide_alex_realistic.png' },
  { id: '582eee5f-c151-4f0e-9061-09a1d4944a70', avatar: '/images/guides/guide_yeoju_realistic.png' },
  { id: '11111111-1111-1111-1111-111111111111', avatar: '/images/guides/guide_james_realistic.png' },
  { id: '22222222-2222-2222-2222-222222222222', avatar: '/images/guides/guide_soyeon_realistic.png' },
  { id: 'f1ad3503-797a-46fb-8f43-b0d3718a4436', avatar: '/images/guides/guide_alex_realistic.png' }, // Alex (Landing page)
  { id: '33333333-3333-3333-3333-333333333333', avatar: '/images/guides/guide_henry_realistic.png' },
  { id: '44444444-4444-4444-4444-444444444444', avatar: '/images/guides/guide_gina_realistic.png' },
  { id: '1d1742de-7c17-4ffa-9f73-41a29d6eadc2', avatar: '/images/guides/guide_alex_realistic.png' }, // Minsoo
  { id: '0746a310-ed2e-4273-80b0-a9f570a5938d', avatar: '/images/guides/guide_yeoju_realistic.png' }, // 여행객1
  { id: 'd101b758-0396-4f7c-9abb-25d0d5897a5d', avatar: '/images/guides/guide_gina_realistic.png' }  // guide2
];

async function apply() {
  for (const item of mapping) {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: item.avatar })
      .eq('id', item.id);
      
    if (error) {
      console.error(`Error updating guide ${item.id}:`, error);
    } else {
      console.log(`Successfully updated guide ${item.id} with realistic avatar.`);
    }
  }
}

apply();
