import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { MapPin, Star, Clock, Calendar, ChevronRight, Bell, Sparkles, TrendingUp, Globe } from "lucide-react";
import HomeSearchClient from "./HomeSearchClient";
import TourInfiniteListClient from "./TourInfiniteListClient";
import SearchClient from "@/components/search/SearchClient";
import { createClient } from "@/lib/supabase/server";

export default async function TravelerHome({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
    const { q: searchKeyword, type: searchType } = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch upcoming bookings
    const { data: rawBookings } = user ? await supabase
        .from('bookings')
        .select('*')
        .eq('traveler_id', user.id)
        .in('status', ['pending', 'confirmed', 'paid'])
        .eq('is_hidden_by_traveler', false)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(1) : { data: null };

    const firstBooking = rawBookings?.[0];
    let processedBooking = null;

    if (firstBooking) {
        const { data: profile } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                avatar_url,
                guides_detail (
                    location,
                    bio
                )
            `)
            .eq('id', firstBooking.guide_id)
            .single();

        if (profile) {
            const detail = Array.isArray(profile.guides_detail)
                ? profile.guides_detail[0]
                : profile.guides_detail;

            processedBooking = {
                ...firstBooking,
                guide: profile,
                detail: detail || {}
            };
        }
    }

    // 2. 가이드 데이터 페칭
    const { data: recommendedGuides } = await supabase
        .from('profiles')
        .select(`
            id, full_name, avatar_url,
            guides_detail ( id, location, languages, bio, hourly_rate, rate_type, rating, review_count, is_verified )
        `)
        .in('role', ['guide', 'admin'])
        .order('rating', { foreignTable: 'guides_detail', ascending: false })
        .limit(4);

    const { data: popularGuides } = await supabase
        .from('profiles')
        .select(`
            id, full_name, avatar_url,
            guides_detail ( id, location, languages, bio, hourly_rate, rate_type, rating, review_count, is_verified )
        `)
        .in('role', ['guide', 'admin'])
        .order('review_count', { foreignTable: 'guides_detail', ascending: false })
        .limit(4);

    const { data: allGuides } = await supabase
        .from('profiles')
        .select(`
            id, full_name, avatar_url,
            guides_detail ( id, location, languages, bio, hourly_rate, rate_type, rating, review_count, is_verified )
        `)
        .in('role', ['guide', 'admin']);

    type GuideRow = {
        guides_detail?: unknown;
    };

    const processGuide = <T extends GuideRow>(guide: T): T & { guides_detail: Record<string, unknown> } => {
        const guideDetail = guide.guides_detail;
        const normalizedDetail = Array.isArray(guideDetail) ? guideDetail[0] : guideDetail;

        return {
            ...guide,
            guides_detail:
                normalizedDetail && typeof normalizedDetail === 'object'
                    ? (normalizedDetail as Record<string, unknown>)
                    : {},
        };
    };

    const processedRecommendedGuides = (recommendedGuides || []).map(processGuide);
    const processedPopularGuides = (popularGuides || []).map(processGuide);
    const processedAllGuides = (allGuides || []).map(processGuide);

    // 3. 투어 데이터 페칭
    const { data: allTours } = await supabase
        .from('tours')
        .select(`
            *,
            profiles (
                full_name,
                avatar_url,
                guides_detail ( rating, review_count, languages )
            )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    const { data: recommendedTours } = await supabase
        .from('tours')
        .select(`
            *,
            profiles (
                full_name,
                avatar_url,
                guides_detail ( rating, review_count, languages )
            )
        `)
        .eq('is_active', true)
        .limit(4);

    const { data: trendingTours } = await supabase
        .from('tours')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-10 animate-fade-in relative">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 pointer-events-none" />

            {/* Hero / CTA Section */}
            <section className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl h-[480px] sm:h-[500px] flex flex-col justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/namsan-tower.png"
                        alt="Seoul Namsan Tower"
                        className="w-full h-full object-contain object-right absolute inset-0 opacity-76"
                        style={{
                            maskImage: 'linear-gradient(to right, transparent 0%, black 60%)',
                            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 60%)'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                </div>
                <div className="relative z-10 p-8 sm:p-14 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 text-sm font-medium">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>프리미엄 로컬 가이드 매칭</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
                        완벽한 한국 여행을 <br className="hidden sm:block" />
                        준비하세요
                    </h1>
                    <p className="text-slate-300 text-lg sm:text-xl mb-10 font-light max-w-2xl leading-relaxed">
                        나의 일정과 취향에 꼭 맞는 현지 전문가를 찾아보세요.<br className="hidden sm:block" />
                        서울부터 제주까지, 지금까지 경험하지 못한 특별한 순간이 기다립니다.
                    </p>

                    <HomeSearchClient initialKeyword={searchKeyword} />
                </div>
            </section>

            {/* Dashboard Grid or Search Results */}
            <div className="relative z-10 w-full">
                {(searchKeyword || searchType) ? (
                    <SearchClient
                        guides={processedAllGuides}
                        recommendedGuides={processedRecommendedGuides}
                        popularGuides={processedPopularGuides}
                        tours={allTours || []}
                        recommendedTours={recommendedTours || []}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column (나의 일정 & 알림) */}
                        <div className="lg:col-span-1 space-y-8">
                            <Card className="premium-card bg-white/70 backdrop-blur-md border-white/60 shadow-xl shadow-blue-900/5">
                                <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-slate-100/50">
                                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        예정된 여행
                                    </CardTitle>
                                    <Link href="/traveler/bookings" className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center">
                                        모두 보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                                    </Link>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {processedBooking ? (
                                        <Link href={`/traveler/bookings`}>
                                            <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl shadow-sm border border-slate-100 mb-5 relative overflow-hidden group hover:border-blue-200 transition-colors cursor-pointer">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">
                                                    <MapPin className="w-24 h-24 text-blue-600" />
                                                </div>
                                                <div className="flex justify-between items-start mb-2 relative z-10">
                                                    <h3 className="font-bold text-slate-900 text-lg">{processedBooking.detail.location || '미지정 지역'} 투어</h3>
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${processedBooking.status === 'confirmed'
                                                        ? 'bg-blue-100 text-blue-700 ring-blue-700/10'
                                                        : 'bg-amber-100 text-amber-700 ring-amber-700/10'
                                                        }`}>
                                                        {processedBooking.status === 'confirmed' ? '확정' : '승인 대기'}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-1.5 relative z-10">
                                                    <Clock className="w-3.5 h-3.5" /> {processedBooking.start_date}
                                                </p>
                                                <div className="flex items-center justify-between relative z-10 pt-4 border-t border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <img className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 shadow-sm object-cover" src={processedBooking.guide.avatar_url || "https://i.pravatar.cc/150"} alt={processedBooking.guide.full_name} />
                                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">{processedBooking.guide.full_name} 가이드</p>
                                                            <p className="text-xs text-slate-500">인증된 파트너</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="text-center py-10 px-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Calendar className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 text-sm">예정된 일정이 없습니다.</p>
                                            <p className="text-slate-400 text-xs mt-1">지금 새로운 가이드를 찾아보세요!</p>
                                        </div>
                                    )}
                                    <Link href="/traveler/home">
                                        <Button fullWidth variant="outline" className="h-12 border-slate-200 bg-white/50 hover:bg-white text-slate-700 font-semibold rounded-xl">
                                            새 일정 계획하기
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="premium-card bg-white/70 backdrop-blur-md border-white/60 shadow-xl shadow-slate-900/5">
                                <CardHeader className="pb-4 border-b border-slate-100/50">
                                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                        <Bell className="w-5 h-5 text-slate-700" />
                                        최근 알림
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ul className="divide-y divide-slate-100/80">
                                        <li className="p-10 text-center">
                                            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                            <p className="text-sm text-slate-400 font-medium">새로운 알림이 없습니다.</p>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column (추천 투어 / 검색 결과) */}
                        <div className="lg:col-span-2 space-y-12">
                            {/* 인기 가이드 섹션 */}
                            <section>
                                <div className="flex items-end justify-between mb-6">
                                    <div className="relative">
                                        <div className="absolute -left-4 -top-4 w-12 h-12 bg-blue-100/50 rounded-full blur-xl -z-10" />
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                            <Sparkles className="w-7 h-7 text-blue-600 animate-pulse" />
                                            지금 가장 인기 있는 로컬 가이드
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1 font-medium pl-10">실제 여행자들이 강력 추천하는 분야별 전문가</p>
                                    </div>
                                    <Link href="/traveler/home?type=guide" className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center mb-1">
                                        더 많은 가이드 보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {processedPopularGuides.map((guide) => (
                                        <Link key={guide.id} href={`/traveler/guides/${guide.id}`}>
                                            <Card className="premium-card overflow-hidden group cursor-pointer bg-white/80 border-white/60 shadow-lg hover:-translate-y-1 transition-all duration-300">
                                                <div className="relative h-48 overflow-hidden">
                                                    <img 
                                                        src={guide.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${guide.id}`} 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                        alt={guide.full_name || "Guide"} 
                                                    />
                                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {(guide.guides_detail?.rating as React.ReactNode) || "신규"}
                                                    </div>
                                                    <div className="absolute bottom-4 left-4 bg-slate-900/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/20">
                                                        {(guide.guides_detail?.location as React.ReactNode) || "지역 미정"}
                                                    </div>
                                                </div>
                                                <CardContent className="p-5">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{(guide.full_name as React.ReactNode) || "Anonymous"}</h3>
                                                        {Boolean(guide.guides_detail?.is_verified) && (
                                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-bold border border-blue-100">인증</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed mb-4">
                                                        {(guide.guides_detail?.bio as React.ReactNode) || "가이드 소개를 준비 중입니다."}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                        <div className="flex items-center gap-1.5">
                                                            <Globe className="w-3 h-3 text-slate-400" />
                                                            <span className="text-[10px] font-medium text-slate-500">
                                                                {Array.isArray(guide.guides_detail?.languages) 
                                                                    ? (guide.guides_detail.languages as string[]).slice(0, 2).join(", ") 
                                                                    : "한국어"}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-black text-slate-950">
                                                            ₩ {Number(guide.guides_detail?.hourly_rate || 0).toLocaleString()}
                                                            <span className="text-[10px] font-normal text-slate-500 ml-0.5">/시간</span>
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </section>

                            {/* 인기 상품 섹션 */}
                            <section>
                                <div className="flex items-end justify-between mb-6">
                                    <div className="relative">
                                        <div className="absolute -left-4 -top-4 w-12 h-12 bg-rose-100/50 rounded-full blur-xl -z-10" />
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                            <TrendingUp className="w-7 h-7 text-rose-600" />
                                            인기 상승 투어 코스
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1 font-medium pl-10">실시간 예약이 가장 많은 핫한 코스들</p>
                                    </div>
                                    <Link href="/traveler/home?type=tour" className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline transition-colors flex items-center mb-1">
                                        더 많은 상품 보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                                    </Link>
                                </div>
                                <TourInfiniteListClient
                                    initialTours={trendingTours || []}
                                    keyword=""
                                />
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
