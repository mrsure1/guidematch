"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Calendar } from "@/components/ui/Calendar"
import { Ban } from "lucide-react"
import { trackClientConversion } from "@/lib/analytics/client"

type AvailabilityDate = {
    start_date: string
}

export default function BookingWidgetClient({
    guideId,
    isProfileComplete,
    rateType,
    hourlyRate,
    unavailableDates = [],
    t,
    locale
}: {
    guideId: string
    isProfileComplete: boolean
    rateType: string
    hourlyRate: number
    unavailableDates: AvailabilityDate[]
    t: any
    locale: string
}) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const defaultStart = searchParams.get("startDate") || ""
    const defaultEnd = searchParams.get("endDate") || defaultStart
    const pAdults = searchParams.get("adults")
    const pChildren = searchParams.get("children")
    const defaultAdults = pAdults ? parseInt(pAdults, 10) : 1
    const defaultChildren = pChildren ? parseInt(pChildren, 10) : 0
    const defaultGuests =
        (isNaN(defaultAdults) ? 1 : defaultAdults) +
        (isNaN(defaultChildren) ? 0 : defaultChildren)

    const [isPending, startTransition] = useTransition()
    const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
        from: defaultStart,
        to: defaultEnd,
    })
    const [durationHours, setDurationHours] = useState(4)
    const [guests, setGuests] = useState(defaultGuests || 1)

    const start = dateRange.from ? new Date(dateRange.from) : null
    const end = dateRange.to ? new Date(dateRange.to) : null
    let days = 0

    if (start && end && end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime())
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    } else if (start && !end) {
        days = 1
    }

    const safeUnavailableDates = Array.isArray(unavailableDates) ? unavailableDates : []

    const totalPrice =
        rateType === "hourly"
            ? hourlyRate * durationHours * guests
            : hourlyRate * days * guests

    const handleBooking = async () => {
        if (!isProfileComplete) {
            alert(t.incompleteProfileAlert || "가이드 프로필이 아직 완전히 준비되지 않아 예약을 진행할 수 없습니다.")
            return
        }

        if (!dateRange.from) {
            alert(t.selectDateAlert || "예약 일정을 선택해주세요.")
            return
        }

        startTransition(async () => {
            try {
                const checkRes = await fetch("/api/bookings/check-overlap", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        startDate: dateRange.from,
                        endDate: dateRange.to || dateRange.from,
                    }),
                })

                if (checkRes.ok) {
                    const checkData = await checkRes.json()
                    if (checkData.isOverlap && !confirm(t.bookingOverlapConfirm || checkData.message)) {
                        return
                    }
                }
            } catch (error) {
                console.error("Failed to validate booking overlap:", error)
            }

            const formData = new FormData()
            formData.append("guide_id", guideId)
            formData.append("start_date", dateRange.from)
            formData.append("end_date", dateRange.to || dateRange.from)
            formData.append("total_price", totalPrice.toString())
            formData.append("guests", guests.toString())

            const res = await fetch("/api/bookings/create", {
                method: "POST",
                body: formData,
            })

            if (res.ok) {
                const data = await res.json().catch(() => null)
                trackClientConversion("booking_created", {
                    booking_id: data?.booking?.id,
                    value: totalPrice,
                    currency: "KRW",
                })
                alert(t.bookingSuccess || "예약 요청이 완료되었습니다.")
                router.push("/traveler/bookings")
                return
            }

            const data = await res.json().catch(() => ({ error: t.bookingFailed || "알 수 없는 오류가 발생했습니다." }))
            alert(`${t.bookingFailed || "예약 요청에 실패했습니다"}: ${data.error}`)
        })
    }

    return (
        <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                <CardTitle className="text-lg">{t.bookingTitle || "일정 선택 및 예약"}</CardTitle>
                <p className="mt-1 text-sm font-light text-slate-500">
                    {t.bookingDescription || "원하는 일정과 인원을 선택해 예약을 진행하세요."}
                </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className={`space-y-4 ${!isProfileComplete ? "pointer-events-none opacity-50" : ""}`}>
                    <div className="space-y-4">
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            {t.selectDateLabel || "여행 일정 선택"}
                        </label>
                        <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            defaultMonth={dateRange.from ? new Date(dateRange.from) : undefined}
                            minDate={new Date().toISOString().split("T")[0]}
                            disabledDates={safeUnavailableDates.map((date) => date.start_date.split("T")[0])}
                            locale={locale}
                            renderDay={(fullDate, isCurrentMonth) => {
                                const isBlocked = safeUnavailableDates.some((date) => {
                                    const blockedDate = date.start_date.split("T")[0]
                                    return blockedDate === fullDate
                                })

                                if (isBlocked && isCurrentMonth) {
                                    return (
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-slate-100/50">
                                            <Ban className="h-4 w-4 text-slate-300" />
                                        </div>
                                    )
                                }

                                return null
                            }}
                        />
                        {dateRange.from && (
                            <div className="flex gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs font-bold text-slate-600">
                                <div className="flex-1">{t.startDateLabel || "시작일"}: {dateRange.from}</div>
                                {dateRange.to && <div className="flex-1">{t.endDateLabel || "종료일"}: {dateRange.to}</div>}
                            </div>
                        )}
                    </div>

                    {rateType === "hourly" && (
                        <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-700">{t.durationLabel || "이용 시간"}</label>
                                <span className="font-bold text-accent">{durationHours}{t.durationUnit || "시간"}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="12"
                                value={durationHours}
                                onChange={(e) => setDurationHours(parseInt(e.target.value, 10))}
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-accent"
                            />
                            <p className="text-[10px] text-slate-500">
                                {t.durationDescription || "가이드와 만날 예상 시간을 조정해보세요."}
                            </p>
                        </div>
                    )}
                </div>

                {!isProfileComplete && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                        <p className="text-xs font-bold text-amber-700">
                            {t.incompleteProfileTitle || "가이드 상세 프로필이 아직 완전히 준비되지 않았습니다."}
                        </p>
                        <p className="mt-1 text-[10px] text-amber-600">
                            {t.incompleteProfileDescription || "프로필 정보가 보완되면 예약 기능이 활성화됩니다."}
                        </p>
                    </div>
                )}

                <div
                    className={`space-y-2 border-b border-slate-100 pb-6 ${!isProfileComplete ? "pointer-events-none opacity-50" : ""}`}
                >
                    <label className="block text-sm font-bold text-slate-700">{t.guestsLabel || "예약 인원"}</label>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                        <button
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 text-slate-600 transition-colors hover:bg-slate-50"
                        >
                            -
                        </button>
                        <span className="text-sm font-bold text-slate-900">{guests}{t.guestUnit || "명"}</span>
                        <button
                            onClick={() => setGuests(guests + 1)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 text-slate-600 transition-colors hover:bg-slate-50"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div
                    className={`space-y-3 rounded-2xl bg-slate-900 p-5 text-white shadow-lg ${!isProfileComplete ? "opacity-50" : ""}`}
                >
                    <div className="flex items-center justify-between opacity-80">
                        <span className="text-xs font-medium">
                            {t.baseRateLabel || "기본 요금"} ({rateType === "hourly" ? (t.hourlyUnit || "시간당") : (t.dailyUnit || "일당")})
                        </span>
                        <span className="font-mono text-xs font-bold">₩{hourlyRate.toLocaleString()}</span>
                    </div>
                    <div className="flex items-end justify-between border-t border-white/10 pt-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                                Estimated Total
                            </p>
                            <p className="text-sm font-medium">{t.totalPriceLabel || "예상 결제 금액"}</p>
                        </div>
                        <p className="text-2xl font-black">
                            ₩{totalPrice > 0 ? totalPrice.toLocaleString() : 0}
                        </p>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <Button
                        className="h-14 w-full rounded-2xl bg-accent text-lg font-bold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] hover:bg-accent/90 active:scale-95 disabled:opacity-50"
                        onClick={handleBooking}
                        disabled={isPending || !dateRange.from || !isProfileComplete}
                    >
                        {isPending ? (t.statusProcessing || "처리 중...") : !isProfileComplete ? (t.statusIncomplete || "프로필 준비 중") : (t.requestBooking || "예약 요청하기")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
