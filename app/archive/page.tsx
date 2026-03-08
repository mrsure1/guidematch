'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2, Sparkles, MapPin, Calendar as CalendarIcon, Clock, Star, Download, Search, History } from 'lucide-react';
import Link from 'next/link';

export default function ArchivePage() {
    // Mock data for past tours
    const pastTours = [
        {
            id: 't-101',
            date: '2026.01.15',
            title: '서울 야간 고궁 프리미엄 투어',
            guideName: '이영희 가이드',
            region: '서울',
            duration: '3시간',
            price: '₩ 85,000',
            status: '완료',
            rating: 5,
            review: '정말 환상적인 야경이었고, 설명도 귀에 쏙쏙 들어왔습니다.',
            image: 'https://images.unsplash.com/photo-1546874177-9e664107314e?q=80&w=400&auto=format&fit=crop'
        },
        {
            id: 't-098',
            date: '2025.12.20',
            title: '부산 해운대 요트 썬셋 프라이빗 투어',
            guideName: '김철수 가이드',
            region: '부산',
            duration: '2시간',
            price: '₩ 150,000',
            status: '완료',
            rating: 4,
            review: '요트 상태가 아주 좋았고 일몰이 예술이었습니다. 다만 날씨가 조금 쌀쌀했어요.',
            image: 'https://images.unsplash.com/photo-1627883906368-b3ab3b376b1b?q=80&w=400&auto=format&fit=crop'
        },
        {
            id: 't-085',
            date: '2025.11.05',
            title: '전주 한옥마을 미식투어 & 한복 체험',
            guideName: '박지훈 가이드',
            region: '전주',
            duration: '5시간',
            price: '₩ 110,000',
            status: '취소됨',
            rating: null,
            review: null,
            image: 'https://images.unsplash.com/photo-1594916848149-114af1dbe1d0?q=80&w=400&auto=format&fit=crop'
        }
    ];

    const loading = false;

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden animate-fade-in">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />

            <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 mt-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-accent text-xs font-bold mb-3 shadow-sm">
                            <History className="w-3.5 h-3.5" /> 지난 여행 기록
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">이용 내역</h1>
                        <p className="text-slate-500 mt-2 text-lg">완료된 투어나 취소된 예약 내역을 모두 모아볼 수 있습니다.</p>
                    </div>

                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="도시명, 투어명 검색"
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-accent animate-spin" />
                            <p className="text-slate-500 font-semibold">데이터를 불러오는 중입니다...</p>
                        </div>
                    </div>
                ) : pastTours.length > 0 ? (
                    <div className="space-y-4">
                        {pastTours.map((tour) => (
                            <Card key={tour.id} className="flex flex-col md:flex-row border-slate-200/60 shadow-md bg-white overflow-hidden hover:shadow-lg transition-all group">
                                <div className="md:w-64 h-48 md:h-auto bg-slate-200 relative shrink-0 overflow-hidden">
                                    <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md shadow-sm border backdrop-blur-md ${tour.status === '완료'
                                                ? 'bg-emerald-500/90 text-white border-emerald-600'
                                                : 'bg-slate-800/80 text-white border-slate-700'
                                            }`}>
                                            {tour.status === '완료' ? '이용 완료' : '취소됨'}
                                        </span>
                                    </div>
                                </div>
                                <CardContent className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-xs font-bold text-slate-400 mb-1">{tour.date}</p>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">예약번호: {tour.id}</span>
                                        </div>
                                        <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-accent transition-colors">
                                            {tour.title}
                                        </h3>

                                        <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
                                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 border border-slate-100 bg-slate-50 px-2 py-1 rounded-md">
                                                <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {tour.region}
                                            </span>
                                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 border border-slate-100 bg-slate-50 px-2 py-1 rounded-md">
                                                <CalendarIcon className="w-3.5 h-3.5 text-accent" /> {tour.guideName}
                                            </span>
                                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 border border-slate-100 bg-slate-50 px-2 py-1 rounded-md">
                                                <Clock className="w-3.5 h-3.5 text-amber-500" /> {tour.duration}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4 border-t border-slate-100">
                                        <div className="flex-1">
                                            {tour.rating ? (
                                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 w-full">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3.5 h-3.5 ${i < tour.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                                                        ))}
                                                        <span className="text-xs font-bold text-slate-700 ml-1">나의 리뷰</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 leading-snug line-clamp-2">
                                                        <span>&quot;</span>
                                                        {tour.review}
                                                        <span>&quot;</span>
                                                    </p>
                                                </div>
                                            ) : tour.status === '완료' ? (
                                                <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 shadow-sm flex items-center gap-1 h-9 font-bold">
                                                    <Star className="w-3.5 h-3.5" /> 리뷰 작성하기
                                                </Button>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic">취소된 예약입니다.</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 md:flex-col md:items-end md:justify-end">
                                            <p className="text-lg font-extrabold text-slate-900 md:mb-1">{tour.price}</p>
                                            <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm flex items-center gap-1.5 h-9 font-bold w-full md:w-auto">
                                                <Download className="w-3.5 h-3.5" /> 영수증
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed border-2 border-slate-200 shadow-none bg-white py-16 text-center mt-8">
                        <CardContent className="flex flex-col items-center justify-center p-0">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                <History className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-700 mb-2">이용 내역이 없습니다</p>
                            <p className="text-sm text-slate-500 mb-6 max-w-sm">아직 완료되거나 취소된 투어가 없습니다. <br />새로운 한국의 매력을 찾아 여행을 떠나보세요.</p>
                            <Link href="/">
                                <Button className="bg-accent hover:bg-blue-600 font-bold px-6 shadow-md">
                                    투어 찾아보기
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
