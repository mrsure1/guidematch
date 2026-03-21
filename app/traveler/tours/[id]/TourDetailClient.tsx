"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/providers/LocaleProvider";
import { localizePath } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Calendar } from "@/components/ui/Calendar";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Minus,
  Plus,
  Share2,
  Star,
  Users,
} from "lucide-react";

interface TourDetailClientProps {
  tour: any;
}

export default function TourDetailClient({ tour }: TourDetailClientProps) {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const t = (messages as any).tourDetail || {};
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 로케일에 따른 콘텐츠 선택 (동적 전환 대응)
  const title = (locale === 'ko' ? (tour.title_ko || tour.title) : (tour.title_en || tour.title_ko)) || "Recommended tour";
  const description = (locale === 'ko' ? (tour.description_ko || tour.description) : (tour.description_en || tour.description_ko)) || "A concise itinerary with local highlights.";
  const region = (locale === 'ko' ? (tour.region_ko || tour.region) : (tour.region_en || tour.region_ko)) || "Seoul";

  const includedItemsField = locale === 'ko' 
    ? (tour.included_items_ko || tour.included_items) 
    : (tour.included_items_en || tour.included_items_ko || tour.included_items);

  const includedItems = Array.isArray(includedItemsField)
    ? includedItemsField
    : [];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];
  const startDateParam = searchParams.get("startDate") || defaultDateStr;
  const endDateParam = searchParams.get("endDate") || startDateParam;

  const pAdults = searchParams.get("adults");
  const pChildren = searchParams.get("children");
  const defaultAdults = pAdults ? parseInt(pAdults, 10) : 2;
  const defaultChildren = pChildren ? parseInt(pChildren, 10) : 0;
  const defaultGuests =
    (Number.isNaN(defaultAdults) ? 2 : defaultAdults) +
    (Number.isNaN(defaultChildren) ? 0 : defaultChildren);

  const [isPending, setIsPending] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [guests, setGuests] = useState(defaultGuests || 2);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: startDateParam,
    to: endDateParam,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const res = await fetch(`/api/tours/${tour.id}/like/status`);
        if (res.ok) {
          const data = await res.json();
          setIsLiked(data.isLiked);
        }
      } catch (error) {
        console.error("Failed to check like status:", error);
      }
    };

    checkLikeStatus();
  }, [tour.id]);

  const handleToggleLike = async () => {
    try {
      const res = await fetch(`/api/tours/${tour.id}/like`, { method: "POST" });
      if (res.status === 401) {
        alert("Please log in to use the like feature.");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.isLiked);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      alert("An error occurred while updating the like status.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title,
      text: description.substring(0, 100),
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert(t.linkCopied || "The link has been copied to your clipboard.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleBooking = async () => {
    if (!dateRange.from) {
      alert("Please select a date.");
      return;
    }

    setIsPending(true);

    try {
      const formData = new FormData();
      formData.append("guide_id", tour.guide_id);
      formData.append("tour_id", tour.id);
      formData.append("start_date", dateRange.from);
      formData.append("end_date", dateRange.to || dateRange.from);
      formData.append("total_price", Math.round(tour.price * guests * 1.05).toString());
      formData.append("guests", guests.toString());

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert(t.bookingSuccess || "Your booking request has been submitted successfully.");
        router.push("/traveler/bookings");
      } else {
        const data = await res.json();
        alert((t.bookingFailed || "Booking failed: {error}").replace("{error}", data.error || "An unknown error occurred."));
      }
    } catch (error) {
      console.error(error);
      alert(t.errorOccurred || "An error occurred while processing the booking.");
    } finally {
      setIsPending(false);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -clientWidth : clientWidth,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    setCurrentIdx(Math.round(scrollLeft / clientWidth));
  };

  const photos = tour.photo ? tour.photo.split(",") : [];
  const subtotal = tour.price * guests;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = Math.round(subtotal + serviceFee);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white pb-20">
      <div className="relative h-[40vh] w-full overflow-hidden bg-slate-900 md:h-[50vh]">
        {photos.length > 0 ? (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none"
          >
            {photos.map((photo: string, index: number) => (
              <div key={index} className="relative h-full w-full shrink-0 snap-start">
                <img src={photo} alt={`${title} - ${index + 1}`} className="h-full w-full object-cover opacity-80" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
            <MapPin className="h-16 w-16" />
          </div>
        )}

        {photos.length > 1 && (
          <>
            <button
              onClick={() => scroll("left")}
              className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition hover:bg-white/40 group-hover:opacity-100"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition hover:bg-white/40 group-hover:opacity-100"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {photos.length > 1 && (
          <div className="absolute bottom-12 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {photos.map((_: string, i: number) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${currentIdx === i ? "w-4 bg-white" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

        <div className="absolute left-4 right-4 top-6 z-10 flex items-center justify-between md:left-8 md:right-8">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleToggleLike}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
                isLiked ? "bg-white text-red-500 shadow-lg" : "bg-black/30 text-white hover:bg-black/50 hover:text-red-400"
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-20 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-blue-600">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1">{t.bestSeller || "Best Seller"}</span>
              <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-600">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> 4.9 (128)
              </span>
            </div>

            <h1 className="mb-6 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">
              {title}
            </h1>

            <div className="mb-8 flex flex-wrap gap-6 border-y border-slate-100 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <div className="mb-0.5 text-xs font-medium text-slate-500">{t.regionLabel || "Region"}</div>
                  <div className="text-sm font-bold text-slate-900">{region}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <div className="mb-0.5 text-xs font-medium text-slate-500">{t.durationLabel || "Duration"}</div>
                  <div className="text-sm font-bold text-slate-900">{(t.durationHours || "{hours} hours").replace("{hours}", tour.duration?.toString())}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="mb-0.5 text-xs font-medium text-slate-500">{t.guestsLabel || "Guests"}</div>
                  <div className="text-sm font-bold text-slate-900">{(t.guestsMax || "Up to {count} people").replace("{count}", tour.max_guests?.toString())}</div>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="mb-4 text-xl font-bold text-slate-900">{t.overviewTitle || "Tour Overview"}</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-600">{description}</p>
            </div>

            <div className="mb-10">
              <h2 className="mb-4 text-xl font-bold text-slate-900">{t.includedTitle || "Included"}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {includedItems.length > 0 ? (
                  includedItems.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">{t.noIncluded || "No included items listed."}</p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 md:w-96">
            <div className="sticky top-24">
              <Card className="overflow-visible rounded-3xl border-0 bg-white shadow-2xl shadow-slate-200">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6">
                    <div className="mb-1 text-sm font-medium text-slate-500">{t.perPerson || "Per person"}</div>
                    <div className="text-3xl font-black tracking-tight text-slate-900">
                      ₩{tour.price?.toLocaleString()}
                    </div>
                  </div>

                  {/* Guide Info Link */}
                  <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                         <img 
                           src={tour.profiles?.avatar_url || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(tour.guide_id)}`} 
                           alt={tour.profiles?.full_name} 
                           className="w-full h-full object-cover"
                         />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.guideLabel || "Guide"}</div>
                        <div className="text-sm font-bold text-slate-900">{tour.profiles?.full_name || "GuideMatch"}</div>
                      </div>
                    </div>
                    <Link 
                      href={localizePath(locale, `/traveler/guides/${tour.guide_id}`)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {t.viewProfile || "View Profile"}
                    </Link>
                  </div>

                  <div className="mb-8 space-y-4">
                    <div className="relative">
                      <div
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-blue-300"
                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                      >
                        <div className="mb-1 flex items-center gap-1 text-xs font-bold text-slate-500">
                          <CalendarIcon className="h-3 w-3" /> {t.selectDate || "Select dates"}
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {dateRange.from ? (
                            <>
                              {dateRange.from}
                              {dateRange.to && dateRange.to !== dateRange.from && ` ~ ${dateRange.to}`}
                            </>
                          ) : (
                            t.selectDatePlaceholder || "Select a date"
                          )}
                        </div>
                      </div>

                      {isDatePickerOpen && (
                        <div className="absolute left-0 right-0 top-full z-[100] mt-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl">
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={(range) => {
                              if (range) {
                                setDateRange(range as any);
                                if (range.from && range.to) {
                                  setIsDatePickerOpen(false);
                                }
                              }
                            }}
                            defaultMonth={dateRange.from ? new Date(dateRange.from) : new Date()}
                            minDate={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900">
                      <div>
                        <div className="mb-1 text-xs font-bold text-slate-500">{t.guestsLabel || "Guests"}</div>
                        <div className="text-sm font-semibold">{(t.guestTotal || "Total {count}").replace("{count}", guests.toString())}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white transition-colors hover:bg-slate-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-4 text-center text-sm font-bold">{guests}</span>
                        <button
                          onClick={() => setGuests(guests + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white transition-colors hover:bg-slate-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 space-y-3 border-t border-slate-100 pt-6">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>₩{tour.price?.toLocaleString()} x {guests}</span>
                      <span>₩{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>{t.serviceFee || "Service fee"}</span>
                      <span>₩{serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-black text-slate-900">
                      <span>{t.total || "Total"}</span>
                      <span>₩{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    size="lg"
                    className="h-14 rounded-xl bg-slate-900 text-base font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-blue-600 disabled:opacity-50"
                    onClick={handleBooking}
                    disabled={isPending}
                  >
                    {isPending ? (t.bookProcessing || "Processing...") : (t.bookNow || "Book now")}
                  </Button>

                  <p className="mt-4 text-center text-xs text-slate-400">
                    {t.bookDisclaimer || "You will not be charged until the booking is confirmed."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
