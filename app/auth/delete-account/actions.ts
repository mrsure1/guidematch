'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function deleteAccount() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '로그인이 필요합니다.' }
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing Supabase environment variables for admin operations')
            return { error: '서버 설정 오류: 관리자 권한 키가 설정되지 않았습니다. (Vercel 환경 변수 확인 필요)' }
        }

        const adminClient = createAdminClient()

        // 1. Auth 계정 삭제
        // ON DELETE CASCADE 설정으로 인해 profiles 및 연관 데이터는 자동 삭제됨
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

        if (deleteError) {
            console.error('Error deleting user account:', deleteError)
            return { error: '계정 삭제 중 오류가 발생했습니다: ' + deleteError.message }
        }

        // 2. 세션 로그아웃 (서버사이드 쿠키 정리)
        await supabase.auth.signOut()

        revalidatePath('/', 'layout')
        
        return { success: true }
    } catch (err: any) {
        console.error('Unhandled error in deleteAccount:', err)
        return { error: '서버 내부 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류') }
    }
}
