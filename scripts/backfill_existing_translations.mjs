import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl) {
  console.error("NEXT_PUBLIC_SUPABASE_URL가 없습니다.");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  process.exit(1);
}

if (!geminiApiKey) {
  console.error("GEMINI_API_KEY가 없습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

function buildResponseSchema(fields) {
  const properties = {};
  const required = [];

  for (const [key, value] of Object.entries(fields)) {
    required.push(key);

    if (Array.isArray(value)) {
      properties[key] = {
        type: "array",
        items: { type: "string" },
      };
      continue;
    }

    properties[key] = { type: "string" };
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function buildPrompt(fields) {
  return [
    "You are a professional Korean-to-English translator for a tour marketplace.",
    "Translate every field into natural, concise English.",
    "Rules:",
    "1. Preserve meaning and marketing tone.",
    "2. Do not add explanations, prefixes, or markdown.",
    "3. Keep arrays as arrays and translate each item individually.",
    "4. Keep proper nouns, brand names, and addresses accurate.",
    "5. Return only JSON that matches the requested schema.",
    "",
    "Source JSON:",
    JSON.stringify(fields, null, 2),
  ].join("\n");
}

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

async function translateFields(fields) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: buildPrompt(fields),
    config: {
      responseMimeType: "application/json",
      responseSchema: buildResponseSchema(fields),
      temperature: 0.2,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  return JSON.parse(text);
}

async function withRetry(task, label) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      console.warn(`[${label}] ${attempt}차 시도 실패: ${error.message}`);

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
      }
    }
  }

  throw lastError;
}

async function backfillGuideBios() {
  const { data, error } = await supabase
    .from("guides_detail")
    .select("id, bio, bio_i18n")
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "42703") {
      console.warn(
        "guides_detail.bio_i18n 컬럼이 아직 없습니다. 가이드 소개글 백필은 lib/db/add_guide_bio_i18n.sql 실행 후 다시 가능합니다.",
      );
      return { updated: 0, skipped: 0, blocked: true };
    }

    throw error;
  }

  let updated = 0;
  let skipped = 0;

  for (const guide of data ?? []) {
    const sourceKo = toText(guide.bio_i18n?.ko) || toText(guide.bio);
    const currentEn = toText(guide.bio_i18n?.en);

    if (!sourceKo || currentEn) {
      skipped += 1;
      continue;
    }

    const translation = await withRetry(() => translateFields({ bio: sourceKo }), `guide:${guide.id}`);
    const bioEn = toText(translation.bio);

    if (!bioEn) {
      throw new Error(`가이드 ${guide.id} 번역 결과가 비어 있습니다.`);
    }

    const nextBioI18n = {
      ...(guide.bio_i18n ?? {}),
      ko: sourceKo,
      en: bioEn,
    };

    const { error: updateError } = await supabase
      .from("guides_detail")
      .update({ bio_i18n: nextBioI18n })
      .eq("id", guide.id);

    if (updateError) {
      throw updateError;
    }

    updated += 1;
    console.log(`가이드 소개글 번역 완료: ${guide.id}`);
  }

  console.log(`가이드 소개글 처리 완료 - 업데이트 ${updated}건, 건너뜀 ${skipped}건`);
  return { updated, skipped, blocked: false };
}

async function backfillTours() {
  const { data, error } = await supabase
    .from("tours")
    .select(
      "id, title, description, region, included_items, title_ko, title_en, description_ko, description_en, region_ko, region_en, included_items_ko, included_items_en",
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  let updated = 0;
  let skipped = 0;

  for (const tour of data ?? []) {
    const titleKo = toText(tour.title_ko) || toText(tour.title);
    const descriptionKo = toText(tour.description_ko) || toText(tour.description);
    const regionKo = toText(tour.region_ko) || toText(tour.region);
    const includedItemsKo =
      toStringArray(tour.included_items_ko).length > 0
        ? toStringArray(tour.included_items_ko)
        : toStringArray(tour.included_items);

    const needsTranslation = {
      ...(toText(tour.title_en) ? {} : titleKo ? { title: titleKo } : {}),
      ...(toText(tour.description_en) ? {} : descriptionKo ? { description: descriptionKo } : {}),
      ...(toText(tour.region_en) ? {} : regionKo ? { region: regionKo } : {}),
      ...((toStringArray(tour.included_items_en).length > 0 || includedItemsKo.length === 0)
        ? {}
        : { includedItems: includedItemsKo }),
    };

    const updatePayload = {};

    // 한국어 원문은 *_ko 컬럼에 보존합니다.
    if (titleKo && !toText(tour.title_ko)) updatePayload.title_ko = titleKo;
    if (descriptionKo && !toText(tour.description_ko)) updatePayload.description_ko = descriptionKo;
    if (regionKo && !toText(tour.region_ko)) updatePayload.region_ko = regionKo;
    if (includedItemsKo.length > 0 && toStringArray(tour.included_items_ko).length === 0) {
      updatePayload.included_items_ko = includedItemsKo;
    }

    if (Object.keys(needsTranslation).length === 0) {
      skipped += 1;
      continue;
    }

    const translation = await withRetry(
      () => translateFields(needsTranslation),
      `tour:${tour.id}`,
    );

    if (needsTranslation.title) {
      const titleEn = toText(translation.title);
      if (!titleEn) {
        throw new Error(`투어 ${tour.id} 제목 번역 결과가 비어 있습니다.`);
      }
      updatePayload.title_en = titleEn;
    }

    if (needsTranslation.description) {
      const descriptionEn = toText(translation.description);
      if (!descriptionEn) {
        throw new Error(`투어 ${tour.id} 소개글 번역 결과가 비어 있습니다.`);
      }
      updatePayload.description_en = descriptionEn;
    }

    if (needsTranslation.region) {
      const regionEn = toText(translation.region);
      if (!regionEn) {
        throw new Error(`투어 ${tour.id} 지역 번역 결과가 비어 있습니다.`);
      }
      updatePayload.region_en = regionEn;
    }

    if (needsTranslation.includedItems) {
      const includedItemsEn = toStringArray(translation.includedItems);
      if (includedItemsEn.length === 0) {
        throw new Error(`투어 ${tour.id} 포함 항목 번역 결과가 비어 있습니다.`);
      }
      updatePayload.included_items_en = includedItemsEn;
    }

    const { error: updateError } = await supabase.from("tours").update(updatePayload).eq("id", tour.id);

    if (updateError) {
      throw updateError;
    }

    updated += 1;
    console.log(`투어 번역 완료: ${tour.id}`);
  }

  console.log(`투어 처리 완료 - 업데이트 ${updated}건, 건너뜀 ${skipped}건`);
  return { updated, skipped, blocked: false };
}

async function main() {
  console.log("기존 가이드 소개글과 투어 소개글을 영어로 백필합니다.");

  const guideResult = await backfillGuideBios();
  const tourResult = await backfillTours();

  if (guideResult.blocked) {
    console.log("가이드 소개글은 lib/db/add_guide_bio_i18n.sql 실행 후 다시 실행하면 됩니다.");
  }

  console.log("백필 작업이 완료되었습니다.");
  console.log(`가이드: 업데이트 ${guideResult.updated}건, 건너뜀 ${guideResult.skipped}건`);
  console.log(`투어: 업데이트 ${tourResult.updated}건, 건너뜀 ${tourResult.skipped}건`);
}

main().catch((error) => {
  console.error("백필 작업 실패:", error);
  process.exit(1);
});
