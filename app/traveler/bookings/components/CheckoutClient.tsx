"use client";

import { useState, useEffect, useRef } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ChevronLeft, CreditCard, User, FileText, Calendar, Clock, Users, Globe, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

// Toss Payments Client Key (위젯 전용 테스트 클라이언트 키 사용 필수)
// 일반 결제창 키(test_ck_...)가 아닌 결제위젯 키(test_gck_...)를 사용해야 합니다.
const clientKey = process.env.NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

interface CheckoutClientProps {
    booking: any;
}

export default function CheckoutClient({ booking }: CheckoutClientProps) {
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<'toss' | 'paypal' | 'kakao'>('toss');
    const [travelerName, setTravelerName] = useState(booking.traveler?.full_name || '');
    const [travelerEmail, setTravelerEmail] = useState(booking.traveler?.email || '');
    const [travelerMessage, setTravelerMessage] = useState('');

    // Toss Payments Widget
    const [paymentWidget, setPaymentWidget] = useState<any>(null);
    const [isWidgetLoading, setIsWidgetLoading] = useState(false);
    const paymentMethodsWidgetRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                setIsWidgetLoading(true);
                console.log(`Toss: Starting initialization...`);
                const tossPayments = await loadTossPayments(clientKey);

                if (!isMounted) return;

                const widget = tossPayments.widgets({
                    customerKey: booking.traveler_id
                });

                console.log("Toss: Widget initialized successfully");
                setPaymentWidget(widget);
            } catch (error) {
                console.error("Toss: Initialization error:", error);
            } finally {
                if (isMounted) setIsWidgetLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [booking.traveler_id]);

    useEffect(() => {
        if (paymentWidget && (paymentMethod === 'toss' || paymentMethod === 'kakao')) {
            const renderWidget = async () => {
                try {
                    // Ensure the container exists before rendering
                    const container = document.getElementById("payment-method");
                    if (!container) {
                        console.warn("Toss/Kakao: #payment-method container not found yet, retrying in 100ms...");
                        setTimeout(renderWidget, 100);
                        return;
                    }

                    // v2 핵심: 위젯 렌더링 전이나 직후에 paymentWidget 인스턴스에 setAmount 호출 필수
                    const amount = { currency: "KRW", value: booking.total_price };
                    
                    // 결제 금액 설정
                    await paymentWidget.setAmount(amount);

                    const methodsWidget = await paymentWidget.renderPaymentMethods({
                        selector: "#payment-method",
                        variantKey: "DEFAULT"
                    });

                    await paymentWidget.renderAgreement({
                        selector: "#agreement",
                        variantKey: "AGREEMENT"
                    });

                    paymentMethodsWidgetRef.current = methodsWidget;
                    console.log("Toss/Kakao: Rendering complete");
                } catch (error) {
                    console.error("Toss/Kakao: Rendering error:", error);
                }
            };

            renderWidget();
        }
    }, [paymentWidget, paymentMethod, booking.total_price]);

    const handlePaymentRequest = async () => {
        console.log("handlePaymentRequest triggered");
        console.log("Selected Payment Method:", paymentMethod);
        console.log("Payment Widget Object:", paymentWidget);

        if (paymentMethod === 'toss' || paymentMethod === 'kakao') {
            if (!paymentWidget) {
                console.error("Toss: Payment widget not initialized");
                alert("결제 위젯이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
                return;
            }

            try {
                // If it's kakao, we use a specific method if supported, 
                // but usually the widget handles the selection.
                // For a dedicated KakaoPay experience via Toss:
                const paymentOptions: any = {
                orderId: booking.id,
                    orderName: booking.tour?.title || `${booking.guide?.full_name} 가이드 투어`,
                    successUrl: `${window.location.origin}/api/payments/toss/success`,
                    failUrl: `${window.location.origin}/api/payments/toss/fail`,
                    customerEmail: travelerEmail || "customer@email.com",
                    customerName: travelerName || "고객",
                };

                console.log("Toss: Requesting payment with options:", paymentOptions);
                // If specialized 'kakao' is selected, we could try to bypass the general UI 
                // but the widget is usually the best way. 
                // We'll proceed with the widget's current selection.
                await paymentWidget.requestPayment(paymentOptions);
                console.log("Toss: requestPayment call finished");
            } catch (error: any) {
                // 사용자가 결제창을 그냥 닫은 경우(취소) 발생하는 에러는 정상적인 동작이므로 무시합니다.
                if (error?.message === "취소되었습니다." || error?.code === "USER_CANCEL") {
                    console.log("Toss: Payment cancelled by user");
                    return;
                }
                console.error("Toss: Payment request error:", error);
                alert("결제 요청 중 오류가 발생했습니다.");
            }
        }
    };

    const onPayPalApprove = async (data: any, actions: any) => {
        try {
            const order = await actions.order.capture();
            // Call backend API to save the paypal capture
            const res = await fetch('/api/payments/paypal/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderID: data.orderID,
                    bookingId: booking.id
                })
            });
            const result = await res.json();

            if (res.ok) {
                alert("결제가 성공적으로 완료되었습니다!");
                router.push('/traveler/bookings');
                router.refresh();
            } else {
                alert(`결제 승인 실패: ${result.error}`);
            }

        } catch (err) {
            console.error("PayPal capture error", err);
            alert("PayPal 결제 승인 중 오류가 발생했습니다.");
        }
    };

    const guideDetail = Array.isArray(booking.guide?.guides_detail) ? booking.guide?.guides_detail[0] : booking.guide?.guides_detail;

    // Convert KRW to USD (Mock conversion, assuming 1 USD = 1400 KRW for demo purposes)
    const usdAmount = (booking.total_price / 1400).toFixed(2);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in relative">
            <div className="mb-8">
                <Link href="/traveler/bookings" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-accent mb-4 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    예약 내역으로 돌아가기
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    안전한 결제
                </h1>
                <p className="mt-2 text-slate-500">여행자 정보와 결제 수단을 확인하고 예약을 확정하세요.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Content */}
                <div className="lg:col-span-2 space-y-6">

                    <Card className="border-slate-200/60 shadow-md">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-accent" />
                                예약자 정보
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">이름</label>
                                    <input 
                                        type="text"
                                        value={travelerName}
                                        onChange={(e) => setTravelerName(e.target.value)}
                                        className="w-full text-sm font-semibold text-slate-900 bg-white px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                                        placeholder="이름을 입력하세요"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">이메일</label>
                                    <input 
                                        type="email"
                                        value={travelerEmail}
                                        onChange={(e) => setTravelerEmail(e.target.value)}
                                        className="w-full text-sm font-semibold text-slate-900 bg-white px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                                        placeholder="이메일을 입력하세요"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <FileText className="w-4 h-4" /> 가이드에게 보내는 메시지 (선택)
                                </label>
                                <textarea
                                    value={travelerMessage}
                                    onChange={(e) => setTravelerMessage(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all min-h-[100px]"
                                    placeholder="만나는 장소 관련 문의나 알러지 정보 등을 남겨주세요."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/60 shadow-md overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-accent" />
                                결제 수단
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 p-0 md:p-6">
                            <div className="flex flex-col md:flex-row gap-3 mb-6 relative z-10 mx-6 md:mx-0 pt-6 md:pt-0">
                                <button
                                    className={`flex-1 py-3 px-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'toss'
                                        ? 'border-blue-600 text-blue-700 bg-blue-50 shadow-sm'
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    onClick={() => setPaymentMethod('toss')}
                                >
                                    <span className="text-lg text-blue-600 font-bold">toss</span>
                                    <span className="text-sm">토스페이먼츠</span>
                                </button>
                                <button
                                    className={`flex-1 py-3 px-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'kakao'
                                        ? 'border-[#ffeb00] text-[#3c1e1e] bg-[#ffeb00]/10 shadow-sm'
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    onClick={() => setPaymentMethod('kakao')}
                                >
                                    <span className="bg-[#ffeb00] px-1.5 py-0.5 rounded text-[10px] font-black text-[#3c1e1e]">TALK</span>
                                    <span className="text-sm">카카오페이</span>
                                </button>
                                <button
                                    className={`flex-1 py-3 px-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'paypal'
                                        ? 'border-[#003087] text-[#003087] bg-blue-50 shadow-sm'
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    onClick={() => setPaymentMethod('paypal')}
                                >
                                    <span className="text-lg italic text-[#003087] font-black tracking-tight">PayPal</span>
                                </button>
                            </div>

                            <div className="bg-white px-2 md:px-0 pb-4">
                                {(paymentMethod === 'toss' || paymentMethod === 'kakao') ? (
                                    <div className="animate-fade-in relative">
                                        {isWidgetLoading && (
                                            <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">위젯 로딩 중...</p>
                                                </div>
                                            </div>
                                        )}
                                        {/* Toss Payments Widget Wrappers */}
                                        <div id="payment-method" className="w-full min-h-[300px]"></div>
                                        <div id="agreement" className="w-full"></div>

                                        <div className="px-5 pb-5">
                                            <Button
                                                fullWidth
                                                size="lg"
                                                disabled={isWidgetLoading || !paymentWidget}
                                                className={`mt-4 rounded-xl shadow-lg border-0 font-bold text-base h-14 transition-all hover:-translate-y-0.5 ${paymentMethod === 'kakao'
                                                    ? 'bg-[#ffeb00] hover:bg-[#f7e100] text-[#3c1e1e] shadow-yellow-500/25'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25'
                                                    }`}
                                                onClick={handlePaymentRequest}
                                            >
                                                {isWidgetLoading ? "준비 중..." : `${paymentMethod === 'kakao' ? '카카오페이' : '토스페이'}로 ₩ ${booking.total_price.toLocaleString()} 결제하기`}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-fade-in p-6 bg-slate-50 rounded-xl border border-slate-100 mx-5 md:mx-0">
                                        <div className="mb-6 text-center">
                                            <p className="text-slate-600 mb-2 font-medium">결제 금액 (USD)</p>
                                            <p className="text-3xl font-black text-[#003087]">${usdAmount}</p>
                                            <p className="text-xs text-slate-400 mt-2">안내: 환율 $1 = ₩1,400 기준 테스트 금액입니다.</p>
                                        </div>
                                        <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test", currency: "USD" }}>
                                            <PayPalButtons
                                                style={{ layout: "vertical", shape: "rect", color: "gold" }}
                                                createOrder={(data, actions) => {
                                                    return actions.order.create({
                                                        intent: "CAPTURE",
                                                        purchase_units: [
                                                            {
                                                                amount: {
                                                                    currency_code: "USD",
                                                                    value: usdAmount,
                                                                },
                                                                description: booking.tour?.title || 'Tour Booking'
                                                            },
                                                        ],
                                                    });
                                                }}
                                                onApprove={onPayPalApprove}
                                            />
                                        </PayPalScriptProvider>
                                    </div>
                                )}
                            </div>
                        </CardContent>

                    </Card>
                </div>

                {/* Right Content - Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden rounded-2xl">
                            <div className="h-40 bg-slate-200 relative">
                                <img src={booking.tour?.photo || booking.guide?.avatar_url || "https://images.unsplash.com/photo-1546874177-9e664107314e?q=80&w=600&auto=format&fit=crop"} className="w-full h-full object-cover" alt="Tour img" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
                                <div className="absolute bottom-4 left-5 right-5">
                                    <h3 className="font-bold text-white text-lg leading-tight mb-1 drop-shadow-md">{booking.tour?.title || `${booking.guide?.full_name} 가이드 투어`}</h3>
                                    <p className="text-sm justify-between flex text-slate-200 font-medium drop-shadow-md">
                                        <span>{booking.guide?.full_name} 가이드</span>
                                    </p>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="space-y-4 pb-6 border-b border-slate-100">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-900">{new Date(booking.start_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-900">{booking.tour?.duration ? `${booking.tour?.duration}시간` : '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-900">{(guideDetail?.languages || []).join(', ') || '한국어'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <CreditCard className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-900">예약번호: {booking.id.split('-')[0].toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 pb-6 border-b border-slate-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">단품 결제</span>
                                        <span className="text-slate-900 font-bold">-</span>
                                    </div>
                                </div>

                                <div className="pt-6 pb-2 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-slate-900">총 결제 금액</span>
                                        <span className="text-2xl font-extrabold text-accent">₩ {booking.total_price?.toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
                                        <p className="font-semibold mb-1 text-slate-700">취소 규정</p>
                                        투어일정 3일 전까지: 전액 환불<br />
                                        투어일정 2일 ~ 당일: 환불 불가<br />
                                        가이드 사정으로 취소 시 예외 없이 전액 환불됩니다.
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
