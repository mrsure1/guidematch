import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tourId } = await params;
        const supabase = await createClient();

        // 현재 사용자 세션 확인
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isLiked: false });
        }

        const { data: existingLike, error } = await supabase
            .from('tour_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('tour_id', tourId)
            .maybeSingle();

        if (error) {
            console.error('Error checking like status:', error);
            return NextResponse.json({ isLiked: false });
        }

        return NextResponse.json({ isLiked: !!existingLike });
    } catch (error) {
        console.error('API Error /api/tours/[id]/like/status:', error);
        return NextResponse.json({ isLiked: false });
    }
}
