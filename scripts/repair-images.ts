import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('필수 환경 변수가 없습니다.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function repair() {
    console.log('🛠️ 데이터 복구 시작...');

    const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/tours/samples`;

    const sampleTours = [
        {
            pattern: '경복궁',
            photos: [
                `${baseUrl}/gyeongbokgung_1.png`,
                `${baseUrl}/gyeongbokgung_2.png`,
                `${baseUrl}/gyeongbokgung_3.png`
            ]
        },
        {
            pattern: '제주',
            photos: [
                `${baseUrl}/jeju_1.png`,
                `${baseUrl}/jeju_2.png`,
                `${baseUrl}/jeju_3.png`
            ]
        }
    ];

    for (const sample of sampleTours) {
        const { data: tours } = await supabase
            .from('tours')
            .select('id, title')
            .ilike('title', `%${sample.pattern}%`);

        if (tours) {
            for (const tour of tours) {
                console.log(`📝 업데이트 중: ${tour.title}`);
                const { error } = await supabase
                    .from('tours')
                    .update({ photo: sample.photos.join(',') })
                    .eq('id', tour.id);

                if (error) console.error('❌ 실패:', error.message);
                else console.log('✅ 성공');
            }
        }
    }

    console.log('✨ 복구 완료!');
}

repair();
