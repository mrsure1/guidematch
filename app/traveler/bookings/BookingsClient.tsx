"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReviewModal } from "@/components/review/ReviewModal";
import { CalendarDays, Clock, Users, Ticket, MapPin, MessageSquare, Download, Repeat, Star, AlertTriangle, CreditCard, Trash2 } from "lucide-react";
import Link from "next/link";

export default function BookingsClient({ bookings }: { bookings: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeStatus, setActiveStatus] = useState(searchParams.get("tab") || "upcoming"); // upcoming, past, cancelled
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedTourForReview, setSelectedTourForReview] = useState("");
    const [selectedGuideId, setSelectedGuideId] = useState("");

    // Update URL when tab changes
    const handleTabChange = (status: string) => {
        setActiveStatus(status);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", status);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    // Ensure state stays in sync with URL (e.g., back button)
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeStatus) {
            setActiveStatus(tab);
        }
    }, [searchParams, activeStatus]);

    const now = new Date();

    // 중복 날짜 감지 로직
    const upcoming = bookings.filter(b => (b.status === "pending" || b.status === "confirmed" || b.status === "paid") && new Date(b.end_date) >= now);
    const duplicates = [];
    for (let i = 0; i < upcoming.length; i++) {
        for (let j = i + 1; j < upcoming.length; j++) {
            const a = upcoming[i];
            const b = upcoming[j];
            const startA = new Date(a.start_date);
            const endA = new Date(a.end_date);
            const startB = new Date(b.start_date);
            const endB = new Date(b.end_date);

            if (startA <= endB && endA >= startB) {
                const overlapStart = new Date(Math.max(startA.getTime(), startB.getTime()));
                const overlapEnd = new Date(Math.min(endA.getTime(), endB.getTime()));
                duplicates.push({
                    dates: `${overlapStart.toLocaleDateString()} ~ ${overlapEnd.toLocaleDateString()}`,
                    guide1: a.guide?.full_name,
                    guide2: b.guide?.full_name
                });
            }
        }
    }

    const handleReviewSubmit = (data: { rating: number; review: string }) => {
        console.log("Review submitted:", data);
        alert("리뷰가 아직 DB에 연결되지 않았습니다. 등록: " + JSON.stringify(data));
        setReviewModalOpen(false);
    };

    const getRegionCode = (location: string) => {
        if (!location) return "BK";
        if (location.includes("서울")) return "SEL";
        if (location.includes("부산")) return "PUS";
        if (location.includes("제주")) return "CJU";
        if (location.includes("인천")) return "ICN";
        if (location.includes("경기")) return "GGY";
        if (location.includes("강원")) return "GWN";
        return "TR";
    };

    const getTimeRemaining = (updatedAt: string) => {
        const deadline = new Date(new Date(updatedAt).getTime() + 24 * 60 * 60 * 1000);
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) return "기한 만료";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}시간 ${minutes}분 남음`;
    };

    const handleHideBooking = async (bookingId: string) => {
        if (!confirm("이 내역을 목록에서 삭제하시겠습니까?\n(가이드의 기록에는 남으며, 나의 목록에서만 숨겨집니다.)")) return;

        try {
            const res = await fetch(`/api/bookings/hide?id=${bookingId}`, {
                method: 'POST'
            });
            if (res.ok) {
                alert("내역이 삭제되었습니다.");
                router.refresh();
            } else {
                const data = await res.json();
                alert(`삭제 실패: ${data.error}`);
            }
        } catch (error) {
            console.error("Error hiding booking:", error);
            alert("처리 중 오류가 발생했습니다.");
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm("정말로 이 예약을 취소하시겠습니까?")) return;

        try {
            const res = await fetch(`/api/bookings/cancel?id=${bookingId}`, {
                method: 'POST'
            });
            if (res.ok) {
                alert("예약이 취소되었습니다.");
                window.location.reload();
            } else {
                const data = await res.json();
                alert(`취소 실패: ${data.error}`);
            }
        } catch (error) {
            console.error("Error cancelling booking:", error);
            alert("처리 중 오류가 발생했습니다.");
        }
    };

    const filteredBookings = bookings.filter(b => {
        const endDate = new Date(b.end_date);
        if (activeStatus === "cancelled") {
            return b.status === "declined" || b.status === "cancelled";
        }
        if (activeStatus === "past") {
            return b.status === "completed" || (b.status === "confirmed" && endDate < now);
        }
        // upcoming
        const comparisonDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return (b.status === "pending" || b.status === "confirmed" || b.status === "paid") && endDate >= comparisonDate;
    });

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <Ticket className="w-8 h-8 text-accent" />
                    나의 예약 내역
                </h1>
                <p className="mt-2 text-slate-500">예정된 투어와 다녀온 투어 일정을 확인하고 관리하세요.</p>
            </div>

            {/* 날짜 중복 경고 메시지 */}
            {duplicates.length > 0 && activeStatus === 'upcoming' && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 animate-bounce-subtle">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-red-900">일정 중복 주의</h3>
                        <p className="text-xs text-red-700 mt-1 leading-relaxed">
                            {duplicates.map((d, i) => (
                                <span key={i} className="block">
                                    • <strong>{d.dates}</strong> 일정이 <strong>{d.guide1}</strong> 가이드와 <strong>{d.guide2}</strong> 가이드 예약에서 겹칩니다.
                                </span>
                            ))}
                        </p>
                    </div>
                </div>
            )}

            {/* Premium Tabs */}
            <div className="flex border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar gap-8">
                <button
                    onClick={() => handleTabChange('upcoming')}
                    className={`pb-4 text-sm font-bold whitespace-nowrap transition-all relative ${activeStatus === 'upcoming' ? 'text-accent' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    예정된 투어 ({bookings.filter(b => (b.status === "pending" || b.status === "confirmed" || b.status === "paid") && new Date(b.end_date) >= now).length})
                    {activeStatus === 'upcoming' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => handleTabChange('past')}
                    className={`pb-4 text-sm font-bold whitespace-nowrap transition-all relative ${activeStatus === 'past' ? 'text-accent' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    다녀온 투어 ({bookings.filter(b => b.status === "completed" || (b.status === "confirmed" && new Date(b.end_date) < now)).length})
                    {activeStatus === 'past' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => handleTabChange('cancelled')}
                    className={`pb-4 text-sm font-bold whitespace-nowrap transition-all relative ${activeStatus === 'cancelled' ? 'text-accent' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    취소/거절 내역 ({bookings.filter(b => b.status === "declined" || b.status === "cancelled").length})
                    {activeStatus === 'cancelled' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full" />
                    )}
                </button>
            </div>

            <div className="space-y-6">
                {filteredBookings.length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                        해당 상태의 예약 내역이 없습니다.
                    </div>
                )}
                {filteredBookings.map((booking) => {
                    const guide = booking.guide; // 가이드 정보 (별칭으로 'guide' 사용)
                    if (!guide) return null;
                    const gd = guide.guides_detail || {};

                    return (
                        <Card key={booking.id} className="overflow-hidden border-slate-200/60 shadow-md hover:shadow-lg transition-all flex flex-col md:flex-row group">
                            <div className="h-56 md:h-auto md:w-72 bg-slate-200 shrink-0 relative overflow-hidden">
                                <img
                                    src={guide.avatar_url || `https://i.pravatar.cc/300?u=${guide.id}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt="Tour img"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-60" />
                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-accent shadow-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                    {booking.status === 'pending' ? '승인 대기중' : booking.status === 'confirmed' ? '결제 대기중' : booking.status === 'paid' ? '결제 완료' : booking.status}
                                </div>
                                {booking.status === 'confirmed' && (
                                    <div className="absolute bottom-4 left-4 right-4 bg-red-600/90 backdrop-blur-sm px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 animate-pulse">
                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span>결제 기한: {getTimeRemaining(booking.updated_at)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 lg:p-8 flex-1 flex flex-col justify-between min-w-0 bg-white">
                                <div>
                                    <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500 bg-slate-100 w-fit px-2 py-1 rounded-md">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {gd.location || '지역 미정'}
                                            </div>
                                            <Link href={`/traveler/guides/${guide.id}`}>
                                                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 line-clamp-1 hover:text-accent transition-colors">
                                                    {guide.full_name} 가이드 투어
                                                </h2>
                                            </Link>
                                        </div>
                                        <span className="text-xl font-extrabold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                            ₩ {booking.total_price?.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-5 border-y border-slate-100/80 my-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-accent shrink-0">
                                                <CalendarDays className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 mb-0.5">이용 시작일</p>
                                                <p className="text-sm font-bold text-slate-900">{new Date(booking.start_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 mb-0.5">이용 종료일</p>
                                                <p className="text-sm font-bold text-slate-900">{new Date(booking.end_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 mb-0.5">이용 인원</p>
                                                <p className="text-sm font-bold text-slate-900">미정</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                                                <Ticket className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 mb-0.5">예약 번호</p>
                                                <p className="text-sm font-bold text-slate-900">{getRegionCode(gd.location)}-{booking.id.toString().split('-')[0].toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 py-2">
                                        <img src={guide.avatar_url || `https://i.pravatar.cc/150?u=${guide.id}`} alt="Guide" className="w-12 h-12 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                                {guide.full_name} 가이드
                                                <span className="flex items-center text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                                                    <Star className="w-3 h-3 fill-amber-500 mr-0.5" /> {gd.rating || "신규"}
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">{gd.location || '지역'} · {(gd.languages || []).join(', ')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-0 pt-6 justify-end">
                                    {activeStatus === 'upcoming' && (
                                        <>
                                            {booking.status === 'pending' && (
                                                <Button
                                                    variant="outline"
                                                    className="bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                >
                                                    예약 취소
                                                </Button>
                                            )}
                                            {booking.status === 'confirmed' && (
                                                <Button
                                                    variant="outline"
                                                    className="bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                >
                                                    예약 취소
                                                </Button>
                                            )}
                                            <Link href={`/messages?guide=${guide.id}`}>
                                                <Button variant="outline" className="bg-white border-accent/20 text-accent hover:bg-accent/5 flex items-center gap-2">
                                                    <MessageSquare className="w-4 h-4" /> 가이드 메시지
                                                </Button>
                                            </Link>
                                            {booking.status === 'confirmed' && (
                                                <Link href={getTimeRemaining(booking.updated_at) === "기한 만료" ? "#" : `/traveler/bookings/checkout/${booking.id}`}>
                                                    <Button
                                                        className={`${getTimeRemaining(booking.updated_at) === "기한 만료" ? "bg-slate-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"} text-white shadow-md flex items-center gap-2`}
                                                        disabled={getTimeRemaining(booking.updated_at) === "기한 만료"}
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                        {getTimeRemaining(booking.updated_at) === "기한 만료" ? "기한 만료" : "결제하기"}
                                                    </Button>
                                                </Link>
                                            )}
                                            {booking.status === 'paid' && (
                                                <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-md flex items-center gap-2">
                                                    <Download className="w-4 h-4" /> E-바우처
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    {activeStatus === 'past' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 px-3"
                                                onClick={() => handleHideBooking(booking.id)}
                                                title="내역 숨기기"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 hover:text-accent shadow-sm" onClick={() => {
                                                setSelectedTourForReview(`${guide.full_name} 가이드 투어`);
                                                setReviewModalOpen(true);
                                                setSelectedGuideId(guide.id);
                                            }}>
                                                <Star className="w-4 h-4 mr-2" /> 후기 작성
                                            </Button>
                                            <Link href={`/traveler/guides/${guide.id}`}>
                                                <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                                                    <Repeat className="w-4 h-4 mr-2" /> 다시 예약하기
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                    {activeStatus === 'cancelled' && (
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 flex items-center gap-2"
                                            onClick={() => handleHideBooking(booking.id)}
                                        >
                                            <Trash2 className="w-4 h-4" /> 내역 삭제하기
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                onSubmit={handleReviewSubmit}
                tourName={selectedTourForReview}
            />
        </div>
    );
}
