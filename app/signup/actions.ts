'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getSiteOriginFromHeaders } from '@/lib/site-origin'
import { trackServerConversion } from '@/lib/analytics/server'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('password-confirm') as string
    const fullName = formData.get('name') as string
    let role = formData.get('role') as string || 'traveler'

    // 역할 값 유효성 검증
    if (role !== 'guide' && role !== 'traveler') {
        role = 'traveler';
    }

    if (password !== confirmPassword) {
        return redirect('/signup?message=Passwords do not match')
    }

    const headersList = await headers();
    const cleanOrigin = getSiteOriginFromHeaders(headersList);
    const redirectTo = `${cleanOrigin}/auth/callback`;

    // 관리자 이메일 가입 차단
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    if (adminEmails.includes(email.toLowerCase())) {
        return redirect('/signup?message=' + encodeURIComponent('관리자 이메일로는 일반 회원가입을 할 수 없습니다. 제한된 이메일입니다.'));
    }

    // 1. 회원가입
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: redirectTo,
            data: {
                full_name: fullName,
                role: role,
            }
        }
    })

    if (error) {
        let errorMessage = error.message;
        if (errorMessage.toLowerCase().includes('already registered')) {
            errorMessage = '이미 가입된 이메일입니다. 다른 이메일 주소를 사용해주세요.';
        }
        return redirect('/signup?message=' + encodeURIComponent(errorMessage))
    }

    // 2. 인증 전이라도 프로필 기본 정보 생성 (데이터 정합성 확보)
    if (data.user) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            role: role,
            full_name: fullName,
        }, { onConflict: 'id' });

        await trackServerConversion(
            'signup',
            {
                userId: data.user.id,
                email,
                eventId: `signup:${data.user.id}`,
            },
            {
                clientIp: headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || undefined,
                userAgent: headersList.get('user-agent') || undefined,
                eventSourceUrl: `${cleanOrigin}/signup`,
            },
        );
    }

    revalidatePath('/', 'layout')

    // 이메일 인증이 꺼져있는 경우(Confirm Email = Off) 가입 즉시 세션이 생성됩니다.
    if (data.session) {
        redirect(role === 'guide' ? '/guide/dashboard' : '/')
    }

    // 인증이 필요한 경우 로그인 페이지로 안내합니다.
    redirect(`/signup?success=true&email=${encodeURIComponent(email)}`)
}

export async function resendConfirmation(email: string) {
    const supabase = await createClient();
    const headersList = await headers();
    const cleanOrigin = getSiteOriginFromHeaders(headersList);
    const redirectTo = `${cleanOrigin}/auth/callback`;

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
            emailRedirectTo: redirectTo,
        }
    });

    if (error) {
        console.error('Resend error:', error);
        return { success: false, message: error.message };
    }

    return { success: true };
}

export async function switchRole(role: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // 역할 업데이트
    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id)

    if (error) {
        console.error('Error switching role:', error)
        return redirect(`/?message=${encodeURIComponent('역할 전환 중 오류가 발생했습니다.')}`)
    }

    // 캐시 무효화 (중요: 서버 사이드 레이아웃에서 변경된 역할을 즉시 반영하기 위함)
    revalidatePath('/', 'layout')
    revalidatePath('/guide', 'layout')
    revalidatePath('/traveler', 'layout')
    revalidatePath('/guide/dashboard')
    revalidatePath('/')

    // 해당 서비스 화면으로 이동
    redirect(role === 'guide' ? '/guide/dashboard' : '/')
}
