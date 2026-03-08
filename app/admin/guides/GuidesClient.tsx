"use client"

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, MapPin, Globe, CreditCard, Clock, Star, ShieldCheck } from "lucide-react";
import { approveGuide, rejectGuide } from "../actions";

interface GuideRecord {
    id: string;
    full_name: string;
    avatar_url: string;
    guides_detail: {
        location: string;
        languages: string[];
        bio: string;
        hourly_rate: number;
        is_verified: boolean;
        created_at: string;
    };
}

export default function GuidesClient({ initialGuides }: { initialGuides: GuideRecord[] }) {
    const [guides, setGuides] = useState<GuideRecord[]>(initialGuides);
    const [filter, setFilter] = useState<"pending" | "all">("pending");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const displayedGuides = guides.filter(g => {
        if (filter === "pending") return !g.guides_detail.is_verified;
        return true;
    });

    const handleApprove = async (guideId: string) => {
        if (!confirm("이 가이드를 승인하시겠습니까? 승인 후 서비스 노출이 시작됩니다.")) return;

        setProcessingId(guideId);
        const result = await approveGuide(guideId);
        setProcessingId(null);

        if (result.success) {
            setGuides(guides.map(g => g.id === guideId ? { ...g, guides_detail: { ...g.guides_detail, is_verified: true } } : g));
        } else {
            alert(result.error || "승인 처리 중 오류가 발생했습니다.");
        }
    };

    const handleReject = async (guideId: string) => {
        if (!confirm("이 가이드의 승인을 취소하거나 거절하시겠습니까?")) return;

        setProcessingId(guideId);
        const result = await rejectGuide(guideId);
        setProcessingId(null);

        if (result.success) {
            setGuides(guides.map(g => g.id === guideId ? { ...g, guides_detail: { ...g.guides_detail, is_verified: false } } : g));
        } else {
            alert(result.error || "거절 처리 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-purple-600" />
                        가이드 승인 관리
                    </h1>
                    <p className="text-slate-500 mt-1">전문 가이드 신청 내역을 검토하고 승인 여부를 결정합니다.</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                    <button
                        onClick={() => setFilter("pending")}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === "pending" ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        승인 대기
                    </button>
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === "all" ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        전체 가이드
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {displayedGuides.map((guide) => (
                    <Card key={guide.id} className="border-none shadow-xl shadow-slate-200/40 bg-white overflow-hidden group">
                        <div className="md:flex">
                            {/* Profile Sidebar */}
                            <div className="md:w-64 bg-slate-50/50 p-8 border-r border-slate-100 flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <img
                                        src={guide.avatar_url || "https://i.pravatar.cc/150"}
                                        alt={guide.full_name}
                                        className="w-24 h-24 rounded-3xl object-cover bg-white shadow-md border-2 border-white ring-4 ring-slate-100"
                                    />
                                    {guide.guides_detail.is_verified && (
                                        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg font-black text-slate-900">{guide.full_name}</h3>
                                <p className="text-sm text-slate-500 mb-6 truncate w-full">이메일 정보 비공개</p>

                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-8 ${guide.guides_detail.is_verified ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {guide.guides_detail.is_verified ? 'Verified Partner' : 'Verification Pending'}
                                </span>

                                <div className="space-y-4 w-full">
                                    <Button
                                        onClick={() => handleApprove(guide.id)}
                                        disabled={guide.guides_detail.is_verified || processingId === guide.id}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2 font-bold shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> 승인하기
                                    </Button>
                                    <Button
                                        onClick={() => handleReject(guide.id)}
                                        disabled={!guide.guides_detail.is_verified || processingId === guide.id}
                                        variant="outline"
                                        className="w-full border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-xl py-2 font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> 승인 취소
                                    </Button>
                                </div>
                            </div>

                            {/* Detail Content */}
                            <div className="flex-1 p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3" /> 활동 지역
                                        </p>
                                        <p className="font-bold text-slate-800">{guide.guides_detail.location}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Globe className="w-3 h-3" /> 가능 언어
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {guide.guides_detail.languages.map(lang => (
                                                <span key={lang} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200/50">{lang}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <CreditCard className="w-3 h-3" /> 희망 시급
                                        </p>
                                        <p className="font-black text-slate-900">₩ {guide.guides_detail.hourly_rate?.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" /> 신청 일시
                                        </p>
                                        <p className="text-sm font-medium text-slate-600">{new Date(guide.guides_detail.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">가이드 한줄 소개 / 자기소개</p>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-slate-700 leading-relaxed italic">
                                        <span>&quot;</span>
                                        {guide.guides_detail.bio || '등록된 소개글이 없습니다.'}
                                        <span>&quot;</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {displayedGuides.length === 0 && (
                    <Card className="border-none shadow-sm bg-white/50 p-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                            <ShieldCheck className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">처리할 내역이 투명합니다</h3>
                        <p className="text-slate-500">현재 승인 대기 중인 가이드 신청이 없습니다.</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
