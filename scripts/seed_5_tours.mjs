import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const tours = [
    {
        title: "서울, 이태원 투어",
        title_ko: "서울, 이태원 투어",
        title_en: "Seoul, Itaewon Global Culture Tour",
        description: "다양한 문화가 공존하는 이태원의 밤거리와 숨겨진 맛집, 그리고 감각적인 카페를 탐방하는 투어입니다.",
        description_ko: "다양한 문화가 공존하는 이태원의 밤거리와 숨겨진 맛집, 그리고 감각적인 카페를 탐방하는 투어입니다.",
        description_en: "Discover the vibrant night streets, hidden gems, and trendy cafes of Itaewon, where diverse cultures coexist.",
        region: "서울 이태원",
        region_ko: "서울 이태원",
        region_en: "Itaewon, Seoul",
        duration: 4,
        price: 50000,
        max_guests: 6,
        photo: "/images/tours/tour_itaewon_1.png,/images/tours/tour_itaewon_2.png,/images/tours/tour_itaewon_3.png",
        included_items: ["가이드비", "생수", "전통차 체험"],
        included_items_ko: ["가이드비", "생수", "전통차 체험"],
        included_items_en: ["Guide fee", "Mineral water", "Traditional tea experience"]
    },
    {
        title: "경주 투어",
        title_ko: "천년의 고도, 경주 역사 기행",
        title_en: "Gyeongju History & Night View Tour",
        description: "불국사와 대릉원, 그리고 아름다운 동궁과 월지의 야경을 감상하며 신라의 역사를 배우는 투어입니다.",
        description_ko: "불국사와 대릉원, 그리고 아름다운 동궁과 월지의 야경을 감상하며 신라의 역사를 배우는 투어입니다.",
        description_en: "Explore the ancient capital of Silla at Bulguksa Temple and Daereungwon, followed by a romantic night view at Donggung Palace.",
        region: "경주",
        region_ko: "경주",
        region_en: "Gyeongju",
        duration: 6,
        price: 80000,
        max_guests: 10,
        photo: "/images/tours/tour_gyeongju_1.png,/images/tours/tour_gyeongju_2.png,/images/tours/tour_gyeongju_3.png",
        included_items: ["입장료", "차량 이동", "역사 해설"],
        included_items_ko: ["입장료", "차량 이동", "역사 해설"],
        included_items_en: ["Entrance fees", "Transportation", "Historical commentary"]
    },
    {
        title: "부산 투어",
        title_ko: "푸른 바다와 예술의 조화, 부산 투어",
        title_en: "Busan Coastal & Culture Village Tour",
        description: "해운대의 탁 트인 바다와 감천문화마을의 예술적 감성, 그리고 자갈치 시장의 활기를 느끼는 투어입니다.",
        description_ko: "해운대의 탁 트인 바다와 감천문화마을의 예술적 감성, 그리고 자갈치 시장의 활기를 느끼는 투어입니다.",
        description_en: "Experience the blue ocean of Haeundae, the artistic charm of Gamcheon Culture Village, and the energy of Jagalchi Market.",
        region: "부산",
        region_ko: "부산",
        region_en: "Busan",
        duration: 5,
        price: 65000,
        max_guests: 8,
        photo: "/images/tours/tour_busan_1.png,/images/tours/tour_busan_2.png,/images/tours/tour_busan_3.png",
        included_items: ["전용 차량", "스냅 사진 촬영", "간식"],
        included_items_ko: ["전용 차량", "스냅 사진 촬영", "간식"],
        included_items_en: ["Private transport", "Snap photography", "Snacks"]
    },
    {
        title: "제주 투어",
        title_ko: "제주 자연 힐링 투어",
        title_en: "Jeju Nature Healing & Cafe Tour",
        description: "한라산의 웅장함과 성산일출봉의 절경, 그리고 바다가 보이는 예쁜 카페에서 여유를 즐기는 투어입니다.",
        description_ko: "한라산의 웅장함과 성산일출봉의 절경, 그리고 바다가 보이는 예쁜 카페에서 여유를 즐기는 투어입니다.",
        description_en: "Relax with the majestic views of Hallasan and Seongsan Ilchulbong, and enjoy leisure time at beautiful seaside cafes.",
        region: "제주",
        region_ko: "제주",
        region_en: "Jeju Island",
        duration: 8,
        price: 120000,
        max_guests: 4,
        photo: "/images/tours/tour_jeju_1.png,/images/tours/tour_jeju_2.png,/images/tours/tour_jeju_3.png",
        included_items: ["렌터카/드라이빙", "커피 1잔 제공", "미술관 입장"],
        included_items_ko: ["렌터카/드라이빙", "커피 1잔 제공", "미술관 입장"],
        included_items_en: ["Rental car/Driving guide", "One free coffee", "Museum admission"]
    },
    {
        title: "강원도 커피거리 투어",
        title_ko: "강릉 안묵 커피거리 & 바다 힐링 투어",
        title_en: "Gangneung Anmok Beach Coffee Tour",
        description: "동해 바다를 바라보며 커피 한 잔의 여유를 즐기고, 커피 로스팅 체험을 통해 깊은 맛을 느끼는 투어입니다.",
        description_ko: "동해 바다를 바라보며 커피 한 잔의 여유를 즐기고, 커피 로스팅 체험을 통해 깊은 맛을 느끼는 투어입니다.",
        description_en: "Enjoy coffee with a panoramic view of the East Sea and experience a professional roasting session in Gangneung.",
        region: "강원도 강릉",
        region_ko: "강원도 강릉",
        region_en: "Gangneung, Gangwondo",
        duration: 3,
        price: 45000,
        max_guests: 6,
        photo: "/images/tours/tour_gangwon_1.png,/images/tours/tour_gangwon_2.png,/images/tours/tour_gangwon_3.png",
        included_items: ["커피 로스팅 체험비", "바리스타 추천 원두", "디저트"],
        included_items_ko: ["커피 로스팅 체험비", "바리스타 추천 원두", "디저트"],
        included_items_en: ["Roasting experience fee", "Barista's choice beans", "Dessert"]
    }
];

async function seed() {
    console.log("Starting to seed 5 new tours...");
    
    // Find a guide to link these tours to (using Alex)
    const { data: guide } = await supabase.from('profiles').select('id').ilike('full_name', '%Alex%').limit(1).single();
    if (!guide) {
        console.error("Alex guide not found. Seeding failed.");
        return;
    }

    for (const t of tours) {
        const { error } = await supabase.from('tours').insert({
            ...t,
            guide_id: guide.id,
            is_active: true
        });

        if (error) {
            console.error(`Error inserting tour ${t.title}:`, error.message);
        } else {
            console.log(`Successfully added tour: ${t.title}`);
        }
    }
    
    console.log("Seeding complete.");
}

seed();
