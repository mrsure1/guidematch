import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import BookingWidgetClient from "./BookingWidgetClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Suspense } from "react";

export default async function GuideDetail({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // We fetch user to see if they are logged in (for booking, though we could enforce it later)
    const { data: { user } } = await supabase.auth.getUser();

    const { data: guide, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            avatar_url,
            guides_detail (
                id,
                location,
                languages,
                bio,
                hourly_rate,
                rate_type,
                rating,
                review_count,
                is_verified
            )
        `)
        .eq('id', id)
        .single();

    if (error || !guide) {
        notFound();
    }

    const gd = (Array.isArray(guide.guides_detail) ? guide.guides_detail[0] : (guide.guides_detail || {})) as any;

    // Fetch unavailabilities for the 캘린더/위젯 (To be passed to client)
    const { data: unavailabilities } = await supabase
        .from('availability')
        .select('*')
        .eq('guide_id', guide.id);

    // 가이드에게 달린 최신 리뷰 10개 조회 (작성자 정보 포함)
    const { data: reviews } = await supabase
        .from('reviews')
        .select(`
            id,
            rating,
            content,
            created_at,
            traveler: traveler_id (
                full_name,
                avatar_url
            )
        `)
        .eq('guide_id', guide.id)
        .order('created_at', { ascending: false })
        .limit(10);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Profile & Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Header */}
                    <section className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-slate-200 shrink-0 overflow-hidden relative shadow-md">
                            <img
                                src={guide.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(guide.full_name || 'G')}`}
                                alt="Guide Profile"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-center text-slate-900 flex justify-center items-center shadow-sm">
                                <span className="text-amber-400 mr-1 text-sm">★</span> {gd.rating || '신규'} ({gd.review_count || 0})
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{guide.full_name || 'Anonymous'}</h1>
                                {gd.is_verified && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-accent border border-blue-100">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        인증 완료
                                    </span>
                                )}
                            </div>
                            <p className="text-lg text-slate-500 font-light mb-4">{gd.location || '지역 미정'} 전문 가이드</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-slate-100 text-slate-700">📍 {gd.location || '지역 미정'}</span>
                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-slate-100 text-slate-700">🗣️ {(gd.languages || []).join(', ') || '한국어'}</span>
                            </div>
                        </div>
                    </section>

                    {/* About */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">가이드 소개</h2>
                        <div className="prose prose-slate max-w-none prose-p:leading-relaxed text-slate-600 font-light whitespace-pre-wrap">
                            {gd.bio || '소개글이 아직 없습니다.'}
                        </div>
                    </section>

                    {/* Reviews */}
                    <section className="pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-slate-900">여행자 후기</h2>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full">
                                <span className="text-sm font-bold text-amber-600">★ {gd.rating || 0}</span>
                                <span className="text-xs text-amber-600/70">({gd.review_count || 0}개)</span>
                            </div>
                        </div>

                        {reviews && reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map((review: any) => {
                                    const traveler = review.traveler || {};
                                    return (
                                        <div key={review.id} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={traveler.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(traveler.full_name || 'T')}`}
                                                        alt="User"
                                                        className="w-10 h-10 rounded-full border border-slate-200 shadow-sm"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{traveler.full_name || '익명 방문자'}</p>
                                                        <p className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`text-lg ${i < review.rating ? 'text-amber-400' : 'text-slate-200'}`}>
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{review.content}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <p className="text-slate-500 text-sm">아직 등록된 후기가 없습니다.<br />이 가이드와 첫 여행을 떠나보세요!</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column - Booking Widget & Calendar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <Suspense fallback={<div className="p-8 text-center text-slate-500">위젯 로딩 중...</div>}>
                            <BookingWidgetClient
                                guideId={guide.id}
                                isProfileComplete={true} // [테스트 모드] 상세 프로필 여부와 상관없이 예약 활성화
                                rateType={gd?.rate_type || 'daily'}
                                hourlyRate={Number(gd?.hourly_rate || 150000)} // 요금 정보가 없으면 기본값(15만) 적용
                                unavailableDates={unavailabilities || []}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
  } catch (err: any) {
    return (
      <div style={{padding: "40px", maxWidth: "800px", margin: "0 auto"}}>
        <h1 style={{color: "red"}}>Guide Detail Error (Debug)</h1>
        <pre style={{whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "16px", borderRadius: "8px"}}>
          {err?.message || "Unknown error"}
          {"\n\n"}
          {err?.stack || "No stack trace"}
        </pre>
      </div>
    );
  }
}
