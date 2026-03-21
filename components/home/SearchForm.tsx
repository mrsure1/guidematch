"use client";

import { useMemo } from "react";
import { Search, MapPin, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import { useI18n } from "@/components/providers/LocaleProvider";
import { formatGuestCount } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { 
  DESTINATION_DEFINITIONS, 
  formatDateRange, 
  replaceCount, 
  resolveDestinationSearchValue 
} from "@/lib/home/search-utils";

export type SearchDraft = {
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
};

interface SearchFormProps {
  draft: SearchDraft;
  setDraft: React.Dispatch<React.SetStateAction<SearchDraft>>;
  onSearch: (criteria: SearchDraft) => void;
  destinationOptions: string[];
  destinationPanelRef: React.RefObject<HTMLDivElement | null>;
  datePanelRef: React.RefObject<HTMLDivElement | null>;
  guestPanelRef: React.RefObject<HTMLDivElement | null>;
  isDestinationOpen: boolean;
  setIsDestinationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDatePickerOpen: boolean;
  setIsDatePickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isGuestPickerOpen: boolean;
  setIsGuestPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
  const { locale } = useI18n();
  const decreaseLabel = locale === "ko" ? `${label} 감소` : `Decrease ${label}`;
  const increaseLabel = locale === "ko" ? `${label} 증가` : `Increase ${label}`;

  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{formatGuestCount(count, locale)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(Math.max(min, count - 1)); }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          aria-label={decreaseLabel}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-slate-900">{count}</span>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(count + 1); }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          aria-label={increaseLabel}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function SearchForm({
  draft,
  setDraft,
  onSearch,
  destinationOptions,
  destinationPanelRef,
  datePanelRef,
  guestPanelRef,
  isDestinationOpen,
  setIsDestinationOpen,
  isDatePickerOpen,
  setIsDatePickerOpen,
  isGuestPickerOpen,
  setIsGuestPickerOpen,
}: SearchFormProps) {
  const { locale, messages } = useI18n();
  const landing = messages.landing;
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const filteredDestinationOptions = useMemo(() => {
    if (!draft.destination.trim()) {
      return DESTINATION_DEFINITIONS.slice(0, 6).map((destination) => ({
        name: destination.labels[locale],
        searchValue: destination.value,
        desc: destination.country[locale],
      }));
    }

    const normalizedInput = draft.destination.toLowerCase();
    const staticOptions = DESTINATION_DEFINITIONS.filter((destination) =>
      [destination.value, destination.labels.ko, destination.labels.en, ...destination.aliases].some((term) =>
        term.toLowerCase().includes(normalizedInput),
      ),
    ).map((destination) => ({
      name: destination.labels[locale],
      searchValue: destination.value,
      desc: destination.country[locale],
    }));

    const dynamicOptions = destinationOptions
      .filter((option) => option.toLowerCase().includes(normalizedInput))
      .map((option) => ({
        name: option,
        searchValue: option,
        desc: landing.search.destinationOptionFallback,
      }));

    return Array.from(new Map([...staticOptions, ...dynamicOptions].map((option) => [option.searchValue, option])).values()).slice(0, 6);
  }, [destinationOptions, draft.destination, landing.search.destinationOptionFallback, locale]);

  const selectedRange = useMemo(
    () => ({
      from: draft.startDate,
      to: draft.endDate,
    }),
    [draft.endDate, draft.startDate],
  );

  const guestSummary =
    locale === "ko"
      ? `${replaceCount(landing.search.adultCount, draft.adults)}${
          draft.children > 0 ? ` · ${replaceCount(landing.search.childrenCount, draft.children)}` : ""
        }`
      : `Adults ${draft.adults}${draft.children > 0 ? ` · Children ${draft.children}` : ""}`;

  const canSearch = Boolean(draft.destination.trim());

  return (
    <div className="mt-6 rounded-3xl sm:rounded-[38px] border border-white/15 bg-white/96 p-2 sm:p-3 shadow-[0_30px_80px_rgba(2,6,23,0.26)] backdrop-blur-md">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSearch) return;
          onSearch({ ...draft, destination: resolveDestinationSearchValue(draft.destination.trim()) });
        }}
        className="flex flex-col lg:grid lg:grid-cols-[1.4fr_1fr_0.9fr_auto] rounded-[24px] lg:rounded-full bg-white lg:bg-transparent shadow-sm lg:shadow-none border border-slate-200 lg:border-none divide-y lg:divide-y-0 lg:divide-x divide-slate-100 lg:outline lg:outline-1 lg:outline-slate-200 lg:bg-white relative z-50"
      >
        <div ref={destinationPanelRef} className="relative w-full">
          <label className="flex min-h-[72px] sm:min-h-[84px] flex-col justify-center px-5 sm:px-6 py-3 sm:py-4 transition hover:bg-slate-50 cursor-text w-full lg:rounded-l-full">
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-wide">{landing.search.destinationLabel}</span>
            <input
              type="text"
              value={draft.destination}
              onFocus={() => setIsDestinationOpen(true)}
              onChange={(event) => {
                setDraft((prev) => ({ ...prev, destination: event.target.value }));
                setIsDestinationOpen(true);
              }}
              placeholder={landing.search.destinationPlaceholder}
              className="mt-0.5 sm:mt-1 bg-transparent text-sm sm:text-base font-medium text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal w-full"
            />
          </label>

          {isDestinationOpen && filteredDestinationOptions.length > 0 && (
            <div className="absolute left-0 top-full mt-3 z-[100] w-[90vw] sm:w-[400px] lg:w-full rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.2)] lg:shadow-[0_24px_60px_rgba(15,23,42,0.16)] overflow-hidden">
              <div className="border-b border-slate-100/80 px-5 py-4 text-[11px] font-black tracking-widest text-slate-400 bg-slate-50/50">
                {landing.search.recommendedDestinations}
              </div>
              <div className="py-2">
                {filteredDestinationOptions.map((destination) => (
                  <button
                    key={destination.name}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setDraft((prev) => ({ ...prev, destination: destination.name }));
                      setIsDestinationOpen(false);
                      setTimeout(() => setIsDatePickerOpen(true), 150);
                    }}
                    className="flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-slate-50 group"
                  >
                    <div className="flex w-12 h-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm group-hover:text-blue-600 transition-all border border-transparent group-hover:border-slate-200">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-slate-800">{destination.name}</span>
                      <span className="text-xs font-medium text-slate-500 mt-0.5">{destination.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={datePanelRef} className="relative w-full">
          <button
            type="button"
            onClick={() => setIsDatePickerOpen((prev) => !prev)}
            className="flex min-h-[72px] sm:min-h-[84px] w-full flex-col justify-center px-5 sm:px-6 py-3 sm:py-4 text-left transition hover:bg-slate-50"
          >
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-wide">{landing.search.dateLabel}</span>
            <span className={cn("mt-0.5 sm:mt-1 text-sm sm:text-base", draft.startDate && draft.endDate ? "text-slate-800 font-bold" : "text-slate-400 font-medium")}>
              {draft.startDate && draft.endDate
                ? formatDateRange(draft.startDate, draft.endDate, locale, landing.search.invalidDateRange)
                : landing.search.datePlaceholder}
            </span>
          </button>

          {isDatePickerOpen && (
            <div className="absolute left-0 lg:-left-12 xl:left-0 top-full mt-3 z-[100] rounded-[32px] bg-white border border-slate-200 p-2 sm:p-4 shadow-[0_30px_100px_rgba(15,23,42,0.2)] lg:shadow-[0_24px_60px_rgba(15,23,42,0.16)] w-[calc(100vw-40px)] sm:w-max min-w-[320px]">
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
                    setTimeout(() => setIsGuestPickerOpen(true), 150);
                  }
                }}
                className="w-full sm:w-[340px] border-none mx-auto"
              />
            </div>
          )}
        </div>

        <div ref={guestPanelRef} className="relative w-full">
          <button
            type="button"
            onClick={() => setIsGuestPickerOpen((prev) => !prev)}
            className="flex min-h-[72px] sm:min-h-[84px] w-full flex-col justify-center px-5 sm:px-6 py-3 sm:py-4 text-left transition hover:bg-slate-50"
          >
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-wide">{landing.search.travelersLabel}</span>
            <span className={cn("mt-0.5 sm:mt-1 text-sm sm:text-base", draft.adults > 0 ? "text-slate-800 font-bold" : "text-slate-400 font-medium")}>
              {draft.adults > 0 || draft.children > 0 ? guestSummary : landing.search.guestPlaceholder}
            </span>
          </button>

          {isGuestPickerOpen && (
            <div className="absolute right-0 top-full mt-3 z-[100] w-[90vw] sm:w-[360px] max-w-[calc(100vw-32px)] lg:w-[380px] rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.2)] lg:shadow-[0_24px_60px_rgba(15,23,42,0.16)] text-left">
              <div className="space-y-4">
                <GuestStepper
                  label={landing.search.adults}
                  count={draft.adults}
                  min={1}
                  onChange={(next) => setDraft((prev) => ({ ...prev, adults: next }))}
                />
                <hr className="border-slate-100 my-2 mx-2" />
                <GuestStepper
                  label={landing.search.children}
                  count={draft.children}
                  onChange={(next) => setDraft((prev) => ({ ...prev, children: next }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center p-2 sm:px-4 sm:py-3 lg:p-2 bg-white">
          <Button
            type="submit"
            size="lg"
            disabled={!canSearch}
            className="h-12 sm:h-14 w-full rounded-[14px] lg:rounded-full bg-[#ff385c] px-7 text-base font-bold text-white hover:bg-[#e31c5f] lg:w-auto shadow-md hover:shadow-lg transition-all"
          >
            <Search className="mr-2 h-5 w-5" />
            {landing.search.searchButton}
          </Button>
        </div>
      </form>
    </div>
  );
}
