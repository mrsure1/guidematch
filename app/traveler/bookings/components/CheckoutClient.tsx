"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Calendar,
  ChevronLeft,
  Clock,
  CreditCard,
  FileText,
  Globe,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { AlertModal } from "@/components/ui/AlertModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { trackClientConversion } from "@/lib/analytics/client";

const clientKey =
  process.env.NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

type CheckoutClientProps = {
  booking: any;
  popupMode?: boolean;
  initialPaymentMethod?: "toss" | "paypal" | "kakao";
  initialTravelerName?: string;
  initialTravelerEmail?: string;
  autoStartPayment?: boolean;
};

type AlertConfig = {
  isOpen: boolean;
  title: string;
  message: string;
};

export default function CheckoutClient({
  booking,
  popupMode = false,
  initialPaymentMethod = "toss",
  initialTravelerName,
  initialTravelerEmail,
  autoStartPayment = false,
}: CheckoutClientProps) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState<"toss" | "paypal" | "kakao">(initialPaymentMethod);
  const [travelerName, setTravelerName] = useState(
    initialTravelerName || booking.traveler?.full_name || "",
  );
  const [travelerEmail, setTravelerEmail] = useState(
    initialTravelerEmail || booking.traveler?.email || "",
  );
  const [travelerMessage, setTravelerMessage] = useState("");
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [paymentWidget, setPaymentWidget] = useState<any>(null);
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);
  const paymentMethodsWidgetRef = useRef<any>(null);
  const mountedErrorRef = useRef<string | null>(null);
  const autoStartRef = useRef(false);

  const errorGuide: Record<string, string> = {
    USER_CANCEL: t("alerts.paymentCancelDetail"),
    user_cancel: t("alerts.paymentCancelDetail"),
    INVALID_CARD_COMPANY: t("alerts.invalidCard"),
    PAY_PROCESS_CANCELED: t("alerts.processCancelled"),
    internal: t("alerts.internalError"),
  };

  const guideDetail = Array.isArray(booking.guide?.guides_detail)
    ? booking.guide?.guides_detail[0]
    : booking.guide?.guides_detail;
  const tourTitle = booking.tour?.title_en || "Recommended tour";
  const usdAmount = (booking.total_price / 1400).toFixed(2);

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ isOpen: true, title, message });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const closePopupOrReturn = () => {
    if (popupMode && typeof window !== "undefined") {
      if (window.opener && !window.opener.closed) {
        window.close();
        return;
      }
    }
    router.push("/traveler/bookings");
  };

  const handlePopupBack = () => {
    if (!popupMode || typeof window === "undefined") {
      router.back();
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.close();
  };

  useEffect(() => {
    const errorCode = searchParams.get("error");
    const errorMessage = searchParams.get("message");
    if (!errorCode || mountedErrorRef.current === `${errorCode}:${errorMessage || ""}`) return;

    mountedErrorRef.current = `${errorCode}:${errorMessage || ""}`;
    const detail =
      errorGuide[errorCode] ||
      errorGuide[errorCode.toLowerCase()] ||
      errorMessage ||
      t("alerts.failGeneric");

    showAlert(t("alerts.paymentError"), detail);
  }, [searchParams, t, errorGuide]);

  useEffect(() => {
    if (!popupMode || !autoStartPayment || autoStartRef.current) return;
    if (!paymentWidget || isWidgetLoading) return;

    autoStartRef.current = true;
    const sanitizedUrl = new URL(window.location.href);
    sanitizedUrl.searchParams.delete("autoStart");
    window.history.replaceState(null, "", sanitizedUrl.toString());
    void handlePaymentRequest();
  }, [autoStartPayment, isWidgetLoading, paymentWidget, popupMode]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setIsWidgetLoading(true);
        const tossPayments = await loadTossPayments(clientKey);
        if (!isMounted) return;

        const widget = tossPayments.widgets({
          customerKey: booking.traveler_id,
        });

        setPaymentWidget(widget);
      } catch (error) {
        console.error("Toss initialization error:", error);
      } finally {
        if (isMounted) {
          setIsWidgetLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [booking.traveler_id]);

  useEffect(() => {
    if (!paymentWidget || paymentMethodsWidgetRef.current) return;

    const renderWidget = async () => {
      try {
        const container = document.getElementById("payment-method");
        if (!container) {
          window.setTimeout(renderWidget, 100);
          return;
        }

        await paymentWidget.setAmount({
          currency: "KRW",
          value: booking.total_price,
        });

        const methodsWidget = await paymentWidget.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        });

        await paymentWidget.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        });

        paymentMethodsWidgetRef.current = methodsWidget;
      } catch (error) {
        console.error("Toss widget render error:", error);
      }
    };

    renderWidget();
  }, [booking.total_price, paymentWidget]);

  const handlePaymentRequest = async () => {
    if (paymentMethod !== "toss" && paymentMethod !== "kakao") return;

    if (!popupMode) {
      const popup = window.open(
        `/payment-popup/${booking.id}?method=${paymentMethod}&customerName=${encodeURIComponent(
          travelerName,
        )}&customerEmail=${encodeURIComponent(travelerEmail)}&autoStart=1`,
        `guidematch-payment-${booking.id}`,
        getPopupFeatures(),
      );

      if (popup) {
        popup.focus();
      } else {
        window.location.href = `/payment-popup/${booking.id}?method=${paymentMethod}&customerName=${encodeURIComponent(
          travelerName,
        )}&customerEmail=${encodeURIComponent(travelerEmail)}&autoStart=1`;
      }
      return;
    }

    if (!paymentWidget) {
      showAlert(t("alerts.paymentError"), t("alerts.widgetNotReady"));
      return;
    }

    const popupSuffix = popupMode ? "?popup=1" : "";

    try {
      await paymentWidget.requestPayment({
        orderId: booking.id,
        orderName: tourTitle || `${booking.guide?.full_name} tour`,
        successUrl: `${window.location.origin}/api/payments/toss/success${popupSuffix}`,
        failUrl: `${window.location.origin}/api/payments/toss/fail${popupSuffix}`,
        customerEmail: travelerEmail || "customer@email.com",
        customerName: travelerName || "customer",
        windowTarget: popupMode ? "self" : "iframe",
      });
    } catch (error: any) {
      if (error?.message === "Cancelled" || error?.code === "USER_CANCEL") {
        return;
      }

      const detail =
        errorGuide[error?.code] ||
        errorGuide[error?.message] ||
        error?.message ||
        t("alerts.failGeneric");

      showAlert(t("alerts.paymentError"), detail);
    }
  };

  const onPayPalApprove = async (data: any, actions: any) => {
    try {
      await actions.order.capture();
      const res = await fetch("/api/payments/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderID: data.orderID,
          bookingId: booking.id,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        showAlert(t("alerts.paymentError"), `Error: ${result.error}`);
        return;
      }

      trackClientConversion("payment_success", {
        booking_id: booking.id,
        payment_provider: "paypal",
        value: Number(booking.total_price),
        currency: "KRW",
      });

      if (popupMode) {
        window.location.href = `/payment-popup?status=success&bookingId=${booking.id}`;
        return;
      }

      showAlert(t("alerts.paymentSuccess"), t("alerts.paymentSuccessDetail"));
      window.setTimeout(() => {
        router.push("/traveler/bookings");
        router.refresh();
      }, 1200);
    } catch (error) {
      console.error("PayPal capture error:", error);
      showAlert(t("alerts.paymentError"), t("alerts.internalError"));
    }
  };

  const popupHeader = popupMode ? (
    <div className="mb-6 flex items-center justify-between rounded-full border border-[#eadfce] bg-white/90 px-4 py-3 shadow-sm">
      <Button
        type="button"
        variant="outline"
        className="rounded-full border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        onClick={handlePopupBack}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t("popup.back")}
      </Button>
      <p className="text-sm font-semibold tracking-[-0.02em] text-slate-900">{t("popup.windowTitle")}</p>
      <Button
        type="button"
        variant="outline"
        className="rounded-full border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        onClick={closePopupOrReturn}
      >
        <X className="mr-2 h-4 w-4" />
        {t("popup.close")}
      </Button>
    </div>
  ) : null;

  return (
    <div className={`mx-auto animate-fade-in px-4 py-10 sm:px-6 lg:px-8 ${popupMode ? "max-w-4xl" : "max-w-5xl"}`}>
      {popupHeader}

      <div className="mb-8">
        {popupMode ? null : (
          <Link
            href="/traveler/bookings"
            className="mb-4 inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-accent"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("backToBookings")}
          </Link>
        )}
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          {t("title")}
        </h1>
        <p className="mt-2 text-slate-500">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-slate-200/60 shadow-md">
            <CardHeader className="border-b border-slate-100/80 bg-slate-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-accent" />
                {t("reservationInfo.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("reservationInfo.name")}</label>
                  <input
                    type="text"
                    value={travelerName}
                    onChange={(event) => setTravelerName(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={t("reservationInfo.namePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("reservationInfo.email")}</label>
                  <input
                    type="email"
                    value={travelerEmail}
                    onChange={(event) => setTravelerEmail(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={t("reservationInfo.emailPlaceholder")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <FileText className="h-4 w-4" />
                  {t("reservationInfo.messageToGuide")}
                </label>
                <textarea
                  value={travelerMessage}
                  onChange={(event) => setTravelerMessage(event.target.value)}
                  className="min-h-[100px] w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder={t("reservationInfo.messagePlaceholder")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200/60 shadow-md">
            <CardHeader className="border-b border-slate-100/80 bg-slate-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-accent" />
                {t("paymentMethod.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <div className="relative z-10 mx-6 mb-6 flex flex-col gap-3 pt-6 md:mx-0 md:flex-row md:pt-0">
                <button
                  type="button"
                  className={`flex-1 rounded-xl border-2 px-3 py-3 font-bold transition-all ${paymentMethod === "toss"
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  onClick={() => setPaymentMethod("toss")}
                >
                  <span className="text-lg font-bold text-blue-600">toss</span>
                  <span className="ml-2 text-sm">{t("paymentMethod.toss")}</span>
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-xl border-2 px-3 py-3 font-bold transition-all ${paymentMethod === "kakao"
                      ? "border-[#ffeb00] bg-[#ffeb00]/10 text-[#3c1e1e] shadow-sm"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  onClick={() => setPaymentMethod("kakao")}
                >
                  <span className="rounded bg-[#ffeb00] px-1.5 py-0.5 text-[10px] font-black text-[#3c1e1e]">
                    TALK
                  </span>
                  <span className="ml-2 text-sm">{t("paymentMethod.kakao")}</span>
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-xl border-2 px-3 py-3 font-bold transition-all ${paymentMethod === "paypal"
                      ? "border-[#003087] bg-blue-50 text-[#003087] shadow-sm"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  onClick={() => setPaymentMethod("paypal")}
                >
                  <span className="text-lg font-black italic tracking-tight text-[#003087]">PayPal</span>
                </button>
              </div>

              <div className="bg-white px-2 pb-4 md:px-0">
                {paymentMethod === "paypal" ? (
                  <div className="mx-5 animate-fade-in rounded-xl border border-slate-100 bg-slate-50 p-6 md:mx-0">
                    <div className="mb-6 text-center">
                      <p className="mb-2 font-medium text-slate-600">{t("paymentMethod.amountUsd")}</p>
                      <p className="text-3xl font-black text-[#003087]">${usdAmount}</p>
                      <p className="mt-2 text-xs text-slate-400">{t("paymentMethod.usdNotice")}</p>
                    </div>
                    <PayPalScriptProvider
                      options={{
                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
                        currency: "USD",
                      }}
                    >
                      <PayPalButtons
                        style={{ layout: "vertical", shape: "rect", color: "gold" }}
                        createOrder={(data, actions) =>
                          actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [
                              {
                                amount: {
                                  currency_code: "USD",
                                  value: usdAmount,
                                },
                                description: tourTitle || "Tour Booking",
                              },
                            ],
                          })
                        }
                        onApprove={onPayPalApprove}
                      />
                    </PayPalScriptProvider>
                  </div>
                ) : (
                  <div className="relative animate-fade-in">
                    {isWidgetLoading ? (
                      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[2px]">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("paymentMethod.loading")}</p>
                        </div>
                      </div>
                    ) : null}
                    <div id="payment-method" className="w-full min-h-[300px]" />
                    <div id="agreement" className="w-full" />

                    <div className="px-5 pb-5">
                      <Button
                        fullWidth
                        size="lg"
                        disabled={isWidgetLoading || !paymentWidget}
                        className={`mt-4 h-14 rounded-xl border-0 text-base font-bold shadow-lg transition-all hover:-translate-y-0.5 ${paymentMethod === "kakao"
                            ? "bg-[#ffeb00] text-[#3c1e1e] shadow-yellow-500/25 hover:bg-[#f7e100]"
                            : "bg-blue-600 text-white shadow-blue-600/25 hover:bg-blue-700"
                          }`}
                        onClick={handlePaymentRequest}
                      >
                        {isWidgetLoading
                          ? t("paymentMethod.preparing")
                          : t("paymentMethod.payButton", {
                              method: paymentMethod === "kakao" ? t("paymentMethod.kakao") : t("paymentMethod.toss"),
                              amount: booking.total_price.toLocaleString()
                            })}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="relative h-40 bg-slate-200">
                <img
                  src={
                    booking.tour?.photo ||
                    booking.guide?.avatar_url ||
                    "https://images.unsplash.com/photo-1546874177-9e664107314e?q=80&w=600&auto=format&fit=crop"
                  }
                  className="h-full w-full object-cover"
                  alt="Tour"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="mb-1 text-lg font-bold leading-tight text-white drop-shadow-md">
                    {tourTitle || `${booking.guide?.full_name} tour`}
                  </h3>
                  <p className="flex justify-between text-sm font-medium text-slate-200 drop-shadow-md">
                    <span>{booking.guide?.full_name} {t("summary.guideLabel")}</span>
                  </p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {new Date(booking.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {booking.tour?.duration ? `${booking.tour.duration}${t("summary.durationUnit")}` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {(guideDetail?.languages || []).join(", ") || "한국어"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {t("summary.bookingNumber")}: {booking.id.split("-")[0].toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 border-b border-slate-200 py-6">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">{t("summary.guests")}</span>
                    <span className="font-bold text-slate-900">
                      {booking.guests ? `${booking.guests}${t("summary.guestsUnit")}` : "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pb-2 pt-6">
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-bold text-slate-900">{t("summary.totalAmount")}</span>
                    <span className="text-2xl font-extrabold text-accent">
                      ₩{booking.total_price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                    <p className="mb-1 font-semibold text-slate-700">{t("summary.cancellationPolicy.title")}</p>
                    {t("summary.cancellationPolicy.threeDays")}
                    <br />
                    {t("summary.cancellationPolicy.twoDays")}
                    <br />
                    {t("summary.cancellationPolicy.guideCircumstance")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />
    </div>
  );
}

function getPopupFeatures() {
  const width = 560;
  const height = 860;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
}
