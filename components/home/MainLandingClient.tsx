"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Star, Clock, Zap, Sparkles } from "lucide-react";
import { useI18n } from "@/components/providers/LocaleProvider";
import { localizePath } from "@/lib/i18n/routing";
import { resolveDestinationSearchValue } from "@/lib/home/search-utils";

// 컴포넌트 임포트
import { HeroSection } from "./HeroSection";
import { SearchForm, type SearchDraft } from "./SearchForm";
import { ThemeNavigation } from "./ThemeNavigation";
import { GuideCard, type LandingGuide } from "./GuideCard";
import { TourCard, type LandingTour } from "./TourCard";

export type { LandingGuide, LandingTour };

type Props = {
  guideHref: string;
  guides: LandingGuide[];
  tours: LandingTour[];
  userName?: string | null;
  userRole?: string | null;
};

export default function MainLandingClient({ guideHref, guides, tours, userName, userRole }: Props) {
  const { locale, messages } = useI18n();
  const withLocale = (href: string) => localizePath(locale, href);
  const landing = messages.landing;
  
  const destinationPanelRef = useRef<HTMLDivElement | null>(null);
  const datePanelRef = useRef<HTMLDivElement | null>(null);
  const guestPanelRef = useRef<HTMLDivElement | null>(null);
  
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (destinationPanelRef.current && !destinationPanelRef.current.contains(target)) setIsDestinationOpen(false);
      if (datePanelRef.current && !datePanelRef.current.contains(target)) setIsDatePickerOpen(false);
      if (guestPanelRef.current && !guestPanelRef.current.contains(target)) setIsGuestPickerOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredGuides = useMemo(() => {
    const list = [...guides];
    if (!criteria || !criteria.destination.trim()) return list;
    const query = resolveDestinationSearchValue(criteria.destination).toLowerCase();
    return list.filter((guide) => {
      const fields = [guide.location, guide.name, guide.bio, ...(guide.languages || [])];
      return fields.some(field => field && field.toLowerCase().includes(query));
    }).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [criteria, guides]);

  const filteredTours = useMemo(() => {
    const list = [...tours];
    if (!criteria || !criteria.destination.trim()) return list;
    const query = resolveDestinationSearchValue(criteria.destination).toLowerCase();
    return list.filter((tour) => {
      const fields = [tour.title, tour.region, tour.description, tour.guideName];
      return fields.some(field => field && field.toLowerCase().includes(query));
    }).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [criteria, tours]);

  useEffect(() => {
    if (!criteria) return;
    const targetId = (filteredGuides.length === 0 && filteredTours.length === 0) ? "recommended-guides" : "explore-results";
    setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [criteria, filteredGuides.length, filteredTours.length]);

  const searchParamsString = useMemo(() => {
    const params = new URLSearchParams();
    if (criteria?.startDate) params.set('startDate', criteria.startDate);
    if (criteria?.endDate) params.set('endDate', criteria.endDate);
    if (criteria?.adults) params.set('adults', criteria.adults.toString());
    if (criteria?.children) params.set('children', criteria.children.toString());
    return Array.from(params.keys()).length > 0 ? `?${params.toString()}` : '';
  }, [criteria]);

  return (
    <main className="min-h-screen bg-[#fbf8f3] text-slate-900 [overflow-wrap:normal] [word-break:keep-all] pb-12">
      <HeroSection userName={userName} userRole={userRole} guideHref={guideHref} withLocale={withLocale}>
        <div className="mx-auto max-w-5xl">
          <SearchForm 
            draft={draft}
            setDraft={setDraft}
            onSearch={setCriteria}
            destinationOptions={destinationOptions}
            destinationPanelRef={destinationPanelRef}
            datePanelRef={datePanelRef}
            guestPanelRef={guestPanelRef}
            isDestinationOpen={isDestinationOpen}
            setIsDestinationOpen={setIsDestinationOpen}
            isDatePickerOpen={isDatePickerOpen}
            setIsDatePickerOpen={setIsDatePickerOpen}
            isGuestPickerOpen={isGuestPickerOpen}
            setIsGuestPickerOpen={setIsGuestPickerOpen}
          />
        </div>
      </HeroSection>

      <section id="explore-results" className="relative z-10 mx-auto max-w-7xl px-4 pt-0 sm:px-6 lg:px-8">

        {criteria && (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 fade-in duration-500 mb-0">
            {filteredGuides.length > 0 && (
              <section className="container mx-auto px-4 pt-4 relative border-t border-slate-100">
                <div className="mb-4">
                  <h2 className="text-3xl font-black text-slate-900">{landing.sections.guideResultsTitle}</h2>
                  <p className="text-slate-500 mt-2 font-medium">{landing.sections.guideResultsDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                  {filteredGuides.slice(0, 8).map((guide) => (
                    <GuideCard key={guide.id} guide={guide} queryString={searchParamsString} compact />
                  ))}
                </div>
              </section>
            )}

            {filteredTours.length > 0 && (
              <section className="container mx-auto px-4 py-8 relative border-t border-slate-100">
                <div className="mb-4">
                  <h2 className="text-3xl font-black text-slate-900">{landing.sections.tourResultsTitle}</h2>
                  <p className="text-slate-500 mt-2 font-medium">{landing.sections.tourResultsDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8">
                  {filteredTours.map((tour) => (
                    <TourCard key={tour.id} tour={tour} queryString={searchParamsString} compact />
                  ))}
                </div>
              </section>
            )}

            {filteredGuides.length === 0 && filteredTours.length === 0 && (
              <section className="container mx-auto px-4 py-12 text-center border-t border-slate-100">
                <h3 className="text-2xl font-bold text-slate-700">{landing.sections.emptyResultsTitle}</h3>
                <p className="text-slate-500 mt-2">{landing.sections.emptyResultsDescription}</p>
              </section>
            )}
          </div>
        )}

        <div className="space-y-4">
          <section id="recommended-guides" className="container mx-auto px-4 py-0 scroll-mt-20">
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-4">
                <Star className="w-3 h-3 fill-current" />
                <span>{landing.sections.verifiedExperts}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                {landing.sections.recommendedGuidesTitlePrefix} <span className="text-blue-600">{landing.sections.recommendedGuidesTitleAccent}</span>
              </h2>
              <p className="text-slate-500 mt-2 max-w-2xl text-lg font-medium">{landing.sections.recommendedGuidesDescription}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
              {guides.slice(0, 4).map((guide) => (
                <GuideCard key={guide.id} guide={guide} queryString={searchParamsString} compact />
              ))}
            </div>
          </section>

          <section id="trending-tours" className="bg-[#fcfaf7] pt-10 pb-12 rounded-3xl scroll-mt-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-6">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  {landing.sections.localExperienceTitlePrefix} <span className="text-[#ff385c]">{landing.sections.localExperienceTitleAccent}</span>
                </h2>
                <p className="mt-2 text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">{landing.sections.localExperienceDescription}</p>
              </div>

              <ThemeNavigation />

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg"><Zap className="w-5 h-5 text-red-500 fill-current" /></div>
                  <h3 className="text-2xl font-bold text-slate-900">{landing.sections.trendingTours}</h3>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4" />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                  {tours.slice(0, 3).map((tour) => ( tour && <TourCard key={tour.id} tour={tour} queryString={searchParamsString} compact /> ))}
                </div>
              </div>
            </div>
          </section>

          {!criteria && (
            <section className="container mx-auto px-4 py-8 border-t border-slate-100">
              <div className="mb-4">
                <h2 className="text-3xl font-black text-slate-900">{landing.sections.allToursTitle}</h2>
                <p className="text-slate-500 mt-2 font-medium">{landing.sections.allToursDescription}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8">
                {tours.map((tour) => ( tour && <TourCard key={tour.id} tour={tour} queryString={searchParamsString} compact /> ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
