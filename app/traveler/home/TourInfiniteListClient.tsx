'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchToursAction } from "./actions";

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
        };
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
                    <div
                        key={`${tour.id}-${idx}`}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${(idx % 10) * 0.05}s`, animationFillMode: 'both' }}
                    >
                        <Card className="premium-card overflow-hidden group cursor-pointer bg-white/80 border-white/60 shadow-lg h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                            <Link href={`/traveler/tours/${tour.id}`}>
                                <div className="h-48 bg-slate-200 relative overflow-hidden">
                                    <img
                                        src={tour.photo || "https://images.unsplash.com/photo-1587841566371-adad37cda3a8?q=80&w=800&auto=format&fit=crop"}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        alt={tour.title}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
                                            {tour.region}
                                        </span>
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors h-12">
                                        {tour.title}
                                    </h3>
                                    <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-3">
                                        <div className="flex items-center text-xs text-slate-500 font-medium">
                                            <Clock className="w-3.5 h-3.5 mr-1" /> {tour.duration}시간
                                        </div>
                                        <p className="text-slate-900 font-bold text-lg tracking-tight">₩ {tour.price.toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    </div>
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
