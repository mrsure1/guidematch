"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateTravelerProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const fullName = formData.get('full_name') as string
    const avatarUrl = formData.get('avatar_url') as string

    // Update profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            avatar_url: avatarUrl
        })
        .eq('id', user.id)

    if (profileError) return { error: profileError.message }

    // 캐시 무효화 및 해당 프로필 페이지로 이동
    revalidatePath('/traveler/profile')
    revalidatePath('/guide/dashboard') // 혹시 모를 여행자-가이드 간 전환 시 영향 등 대비

    return { success: true }
}
