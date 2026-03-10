"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Star, MapPin, Clock, Users, Heart, Share2, ChevronLeft, CheckCircle2 } from "lucide-react";

interface TourDetailClientProps {
    tour: any;
}

export default function TourDetailClient({ tour }: TourDetailClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Set default values from URL parameters
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDateStr = tomorrow.toISOString().split('T')[0];
    const startDateParam = searchParams.get('startDate') || defaultDateStr;

    const pAdults = searchParams.get('adults');
    const pChildren = searchParams.get('children');
    const defaultAdults = pAdults ? parseInt(pAdults, 10) : 2;
    const defaultChildren = pChildren ? parseInt(pChildren, 10) : 0;
    const defaultGuests = (isNaN(defaultAdults) ? 2 : defaultAdults) + (isNaN(defaultChildren) ? 0 : defaultChildren);

    const [isPending, setIsPending] = useState(false);
    const [guests, setGuests] = useState(defaultGuests || 2);

    const handleBooking = async () => {
        setIsPending(true);
        try {
            const formData = new FormData();
            formData.append('guide_id', tour.guide_id);
            formData.append('tour_id', tour.id);
            formData.append('start_date', startDateParam);
            formData.append('end_date', startDateParam);
            formData.append('total_price', (tour.price * guests * 1.05).toString()); // N인 기준 + 5% 수수료

            const res = await fetch('/api/bookings/create', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                alert("예약 신청이 성공적으로 완료되었습니다!");
                router.push('/traveler/bookings');
            } else {
                const data = await res.json();
                alert(`예약 실패: ${data.error || '원인을 알 수 없는 오류입니다.'}`);
            }
        } catch (error) {
            console.error(error);
            alert("예약 처리 중 오류가 발생했습니다.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="bg-white min-h-[calc(100vh-64px)] animate-fade-in pb-20">
            {/* Header image & Quick Nav */}
            <div className="relative h-[40vh] md:h-[50vh] w-full bg-slate-900">
                {tour.photo ? (
                    <img src={tour.photo} alt={tour.title} className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                        <MapPin className="w-16 h-16" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                <div className="absolute top-6 left-4 md:left-8 right-4 md:right-8 flex justify-between items-center z-10">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex gap-3">
                        <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 hover:text-red-400 transition-colors">
                            <Heart className="w-5 h-5" />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-blue-600">
                            <span className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">베스트셀러</span>
                            <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-slate-600 font-medium flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> 4.9 (128)
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                            {tour.title}
                        </h1>

                        <div className="flex flex-wrap gap-6 mb-8 py-6 border-y border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-medium mb-0.5">지역</div>
                                    <div className="text-sm font-bold text-slate-900">{tour.region}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-medium mb-0.5">소요 시간</div>
                                    <div className="text-sm font-bold text-slate-900">{tour.duration}시간</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-medium mb-0.5">투어 인원</div>
                                    <div className="text-sm font-bold text-slate-900">최대 {tour.max_guests}인</div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">투어 소개</h2>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {tour.description}
                            </p>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">포함 사항</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Array.isArray(tour.included_items) && tour.included_items.length > 0 ? (
                                    tour.included_items.map((item: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                            <span>{item}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm">포함 사항이 없습니다.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Booking Card */}
                    <div className="w-full md:w-96 shrink-0 mt-8 md:mt-0">
                        <div className="sticky top-24">
                            <Card className="bg-white shadow-2xl shadow-slate-200 border-0 rounded-3xl overflow-hidden">
                                <CardContent className="p-6 md:p-8">
                                    <div className="mb-6">
                                        <div className="text-sm font-medium text-slate-500 mb-1">1인 기준</div>
                                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                                            ₩ {tour.price?.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                            <div className="text-xs font-bold text-slate-500 mb-1">날짜 선택</div>
                                            <div className="text-sm font-semibold text-slate-900">{startDateParam}</div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 mb-1">인원</div>
                                                <div className="text-sm font-semibold text-slate-900">총 {guests}명</div>
                                            </div>
                                            <div className="text-sm font-bold text-blue-600 cursor-pointer" onClick={() => {
                                                const currentUrl = new URL(window.location.href);
                                                alert("인원수나 날짜를 변경하시려면 뒤로 가기하여 조건 검색창을 이용해 주세요.");
                                            }}>수정</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-slate-100 mb-8">
                                        <div className="flex justify-between text-slate-600 text-sm">
                                            <span>₩ {tour.price?.toLocaleString()} x {guests}인</span>
                                            <span>₩ {(tour.price * guests)?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600 text-sm">
                                            <span>서비스 수수료</span>
                                            <span>₩ {(tour.price * guests * 0.05)?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-100">
                                            <span>총 합계</span>
                                            <span>₩ {(tour.price * guests * 1.05)?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <Button
                                        fullWidth
                                        size="lg"
                                        className="h-14 bg-slate-900 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-slate-900/10 text-base font-bold transition-all disabled:opacity-50"
                                        onClick={handleBooking}
                                        disabled={isPending}
                                    >
                                        {isPending ? '처리 중...' : '예약 진행하기'}
                                    </Button>
                                    <p className="text-center text-xs text-slate-400 mt-4">예약 확정 전에는 결제되지 않습니다.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
