import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { InfoHeader } from "@/components/layout/InfoHeader";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarCheck2,
  Camera,
  CreditCard,
  Globe2,
  HeartHandshake,
  Map,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  
  return {
    title: dict.about.metadata.title,
    description: dict.about.metadata.description,
  };
}

export default async function AboutPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { about } = dict;

  const valueCards = [
    {
      title: about.values.transparency.title,
      description: about.values.transparency.description,
      icon: ShieldCheck,
      accent: "from-sky-500 to-cyan-400",
      iconStyle: "bg-sky-100 text-sky-700",
    },
    {
      title: about.values.expertise.title,
      description: about.values.expertise.description,
      icon: BadgeCheck,
      accent: "from-emerald-500 to-teal-400",
      iconStyle: "bg-emerald-100 text-emerald-700",
    },
    {
      title: about.values.design.title,
      description: about.values.design.description,
      icon: Globe2,
      accent: "from-amber-500 to-orange-400",
      iconStyle: "bg-amber-100 text-amber-700",
    },
  ];

  const processSteps = [
    {
      step: "01",
      title: about.howItWorks.step1.title,
      description: about.howItWorks.step1.description,
      icon: Sparkles,
    },
    {
      step: "02",
      title: about.howItWorks.step2.title,
      description: about.howItWorks.step2.description,
      icon: Users,
    },
    {
      step: "03",
      title: about.howItWorks.step3.title,
      description: about.howItWorks.step3.description,
      icon: CalendarCheck2,
    },
  ];

  const galleryCards = [
    {
      src: "/images/tours/gyeongbokgung.png",
      alt: "Seoul Gyeongbokgung",
      title: about.gallery.card1.title,
      description: about.gallery.card1.description,
    },
    {
      src: "/images/tours/jeju_1.png",
      alt: "Jeju Island Tour",
      title: about.gallery.card2.title,
      description: about.gallery.card2.description,
    },
    {
      src: "/images/tours/gyeongbokgung_3.png",
      alt: "Korea Cultural Heritage",
      title: about.gallery.card3.title,
      description: about.gallery.card3.description,
    },
  ];

  return (
    <>
      <InfoHeader />
      <main className="min-h-screen bg-[#f6f3ee] text-slate-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#0f172a]">
          <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_50%),radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.14),transparent_40%)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:72px_72px]" />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="pt-4 sm:pt-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                {about.hero.badge}
              </div>

              <h1 className="max-w-xl text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl hero-title">
                {about.hero.titleLine1}
                <span className="text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-amber-200 bg-clip-text">
                  {about.hero.titleLine2}
                </span>
                {about.hero.titleSuffix}
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                {about.hero.description}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">{about.hero.matching.label}</p>
                  <p className="mt-3 text-lg font-bold text-white">{about.hero.matching.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{about.hero.matching.desc}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">{about.hero.trust.label}</p>
                  <p className="mt-3 text-lg font-bold text-white">{about.hero.trust.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{about.hero.trust.desc}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">{about.hero.experience.label}</p>
                  <p className="mt-3 text-lg font-bold text-white">{about.hero.experience.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{about.hero.experience.desc}</p>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4efe7] px-7 py-4 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5"
                >
                  {about.hero.ctaTraveler}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup?role=guide"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/15"
                >
                  {about.hero.ctaGuide}
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full bg-amber-300/30 blur-2xl lg:block" />
              <div className="absolute -right-8 bottom-28 hidden h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl lg:block" />

              <div className="relative rounded-[2rem] border border-white/12 bg-white/8 p-3 shadow-[0_30px_80px_rgba(15,23,42,0.35)] backdrop-blur">
                <div className="relative overflow-hidden rounded-[1.6rem]">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src="/hero-korea.png"
                      alt="GuideMatch Main Vision"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-300">{about.hero.standardBadge}</p>
                    <p className="mt-3 max-w-sm text-2xl font-bold tracking-[-0.04em] text-white">
                      {about.hero.standardText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto mt-8 grid max-w-xl gap-4 px-4 sm:grid-cols-[0.84fr_1.16fr] lg:mt-12 lg:ml-8 lg:px-0">
                <div className="rounded-[1.75rem] border border-slate-200 bg-[#fcfaf7] p-3 shadow-xl shadow-slate-900/10">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem]">
                    <Image
                      src="/images/guides/guide_busan_woman.png"
                      alt="Guide Profile Example"
                      fill
                      sizes="(max-width: 640px) 100vw, 18vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-[#fcfaf7] p-5 shadow-xl shadow-slate-900/10">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-slate-900 p-3 text-white">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{about.hero.trust.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {about.hero.trust.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-[#fcfaf7] p-5 shadow-xl shadow-slate-900/10">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                        <HeartHandshake className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{about.benefits.guide.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {about.benefits.guide.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Perspective Section */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">{about.perspective.label}</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl whitespace-pre-line">
                {about.perspective.title}
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-600">
                {about.perspective.description}
              </p>
              <div className="mt-8 rounded-[1.5rem] bg-slate-950 px-6 py-5 text-slate-100">
                <p className="text-sm leading-7">
                  &quot;{about.perspective.quote}&quot;
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {valueCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.title}
                    className="group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className={`inline-flex rounded-2xl p-3 ${card.iconStyle}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold tracking-[-0.03em] text-slate-900">{card.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{card.description}</p>
                    <div className={`mt-8 h-1.5 rounded-full bg-gradient-to-r ${card.accent}`} />
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="border-y border-slate-200 bg-[#efe7dc]">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">{about.howItWorks.label}</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl whitespace-pre-line">
                {about.howItWorks.title}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-700">
                {about.howItWorks.description}
              </p>

              <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-slate-300 bg-white/70 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="relative aspect-[5/4] overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/images/tours/gyeongbokgung_1.png"
                    alt="Process Example"
                    fill
                    sizes="(max-width: 1024px) 100vw, 36vw"
                    className="object-cover"
                  />
                </div>
                {/* Updated background to bg-slate-950/80 as per user request */}
                <div className="absolute bottom-8 left-8 right-8 rounded-[1.5rem] border border-white/40 bg-slate-950/80 p-5 text-white backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">{about.howItWorks.matchingLabel}</p>
                  <p className="mt-2 text-lg font-bold tracking-[-0.03em]">
                    {about.howItWorks.matchingText}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {processSteps.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.step}
                    className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold tracking-[0.18em] text-white">
                          {item.step}
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">{item.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">{about.benefits.label}</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl whitespace-pre-line">
              {about.benefits.title}
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div className="relative aspect-[16/10]">
                <Image
                  src="/images/tours/jeju_2.png"
                  alt="For Travelers"
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                    <Map className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">{about.benefits.traveler.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {about.benefits.traveler.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {about.benefits.traveler.list.map((benefit: string) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                      <span className="mt-1 rounded-full bg-slate-900 p-1 text-white">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {about.benefits.traveler.tags.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-2">{tag}</span>
                  ))}
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-[#0f172a] text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
              <div className="relative aspect-[16/10]">
                <Image
                  src="/images/guides/guide_fashion_woman.png"
                  alt="For Guides"
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3 text-amber-200">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-[-0.03em]">{about.benefits.guide.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {about.benefits.guide.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {about.benefits.guide.list.map((benefit: string) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm leading-7 text-slate-200">
                      <span className="mt-1 rounded-full bg-white/12 p-1 text-amber-200">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center gap-2 text-amber-200">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.18em]">{about.benefits.guide.revenue.title}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{about.benefits.guide.revenue.desc}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center gap-2 text-cyan-200">
                      <Camera className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.18em]">{about.benefits.guide.profile.title}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{about.benefits.guide.profile.desc}</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">{about.gallery.label}</p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">
                  {about.gallery.title}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-600">
                {about.gallery.description}
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {galleryCards.map((card, index) => (
                <article
                  key={card.title}
                  className={`overflow-hidden rounded-[2rem] border border-slate-200 bg-[#faf7f2] shadow-[0_18px_48px_rgba(15,23,42,0.06)] ${
                    index === 1 ? "lg:translate-y-10" : ""
                  }`}
                >
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={card.src}
                      alt={card.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 31vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-7">
                    <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">{card.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{card.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Promise Section */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-10 text-center text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:px-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">{about.promise.label}</p>
              <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl whitespace-pre-line">
                {about.promise.title}
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-300">
                {about.promise.description}
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  {about.promise.ctaTour}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup?role=guide"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  {about.promise.ctaJoin}
                </Link>
              </div>

              <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">{about.promise.trust.label}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{about.promise.trust.desc}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-amber-200">
                    <HeartHandshake className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">{about.promise.partnership.label}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{about.promise.partnership.desc}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-emerald-200">
                    <Globe2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">{about.promise.locality.label}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{about.promise.locality.desc}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
