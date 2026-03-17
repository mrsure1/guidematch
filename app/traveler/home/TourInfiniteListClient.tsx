'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Clock, Loader2, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { fetchToursAction } from "./actions";
import { cn } from "@/lib/utils";

interface Tour {
    id: string;
    title: string;
    photo: string | null;
    price: number;
    duration: number;
    region: string;
    profiles: {
        full_name: string;
        avatar_url: string | null;
        guides_detail: {
            rating: number;
            review_count: number;
        } | null;
    };
}

export default function TourInfiniteListClient({
    initialTours,
    keyword
}: {
    initialTours: Tour[],
    keyword: string
}) {
    const [tours, setTours] = useState<Tour[]>(initialTours);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialTours.length >= 10);
    const observerTarget = useRef<HTMLDivElement>(null);

    const loadMoreTours = useCallback(async () => {
        setLoading(true);
        const nextTours = await fetchToursAction({ keyword, page, pageSize: 10 });

        if (nextTours.length < 10) {
            setHasMore(false);
        }

        setTours(prev => [...prev, ...nextTours]);
        setPage(prev => prev + 1);
        setLoading(false);
    }, [keyword, page]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMoreTours();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, loadMoreTours]);

    if (tours.length === 0) {
        return <div className="py-10 text-center text-slate-400 text-sm">현재 등록된 투어 상품이 없습니다.</div>;
    }

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map((tour, idx) => (
                    <TourItem key={`${tour.id}-${idx}`} tour={tour} idx={idx} />
                ))}
            </div>

            {/* Load More Trigger */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center">
                {loading && (
                    <div className="flex items-center gap-2 text-blue-600 font-bold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>불러오는 중...</span>
                    </div>
                )}
                {!hasMore && tours.length > 0 && (
                    <p className="text-slate-400 text-sm italic py-4 border-t border-slate-100 w-full text-center">모든 투어를 확인했습니다.</p>
                )}
            </div>
        </div>
    );
}

function TourItem({ tour, idx }: { tour: Tour, idx: number }) {
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
        <div
            className="animate-fade-in-up"
            style={{ animationDelay: `${(idx % 10) * 0.05}s`, animationFillMode: 'both' }}
        >
            <div className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e9e4db] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f1ea]">
                    <Link
                        href={`/traveler/tours/${tour.id}`}
                        className="block h-full w-full"
                    >
                        <div
                            ref={scrollRef}
                            onScroll={handleScroll}
                            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scrollbar-none scroll-smooth"
                        >
                            {photos.map((photo, index) => (
                                <div key={index} className="relative h-full w-full shrink-0 snap-start">
                                    <img
                                        src={photo}
                                        alt={`${tour.title} - ${index + 1}`}
                                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                </div>
                            ))}
                        </div>
                    </Link>

                    {/* Arrows */}
                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    scroll('left');
                                }}
                                className={cn(
                                    "absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-white",
                                    currentIdx === 0 && "hidden"
                                )}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    scroll('right');
                                }}
                                className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-white",
                                    currentIdx === photos.length - 1 && "hidden"
                                )}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    {/* Indicators */}
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
                    href={`/traveler/tours/${tour.id}`}
                    className="flex flex-1 flex-col gap-4 p-5"
                >
                    <h3 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors h-12">
                        {tour.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                            <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {tour.duration}시간
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-[#ff385c] text-[#ff385c]" />
                                {tour.profiles?.guides_detail?.rating ? tour.profiles.guides_detail.rating.toFixed(1) : "New"}
                            </span>
                        </div>
                        <p className="text-slate-900 font-bold text-lg tracking-tight">₩ {tour.price.toLocaleString()}</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
