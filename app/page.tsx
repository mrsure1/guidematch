import { createClient } from "@/lib/supabase/server";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { localizeLanguageList, localizeLocationLabel } from "@/lib/i18n/display";
import MainLandingClient, {
  type LandingGuide,
  type LandingTour,
} from "@/components/home/MainLandingClient";

function getFallbackGuides(locale: "en" | "ko"): LandingGuide[] {
  if (locale === "ko") {
    return [
      {
        id: "fallback-guide-seoul",
        name: "민지 가이드",
        location: "서울",
        bio: "한옥 골목, 전통시장, 감성 카페를 자연스럽게 이어주는 서울 로컬 가이드입니다.",
        languages: ["Korean", "English"],
        hourlyRate: 45000,
        rating: 4.9,
        reviewCount: 128,
        avatar: "/minji_guide.png",
        isVerified: true,
      },
      {
        id: "fallback-guide-busan",
        name: "준호 가이드",
        location: "부산",
        bio: "바다 전망, 로컬 식사, 야경 동선을 한 번에 연결해주는 부산 가이드입니다.",
        languages: ["Korean", "English"],
        hourlyRate: 50000,
        rating: 5,
        reviewCount: 74,
        avatar: "/junho_guide.png",
        isVerified: true,
      },
    ];
  }

  return [
    {
      id: "fallback-guide-seoul",
      name: "Minji Guide",
      location: "Seoul",
      bio: "A local Seoul guide who blends hanok neighborhoods, traditional markets, and cafe alleys into one easy day.",
      languages: ["Korean", "English"],
      hourlyRate: 45000,
      rating: 4.9,
      reviewCount: 128,
      avatar: "/minji_guide.png",
      isVerified: true,
    },
    {
      id: "fallback-guide-busan",
      name: "Junho Guide",
      location: "Busan",
      bio: "Ocean views, local dining, and night scenery linked into a smooth Busan route.",
      languages: ["Korean", "English"],
      hourlyRate: 50000,
      rating: 5,
      reviewCount: 74,
      avatar: "/junho_guide.png",
      isVerified: true,
    },
  ];
}

function getFallbackTours(locale: "en" | "ko"): LandingTour[] {
  if (locale === "ko") {
    return [
      {
        id: "fallback-tour-seoul",
        title: "서울 감성 산책 + 로컬 브런치",
        region: "서울",
        description: "성수와 서울숲을 천천히 걷고, 일정에 맞는 브런치까지 이어지는 코스입니다.",
        duration: 4,
        price: 89000,
        photo:
          "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1400&q=80",
        guideName: "민지 가이드",
        guideId: "fallback-guide-seoul",
        rating: 4.9,
        reviewCount: 61,
      },
      {
        id: "fallback-tour-busan",
        title: "부산 오션뷰 드라이브 데이",
        region: "부산",
        description: "광안리에서 해운대, 기장까지 이어지는 해안 루트와 로컬 맛집을 함께 즐깁니다.",
        duration: 6,
        price: 119000,
        photo:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
        guideName: "준호 가이드",
        guideId: "fallback-guide-busan",
        rating: 4.8,
        reviewCount: 44,
      },
      {
        id: "fallback-tour-jeju",
        title: "제주 오름과 노을 루트",
        region: "제주",
        description: "조용한 오름 산책부터 해안 노을 포인트까지 이어지는 하루 코스입니다.",
        duration: 7,
        price: 149000,
        photo:
          "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
        guideName: "서연 가이드",
        guideId: "fallback-guide-jeju",
        rating: 5,
        reviewCount: 39,
      },
    ];
  }

  return [
    {
      id: "fallback-tour-seoul",
      title: "Seoul Mood Walk and Local Brunch",
      region: "Seoul",
      description: "A gentle route through Seongsu and Seoul Forest with a brunch stop matched to your pace.",
      duration: 4,
      price: 89000,
      photo:
        "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1400&q=80",
      guideName: "Minji Guide",
      guideId: "fallback-guide-seoul",
      rating: 4.9,
      reviewCount: 61,
    },
    {
      id: "fallback-tour-busan",
      title: "Busan Ocean View Drive Day",
      region: "Busan",
      description: "A scenic coastal route from Gwangalli to Haeundae and Gijang with local food stops.",
      duration: 6,
      price: 119000,
      photo:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
      guideName: "Junho Guide",
      guideId: "fallback-guide-busan",
      rating: 4.8,
      reviewCount: 44,
    },
    {
      id: "fallback-tour-jeju",
      title: "Jeju Oreum and Sunset Route",
      region: "Jeju",
      description: "From a quiet oreum walk to a sunset coastal stop, this route keeps the whole day flowing.",
      duration: 7,
      price: 149000,
      photo:
        "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
      guideName: "Seoyeon Guide",
      guideId: "fallback-guide-jeju",
      rating: 5,
      reviewCount: 39,
    },
  ];
}

type GuideDetailRow = {
  location?: string | null;
  languages?: string[] | string | null;
  bio?: string | null;
  bio_i18n?: {
    ko?: string | null;
    en?: string | null;
  } | null;
  hourly_rate?: number | null;
  rating?: number | null;
  review_count?: number | null;
  is_verified?: boolean | null;
};

type GuideRow = {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  guides_detail?: GuideDetailRow | GuideDetailRow[] | null;
};

type TourGuideDetailRow = {
  rating?: number | null;
  review_count?: number | null;
};

type TourProfileRow = {
  id: string;
  full_name?: string | null;
  guides_detail?: TourGuideDetailRow | TourGuideDetailRow[] | null;
};

type TourRow = {
  id: string;
  title_ko?: string | null;
  title?: string | null;
  title_en?: string | null;
  description_ko?: string | null;
  description?: string | null;
  description_en?: string | null;
  region_ko?: string | null;
  region?: string | null;
  region_en?: string | null;
  duration?: number | null;
  price?: number | null;
  photo?: string | null;
  profiles?: TourProfileRow | TourProfileRow[] | null;
};

function firstOf<T>(value: T | T[] | null | undefined): T | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home() {
  const locale = await getRequestLocale();
  const supabase = await createClient();
  const fallbackGuides = getFallbackGuides(locale);
  const fallbackTours = getFallbackTours(locale);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileResult = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle()
    : null;

  let profile = profileResult?.data ? { ...profileResult.data } : null;

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  const isAdminEmail = !!user?.email && adminEmails.includes(user.email.toLowerCase());

  if (isAdminEmail) {
    if (!profile) {
      profile = { full_name: user?.user_metadata?.full_name || "Admin", role: "admin" } as any;
    } else {
      profile.role = "admin";
    }
  }

  const { data: rawGuides } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      avatar_url,
      guides_detail (*)
    `,
    )
    .in("role", ["guide", "admin"])
    .limit(10);

  const { data: rawTours } = await supabase
    .from("tours")
    .select(
      `
      id,
      title_ko,
      title,
      title_en,
      description_ko,
      description,
      description_en,
      region_ko,
      region,
      region_en,
      duration,
      price,
      photo,
      profiles (
        id,
        full_name,
        guides_detail (
          rating,
          review_count,
          is_verified
        )
      )
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const dbGuides: LandingGuide[] =
    (rawGuides as GuideRow[] | null)
      ?.filter((guide) => {
        const detail = firstOf(guide.guides_detail);
        return detail != null && detail.is_verified === true;
      })
      .map((guide) => {
      const detail = firstOf(guide.guides_detail);
      const languages = detail?.languages;
      const localizedBio =
        locale === "ko"
          ? detail?.bio_i18n?.ko || detail?.bio
          : detail?.bio_i18n?.en || "";

      return {
        id: guide.id,
        name: guide.full_name || (locale === "ko" ? "로컬 가이드" : "Local Guide"),
        location: localizeLocationLabel(detail?.location || (locale === "ko" ? "서울" : "Seoul"), locale),
        bio:
          localizedBio ||
          (locale === "ko"
            ? "한 코스를 믿고 맡길 수 있는 로컬 가이드입니다."
            : "A local guide who knows the route well."),
        languages: localizeLanguageList(
          Array.isArray(languages)
            ? languages.filter(Boolean)
            : languages
              ? [languages]
              : locale === "ko"
                ? ["한국어"]
                : ["English"],
          locale,
        ),
        hourlyRate: typeof detail?.hourly_rate === "number" ? detail.hourly_rate : 0,
        rating: typeof detail?.rating === "number" ? detail.rating : null,
        reviewCount: typeof detail?.review_count === "number" ? detail.review_count : null,
        avatar:
          guide.avatar_url ||
          `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(guide.id)}`,
        isVerified: Boolean(detail?.is_verified),
      };
    }) || [];

  const guides = [...dbGuides, ...fallbackGuides].slice(0, 6);

  const dbTours: LandingTour[] =
    (rawTours as TourRow[] | null)
      ?.filter((tour) => {
        const profileRow = firstOf(tour.profiles);
        const guideDetail = firstOf(profileRow?.guides_detail);
        return guideDetail != null && (guideDetail as any).is_verified === true;
      })
      .map((tour) => {
      const profileRow = firstOf(tour.profiles);
      const guideDetail = firstOf(profileRow?.guides_detail);

      return {
        id: tour.id,
        guideId: profileRow?.id || "",
        title:
          locale === "ko"
            ? tour.title_ko || tour.title || "추천 투어"
            : tour.title_en || "Recommended tour",
        region:
          locale === "ko"
            ? localizeLocationLabel(tour.region_ko || tour.region || "서울", locale)
            : localizeLocationLabel(tour.region_en || "Seoul", locale),
        description:
          locale === "ko"
            ? tour.description_ko || tour.description || "지역의 흐름과 핵심 포인트를 담은 일정입니다."
            : tour.description_en || "A concise itinerary with local movement and key highlights.",
        duration: typeof tour.duration === "number" ? tour.duration : 0,
        price: typeof tour.price === "number" ? tour.price : 0,
        photo:
          tour.photo ||
          "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80",
        guideName: profileRow?.full_name || "GuideMatch",
        rating: typeof guideDetail?.rating === "number" ? guideDetail.rating : null,
        reviewCount:
          typeof guideDetail?.review_count === "number" ? guideDetail.review_count : null,
      };
    }) || [];

  const tours = [...dbTours, ...fallbackTours].slice(0, 6);

  const isGuide = profile?.role === "guide" || profile?.role === "admin";
  const guideHref = user && isGuide ? "/guide/dashboard" : "/signup?role=guide";

  return (
    <MainLandingClient
      userName={profile?.full_name ?? null}
      userRole={profile?.role ?? null}
      guideHref={guideHref}
      guides={guides.length > 0 ? guides : fallbackGuides}
      tours={tours.length > 0 ? tours : fallbackTours}
    />
  );
}


