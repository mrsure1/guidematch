import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const guide_id = formData.get('guide_id') as string;
        const start_date = formData.get('start_date') as string;
        const end_date = formData.get('end_date') as string;
        const total_price = formData.get('total_price') as string;
        const guests = formData.get('guests') as string;

        console.log('--- Booking Attempt ---');
        console.log('Guide ID:', guide_id);
        console.log('Start Date:', start_date);
        console.log('End Date:', end_date);
        console.log('Total Price:', total_price);

        if (!guide_id || !start_date || !end_date || !total_price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();

        // Get the current user (traveler)
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized. Please login to book a guide.' }, { status: 401 });
        }

        // [방어 로직] 여행자 프로필이 없는 경우 즉석에서 생성 (Just-in-Time)
        const { data: travelerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (!travelerProfile) {
            console.log('Creating missing traveler profile for:', user.email);
            const { error: upsertError } = await supabase.from('profiles').upsert({
                id: user.id,
                role: 'traveler',
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
            });
            if (upsertError) console.error('Failed to create traveler profile:', upsertError);
        }

        // [방어 로직 2] 대상 가이드가 DB에 없는 경우 (샘플 가이드인 경우 즉석 생성)
        const { data: guideProfile, error: guideCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', guide_id)
            .maybeSingle();

        if (!guideProfile) {
            console.log('Target guide profile missing. Checking if it is a known sample ID:', guide_id);
            const sampleGuides: Record<string, any> = {
                '44444444-4444-4444-4444-444444444444': { full_name: '김지나 (Gina)', role: 'guide' },
                '11111111-1111-1111-1111-111111111111': { full_name: '박성진 (James)', role: 'guide' },
                '22222222-2222-2222-2222-222222222222': { full_name: '이소연 (Soyeon)', role: 'guide' },
                '33333333-3333-3333-3333-333333333333': { full_name: '이현우 (Henry)', role: 'guide' },
                '1d1742de-7c17-4ffa-9f73-41a29d6eadc2': { full_name: '김민수 (Minsoo)', role: 'guide' }
            };

            if (sampleGuides[guide_id]) {
                console.log('Creating missing sample guide profile:', sampleGuides[guide_id].full_name);
                await supabase.from('profiles').upsert({
                    id: guide_id,
                    ...sampleGuides[guide_id]
                });
                // 가이드 상세 정보도 최소한으로 생성 (FK 무결성 위해)
                await supabase.from('guides_detail').upsert({
                    id: guide_id,
                    location: '서울',
                    hourly_rate: 100000
                });
            } else {
                console.warn('Guide ID is not a known sample and does not exist in profiles.');
            }
        }

        // Insert booking
        const { data, error } = await supabase.from('bookings').insert([
            {
                traveler_id: user.id,
                guide_id: guide_id,
                start_date: new Date(start_date).toISOString(),
                end_date: new Date(end_date).toISOString(),
                status: 'pending',
                total_price: parseFloat(total_price),
                guests: parseInt(guests || "1", 10)
            }
        ]).select();

        if (error) {
            console.error('Booking creation error:', error);
            // Handle specific FK error message for the user
            if (error.code === '23503') {
                console.error(`FK Constraint Violation: Check if guide_id(${guide_id}) OR traveler_id(${user.id}) exists in referenced tables.`);
                return NextResponse.json({
                    error: `예약 실패: 가이드(${guide_id}) 또는 회원 정보가 유효하지 않습니다. 샘플 가이드의 경우 실제 가입이 필요할 수 있습니다.`
                }, { status: 400 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Revalidate guide's dashboard and traveler's booking page so they see updates
        revalidatePath('/guide/dashboard');
        revalidatePath('/traveler/bookings');

        return NextResponse.json({ success: true, booking: data[0] });

    } catch (error: any) {
        console.error('API Error /api/bookings/create:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
