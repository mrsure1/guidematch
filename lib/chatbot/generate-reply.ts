import type { ChatMessage } from "@/lib/chatbot/types";
import { formatContextBlock, fallbackAnswer, retrieveForQuery, type RetrievedContext } from "@/lib/chatbot/rag";

const MODEL = process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.0-flash";

function buildSystemPrompt(locale: string): string {
  const lang =
    locale === "en"
      ? "Respond in natural English when the user writes in English; use Korean when they write in Korean."
      : "사용자가 한국어로 물으면 한국어로, 영어로 물으면 영어로 자연스럽게 답하세요.";

  return [
    "You are GuideMatch (Korea travel guide matching) customer assistant.",
    "Answer ONLY using the provided CONTEXT blocks. If CONTEXT is insufficient, say so briefly and suggest email support@guidematch.com or the site Support page.",
    "When an FAQ entry in CONTEXT clearly matches the user's question, treat that FAQ answer as authoritative: stay consistent with it; prefer quoting or light paraphrase over inventing new policy details.",
    "Do not invent policies, prices, or legal facts not present in CONTEXT.",
    "Keep answers concise (roughly 3–8 sentences unless the user asks for detail).",
    "No markdown headings; plain paragraphs or short bullets are fine.",
    lang,
  ].join("\n");
}

async function loadGenAi() {
  try {
    return await import("@google/genai");
  } catch {
    return null;
  }
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
  const formatted = formatContextBlock(ctx).trim();
  const contextBlock =
    formatted ||
    "(이번 질문과 직접 일치하는 FAQ·사이트 발췌를 찾지 못했습니다. 추측하지 말고, 일반적인 안내와 고객센터 문의를 권장하세요.)";

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      answer: fallbackAnswer(query, ctx, locale),
      usedModel: false,
      context: ctx,
    };
  }

  const faqTop = ctx.faqHits[0];
  const faqSecond = ctx.faqHits[1];
  const directMin = Math.max(1, parseInt(process.env.CHATBOT_FAQ_DIRECT_MIN_SCORE || "24", 10) || 24);
  const directGap = Math.max(0, parseInt(process.env.CHATBOT_FAQ_DIRECT_GAP || "5", 10) || 5);
  if (
    faqTop &&
    faqTop.score >= directMin &&
    (!faqSecond || faqTop.score >= faqSecond.score + directGap)
  ) {
    return {
      answer: faqTop.row.answer,
      usedModel: false,
      context: ctx,
    };
  }

  const system = buildSystemPrompt(locale);
  const sdk = await loadGenAi();
  if (!sdk?.GoogleGenAI) {
    return { answer: fallbackAnswer(query, ctx, locale), usedModel: false, context: ctx };
  }

  const ai = new sdk.GoogleGenAI({ apiKey });

  const contents: { role: string; parts: { text: string }[] }[] = [];

  let history = messages.slice(-10);
  let start = 0;
  while (start < history.length && history[start].role === "assistant") start += 1;
  history = history.slice(start);

  let firstUser = true;
  for (const m of history) {
    if (m.role === "user") {
      const text = firstUser
        ? `${system}\n\nCONTEXT:\n${contextBlock}\n\n사용자 메시지:\n${m.content}`
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
      config: { temperature: 0.22 },
    });
    const text = response.text?.trim();
    if (!text) {
      return { answer: fallbackAnswer(query, ctx, locale), usedModel: false, context: ctx };
    }
    return { answer: text, usedModel: true, context: ctx };
  } catch (e) {
    console.error("[chatbot] Gemini error:", e);
    return { answer: fallbackAnswer(query, ctx, locale), usedModel: false, context: ctx };
  }
}
