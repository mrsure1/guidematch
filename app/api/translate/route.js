import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
    } else {
      properties[key] = { type: "string" };
    }
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function buildPrompt(fields, strict = false) {
  return [
    strict
      ? "You are a strict Korean-to-English translator."
      : "You are a professional Korean-to-English translator for a tour marketplace.",
    strict
      ? "The previous output was not translated enough."
      : "Translate every provided field into natural, concise English.",
    "Rules:",
    "1. Preserve meaning and marketing tone.",
    "2. Do not add explanations, prefixes, or markdown.",
    "3. Keep arrays as arrays and translate each item individually.",
    "4. Keep proper nouns, brand names, and addresses accurate.",
    "5. Return only JSON that matches the requested schema.",
    "6. **CRITICAL: Preserve all original newlines (\\n) and document structure exactly.** Do not merge paragraphs.",
    strict
      ? "7. Do not copy Korean characters into the final JSON."
      : "7. If the source text is Korean, the result must be English, not copied Korean.",
    "",
    "Source JSON:",
    JSON.stringify(fields, null, 2),
  ].join("\n");
}

function hasHangul(value) {
  return typeof value === "string" && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value);
}

function looksUntranslated(fields, translated) {
  for (const [key, sourceValue] of Object.entries(fields)) {
    const outputValue = translated?.[key];

    if (typeof sourceValue === "string" && typeof outputValue === "string") {
      if (hasHangul(sourceValue) && outputValue.trim() === sourceValue.trim()) {
        return true;
      }

      if (hasHangul(sourceValue) && !/[A-Za-z]/.test(outputValue)) {
        return true;
      }
    }

    if (Array.isArray(sourceValue) && Array.isArray(outputValue)) {
      const sourceHasHangul = sourceValue.some((item) => hasHangul(String(item)));
      const outputLooksKorean = outputValue.every((item) => {
        const text = String(item);
        return hasHangul(text) && !/[A-Za-z]/.test(text);
      });

      if (sourceHasHangul && outputLooksKorean) {
        return true;
      }
    }
  }

  return false;
}

async function loadGoogleGenAI() {
  try {
    return await import("@google/genai");
  } catch {
    return null;
  }
}

async function translateWithSdk(apiKey, fields, responseSchema, strict = false) {
  const sdk = await loadGoogleGenAI();
  if (!sdk?.GoogleGenAI) {
    throw new Error("Google GenAI SDK를 불러오지 못했습니다.");
  }

  const ai = new sdk.GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: buildPrompt(fields, strict),
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  return JSON.parse(text);
}

async function translateWithRest(apiKey, fields, responseSchema, strict = false) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(fields, strict) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0,
        },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Gemini REST 요청이 실패했습니다.");
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) {
    throw new Error("Gemini REST 응답이 비어 있습니다.");
  }

  return JSON.parse(text);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const fields = body?.fields;

    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      return NextResponse.json(
        { error: "fields 객체가 필요합니다." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다." },
        { status: 500 },
      );
    }

    const responseSchema = buildResponseSchema(fields);

    let translated;
    try {
      translated = await translateWithSdk(apiKey, fields, responseSchema, false);
    } catch (sdkError) {
      console.warn("[translate] SDK 실패, REST fallback 사용:", sdkError);
      translated = await translateWithRest(apiKey, fields, responseSchema, false);
    }

    if (looksUntranslated(fields, translated)) {
      console.warn("[translate] 번역 결과가 한국어 원문처럼 보여서 strict 재시도합니다.");
      try {
        translated = await translateWithSdk(apiKey, fields, responseSchema, true);
      } catch {
        translated = await translateWithRest(apiKey, fields, responseSchema, true);
      }
    }

    return NextResponse.json({ translations: translated });
  } catch (error) {
    console.error("[translate] Gemini translation failed:", error);
    return NextResponse.json(
      {
        error: "AI 번역 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
