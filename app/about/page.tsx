import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2, HeartHandshake, Map, ShieldCheck, Sparkles, Users } from "lucide-react";
import { InfoHeader } from "@/components/layout/InfoHeader";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { localizePath } from "@/lib/utils";

type LocaleCode = "ko" | "en";

const localeSwitcher = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
] as const;

const valueCards: {
  icon: typeof ShieldCheck;
  accent: string;
  iconColor: string;
  title: Record<LocaleCode, string>;
  description: Record<LocaleCode, string>;
}[] = [
  {
    icon: ShieldCheck,
    accent: "from-blue-500 to-cyan-400",
    iconColor: "text-blue-600",
    title: {
      ko: "투명한 신뢰 (Trust)",
      en: "Transparent Trust",
    },
    description: {
      ko: "숨겨진 수수료나 패키지 쇼핑 강요 없이, 약속된 일정과 비용 그대로 안전한 여행을 보장합니다.",
      en: "No hidden fees or forced shopping—just the promised itinerary and costs for a safe trip.",
    },
  },
  {
    icon: HeartHandshake,
    accent: "from-emerald-500 to-teal-400",
    iconColor: "text-emerald-600",
    title: {
      ko: "상생 (Coexistence)",
      en: "Coexistence",
    },
    description: {
      ko: "업계 최저 수준의 합리적인 수수료율을 통해 파트너 가이드의 전문성과 열정에 합당한 보상을 지원합니다.",
      en: "Fair commissions reward guides for their expertise and passion, fostering a sustainable ecosystem.",
    },
  },
  {
    icon: Globe2,
    accent: "from-purple-500 to-pink-400",
    iconColor: "text-purple-600",
    title: {
      ko: "로컬 경험 (Local)",
      en: "Local Experience",
    },
    description: {
      ko: "단순 관광지 방문을 넘어 현지인만 아는 진짜 이야기와 생생한 문화를 여행자에게 선사합니다.",
      en: "Go beyond tourist icons to discover living local stories and the authentic rhythm of everyday life.",
    },
  },
];

const translations: Record<
  LocaleCode,
  {
    hero: {
      badge: string;
      titlePrefix: string;
      titleAccent: string;
      titleSuffix: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
    };
    story: {
      headingPrefix: string;
      headingAccent: string;
      headingSuffix: string;
      description: string;
      bullets: string[];
      pillars: { title: string; body: string; }[];
    };
    cta: {
      heading: string;
      description: string;
      label: string;
    };
  }
> = {
  ko: {
    hero: {
      badge: "로컬 여행의 패러다임을 바꿉니다",
      titlePrefix: "당신만의 ",
      titleAccent: "완벽한 가이드",
      titleSuffix: "를 만나는 가장 쉬운 방법",
      description:
        "가이드매치는 검증된 로컬 전문가와 특별한 여행을 꿈꾸는 여행자를 직접 연결하여, 중간 마진 없이 투명하고 신뢰할 수 있는 진짜 여행 생태계를 만들어갑니다.",
      primaryCta: "인기 투어 찾아보기",
      secondaryCta: "가이드로 합류하기",
    },
    story: {
      headingPrefix: "여행의 스토리는",
      headingAccent: "누구와 함께하느냐",
      headingSuffix: "에 따라 달라집니다",
      description:
        "가이드매치는 단순한 여행 포털이 아닙니다. 엄격한 심사를 거친 검증된 로컬 전문가들의 프로필과 실제 여행자들의 생생한 리뷰를 바탕으로, 내 취향에 딱 맞는 동반자를 직접 선택할 수 있습니다.",
      bullets: [
        "철저한 가이드 신원 및 자격 증명 검증 시스템",
        "전 세계 다양한 도시 글로벌 네트워크 활성화",
      ],
      pillars: [
        {
          icon: Users,
          title: "여행자를 위해",
          body: "1:1 맞춤형 전담 투어부터 알찬 소규모 그룹 투어까지, 안전하고 편리한 간편 결제를 지원합니다.",
        },
        {
          icon: Map,
          title: "파트너 가이드를 위해",
          body: "내 맘대로 일정을 관리하고 나만의 특별한 투어 상품을 기획하여 정당한 수준의 수익을 창출하세요.",
        },
      ],
    },
    cta: {
      heading: "지금 바로 새로운 여행을 시작해 볼까요?",
      description: "가이드매치와 함께 평생 잊지 못할 당신만의 특별한 추억을 만들어보세요.",
      label: "어디로 떠나고 싶으신가요?",
    },
  },
  en: {
    hero: {
      badge: "Reinventing how local travel connects",
      titlePrefix: "Meet your perfect ",
      titleAccent: "local guide",
      titleSuffix: " effortlessly",
      description:
        "GuideMatch pairs verified local experts with travelers so you skip the middleman and step into trustworthy, immersive journeys.",
      primaryCta: "Explore popular tours",
      secondaryCta: "Join as a guide",
    },
    story: {
      headingPrefix: "Travel stories",
      headingAccent: "change depending on who you travel with",
      headingSuffix: "",
      description:
        "GuideMatch isn't just another travel portal. We highlight vetted local experts and real traveler reviews so you can choose the companion who matches your pace.",
      bullets: [
        "Rigorous verification of guide identity and credentials",
        "An expanding global network that keeps local insight fresh in every city",
      ],
      pillars: [
        {
          icon: Users,
          title: "For travelers",
          body: "From bespoke private tours to small-group departures, we handle safe, frictionless checkouts.",
        },
        {
          icon: Map,
          title: "For partner guides",
          body: "Design your own schedule and turn signature experiences into fair, repeatable income.",
        },
      ],
    },
    cta: {
      heading: "Ready to start a new kind of trip?",
      description: "Let GuideMatch help you craft unforgettable memories.",
      label: "Where to next?",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: locale === "ko" ? "GuideMatch 소개 | GuideMatch" : "About GuideMatch | GuideMatch",
    description:
      locale === "ko"
        ? "GuideMatch는 검증된 로컬 가이드와 여행자를 연결해 경험의 밀도를 높이는 서비스를 제공합니다."
        : "GuideMatch connects verified local guides with travelers for richer, more trustworthy trips.",
  };
}

export default async function AboutPage() {
  const locale = await getRequestLocale();
  const content = translations[locale];
  const localePath = (href: string) => localizePath(locale, href);

  return (
    <>
      <InfoHeader />
      <main className="min-h-screen bg-slate-50 text-slate-900">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.12),transparent_28%)]" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex flex-col items-center gap-3 text-white/80 sm:flex-row sm:justify-center mb-6">
              <p className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                {content.hero.badge}
              </p>
              
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                {localeSwitcher.map(({ code, label }) => (
                  <Link
                    key={code}
                    href={localizePath(code, "/about")}
                    className={`rounded-full px-3 py-1 transition ${
                      locale === code
                        ? "bg-white text-slate-900 shadow-lg shadow-slate-950/30"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-8 hero-title">
              {content.hero.titlePrefix}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {content.hero.titleAccent}
              </span>
              {content.hero.titleSuffix}
            </h1>
            
            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-white/80 leading-relaxed mb-10">
              {content.hero.description}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link 
                href={localePath("/")} 
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition shadow-lg inline-flex items-center justify-center gap-2"
              >
                {content.hero.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href={localePath("/signup?role=guide")} 
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white font-bold rounded-2xl border border-slate-700 hover:bg-slate-700 transition inline-flex items-center justify-center"
              >
                {content.hero.secondaryCta}
              </Link>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              {locale === "ko" ? "우리가 추구하는 가치" : "Our Core Values"}
            </h2>
            <p className="text-lg text-slate-500">
              {locale === "ko" 
                ? "여행자와 가이드 모두가 평등하게 만족하는 여행 플랫폼" 
                : "A travel platform where both travelers and guides find equal satisfaction"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valueCards.map((card) => (
              <div 
                key={card.title.ko}
                className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${card.accent} text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                  <card.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {card.title[locale]}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {card.description[locale]}
                </p>
                <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${card.accent} w-0 group-hover:w-full transition-all duration-500`} />
              </div>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section className="bg-white border-y border-slate-200 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6">
                  {content.story.headingPrefix}<br />
                  <span className="text-blue-600">{content.story.headingAccent}</span> {content.story.headingSuffix}
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  {content.story.description}
                </p>
                <ul className="space-y-4">
                  {content.story.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-slate-700 font-medium tracking-tight text-sm">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-cyan-50 rounded-[3rem] transform rotate-3 scale-105 -z-10" />
                <div className="bg-white border border-slate-100 p-8 sm:p-10 rounded-[3rem] shadow-xl">
                  <div className="space-y-8">
                    {content.story.pillars.map((pillar, idx) => (
                      <div key={idx}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                            <pillar.icon className="w-6 h-6 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 mb-1">{pillar.title}</p>
                            <p className="text-slate-600 text-sm leading-relaxed">{pillar.body}</p>
                          </div>
                        </div>
                        {idx < content.story.pillars.length - 1 && <div className="w-full h-px bg-slate-100 mt-8" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 tracking-tight">
              {content.cta.heading}
            </h2>
            <p className="text-lg text-slate-600 mb-10">
              {content.cta.description}
            </p>
            <Link 
              href={localePath("/")} 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-500/30"
            >
              {content.cta.label} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
