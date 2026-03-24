"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/providers/LocaleProvider";
import { MessageCircle, Instagram, Youtube, Navigation } from "lucide-react";
import { OPEN_GUIDEMATCH_CHATBOT_EVENT } from "@/lib/chatbot/open-dock-event";
import { localizePath } from "@/lib/i18n/routing";

const paymentMethods = [
  {
    name: "Visa",
    logoSrc: "/payment/visa.svg",
    className: "border-slate-200 bg-white",
    imageClassName: "h-4 w-auto",
  },
  {
    name: "Mastercard",
    logoSrc: "/payment/mastercard.svg",
    className: "border-slate-200 bg-white",
    imageClassName: "h-5 w-auto",
  },
  {
    name: "PayPal",
    logoSrc: "/payment/paypal.svg",
    className: "border-slate-200 bg-white",
    imageClassName: "h-4 w-auto",
  },
  {
    name: "KakaoPay",
    logoSrc: "/payment/kakaopay.svg",
    className: "border-slate-200 bg-white",
    imageClassName: "h-6 w-auto",
  },
  {
    name: "Toss Pay",
    logoSrc: "/payment/toss.svg",
    className: "border-blue-100 bg-white",
    imageClassName: "h-4 w-auto",
  },
] as const;

export function Footer() {
  const { locale, messages } = useI18n();
  const t = messages.common.footer;
  const localePath = (href: string) => localizePath(locale, href);

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-900">{t.customerSupport}</h3>
            <ul className="space-y-4">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    window.dispatchEvent(new CustomEvent(OPEN_GUIDEMATCH_CHATBOT_EVENT));
                  }}
                  className="group w-full text-left outline-none"
                >
                  <p className="text-sm font-bold text-slate-700 transition-colors group-hover:text-blue-600">
                    {t.liveChat}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{t.liveChatDesc}</p>
                </button>
              </li>
              <li>
                <Link href={localePath("/support/inquiry")} className="group block outline-none">
                  <p className="text-sm font-bold text-slate-700 transition-colors group-hover:text-blue-600">
                    {t.inquiryMail}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{t.inquiryMailDesc}</p>
                </Link>
              </li>
              <li>
                <Link href={localePath("/support#faq")} className="group block outline-none">
                  <p className="text-sm font-bold text-slate-700 transition-colors group-hover:text-blue-600">
                    {t.faq}
                  </p>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">{t.company}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href={localePath("/about")} className="text-sm text-slate-600 hover:text-blue-600">
                  {t.about}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">{t.partners}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href={localePath("/signup?role=guide")} className="text-sm text-slate-600 hover:text-blue-600">
                  {t.guideApply}
                </Link>
              </li>
              <li>
                <Link href={localePath("/guide/policy")} className="text-sm text-slate-600 hover:text-blue-600">
                  {t.guidePolicy}
                </Link>
              </li>
              <li>
                <Link href={localePath("/partnership")} className="text-sm text-slate-600 hover:text-blue-600">
                  {t.partnership}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">{t.legal}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href={localePath("/terms")} className="text-sm text-slate-600 hover:text-blue-600">
                  {t.terms}
                </Link>
              </li>
              <li>
                <Link href={localePath("/terms?type=privacy")} className="text-sm font-bold text-slate-900 hover:text-blue-600">
                  {t.privacy}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-sm font-bold text-slate-900">{t.social}</h3>
            <div className="mt-4 flex gap-4">
              <Link href="#" className="text-slate-400 transition-colors hover:text-[#fae100]" aria-label="Kakao">
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-400 transition-colors hover:text-[#E1306C]" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-400 transition-colors hover:text-[#03C75A]" aria-label="Naver Blog">
                <Navigation className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-400 transition-colors hover:text-[#FF0000]" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-6 border-t border-slate-200 pt-8 sm:flex-row sm:items-end">
          <div className="text-xs leading-5 text-slate-500">
            <p className="mb-2 font-bold text-slate-700">{t.companyName}</p>
            <p>{t.businessInfo1}</p>
            <p>{t.businessInfo2}</p>
            <p>{t.businessInfo3}</p>
            <p>{t.businessInfo4}</p>
            <p className="mt-4">
              &copy; {new Date().getFullYear()} {t.copyright}
            </p>
          </div>

          <div className="flex flex-col gap-4 text-right">
            <div className="flex flex-wrap justify-end gap-2 text-xs font-semibold text-slate-400">
              {paymentMethods.map((method) => (
                <span
                  key={method.name}
                  className={`inline-flex h-10 min-w-[4.5rem] items-center justify-center rounded-xl border px-3 shadow-sm ${method.className}`}
                  aria-label={method.name}
                  title={method.name}
                >
                  <Image
                    src={method.logoSrc}
                    alt={method.name}
                    className={method.imageClassName}
                    width={96}
                    height={32}
                    loading="lazy"
                  />
                </span>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                {t.ssl}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                {t.security}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
