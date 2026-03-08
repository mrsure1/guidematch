"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Clock,
  Globe,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  User,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  expandLanguageSearchTerms,
  GUIDE_LANGUAGE_FILTER_OPTIONS,
  normalizeSearchText,
} from "@/lib/search/language";

type GuideDetail = {
  location?: string | null;
  languages?: string[] | string | null;
  bio?: string | null;
  hourly_rate?: number | null;
  rate_type?: string | null;
  rating?: number | null;
  review_count?: number | null;
  is_verified?: boolean | null;
};

type Guide = {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  guides_detail?: GuideDetail | GuideDetail[] | null;
};

type TourGuideDetail = {
  rating?: number | null;
  review_count?: number | null;
  languages?: string[] | string | null;
};

type TourProfile = {
  full_name?: string | null;
  avatar_url?: string | null;
  guides_detail?: TourGuideDetail | TourGuideDetail[] | null;
};

type Tour = {
  id: string;
  title?: string | null;
  description?: string | null;
  region?: string | null;
  category?: string | null;
  duration?: number | null;
  price?: number | null;
  created_at?: string | null;
  photo?: string | null;
  included_items?: string[] | null;
  profiles?: TourProfile | null;
};

const ITEMS_PER_PAGE = 6;
const REGION_OPTIONS = ["전체", "서울", "부산", "제주", "강원", "전주"] as const;
const TOUR_CATEGORY_OPTIONS = ["전체", "역사", "음식", "쇼핑", "야경", "액티비티"] as const;
const GUIDE_SORT_OPTIONS = ["추천순", "평점 높은순", "리뷰 많은순", "가격 낮은순"] as const;
const TOUR_SORT_OPTIONS = ["추천순", "가격 낮은순", "최신순"] as const;

function getGuideDetail(guide: Guide): GuideDetail {
  const raw = guide.guides_detail;
  if (Array.isArray(raw)) {
    return raw[0] ?? {};
  }
  return raw ?? {};
}

function getTourGuideDetail(tour: Tour): TourGuideDetail {
  const raw = tour.profiles?.guides_detail;
  if (Array.isArray(raw)) {
    return raw[0] ?? {};
  }
  return raw ?? {};
}

function tokenizeKeyword(keyword: string): string[] {
  const normalized = normalizeSearchText(keyword);
  return normalized ? normalized.split(" ") : [];
}

function normalizeParts(parts: Array<string | null | undefined>): string[] {
  return parts.map((part) => normalizeSearchText(part ?? "")).filter(Boolean);
}

function includesAllTokens(index: string[], tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  return tokens.every((token) => index.some((entry) => entry.includes(token)));
}

function asLanguageIndex(value: unknown): string[] {
  return expandLanguageSearchTerms(value)
    .map((term) => normalizeSearchText(term))
    .filter(Boolean);
}

function containsTerm(source: string[], target: string[]): boolean {
  if (target.length === 0) return true;
  return target.some((term) => source.includes(term));
}

export default function SearchClient({
  guides,
  recommendedGuides = [],
  popularGuides = [],
  tours = [],
  recommendedTours = [],
}: {
  guides: Guide[];
  recommendedGuides?: Guide[];
  popularGuides?: Guide[];
  tours?: Tour[];
  recommendedTours?: Tour[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"guide" | "tour">(
    (searchParams.get("type") as "guide" | "tour") || "guide",
  );
  const [guidePage, setGuidePage] = useState(1);
  const [tourPage, setTourPage] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [selectedLanguage, setSelectedLanguage] = useState("상관없음");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortBy, setSortBy] = useState("추천순");
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get("q") || "");

  const resetPagination = useCallback(() => {
    setGuidePage(1);
    setTourPage(1);
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type");

    let hasChanged = false;

    if (searchKeyword !== q) {
      setSearchKeyword(q);
      hasChanged = true;
    }

    if ((type === "guide" || type === "tour") && activeTab !== type) {
      setActiveTab(type);
      hasChanged = true;
    }
    
    // 페이지네이션 리셋 제어
    if (hasChanged) {
      setGuidePage(1);
      setTourPage(1);
      
      // 검색 결과가 있는 경우 부드럽게 스크롤
      if (q.trim()) {
        const timeoutId = setTimeout(() => {
          const resultsElement = document.getElementById('search-results');
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [searchParams, searchKeyword, activeTab]);

  const keywordTokens = useMemo(() => tokenizeKeyword(searchKeyword), [searchKeyword]);
  const selectedLanguageTerms = useMemo(
    () => (selectedLanguage === "상관없음" ? [] : asLanguageIndex(selectedLanguage)),
    [selectedLanguage],
  );

  const handleActiveTabChange = useCallback(
    (tab: "guide" | "tour") => {
      setActiveTab(tab);
      setGuidePage(1);
      setTourPage(1);
      setSortBy("추천순");
      
      const params = new URLSearchParams(searchParams.toString());
      params.set("type", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleRegionChange = useCallback(
    (region: string) => {
      setSelectedRegion(region);
      resetPagination();
    },
    [resetPagination],
  );

  const handleLanguageChange = useCallback(
    (language: string) => {
      setSelectedLanguage(language);
      resetPagination();
    },
    [resetPagination],
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      resetPagination();
    },
    [resetPagination],
  );

  const handleSortChange = useCallback(
    (nextSortBy: string) => {
      setSortBy(nextSortBy);
      resetPagination();
    },
    [resetPagination],
  );

  const handleKeywordChange = useCallback(
    (value: string) => {
      setSearchKeyword(value);
      resetPagination();
    },
    [resetPagination],
  );

  const filteredGuides = useMemo(() => {
    const result = guides.filter((guide) => {
      const detail = getGuideDetail(guide);

      if (
        selectedRegion !== "전체" &&
        !(detail.location ?? "").toLowerCase().includes(selectedRegion.toLowerCase())
      ) {
        return false;
      }

      const languageIndex = asLanguageIndex(detail.languages);
      if (selectedLanguage !== "상관없음" && !containsTerm(languageIndex, selectedLanguageTerms)) {
        return false;
      }

      const guideSearchIndex = [
        ...normalizeParts([
          guide.full_name ?? "",
          detail.bio ?? "",
          detail.location ?? "",
          detail.rate_type === "hourly" ? "시간제" : "일일",
          detail.rate_type === "daily" ? "일일" : "시간제",
          "가이드",
          "전문가",
        ]),
        ...languageIndex,
      ];

      return includesAllTokens(guideSearchIndex, keywordTokens);
    });

    result.sort((a, b) => {
      const detailA = getGuideDetail(a);
      const detailB = getGuideDetail(b);

      const ratingA = detailA.rating ?? 0;
      const ratingB = detailB.rating ?? 0;
      const reviewsA = detailA.review_count ?? 0;
      const reviewsB = detailB.review_count ?? 0;
      const priceA = detailA.hourly_rate ?? 0;
      const priceB = detailB.hourly_rate ?? 0;

      if (sortBy === "평점 높은순") return ratingB - ratingA;
      if (sortBy === "리뷰 많은순") return reviewsB - reviewsA;
      if (sortBy === "가격 낮은순") return priceA - priceB;
      return 0;
    });

    return result;
  }, [guides, keywordTokens, selectedLanguage, selectedLanguageTerms, selectedRegion, sortBy]);

  const filteredTours = useMemo(() => {
    const result = tours.filter((tour) => {
      if (
        selectedRegion !== "전체" &&
        !(tour.region ?? "").toLowerCase().includes(selectedRegion.toLowerCase())
      ) {
        return false;
      }

      if (selectedCategory !== "전체" && tour.category !== selectedCategory) {
        return false;
      }

      const guideDetail = getTourGuideDetail(tour);
      const tourSearchIndex = [
        ...normalizeParts([
          tour.title ?? "",
          tour.description ?? "",
          tour.region ?? "",
          tour.category ?? "",
          tour.profiles?.full_name ?? "",
          ...(tour.included_items ?? []),
          "투어",
          "상품",
          "체험",
        ]),
        ...asLanguageIndex(guideDetail.languages),
      ];

      return includesAllTokens(tourSearchIndex, keywordTokens);
    });

    result.sort((a, b) => {
      if (sortBy === "가격 낮은순") {
        return (a.price ?? 0) - (b.price ?? 0);
      }
      if (sortBy === "최신순") {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }
      return 0;
    });

    return result;
  }, [keywordTokens, selectedCategory, selectedRegion, sortBy, tours]);

  const totalGuidePages = Math.max(1, Math.ceil(filteredGuides.length / ITEMS_PER_PAGE));
  const totalTourPages = Math.max(1, Math.ceil(filteredTours.length / ITEMS_PER_PAGE));

  const paginatedGuides = useMemo(() => {
    const start = (guidePage - 1) * ITEMS_PER_PAGE;
    return filteredGuides.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGuides, guidePage]);

  const paginatedTours = useMemo(() => {
    const start = (tourPage - 1) * ITEMS_PER_PAGE;
    return filteredTours.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTours, tourPage]);

  const isSearching = keywordTokens.length > 0;
  // type 파라미터만 있어도 전체 목록을 보여줌
  const hasTypeFilter = searchParams.has('type');
  const showFullList = isSearching || hasTypeFilter;

  const GuideCard = ({ guide }: { guide: Guide }) => {
    const detail = getGuideDetail(guide);
    return (
      <Link href={`/traveler/guides/${guide.id}`}>
        <Card className="premium-card flex h-full cursor-pointer flex-col gap-5 border-slate-200/60 bg-white p-5 transition-all group hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10 sm:flex-row">
          <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-inner sm:h-auto sm:w-36">
            <img
              src={guide.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${guide.id}`}
              alt="Guide"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute left-3 top-3 flex items-center rounded-lg bg-white/95 px-2 py-1 text-xs font-bold text-slate-900 shadow-sm backdrop-blur-md">
              <Star className="mr-1 h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {detail.rating || "신규"}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
            <div>
              <div className="mb-1.5 flex items-start justify-between">
                <h3 className="truncate text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                  {guide.full_name || "Anonymous"}
                </h3>
                {detail.is_verified && (
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 shadow-sm">
                    인증 가이드
                  </span>
                )}
              </div>
              <p className="mb-3 flex items-center gap-1.5 truncate text-sm font-medium text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {detail.location || "지역 미정"}
                <span className="text-slate-300">|</span>
                <Globe className="h-3.5 w-3.5 text-slate-400" />{" "}
                {(Array.isArray(detail.languages) ? detail.languages : detail.languages ? [detail.languages] : ["한국어"]).join(
                  ", ",
                )}
              </p>
              <p className="line-clamp-2 text-sm font-light leading-relaxed text-slate-600">
                {detail.bio || "소개글이 없습니다."}
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                ₩ {Number(detail.hourly_rate || 0).toLocaleString()}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  / {detail.rate_type === "hourly" ? "시간" : "일"}
                </span>
              </span>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  const TourCard = ({ tour }: { tour: Tour }) => {
    const guideDetail = getTourGuideDetail(tour);
    return (
      <Link href={`/traveler/tours/${tour.id}`}>
        <Card className="premium-card group flex h-full cursor-pointer flex-col gap-0 overflow-hidden border-slate-200/60 bg-white transition-all hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10">
          <div className="relative h-48 overflow-hidden bg-slate-100">
            <img
              src={tour.photo || "https://images.unsplash.com/photo-1544750040-4ea9b8a27d38?q=80&w=800"}
              alt="Tour"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-900 shadow-sm backdrop-blur-md">
              {tour.region}
            </div>
          </div>
          <CardContent className="flex flex-1 flex-col justify-between p-5">
            <div>
              <h3 className="mb-2 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                {tour.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {tour.duration}시간
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {tour.profiles?.full_name}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
              <span className="text-lg font-black text-blue-600">₩ {Number(tour.price || 0).toLocaleString()}</span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                <Star className="h-3 w-3 fill-amber-500" /> {guideDetail.rating || 4.5}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 w-full animate-in fade-in duration-500 will-change-transform">
      {/* Sidebar: Dashboard-like Sidebar for search too */}
      <aside className="lg:col-span-1 flex flex-col gap-6">
        <div className="space-y-6 sticky top-24">
          {/* New Widget: Quick Navigation */}
          <Card className="premium-card bg-white/70 backdrop-blur-md border-white/60 shadow-xl shadow-slate-900/5 overflow-hidden">
            <div className="p-5 border-b border-slate-100/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">퀵 네비게이션</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <Button 
                variant="outline" 
                fullWidth 
                className="justify-between h-12 border-slate-200 bg-white/50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 font-bold rounded-xl transition-all group"
                onClick={() => {
                  setSearchKeyword('');
                  setActiveTab('guide');
                  setSelectedRegion('전체');
                  setSelectedLanguage('상관없음');
                  setSortBy('추천순');
                  resetPagination();
                  router.replace('/traveler/home?type=guide', { scroll: false });
                }}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                  <span>전체 가이드 보기</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Button>
              <Button 
                variant="outline" 
                fullWidth 
                className="justify-between h-12 border-slate-200 bg-white/50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 font-bold rounded-xl transition-all group"
                onClick={() => {
                  setSearchKeyword('');
                  setActiveTab('tour');
                  setSelectedRegion('전체');
                  setSelectedCategory('전체');
                  setSortBy('추천순');
                  resetPagination();
                  router.replace('/traveler/home?type=tour', { scroll: false });
                }}
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                  <span>전체 투어 상품 보기</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Button>
            </div>
          </Card>

          {/* Notifications Card - Matching Dashboard style */}
          <Card className="premium-card bg-white/70 backdrop-blur-md border-white/60 shadow-xl shadow-slate-900/5 overflow-hidden">
            <div className="p-5 border-b border-slate-100/50 flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-700" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">최근 알림</h3>
            </div>
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-bold">새로운 알림이 없습니다.</p>
            </div>
          </Card>

          {/* New Widget: Travel Tips */}
          <Card className="premium-card bg-gradient-to-br from-blue-600 to-indigo-700 border-none shadow-xl shadow-blue-900/20 text-white overflow-hidden group">
            <div className="p-6 relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-24 h-24" />
              </div>
              <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                여행 꿀팁
              </h3>
              <p className="text-xs text-blue-100 font-medium leading-relaxed mb-4">
                가이드와 미리 연락하여 <br/>코스를 조정하면 더 만족스럽답니다!
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 p-2 rounded-lg border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  전문 예약 시스템 이용하기
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 p-2 rounded-lg border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                  리뷰 꼼꼼히 체크하기
                </div>
              </div>
            </div>
          </Card>

          {/* New Widget: Safe Guarantee */}
          <Card className="premium-card bg-white/80 backdrop-blur-md border-white/60 shadow-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">100% 안심 보장</h4>
                <p className="text-[10px] text-slate-500 font-bold">Mr.Sure가 보증하는 거래</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                24시간 전 무료 취소 가능
              </li>
              <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <User className="h-3.5 w-3.5 text-blue-500" />
                신원 인증 완료된 가이드만 활동
              </li>
            </ul>
          </Card>

          {/* New Widget: Popular Tags */}
          <div className="px-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              지금 뜨는 키워드
            </h4>
            <div className="flex flex-wrap gap-2">
              {["#서울야경", "#현지인맛집", "#사진전문가", "#역사기행", "#DMZ투어", "#동대문쇼핑"].map((tag) => (
                <button 
                  key={tag}
                  onClick={() => handleKeywordChange(tag.replace('#', ''))} 
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Results: Dashboard-like container for search too */}
      <main id="search-results" className="lg:col-span-2 space-y-8 min-w-0">
        {!showFullList ? (
          <div className="animate-fade-in space-y-12">
            {activeTab === "guide" ? (
              <>
                <section className="space-y-6">
                  <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900">
                    <Sparkles className="h-7 w-7 animate-pulse text-amber-500" />
                    추천 가이드
                  </h2>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {recommendedGuides.map((guide) => (
                      <GuideCard key={`rec-${guide.id}`} guide={guide} />
                    ))}
                  </div>
                </section>
                <section className="space-y-6">
                  <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900">
                    <TrendingUp className="h-7 w-7 text-rose-500" />
                    인기 가이드
                  </h2>
                  <div className="grid grid-cols-1 gap-6 pb-12 md:grid-cols-2">
                    {popularGuides.map((guide) => (
                      <GuideCard key={`pop-${guide.id}`} guide={guide} />
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-6">
                  <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900">
                    <Sparkles className="h-7 w-7 animate-pulse text-blue-500" />
                    추천 투어
                  </h2>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {recommendedTours.map((tour) => (
                      <TourCard key={`rectour-${tour.id}`} tour={tour} />
                    ))}
                  </div>
                </section>
                <div className="relative overflow-hidden rounded-[40px] bg-blue-600 p-8 text-center text-white shadow-2xl">
                  <h3 className="mb-2 text-2xl font-black">나만의 맞춤 투어를 찾아보세요</h3>
                  <p className="text-sm text-blue-100">원하는 키워드로 검색해 보세요.</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 overflow-hidden rounded-[32px] border border-white bg-white/60 shadow-2xl duration-500 backdrop-blur-md">
            <div className="border-b border-slate-100 bg-slate-50/50 p-4">
              <div className="mx-auto flex max-w-md rounded-2xl bg-slate-200/50 p-1 backdrop-blur-sm sm:mx-0">
                <button
                  type="button"
                  onClick={() => handleActiveTabChange("guide")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition-all ${
                    activeTab === "guide"
                      ? "scale-[1.02] bg-white text-blue-600 shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <User className="h-4 w-4" /> 가이드 찾기
                </button>
                <button
                  type="button"
                  onClick={() => handleActiveTabChange("tour")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition-all ${
                    activeTab === "tour"
                      ? "scale-[1.02] bg-white text-blue-600 shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Heart className="h-4 w-4" /> 투어 상품 탐색
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-white/40 p-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {isSearching 
                    ? `${activeTab === "guide" ? "가이드" : "투어"} 검색 결과` 
                    : `전체 ${activeTab === "guide" ? "가이드" : "투어 상품"} 목록`}
                </h2>
                <p className="text-sm text-slate-500">
                  <span className="font-bold text-blue-600">
                    {activeTab === "guide" ? filteredGuides.length : filteredTours.length}
                  </span>
                  {isSearching ? '개의 결과를 찾았습니다.' : '개가 등록되어 있습니다.'}
                </p>
              </div>
              <select
                value={sortBy}
                onChange={(event) => handleSortChange(event.target.value)}
                className="min-w-32 appearance-none rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm"
              >
                {(activeTab === "guide" ? GUIDE_SORT_OPTIONS : TOUR_SORT_OPTIONS).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="custom-scrollbar max-h-[calc(100vh-250px)] space-y-6 overflow-y-auto p-6">
              {(activeTab === "guide" ? filteredGuides.length : filteredTours.length) === 0 ? (
                <div className="py-24 text-center text-slate-400">결과가 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {activeTab === "guide"
                    ? paginatedGuides.map((guide) => <GuideCard key={guide.id} guide={guide} />)
                    : paginatedTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
                </div>
              )}

              {(activeTab === "guide" ? totalGuidePages : totalTourPages) > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3 pb-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      activeTab === "guide"
                        ? setGuidePage((prev) => Math.max(1, prev - 1))
                        : setTourPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={(activeTab === "guide" ? guidePage : tourPage) === 1}
                  >
                    이전
                  </Button>
                  <span className="text-xs font-black text-slate-500">
                    {activeTab === "guide" ? guidePage : tourPage} /{" "}
                    {activeTab === "guide" ? totalGuidePages : totalTourPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      activeTab === "guide"
                        ? setGuidePage((prev) => Math.min(totalGuidePages, prev + 1))
                        : setTourPage((prev) => Math.min(totalTourPages, prev + 1))
                    }
                    disabled={
                      (activeTab === "guide" ? guidePage : tourPage) ===
                      (activeTab === "guide" ? totalGuidePages : totalTourPages)
                    }
                  >
                    다음
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
