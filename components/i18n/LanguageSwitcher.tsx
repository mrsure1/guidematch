"use client";

import { useRouter, usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/components/providers/LocaleProvider";
import { localizePath } from "@/lib/i18n/routing";

export function LanguageSwitcher({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, messages } = useI18n();

  const isLockedKoreanRoute = pathname.startsWith("/guide") || pathname.startsWith("/admin");
  if (isLockedKoreanRoute) {
    return null;
  }

  const nextLocale: Locale = locale === "ko" ? "en" : "ko";

  const handleChangeLocale = async () => {
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    try {
      window.localStorage.setItem(LOCALE_COOKIE_NAME, nextLocale);
    } catch {
      // localStorage can be unavailable in hardened browser modes.
    }
    await router.push(localizePath(nextLocale, pathname));
    router.refresh();
  };

  const label =
    nextLocale === "ko"
      ? messages.common.languageSwitcher.korean
      : messages.common.languageSwitcher.english;

  return (
    <button
      type="button"
      onClick={handleChangeLocale}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
        tone === "light"
          ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      } ${className}`}
      aria-label={messages.common.languageSwitcher.label}
      title={messages.common.languageSwitcher.label}
    >
      <Languages className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
