import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Settings, Heart, History, Shield, Bell, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function TravelerProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50" />

                <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                    <img
                        src={profile?.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(profile?.full_name || 'User')}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="relative z-10 flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{profile?.full_name || '사용자'}님</h1>
                    <p className="text-slate-500 font-medium mt-1">{user.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 uppercase">Traveler</span>
                        <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-xs font-bold border border-slate-100">가입일: {new Date(profile?.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="relative z-10 flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Link href="/traveler/profile/edit" className="flex-1 md:flex-none">
                        <Button variant="outline" size="sm" className="w-full h-11 border-slate-200 font-bold">
                            프로필 수정
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats / Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { icon: Heart, label: "찜한 가이드", value: "0", color: "text-rose-500", bg: "bg-rose-50" },
                    { icon: History, label: "투어 기록", value: "0", color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: Bell, label: "새 알림", value: "0", color: "text-amber-500", bg: "bg-amber-50" },
                    { icon: Shield, label: "포인트", value: "0", color: "text-emerald-500", bg: "bg-emerald-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-black text-slate-900 leading-tight">{stat.value}</span>
                            <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Account Settings Menu */}
            <Card className="border-slate-200/60 shadow-xl shadow-slate-900/5 bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900">계정 설정</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ul className="divide-y divide-slate-50">
                        {[
                            { icon: User, label: "개인 정보 관리", sub: "내 연락처와 주소를 관리하세요" },
                            { icon: Settings, label: "알림 설정", sub: "푸시 알림 및 이메일 수신 여부를 결정하세요" },
                            { icon: Shield, label: "로그인 방식 및 보안", sub: "비밀번호 변경 및 SNS 연동 관리" },
                            { icon: History, label: "결제 및 환불 내역", sub: "영수증 확인 및 결제 수단 관리" },
                        ].map((item, i) => (
                            <li key={i}>
                                <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-900">{item.label}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <div className="pt-4">
                <LogoutButton className="w-full h-14 rounded-2xl border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold transition-all shadow-sm" />
            </div>
        </div>
    );
}
