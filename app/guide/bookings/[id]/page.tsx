import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Calendar, MapPin, User, DollarSign, Clock, ArrowLeft, MessageSquare, CheckCircle2, XCircle } from "lucide-react";

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
            *,
            traveler:profiles!traveler_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('id', id)
        .eq('guide_id', user.id) // 가이드 본인의 예약만 조회 가능하도록 보안 유지
        .single();

    if (error || !booking) {
        console.error("Booking API Error:", error, "Booking:", booking, "ID:", id, "UserID:", user.id);
        notFound();
    }

    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Back Button */}
            <Link href="/guide/dashboard">
                <Button variant="ghost" className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
                </Button>
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">예약 상세 내역</h1>
                    <p className="text-slate-500 mt-1">예약 번호: <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">#{booking.id.slice(0, 8)}</span></p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${booking.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                    {booking.status === 'pending' ? '수락 대기 중' :
                        booking.status === 'confirmed' ? '예약 확정됨' :
                            booking.status === 'declined' ? '거절됨' :
                                booking.status === 'cancelled' ? '취소됨' : booking.status}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Traveler Info */}
                <Card className="md:col-span-1 border-slate-200/60 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4 text-accent" /> 여행자 정보
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center pt-4">
                        <img
                            src={booking.traveler.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(booking.traveler.full_name || 'T')}`}
                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-4 object-cover"
                            alt="Traveler"
                        />
                        <h3 className="text-xl font-bold text-slate-900 mb-6">{booking.traveler.full_name || '여행자'}</h3>

                        <Link href={`/messages?guide=${booking.traveler_id}`} className="w-full">
                            <Button variant="outline" className="w-full flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50">
                                <MessageSquare className="w-4 h-4" /> 메시지 보내기
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Tour Info */}
                <Card className="md:col-span-2 border-slate-200/60 shadow-md">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-accent" /> 투어 일정 및 결제
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 font-medium">시작일</p>
                                <p className="text-lg font-bold text-slate-900">{booking.start_date}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 font-medium">종료일</p>
                                <p className="text-lg font-bold text-slate-900">{booking.end_date}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 font-medium">총 기간</p>
                                <p className="text-lg font-bold text-slate-900">{diffDays}일</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 font-medium">결제 예정 금액</p>
                                <p className="text-2xl font-black text-accent">₩ {Number(booking.total_price).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" /> 예약 타임라인
                            </h4>
                            <div className="text-sm text-slate-600 space-y-2">
                                <div className="flex justify-between">
                                    <span>예약 요청 일시</span>
                                    <span className="font-medium">{new Date(booking.created_at).toLocaleString()}</span>
                                </div>
                                {booking.status === 'confirmed' && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>예약 확정 완료</span>
                                        <span className="font-bold">{booking.updated_at ? new Date(booking.updated_at).toLocaleString() : '-'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {booking.status === 'pending' && (
                            <div className="flex gap-3 pt-2">
                                <form className="flex-1" action={`/api/bookings/accept?id=${booking.id}`} method="POST">
                                    <Button size="lg" type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white flex gap-2 h-12 text-base shadow-lg shadow-slate-200">
                                        <CheckCircle2 className="w-5 h-5" /> 예약 수락하기
                                    </Button>
                                </form>
                                <form action={`/api/bookings/reject?id=${booking.id}`} method="POST">
                                    <Button size="lg" variant="outline" type="submit" className="h-12 px-6 border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex gap-2">
                                        <XCircle className="w-5 h-5" /> 거절
                                    </Button>
                                </form>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
