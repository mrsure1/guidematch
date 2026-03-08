'use client';

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Star, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface GuideProfile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    guides_detail: {
        location: string;
        bio: string;
        rating: number;
        review_count: number;
        languages: string[];
    };
}

export default function GuideCarouselClient({ guides }: { guides: GuideProfile[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    // 평점 높은 순으로 정렬
    const sortedGuides = [...guides].sort((a, b) => b.guides_detail.rating - a.guides_detail.rating);

    const nextSlide = () => {
        if (currentIndex < sortedGuides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCurrentIndex(0); // Loop back
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            setCurrentIndex(sortedGuides.length - 1); // Loop to end
        }
    };

    // Auto-scroll effect (optional, disabling for better user control on search results)
    /*
    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [currentIndex]);
    */

    if (sortedGuides.length === 0) {
        return <p className="text-center py-10 text-slate-400">일치하는 가이드가 없습니다.</p>;
    }

    return (
        <div className="relative group">
            <div className="overflow-hidden rounded-3xl">
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {/* PC에서는 4개, 태블릿 2개, 모바일 1개씩 보여주고 싶지만 
                        사용자 요청인 '4명 보여주고 화살표'를 위해 슬라이드당 4개 배치 or 개별 슬라이드 처리 
                        여기서는 개별 슬라이드 형태로 구현하되 슬롯을 나눔 */}
                    {sortedGuides.map((guide) => (
                        <div key={guide.id} className="min-w-full sm:min-w-[50%] lg:min-w-[25%] p-2">
                            <Link href={`/traveler/guides/${guide.id}`}>
                                <Card className="premium-card h-full flex flex-col p-5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10 transition-all cursor-pointer bg-white/80 backdrop-blur-sm border-white/60 group/card">
                                    <div className="flex gap-4 mb-4">
                                        <div className="relative">
                                            <img
                                                src={guide.avatar_url || "https://i.pravatar.cc/150"}
                                                alt={guide.full_name}
                                                className="w-[72px] h-[72px] rounded-2xl object-cover bg-slate-100 shadow-sm group-hover/card:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                                                <div className="bg-amber-100 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <Star className="w-3 h-3 fill-current" /> {guide.guides_detail.rating || '0.0'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <h3 className="font-bold text-slate-900 text-lg truncate group-hover/card:text-blue-600 transition-colors">{guide.full_name}</h3>
                                            <div className="flex items-center text-xs text-slate-500 mt-1 font-medium gap-1">
                                                <MapPin className="w-3 h-3" /> {guide.guides_detail.location}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-4 font-light leading-relaxed">
                                        <span>&quot;</span>
                                        {guide.guides_detail.bio || '안녕하세요, 인증된 투어 가이드입니다.'}
                                        <span>&quot;</span>
                                    </p>
                                    <div className="mt-auto flex flex-wrap gap-1.5">
                                        {(guide.guides_detail.languages || ['한국어']).slice(0, 2).map((lang: string) => (
                                            <span key={lang} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600/90 border border-slate-200/60">
                                                {lang}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            {sortedGuides.length > 4 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all z-20 opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all z-20 opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}
        </div>
    );
}
