'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect('/login?message=' + encodeURIComponent(error.message))
    }

    if (!user) {
        return redirect('/login?message=' + encodeURIComponent('로그인에 실패했습니다.'))
    }

    // Fetch user profile role to redirect to the correct dashboard
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
    const adminAllowlistEnabled = adminEmails.length > 0;
    const isAdminEmail = !!user.email && adminEmails.includes(user.email.toLowerCase());

    const selectedRoleRaw = formData.get('role') as string;
    const selectedRole =
        selectedRoleRaw === 'guide' || selectedRoleRaw === 'traveler' ? selectedRoleRaw : null;

    // 최종 역할 결정: 명시적으로 선택된 역할이 있으면 우선 적용, 없으면 기존 프로필 역할 사용
    let targetRole = selectedRole || profile?.role || 'traveler';

    if (isAdminEmail) {
        targetRole = 'admin';
    }

    // 만약 선택된 역할이 기존 프로필과 다르거나 프로필이 없는 경우 업데이트 실행 (Role Switching 지원)
    if (targetRole && targetRole !== profile?.role) {
        const { error: upsertError } = await supabase.from('profiles').upsert({
            id: user.id,
            role: targetRole,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
        }, { onConflict: 'id' });

        if (upsertError) {
            console.error("[Login Action] Profile Upsert Error:", upsertError);
        }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/guide', 'layout')
    revalidatePath('/traveler', 'layout')
    revalidatePath('/guide/dashboard')
    revalidatePath('/')

    redirect(targetRole === 'admin' ? '/admin/dashboard' : (targetRole === 'guide' ? '/guide/dashboard' : '/'))
}
