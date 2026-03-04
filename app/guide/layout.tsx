import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from "@/components/layout/Navbar";
import { GuideNav } from "@/components/layout/GuideNav";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function GuideLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'guide' && profile?.role !== 'admin') {
        console.log(`[GuideLayout] Access denied for user ${user.id}. Role: ${profile?.role}. Redirecting to selection.`);
        redirect('/role-selection');
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Top Navigation */}
            <Navbar profile={profile} />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation - Desktop */}
                <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0">
                    <div className="flex-1 overflow-y-auto">
                        <GuideNav />
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                                <img
                                    src={profile?.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(profile?.full_name || 'User')}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name || '가이드'}</p>
                                <p className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit uppercase">Guide Mode</p>
                            </div>
                            <LogoutButton variant="ghost" className="p-2 text-slate-400 hover:text-red-500" showText={false} />
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
