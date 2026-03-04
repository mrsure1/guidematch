import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Calendar as CalendarIcon, Map, DollarSign, MessageSquare, Plus, CheckCircle2, XCircle, ArrowRight, UserCircle, Settings, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function GuideDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

    // Fetch waitlist/pending bookings
    const { data: pendingBookings } = await supabase
        .from('bookings')
        .select(`
            id, start_date, end_date, total_price, status, created_at,
            traveler:profiles!traveler_id ( full_name, avatar_url )
        `)
        .eq('guide_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    // Fetch confirmed future bookings
    const { data: confirmedBookings } = await supabase
        .from('bookings')
        .select(`
            id, start_date, end_date, total_price, status, created_at,
            traveler:profiles!traveler_id ( full_name, avatar_url )
        `)
        .eq('guide_id', user.id)
        .eq('status', 'confirmed')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

    const totalConfirmed = confirmedBookings?.length || 0;
    const pendingCount = pendingBookings?.length || 0;
    const nextTour = confirmedBookings?.[0];

    // Calculate this month's revenue from confirmed or paid bookings in the current month
    // For simplicity, just sum total_price of confirmed ones
    const revenue = confirmedBookings?.reduce((acc, curr) => acc + Number(curr.total_price || 0), 0) || 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 animate-fade-in relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        안녕하세요, {profile?.full_name || '가이드'}님! <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">오늘도 멋진 투어를 만들어주세요. 새로운 예약 요청이 {pendingCount}건 있습니다.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/guide/schedule">
                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm flex items-center gap-2 h-11 px-5">
                            <CalendarIcon className="w-4 h-4" /> 일정 관리
                        </Button>
                    </Link>
                    <Link href="/guide/profile">
                        <Button className="bg-accent hover:bg-blue-600 shadow-md shadow-accent/20 flex items-center gap-2 h-11 px-6">
                            <Settings className="w-4 h-4" /> 내 프로필 설정
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-transparent shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <CardHeader className="pb-2 border-none">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-300 font-medium text-sm flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" /> 확정된 예약 수익
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <h2 className="text-4xl font-extrabold mb-2 tracking-tight">₩ {revenue.toLocaleString()}</h2>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <p className="text-slate-500 font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
                            <Map className="w-4 h-4 text-accent" /> 확정된 투어 (예정)
                        </p>
                    </CardHeader>
                    <CardContent>
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-2">{totalConfirmed}건</h2>
                        <p className="text-sm font-medium text-slate-600 bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-100">
                            다음 투어: {nextTour ? new Date(nextTour.start_date).toLocaleDateString() : '없음'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <p className="text-slate-500 font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
                            <MessageSquare className="w-4 h-4 text-emerald-500" /> 수락 대기 중인 예약
                        </p>
                    </CardHeader>
                    <CardContent>
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-2">{pendingCount}건</h2>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="flex flex-col border-slate-200/60 shadow-md overflow-hidden h-[450px]">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/80 bg-slate-50/50 py-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
                            새로운 예약 요청
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        {pendingCount === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 h-full text-slate-400">
                                <CheckCircle2 className="w-10 h-10 mb-2 text-slate-300" />
                                <p>대기 중인 예약 요청이 없습니다.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {pendingBookings?.map((booking: any) => (
                                    <li key={booking.id} className="p-5 hover:bg-slate-50/80 transition-colors group">
                                        <div className="flex items-start gap-4">
                                            <img
                                                src={booking.traveler.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(booking.traveler.full_name || 'T')}`}
                                                className="w-12 h-12 rounded-full border border-slate-200 shadow-sm shrink-0 object-cover"
                                                alt="Traveler"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                        {booking.traveler.full_name || '여행자'}
                                                    </p>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                                        대기중
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-3 bg-white border border-slate-100 rounded-md p-2 mt-2 leading-relaxed h-[52px]">
                                                    <strong className="text-slate-900 font-semibold">{booking.start_date} ~ {booking.end_date}</strong>
                                                    <br />예상 결제 금액: ₩ {Number(booking.total_price).toLocaleString()}
                                                </p>
                                                <div className="flex gap-2">
                                                    <Link href={`/guide/bookings/${booking.id}`} className="flex-1">
                                                        <Button size="sm" variant="outline" className="w-full h-9 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 flex gap-1.5 focus:outline-none">
                                                            상세보기
                                                        </Button>
                                                    </Link>
                                                    <form action={`/api/bookings/accept?id=${booking.id}`} method="POST">
                                                        <Button size="sm" type="submit" className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white flex gap-1.5 focus:outline-none">
                                                            <CheckCircle2 className="w-4 h-4" /> 수락
                                                        </Button>
                                                    </form>
                                                    <form action={`/api/bookings/reject?id=${booking.id}`} method="POST">
                                                        <Button size="sm" variant="ghost" type="submit" className="h-9 px-3 text-slate-400 hover:text-red-600 hover:bg-red-50 flex gap-1.5">
                                                            <XCircle className="w-4 h-4" /> 거절
                                                        </Button>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col border-slate-200/60 shadow-md h-[450px]">
                    <CardHeader className="border-b border-slate-100/80 bg-slate-50/50 py-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-slate-400" />
                            다가오는 투어 일정
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-6">
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[35px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {totalConfirmed === 0 && (
                                <div className="text-center text-slate-400 py-10 relative z-10 bg-white">확정된 일정이 없습니다.</div>
                            )}
                            {confirmedBookings?.map((tour: any) => (
                                <div key={tour.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <span className="text-xs font-bold">{new Date(tour.start_date).getDate()}일</span>
                                    </div>
                                    <Link href={`/guide/bookings/${tour.id}`} className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-accent hover:shadow-md transition-all group/card">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-900 text-sm group-hover/card:text-accent transition-colors">{tour.traveler.full_name || '여행자'}님와의 예약</h4>
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover/card:text-accent group-hover/card:translate-x-1 transition-all" />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 bg-slate-50 px-2 py-1.5 rounded-md">
                                            <Clock className="w-3.5 h-3.5 text-accent" />
                                            <span className="font-semibold text-slate-700">{tour.start_date} ~ {tour.end_date}</span>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
