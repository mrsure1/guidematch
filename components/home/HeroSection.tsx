"use client";

import Link from "next/link";
import { User, LayoutDashboard } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/providers/LocaleProvider";
import { replaceName } from "@/lib/home/search-utils";

interface HeroSectionProps {
  userName?: string | null;
  userRole?: string | null;
  withLocale: (href: string) => string;
  children?: React.ReactNode;
}

export function HeroSection({ userName, userRole, withLocale, children }: HeroSectionProps) {
  const { messages } = useI18n();
  const nav = messages.common.navigation;
  const landing = messages.landing;

  return (
    <section className="relative z-20 overflow-visible">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1535189043414-47a3c49a0bed?auto=format&fit=crop&w=1800&q=80')",
        }}
      />
      
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/72 to-blue-950/68" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.28),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(59,130,246,0.2),transparent_28%),radial-gradient(circle_at_75%_85%,rgba(14,116,144,0.2),transparent_30%)]" />

      {/* Content Container */}
      <div className="relative z-[150] mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 md:gap-4">
          <header className="relative z-[100] flex flex-1 items-center justify-between gap-4 rounded-full border border-white/15 bg-white/8 px-5 py-3 backdrop-blur-md">
            <BrandLogo href={withLocale("/")} size="lg" tone="light" variant="signature" />
            
            <div className="flex items-center gap-4">
              {userName ? (
                <>
                  <HeaderActions variant="light" />
                  
                  {(userRole === 'guide' || userRole === 'admin') && (
                    <Link
                      href={withLocale('/guide/dashboard')}
                      className="hidden md:flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-4 py-2 text-xs font-bold text-white transition hover:border-white/30 hover:bg-white/12"
                    >
                      <LayoutDashboard className="w-3 h-3" />
                      {nav.guideMenu}
                    </Link>
                  )}

                  <Link
                    href={withLocale(userRole === 'guide' || userRole === 'admin' ? '/guide/profile' : '/traveler/profile')}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-4 py-2 text-xs font-bold text-white transition hover:border-white/30 hover:bg-white/12"
                  >
                    <User className="w-3 h-3" />
                    {nav.myPage}
                  </Link>
                </>
              ) : (

                <Link
                  href={withLocale("/login")}
                  className="rounded-full bg-white px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-slate-100"
                >
                  {nav.login}
                </Link>
              )}
              <div className="hidden sm:block">
                <LanguageSwitcher tone="light" />
              </div>
            </div>
          </header>
        </div>

        {/* Search Bar Placeholder (Right below header) */}
        {children}

        {/* Hero Text */}
        <div className="mt-12 text-center lg:mt-16">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-bold text-blue-300 backdrop-blur-sm">
            <div className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            {userName ? replaceName(landing.hero.loggedInBadge, userName) : landing.hero.loggedOutBadge}
          </div>
          <h1 className="mt-8 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            {landing.hero.titleLine1} <br />
            <span className="bg-gradient-to-r from-blue-300 via-blue-100 to-indigo-200 bg-clip-text text-transparent">
              {landing.hero.titleLine2}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-slate-300 sm:text-xl">
            {landing.hero.description}
          </p>
        </div>
      </div>
    </section>
  );
}

