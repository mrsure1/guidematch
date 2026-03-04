import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditClient from "./ProfileEditClient";

export default async function TravelerProfileEdit() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/login');
    }

    // Role check to ensure it's a traveler or admin. It's safe to let guides access it but this is for travelers primarily.
    if (profile.role !== 'traveler' && profile.role !== 'admin') {
        redirect('/role-selection');
    }

    return <ProfileEditClient profile={profile} />;
}
