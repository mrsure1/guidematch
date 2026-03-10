"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  Clock,
  Compass,
  Map,
  MapPin,
  Minus,
  Plus,
  Search,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type LandingGuide = {
  id: string;
  name: string;
  location: string;
  bio: string;
  languages: string[];
  hourlyRate: number;
  rating: number | null;
  reviewCount: number | null;
  avatar: string;
  isVerified: boolean;
};

export type LandingTour = {
  id: string;
  title: string;
  region: string;
  description: string;
  duration: number;
  price: number;
  photo: string;
  guideName: string;
  rating: number | null;
  reviewCount: number | null;
};

type TabType = "guide" | "tour";

type SearchDraft = {
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
};

type Props = {
  guideHref: string;
  guides: LandingGuide[];
  tours: LandingTour[];
  userName?: string | null;
};

const numberFormatter = new Intl.NumberFormat("ko-KR");

const tabCopy: Record<
  TabType,
  {
    label: string;
    title: string;
    subtitle: string;
  }
> = {
  tour: {
    label: "여행상품 추천",
    title: "바로 비교할 수 있는 여행상품",
    subtitle: "일정형 상품을 먼저 훑고 싶을 때 빠르게 비교할 수 있습니다.",
  },
  guide: {
    label: "가이드 추천",
    title: "내 일정에 맞는 로컬 가이드",
    subtitle: "상품보다 사람을 먼저 고르고 싶다면 이 탭에서 바로 비교할 수 있습니다.",
  },
};

function formatPrice(value: number) {
  return `₩${numberFormatter.format(value)}`;
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "날짜 선택";
  }

  return `${start.getMonth() + 1}.${start.getDate()} - ${end.getMonth() + 1}.${end.getDate()}`;
}

function GuestStepper({
  label,
  count,
  min = 0,
  onChange,
}: {
  label: string;
  count: number;
  min?: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{count}명</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, count - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          aria-label={`${label} 감소`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-slate-900">{count}</span>
        <button
          type="button"
          onClick={() => onChange(count + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          aria-label={`${label} 증가`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function GuideCard({ guide, queryString }: { guide: LandingGuide, queryString?: string }) {
  return (
    <Link
      href={`/traveler/guides/${guide.id}${queryString || ''}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e9e4db] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f1ea]">
        <Image
          src={guide.avatar}
          alt={guide.name}
          fill
          sizes="(min-width: 1280px) 24rem, (min-width: 768px) 33vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-900 backdrop-blur">
          <Star className="h-3.5 w-3.5 fill-[#ff385c] text-[#ff385c]" />
          {guide.rating ? guide.rating.toFixed(1) : "New"}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{guide.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {guide.location}
            </p>
          </div>
          {guide.isVerified && (
            <span className="rounded-full bg-[#fff0f3] px-3 py-1 text-xs font-semibold text-[#ff385c]">
              인증
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{guide.bio}</p>
        <div className="flex flex-wrap gap-2">
          {guide.languages.slice(0, 3).map((language) => (
            <span
              key={`${guide.id}-${language}`}
              className="rounded-full bg-[#f7f5f2] px-3 py-1 text-xs font-medium text-slate-600"
            >
              {language}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{formatPrice(guide.hourlyRate)}</p>
            <p className="text-xs text-slate-500">시간당 가이드</p>
          </div>
          <p className="text-xs text-slate-500">
            후기 {guide.reviewCount ? numberFormatter.format(guide.reviewCount) : 0}개
          </p>
        </div>
      </div>
    </Link>
  );
}

function TourCard({ tour, queryString }: { tour: LandingTour, queryString?: string }) {
  const photos = tour.photo ? tour.photo.split(',') : ['https://images.unsplash.com/photo-1544750040-4ea9b8a27d38?q=80&w=800'];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const idx = Math.round(scrollLeft / clientWidth);
      setCurrentIdx(idx);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const move = direction === 'left' ? -clientWidth : clientWidth;
      scrollRef.current.scrollBy({ left: move, behavior: 'smooth' });
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e9e4db] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f1ea]">
        {/* Image Carousel */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scrollbar-none scroll-smooth"
        >
          {photos.map((photo, index) => (
            <div key={index} className="relative h-full w-full shrink-0 snap-start">
              <Image
                src={photo}
                alt={`${tour.title} - ${index + 1}`}
                fill
                sizes="(min-width: 1280px) 24rem, (min-width: 768px) 33vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Carousel Navigation Buttons (Arrows) */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); scroll('left'); }}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-white",
                currentIdx === 0 && "hidden"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); scroll('right'); }}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-white",
                currentIdx === photos.length - 1 && "hidden"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Carousel Indicators (Dots) */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 z-10">
            {photos.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all duration-300",
                  currentIdx === i ? "bg-white w-3" : "bg-white/60"
                )}
              />
            ))}
          </div>
        )}

        <div className="absolute left-4 top-4 z-10 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-900 backdrop-blur">
          {tour.region}
        </div>
      </div>

      <Link
        href={`/traveler/tours/${tour.id}${queryString || ''}`}
        className="flex flex-1 flex-col gap-4 p-5"
      >
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{tour.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{tour.description}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {tour.duration || 0}시간
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-[#ff385c] text-[#ff385c]" />
            {tour.rating ? tour.rating.toFixed(1) : "New"}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{formatPrice(tour.price)}</p>
            <p className="text-xs text-slate-500">{tour.guideName}</p>
          </div>
          <p className="text-xs font-medium text-slate-600">자세히 보기</p>
        </div>
      </Link>
    </div>
  );
}

export default function MainLandingClient({ guideHref, guides, tours, userName }: Props) {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const destinationPanelRef = useRef<HTMLDivElement | null>(null);
  const datePanelRef = useRef<HTMLDivElement | null>(null);
  const guestPanelRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("tour");
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const [draft, setDraft] = useState<SearchDraft>({
    destination: "",
    startDate: "",
    endDate: "",
    adults: 2,
    children: 0,
  });
  const [criteria, setCriteria] = useState<SearchDraft | null>(null);

  const destinationOptions = useMemo(() => {
    const values = [...guides.map((guide) => guide.location), ...tours.map((tour) => tour.region)]
      .map((value) => value.trim())
      .filter(Boolean);

    return Array.from(new Set(values));
  }, [guides, tours]);

  const quickRegions = useMemo(() => destinationOptions.slice(0, 5), [destinationOptions]);

  const filteredDestinationOptions = useMemo(() => {
    if (!draft.destination.trim()) {
      return destinationOptions.slice(0, 6);
    }

    return destinationOptions
      .filter((option) => option.toLowerCase().includes(draft.destination.toLowerCase()))
      .slice(0, 6);
  }, [destinationOptions, draft.destination]);

  const selectedRange = useMemo(
    () => ({
      from: draft.startDate,
      to: draft.endDate,
    }),
    [draft.endDate, draft.startDate],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (destinationPanelRef.current && !destinationPanelRef.current.contains(target)) {
        setIsDestinationOpen(false);
      }

      if (datePanelRef.current && !datePanelRef.current.contains(target)) {
        setIsDatePickerOpen(false);
      }

      if (guestPanelRef.current && !guestPanelRef.current.contains(target)) {
        setIsGuestPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!criteria) return;

    const section = document.getElementById("explore-results");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [criteria, activeTab]);

  const canSearch = Boolean(draft.destination.trim() && draft.startDate && draft.endDate);

  const filteredGuides = useMemo(() => {
    const list = [...guides];

    if (!criteria) return list.slice(0, 8);

    return list
      .filter((guide) => guide.location.toLowerCase().includes(criteria.destination.toLowerCase()))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [criteria, guides]);

  const filteredTours = useMemo(() => {
    const list = [...tours];

    if (!criteria) return list.slice(0, 8);

    return list
      .filter((tour) => tour.region.toLowerCase().includes(criteria.destination.toLowerCase()))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [criteria, tours]);

  const visibleGuides = filteredGuides.slice(0, 8);
  const visibleTours = filteredTours.slice(0, 8);

  const guestSummary = `성인 ${draft.adults}명${draft.children > 0 ? ` · 어린이 ${draft.children}명` : ""
    }`;

  return (
    <main className="min-h-screen bg-[#fbf8f3] text-slate-900 [overflow-wrap:normal] [word-break:keep-all]">
      <section className="relative z-20 overflow-visible">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1535189043414-47a3c49a0bed?auto=format&fit=crop&w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/72 to-blue-950/68" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.28),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(59,130,246,0.2),transparent_28%),radial-gradient(circle_at_75%_85%,rgba(14,116,144,0.2),transparent_30%)]" />

        <div className="relative z-30 mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4 rounded-full border border-white/15 bg-white/8 px-5 py-3 backdrop-blur-md">
            <BrandLogo href="/" size="lg" tone="light" variant="signature" />
            <Link
              href={guideHref}
              className="rounded-full border border-white/20 bg-white/8 px-4 py-2 text-xs font-medium text-white/72 transition hover:border-white/30 hover:bg-white/12 hover:text-white"
            >
              가이드 메뉴
            </Link>
          </header>

          <div className="mt-8 rounded-[38px] border border-white/15 bg-white/96 p-3 shadow-[0_30px_80px_rgba(2,6,23,0.26)] backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2 px-2 pb-3 pt-1">
              {(
                [
                  { key: "tour", label: tabCopy.tour.label, icon: Map },
                  { key: "guide", label: tabCopy.guide.label, icon: Compass },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                      activeTab === tab.key
                        ? "bg-slate-950 text-white"
                        : "bg-[#f6f2eb] text-slate-600 hover:text-slate-900",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!canSearch) return;
                setCriteria({ ...draft, destination: draft.destination.trim() });
              }}
              className="grid gap-2 lg:grid-cols-[1.4fr_1fr_0.9fr_auto]"
            >
              <div ref={destinationPanelRef} className="relative">
                <label className="flex min-h-[84px] flex-col justify-center rounded-[30px] border border-transparent px-5 py-4 transition hover:bg-slate-50 lg:border-r lg:border-r-slate-100 lg:rounded-none lg:rounded-l-[30px]">
                  <span className="text-xs font-semibold text-slate-900">여행지</span>
                  <input
                    type="text"
                    value={draft.destination}
                    onFocus={() => setIsDestinationOpen(true)}
                    onChange={(event) => {
                      setDraft((prev) => ({ ...prev, destination: event.target.value }));
                      setIsDestinationOpen(true);
                    }}
                    placeholder="어디로 여행할까요?"
                    className="mt-2 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>

                {isDestinationOpen && filteredDestinationOptions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                    <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Suggested Regions
                    </div>
                    <div className="py-2">
                      {filteredDestinationOptions.map((destination) => (
                        <button
                          key={destination}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setDraft((prev) => ({ ...prev, destination }));
                            setIsDestinationOpen(false);
                          }}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            {destination}
                          </span>
                          <span className="text-xs text-slate-400">참조 지역명</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div ref={datePanelRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen((prev) => !prev)}
                  className="flex min-h-[84px] w-full flex-col justify-center rounded-[30px] border border-transparent px-5 py-4 text-left transition hover:bg-slate-50 lg:border-r lg:border-r-slate-100 lg:rounded-none"
                >
                  <span className="text-xs font-semibold text-slate-900">날짜</span>
                  <span className="mt-2 text-sm text-slate-700">
                    {draft.startDate && draft.endDate
                      ? formatDateRange(draft.startDate, draft.endDate)
                      : "여행 날짜 추가"}
                  </span>
                </button>

                {isDatePickerOpen && (
                  <div className="absolute left-0 top-[calc(100%+10px)] z-50">
                    <Calendar
                      mode="range"
                      minDate={today}
                      selected={selectedRange}
                      onSelect={(range: { from: string; to: string }) => {
                        setDraft((prev) => ({
                          ...prev,
                          startDate: range?.from || "",
                          endDate: range?.to || "",
                        }));

                        if (range?.from && range?.to) {
                          setIsDatePickerOpen(false);
                        }
                      }}
                      className="w-[340px] shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
                    />
                  </div>
                )}
              </div>

              <div ref={guestPanelRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsGuestPickerOpen((prev) => !prev)}
                  className="flex min-h-[84px] w-full flex-col justify-center rounded-[30px] border border-transparent px-5 py-4 text-left transition hover:bg-slate-50 lg:rounded-none"
                >
                  <span className="text-xs font-semibold text-slate-900">인원</span>
                  <span className="mt-2 text-sm text-slate-700">{guestSummary}</span>
                </button>

                {isGuestPickerOpen && (
                  <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-[320px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                    <div className="space-y-3">
                      <GuestStepper
                        label="성인"
                        count={draft.adults}
                        min={1}
                        onChange={(next) => setDraft((prev) => ({ ...prev, adults: next }))}
                      />
                      <GuestStepper
                        label="어린이"
                        count={draft.children}
                        onChange={(next) => setDraft((prev) => ({ ...prev, children: next }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center px-2 py-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={!canSearch}
                  className="h-14 w-full rounded-full bg-blue-600 px-7 text-sm font-semibold text-white hover:bg-blue-700 lg:w-auto"
                >
                  <Search className="mr-2 h-4 w-4" />
                  검색
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-8 max-w-3xl text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/12 px-4 py-2 text-sm font-medium text-cyan-50 shadow-sm">
              <Sparkles className="h-4 w-4" />
              {userName
                ? `${userName}님, 이번 여행에 맞는 가이드와 상품을 골라보세요`
                : "지역과 일정만 고르면 가이드와 여행상품을 바로 비교할 수 있습니다"}
            </p>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
              어디로 떠날지 고르면
              <br />
              잘 맞는 가이드와 여행을 바로 찾습니다
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
              지역, 날짜, 인원을 먼저 선택하고 현지 가이드 매칭과 관광상품을 한 화면에서
              비교해보세요. 지역별 추천은 물론 여행 테마에 맞는 선택지도 빠르게 찾을 수
              있습니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {quickRegions.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, destination: region }))}
                  className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm text-white/88 transition hover:bg-white/16"
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="explore-results" className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {(() => {
          const params = new URLSearchParams();
          if (criteria?.startDate) params.set('startDate', criteria.startDate);
          if (criteria?.endDate) params.set('endDate', criteria.endDate);
          if (criteria?.adults) params.set('adults', criteria.adults.toString());
          if (criteria?.children) params.set('children', criteria.children.toString());
          const searchParamsString = Array.from(params.keys()).length > 0 ? `?${params.toString()}` : '';

          return (
            <div className="space-y-16">
              {/* 1. 추천 가이드 섹션 (사용자 요청: 가이드 우선 배치) */}
              <div className="space-y-8">
                <div className="flex items-end justify-between px-2">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">인기 추천 가이드</h2>
                    <p className="text-sm font-medium text-slate-500">전문성 넘치는 가이드들과 함께하는 특별한 현지 여행</p>
                  </div>
                </div>
                {visibleGuides.length === 0 ? (
                  <div className="rounded-[28px] bg-white/50 border border-slate-100 px-6 py-14 text-center backdrop-blur-sm">
                    <p className="text-lg font-semibold text-slate-900">추천 가이드 정보가 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleGuides.map((guide) => (
                      <GuideCard key={guide.id} guide={guide} queryString={searchParamsString} />
                    ))}
                  </div>
                )}
              </div>

              {/* 2. 추천 투어 상품 섹션 */}
              <div className="space-y-8">
                <div className="flex items-end justify-between px-2">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">인기 투어 상품</h2>
                    <p className="text-sm font-medium text-slate-500">지금 가장 핫한 추천 여행 코스</p>
                  </div>
                </div>
                {visibleTours.length === 0 ? (
                  <div className="rounded-[28px] bg-white/50 border border-slate-100 px-6 py-14 text-center backdrop-blur-sm">
                    <p className="text-lg font-semibold text-slate-900">추천 투어 상품이 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleTours.map((tour) => (
                      <TourCard key={tour.id} tour={tour} queryString={searchParamsString} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </section>
    </main>
  );
}
