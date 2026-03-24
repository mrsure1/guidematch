import type { ChatMessage } from "@/lib/chatbot/types";
import { formatContextBlock, fallbackAnswer, retrieveForQuery, type RetrievedContext } from "@/lib/chatbot/rag";
import { GoogleGenAI } from "@google/genai/node";

const MODEL = process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.0-flash";

/** 모델이 JSON/펜스/내부 마크업을 그대로보내는 경우 완화 */
function sanitizeAssistantOutput(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```\s*$/i;
  const fm = t.match(fence);
  if (fm) {
    const inner = fm[1].trim();
    try {
      const o = JSON.parse(inner) as Record<string, unknown>;
      for (const key of ["answer", "response", "text", "message", "content"]) {
        const v = o[key];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
    } catch {
      /* use stripped fence content if it reads as prose */
      if (!/^\s*[{[]/.test(inner)) return inner;
    }
  }
  if (t.startsWith("{") && t.endsWith("}")) {
    try {
      const o = JSON.parse(t) as Record<string, unknown>;
      for (const key of ["answer", "response", "text", "message", "content"]) {
        const v = o[key];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
    } catch {
      /* keep t */
    }
  }
  return t;
}

function buildSystemPrompt(locale: string): string {
  const lang =
    locale === "en"
      ? "When the user writes in English, reply in natural conversational English only. If they write in Korean, reply in Korean. Do not mix languages in one reply unless translating a short term."
      : "사용자가 한국어로 물으면 한국어로, 영어로 물으면 영어로 자연스럽게 답하세요.";

  const voice =
    locale === "en"
      ? [
          "Write like a helpful human support agent in complete sentences—not a pasted FAQ database row.",
          "Do not dump the FAQ question/answer text verbatim; rephrase in your own words while keeping every factual claim aligned with CONTEXT.",
          "Start with a short direct answer, then add any useful detail from CONTEXT in a friendly tone.",
        ]
      : [
          "고객센터 상담원이 말하듯 완전한 문장으로 답하세요. FAQ 원문을 그대로 복붙하지 마세요.",
          "CONTEXT의 사실·정책은 그대로 유지하되, 표현은 바꿔 자연스럽게 풀어 설명하세요.",
          "먼저 질문에 직접 답한 뒤, 필요하면 CONTEXT에서 덧붙일 안내를 이어가세요.",
        ];

  const formatRules =
    locale === "en"
      ? [
          "Output plain conversational text only: no JSON, no YAML, no XML, no code blocks, no keys like \"answer\":.",
          "Do not repeat CONTEXT section titles (lines starting with ===), bracket labels like [FAQ 1], or internal file paths unless the user explicitly asks.",
        ]
      : [
          "JSON·코드펜스·키-값 형태로 답하지 마세요. 자연스러운 문장만 사용하세요.",
          "CONTEXT의 === 제목이나 [FAQ 1] 같은 표기를 그대로 복사해 출력하지 마세요.",
        ];

  return [
    "You are GuideMatch (Korea travel guide matching) customer assistant.",
    "Answer ONLY using the provided CONTEXT blocks. If CONTEXT is insufficient, say so briefly and suggest email support@guidematch.com or the site Support page.",
    "When an FAQ entry in CONTEXT clearly matches the user's question, treat that FAQ answer as authoritative: keep the same facts and policy meaning; do not add new rules.",
    "If an FAQ answer is in Korean but the user asked in English, summarize the same facts in clear English (no word-for-word dump of Korean labels).",
    "Do not invent policies, prices, or legal facts not present in CONTEXT.",
    "Keep answers concise (roughly 3–8 sentences unless the user asks for detail).",
    "No markdown headings; plain paragraphs or short bullets are fine.",
    ...voice,
    ...formatRules,
    lang,
  ].join("\n");
}

function lastUserText(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content.trim();
  }
  return "";
}

export type GenerateResult = {
  answer: string;
  usedModel: boolean;
  context: RetrievedContext;
};

/** Gemini 없이 FAQ·사이트 RAG 폴백만 (레이트 리밋 등) */
export async function generateFaqOnlyReply(messages: ChatMessage[], locale: string): Promise<GenerateResult> {
  const query = lastUserText(messages);
  const ctx = retrieveForQuery(query, locale);
  return {
    answer: fallbackAnswer(query, ctx, locale),
    usedModel: false,
    context: ctx,
  };
}

export async function generateChatReply(messages: ChatMessage[], locale: string): Promise<GenerateResult> {
  const query = lastUserText(messages);
  const ctx = retrieveForQuery(query, locale);
  const formatted = formatContextBlock(ctx, locale).trim();
  const contextBlock =
    formatted ||
    (locale === "en"
      ? "(No close FAQ or site excerpt matched this question. Do not guess; give a short reply and suggest support@guidematch.com or the Support page.)"
      : "(이번 질문과 직접 일치하는 FAQ·사이트 발췌를 찾지 못했습니다. 추측하지 말고, 일반적인 안내와 고객센터 문의를 권장하세요.)");

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      answer: fallbackAnswer(query, ctx, locale),
      usedModel: false,
      context: ctx,
    };
  }

  const system = buildSystemPrompt(locale);
  const ai = new GoogleGenAI({ apiKey });

  const contents: { role: string; parts: { text: string }[] }[] = [];

  let history = messages.slice(-10);
  let start = 0;
  while (start < history.length && history[start].role === "assistant") start += 1;
  history = history.slice(start);

  let firstUser = true;
  const userLabel = locale === "en" ? "User message" : "사용자 메시지";
  for (const m of history) {
    if (m.role === "user") {
      const text = firstUser
        ? `${system}\n\nCONTEXT:\n${contextBlock}\n\n${userLabel}:\n${m.content}`
        : m.content;
      contents.push({ role: "user", parts: [{ text }] });
      firstUser = false;
    } else {
      contents.push({ role: "model", parts: [{ text: m.content }] });
    }
  }

  if (contents.length === 0) {
    return { answer: fallbackAnswer(query, ctx, locale), usedModel: false, context: ctx };
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { temperature: 0.38 },
    });
    const rawText = response.text ?? "";
    const text = sanitizeAssistantOutput(rawText.trim());
    if (!text) {
      const c0 = (response as { candidates?: Array<{ finishReason?: string }> }).candidates?.[0];
      const pf = (response as { promptFeedback?: { blockReason?: string } }).promptFeedback;
      console.warn("[chatbot] Gemini empty text", {
        model: MODEL,
        finishReason: c0?.finishReason,
        blockReason: pf?.blockReason,
      });
      return { answer: fallbackAnswer(query, ctx, locale), usedModel: false, context: ctx };
    }
    return { answer: text, usedModel: true, context: ctx };
  } catch (e) {
    console.error("[chatbot] Gemini error:", e);
    return { answer: fallbackAnswer(query, ctx, locale), usedModel: false, context: ctx };
  }
}
