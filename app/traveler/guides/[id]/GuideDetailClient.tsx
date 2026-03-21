"use client"

import Image from "next/image"
import { Card } from "@/components/ui/Card"
// import { Zap } from "lucide-react" 삭제
import { Suspense } from "react"
import BookingWidgetClient from "./BookingWidgetClient"
import BookingWidgetErrorBoundary from "./BookingWidgetErrorBoundary"

export default function GuideDetailClient({
    guide,
    gd,
    unavailabilities,
    reviews,
    formattedLocation,
    languagesString,
    localizedBio,
    locale
}: any) {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="mb-12 flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-10">
                <div className="relative group shrink-0">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-accent to-blue-400 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
                    <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-2xl transition duration-500 group-hover:scale-[1.02]">
                        {guide.avatar_url ? (
                            <Image
                                src={guide.avatar_url}
                                alt={t.avatarAlt || "Guide profile photo"}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-4xl font-black text-slate-300">
                                {guide.full_name?.charAt(0)}
                            </div>
                        )}
                    </div>
                    {gd?.is_verified && (
                        <div className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-blue-500 text-white shadow-lg">
                            <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-2 md:justify-start">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 ring-1 ring-blue-500/10">
                            {t.expertGuide?.replace("{location}", formattedLocation.split(" ")[0]) || `${formattedLocation} 전문 가이드`}
                        </span>
                    </div>
                    <h1 className="mb-2 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                        {guide.full_name}
                    </h1>
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-slate-500 md:justify-start">
                        <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-amber-400 text-lg">★</span>
                            <span className="font-bold text-slate-900">{gd?.rating || "New"}</span>
                            <span className="text-xs opacity-60">({gd?.review_count || 0})</span>
                        </div>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span className="text-sm font-medium">{t.locationFormat?.replace("{location}", formattedLocation) || `📍 ${formattedLocation}`}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span className="text-sm font-medium">{t.languagesFormat?.replace("{languages}", languagesString) || `언어: ${languagesString}`}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <h2 className="mb-6 flex items-center gap-2 text-2xl font-black text-slate-900">
                            <span className="h-8 w-1.5 rounded-full bg-accent"></span>
                            {t.introductionTitle || "가이드 소개"}
                        </h2>
                        <div className="prose prose-slate max-w-none rounded-3xl bg-white p-8 border border-slate-100 shadow-sm leading-relaxed text-slate-600">
                            {localizedBio ? (
                                <p className="whitespace-pre-wrap text-lg">{localizedBio}</p>
                            ) : (
                                <p className="italic text-slate-400">{t.noBio || "소개글이 아직 없습니다."}</p>
                            )}
                        </div>
                    </section>

                    <section>
                        <h2 className="mb-6 flex items-center gap-2 text-2xl font-black text-slate-900">
                            <span className="h-8 w-1.5 rounded-full bg-accent"></span>
                            {t.reviewTitle || "여행자 후기"}
                        </h2>
                        <div className="space-y-4">
                            {reviews && reviews.length > 0 ? (
                                reviews.map((review: any) => (
                                    <Card key={review.id} className="border-none bg-white p-6 shadow-sm ring-1 ring-slate-100">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 font-bold uppercase">
                                                {review.profiles?.full_name?.charAt(0) || "T"}
                                            </div>
                                            <div className="flex-1">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <h4 className="font-bold text-slate-900">
                                                        {/* profile이 없을 경우를 대비한 방어적 프로퍼티 접근 */}
                                                        {review.profiles?.full_name || t.anonymousTraveler || "여행자"}
                                                    </h4>
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={`text-sm ${i < review.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 leading-relaxed italic">&ldquo;{review.content}&rdquo;</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center bg-slate-50/30">
                                    <p className="text-slate-400 font-medium whitespace-pre-wrap">{t.noReview || "아직 등록된 후기가 없습니다.\n이 가이드와 첫 여행을 떠나보세요!"}</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <BookingWidgetErrorBoundary>
                            <Suspense fallback={<div className="p-8 text-center text-slate-500">{t.loadingBooking || "예약 정보 불러오는 중..."}</div>}>
                                <BookingWidgetClient
                                    guideId={guide.id}
                                    isProfileComplete={true}
                                    rateType={gd?.rate_type || "daily"}
                                    hourlyRate={Number(gd?.hourly_rate || 150000)}
                                    unavailableDates={unavailabilities || []}  
                                    t={t}
                                    locale={locale}
                                />
                            </Suspense>
                        </BookingWidgetErrorBoundary>
                    </div>
                </div>
            </div>
        </div>
    )
}
