import type { ChatMessage } from "@/lib/chatbot/types";
import {
  formatContextBlock,
  fallbackAnswer,
  retrieveForQuery,
  retrieveWithEmbedding,
  isSmallTalkOnly,
  type RetrievedContext,
} from "@/lib/chatbot/rag";
import { rewriteQueryForRetrieval } from "@/lib/chatbot/query-rewrite";
import { resolveChatModel } from "@/lib/gemini-model";
import { GoogleGenAI } from "@google/genai/node";

const MODEL = resolveChatModel();

/** 모델이 JSON/펜스/내부 마크업을 그대로보내는 경우 완화 */
function sanitizeAssistantOutput(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```\s*$/im;
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

/** 답변에 RAG/JSON 누출이 있으면 제거 (모델이 CONTEXT를 그대로 출력한 경우) */
function stripRagLeakage(text: string): string {
  const lines = text.split(/\r?\n/);
  const kept: string[] = [];
  for (const line of lines) {
    const s = line.trim();
    if (/^===\s*.+===?\s*$/.test(s)) continue;
    if (/^\[(FAQ|SITE|Site)\s*\d+\]/i.test(s)) continue;
    if (/^(Question|Answer|Q|A):\s*$/i.test(s)) continue;
    if (/^Source:\s*messages\//i.test(s)) continue;
    if (/^"?answer"?\s*:\s*"/i.test(s)) continue;
    if (/^\[시스템/.test(s) || /^\[System:/i.test(s)) continue;
    kept.push(line);
  }
  const out = kept.join("\n").trim();
  return out.length >= 8 ? out : text.trim();
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
          "REFERENCE에 FAQ가 여러 개 있으면 사용자 질문과 의미가 가장 잘 맞는 한 항목을 고르고, 그 항목의 답(A)에 나온 내용만 근거로 답하세요. 관계없는 FAQ는 사용하지 마세요.",
          "사용자가 한국어로 물었으면 반드시 한국어로 답하고, REFERENCE에 한국어 FAQ가 있으면 그 사실을 우선 반영하세요.",
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
    "Answer ONLY using the provided REFERENCE blocks in the user message. If REFERENCE is insufficient, say so briefly and suggest email support@guidematch.com or the site Support page.",
    "When an FAQ entry in REFERENCE clearly matches the user's question, treat that FAQ answer as authoritative: keep the same facts and policy meaning; do not add new rules.",
    "If several FAQ items appear in REFERENCE, pick the one whose meaning is closest to the user's question and base your reply on that item's answer; ignore unrelated FAQ lines.",
    "If an FAQ answer is in Korean but the user asked in English, summarize the same facts in clear English (no word-for-word dump of Korean labels).",
    "Do not invent policies, prices, or legal facts not present in REFERENCE.",
    "Keep answers concise (roughly 3–8 sentences unless the user asks for detail).",
    "No markdown headings; plain paragraphs or short bullets are fine.",
    "Your reply must be ONLY what you would show the customer — never repeat the REFERENCE block, never output JSON objects, YAML, or key-value dumps.",
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

/** 질문 정규화(유니코드 NFC) — 검색·매칭 일관성 */
function normalizedLastQuery(messages: ChatMessage[]): string {
  return lastUserText(messages).normalize("NFC").trim();
}

/**
 * 상위 1건 FAQ를 모델이 반드시 보도록 사용자 턴에 삽입 (한글 질문-답 불일치 완화).
 */
function primaryFaqAnchor(ctx: RetrievedContext, query: string, locale: string): string {
  const best = ctx.faqHits[0];
  if (!best) return "";
  const hangul = /[가-힣]/.test(query);
  const minScore = hangul ? 9 : 16;
  if (best.score < minScore) return "";

  if (locale === "en" && !hangul) {
    return (
      "\n\n---\n[System: The FAQ block below is the strongest match. Base your reply on Answer A; paraphrase in clear English.]\n" +
      `Q. ${best.row.question}\nA. ${best.row.answer}\n---\n`
    );
  }

  if (locale === "en" && hangul) {
    return (
      "\n\n---\n[System: Strongest-matching official FAQ (text may be Korean). Reflect every fact from A in natural Korean.]\n" +
      `Q. ${best.row.question}\nA. ${best.row.answer}\n---\n`
    );
  }

  return (
    "\n\n---\n[시스템 지시: 아래 1건이 질문과 가장 잘 맞는 공식 FAQ입니다. A의 사실·정책을 반드시 반영해 자연스러운 한국어 문장으로 답하세요. 다른 FAQ는 보조 참고만 하세요.]\n" +
    `Q. ${best.row.question}\nA. ${best.row.answer}\n---\n`
  );
}

export type GenerateResult = {
  answer: string;
  usedModel: boolean;
  context: RetrievedContext;
};

/** Gemini 없이 FAQ·사이트 RAG 폴백만 (레이트 리밋 등) */
export async function generateFaqOnlyReply(messages: ChatMessage[], locale: string): Promise<GenerateResult> {
  const query = normalizedLastQuery(messages);
  const ctx = retrieveForQuery(query, locale);
  return {
    answer: fallbackAnswer(query, ctx, locale),
    usedModel: false,
    context: ctx,
  };
}

export async function generateChatReply(messages: ChatMessage[], locale: string): Promise<GenerateResult> {
  const query = normalizedLastQuery(messages);
  const smallTalk = isSmallTalkOnly(query);
  const searchQuery = smallTalk ? query : await rewriteQueryForRetrieval(messages, locale);
  const ctx = smallTalk
    ? retrieveForQuery(query, locale)
    : await retrieveWithEmbedding(searchQuery, locale);
  const formatted = smallTalk ? "" : formatContextBlock(ctx, locale).trim();
  const faqAnchor = smallTalk ? "" : primaryFaqAnchor(ctx, query, locale);
  const contextBlock = smallTalk
    ? locale === "en"
      ? "(The user only greeted or sent a short thanks. Reply warmly in 2–4 sentences. Do NOT list FAQs or paste site copy.)"
      : "(짧은 인사·감사입니다. 2~4문장으로 짧게 답하세요. FAQ·사이트 문구를 나열하지 마세요.)"
    : formatted ||
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

  const system =
    buildSystemPrompt(locale) +
    (smallTalk
      ? locale === "en"
        ? "\nFor this turn: the user did not ask a product question yet — do not enumerate FAQ entries."
        : "\n이번 턴은 제품 질문이 아닙니다 — FAQ 항목을 나열하지 마세요."
      : "");
  const ai = new GoogleGenAI({ apiKey });

  const contents: { role: string; parts: { text: string }[] }[] = [];

  let history = messages.slice(-10);
  let start = 0;
  while (start < history.length && history[start].role === "assistant") start += 1;
  history = history.slice(start);

  let lastUserIdx = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") {
      lastUserIdx = i;
      break;
    }
  }

  const refLabel =
    locale === "en"
      ? "REFERENCE (internal — do not copy headings or brackets into your reply)"
      : "참고 자료(내부용 — 제목·대괄호 표기를 답변에 복사하지 마세요)";

  const userLabel = locale === "en" ? "Current user question" : "현재 사용자 질문";

  for (let i = 0; i < history.length; i++) {
    const m = history[i];
    if (m.role === "user") {
      const text =
        i === lastUserIdx
          ? `${refLabel}:\n${contextBlock}${faqAnchor}\n\n${userLabel}:\n${m.content}`
          : m.content;
      contents.push({ role: "user", parts: [{ text }] });
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
      config: {
        temperature: 0.38,
        systemInstruction: system,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const rawText = response.text ?? "";
    const text = stripRagLeakage(sanitizeAssistantOutput(rawText.trim()));
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
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[chatbot] Gemini error:", msg, e);
    try {
      const last = contents[contents.length - 1];
      const retryContents =
        last?.role === "user" && last.parts[0]?.text
          ? [
              ...contents.slice(0, -1),
              {
                role: "user" as const,
                parts: [{ text: `${system}\n\n${last.parts[0].text}` }],
              },
            ]
          : contents;
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: retryContents,
        config: { temperature: 0.38, thinkingConfig: { thinkingBudget: 0 } },
      });
      const rawText = response.text ?? "";
      const text = stripRagLeakage(sanitizeAssistantOutput(rawText.trim()));
      if (text) {
        return { answer: text, usedModel: true, context: ctx };
      }
    } catch (e2) {
      console.error("[chatbot] Gemini retry (inline system) failed:", e2);
    }
    return { answer: fallbackAnswer(query, ctx, locale), usedModel: false, context: ctx };
  }
}
