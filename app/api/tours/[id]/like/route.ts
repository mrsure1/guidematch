import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tourId } = await params;
        const supabase = await createClient();

        // 현재 사용자 세션 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        // 이미 좋아요를 눌렀는지 확인
        const { data: existingLike, error: checkError } = await supabase
            .from('tour_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('tour_id', tourId)
            .maybeSingle();

        if (checkError) {
            return NextResponse.json({ error: checkError.message }, { status: 500 });
        }

        if (existingLike) {
            // 좋아요 취소
            const { error: deleteError } = await supabase
                .from('tour_likes')
                .delete()
                .eq('id', existingLike.id);

            if (deleteError) {
                return NextResponse.json({ error: deleteError.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, isLiked: false });
        } else {
            // 좋아요 추가
            const { error: insertError } = await supabase
                .from('tour_likes')
                .insert([{ user_id: user.id, tour_id: tourId }]);

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, isLiked: true });
        }
    } catch (error: any) {
        console.error('API Error /api/tours/[id]/like:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
