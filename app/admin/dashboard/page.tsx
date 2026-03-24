import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ShieldCheck, CreditCard, ChevronRight, MessageSquare } from "lucide-react";

export default async function AdminDashboardPage() {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (!session || error) {
        redirect('/login');
    }

    // Role 재확인 (보안)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        redirect('/'); // 권한이 없으면 메인으로
    }

    // 통계 데이터 가져오기
    const [
        { count: userCount },
        { count: pendingGuideCount },
        { data: recentPayments },
        { count: chatbotConvCount, error: chatbotCountError },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, guides_detail!inner(is_verified)', { count: 'exact', head: true })
            .eq('role', 'guide')
            .eq('guides_detail.is_verified', false),
        supabase.from('bookings').select('total_price').in('status', ['paid', 'completed']),
        supabase.from('chatbot_conversations').select('*', { count: 'exact', head: true }),
    ]);

    if (chatbotCountError) {
        console.warn('[admin/dashboard] chatbot_conversations count:', chatbotCountError.message);
    }

    const totalRevenue = recentPayments?.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0) || 0;

    const stats = [
        {
            title: "사용자 관리",
            description: "전체 사용자 권한 및 계정 관리",
            icon: <Users className="w-6 h-6" />,
            count: `${userCount || 0} 명`,
            link: "/admin/users",
            color: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100",
        },
        {
            title: "가이드 승인",
            description: "신규 가이드 신청 및 자격 검토",
            icon: <ShieldCheck className="w-6 h-6" />,
            count: pendingGuideCount ? `${pendingGuideCount}건 대기` : "대기 없음",
            link: "/admin/guides",
            color: "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100",
        },
        {
            title: "결제 내역",
            description: "전체 예약 거래 및 매출 모니터링",
            icon: <CreditCard className="w-6 h-6" />,
            count: `₩ ${totalRevenue.toLocaleString()}`,
            link: "/admin/payments",
            color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100",
        },
        {
            title: "챗봇 로그",
            description: "로그인 사용자 FAQ 챗봇 대화 조회 (30일 보관)",
            icon: <MessageSquare className="w-6 h-6" />,
            count: chatbotConvCount != null ? `${chatbotConvCount}건` : "—",
            link: "/admin/chatbot-logs",
            color: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100",
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
                <header className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-slate-500 font-medium">시스템 운영 및 관리를 위한 중앙 제어실입니다.</p>
                </header>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-32 h-32 text-slate-900" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black mb-2 text-slate-800">환영합니다, {session.user.email}님!</h2>
                        <p className="text-slate-500 max-w-lg leading-relaxed">
                            오늘도 최고의 서비스 품질을 유지하기 위해 각 섹션의 상태를 점검해 주세요. <br />
                            승인 대기 중인 가이드나 새로운 예약 내역이 실시간으로 반영됩니다.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat, idx) => (
                        <Link key={idx} href={stat.link} className="block transition-transform hover:-translate-y-1">
                            <div className={`h-full border border-transparent transition-all duration-300 group cursor-pointer ${stat.color} p-8 rounded-3xl`}>
                                <div className="flex flex-col h-full">
                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-slate-900 group-hover:scale-110 transition-transform">
                                        {stat.icon}
                                    </div>
                                    <h3 className="text-xl font-black mb-2">{stat.title}</h3>
                                    <p className="text-sm font-medium opacity-70 mb-8 leading-snug">
                                        {stat.description}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-lg font-black italic">{stat.count}</span>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
