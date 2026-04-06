/**
 * 오케스트레이터-워커 패턴의 5대 전문 워커
 *
 * 1. QueryUnderstandingWorker  – 질문 의도 분석 및 검색어 최적화
 * 2. RetrievalWorker           – FAQ + 사이트 코퍼스 하이브리드 검색
 * 3. RerankWorker              – 관련성 기반 재정렬 및 필터링
 * 4. AnswerWorker              – LLM 기반 근거 답변 생성
 * 5. EvalLoggingWorker         – 답변 품질 자가 평가 및 로그 기록
 */

import type { ChatMessage, FaqRow, SiteChunk } from "@/lib/chatbot/types";
import {
  retrieveForQuery,
  formatContextBlock,
  fallbackAnswer,
  isSmallTalkOnly,
  smallTalkFallback,
  type RetrievedContext,
} from "@/lib/chatbot/rag";
import { GoogleGenAI } from "@google/genai/node";

/* ────────────────── 공통 타입 ────────────────── */

/** 워커들이 공유하는 파이프라인 상태 */
export type PipelineState = {
  // 입력
  messages: ChatMessage[];
  locale: string;
  query: string;

  // Step 1: Query Understanding
  intent: string;
  isSmallTalk: boolean;
  searchQuery: string;

  // Step 2: Retrieval
  context: RetrievedContext;

  // Step 3: Rerank
  rerankedFaq: { row: FaqRow; score: number }[];
  rerankedSite: { chunk: SiteChunk; score: number }[];

  // Step 4: Answer
  answer: string;
  usedModel: boolean;
  sources: string[];

  // Step 5: Eval
  evalScore: number;
  evalReason: string;

  // 메타
  startTime: number;
  errors: string[];
};

/** 빈 초기 상태 생성 */
export function createInitialState(
  messages: ChatMessage[],
  locale: string,
): PipelineState {
  const query = lastUserText(messages).normalize("NFC").trim();
  return {
    messages,
    locale,
    query,
    intent: "unknown",
    isSmallTalk: false,
    searchQuery: query,
    context: { faqHits: [], siteHits: [] },
    rerankedFaq: [],
    rerankedSite: [],
    answer: "",
    usedModel: false,
    sources: [],
    evalScore: 0,
    evalReason: "",
    startTime: Date.now(),
    errors: [],
  };
}

function lastUserText(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content.trim();
  }
  return "";
}

/* ─────────── Worker 1: 질문 이해(Query Understanding) ─────────── */

export function runQueryUnderstanding(state: PipelineState): PipelineState {
  const q = state.query;

  // 스몰톡 판별
  state.isSmallTalk = isSmallTalkOnly(q);
  if (state.isSmallTalk) {
    state.intent = "small_talk";
    return state;
  }

  // 의도 분류 (키워드 기반 – LLM 호출 없이 서버리스 제약 준수)
  const h = q.replace(/[^가-힣]/g, "");
  if (/(환불|환급|취소)/.test(h)) state.intent = "refund";
  else if (/(결제|카드|계좌|페이)/.test(h)) state.intent = "payment";
  else if (/(예약|신청|일정)/.test(h)) state.intent = "booking";
  else if (/(가이드|매칭|추천|검색)/.test(h)) state.intent = "guide_matching";
  else if (/(회원|가입|로그인|비밀번호|탈퇴)/.test(h)) state.intent = "account";
  else if (/(정책|수수료|커미션|약관)/.test(h)) state.intent = "policy";
  else state.intent = "general";

  // 검색어 최적화 – 원본 유지 (rag.ts의 expandQueryForRetrieval이 담당)
  state.searchQuery = q;
  return state;
}

/* ─────────── Worker 2: 검색(Retrieval) ─────────── */

export function runRetrieval(state: PipelineState): PipelineState {
  if (state.isSmallTalk) return state;

  try {
    state.context = retrieveForQuery(state.searchQuery, state.locale);
  } catch (err) {
    state.errors.push(`[Retrieval] ${String(err)}`);
    state.context = { faqHits: [], siteHits: [] };
  }
  return state;
}

/* ─────────── Worker 3: 재정렬(Rerank) ─────────── */

export function runRerank(state: PipelineState): PipelineState {
  if (state.isSmallTalk) return state;

  const { faqHits, siteHits } = state.context;

  // 의도 기반 도메인 부스팅
  const intentKeywords: Record<string, RegExp> = {
    refund: /(환불|환급|취소|refund)/i,
    payment: /(결제|카드|계좌|payment)/i,
    booking: /(예약|신청|booking)/i,
    guide_matching: /(가이드|매칭|추천|guide|match)/i,
    account: /(회원|가입|로그인|비밀번호|account)/i,
    policy: /(정책|수수료|커미션|약관|policy)/i,
  };
  const intentRe = intentKeywords[state.intent];

  // FAQ 재정렬: 의도와 일치하면 부스트, 아니면 소폭 감소
  state.rerankedFaq = faqHits
    .map((h) => {
      let boosted = h.score;
      if (intentRe) {
        const blob = `${h.row.question} ${h.row.answer}`;
        boosted *= intentRe.test(blob) ? 1.3 : 0.85;
      }
      return { ...h, score: boosted };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // 사이트 코퍼스 재정렬
  state.rerankedSite = siteHits
    .map((h) => {
      let boosted = h.score;
      if (intentRe && intentRe.test(h.chunk.text)) boosted *= 1.2;
      return { ...h, score: boosted };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // sources 목록 생성
  state.sources = [
    ...state.rerankedFaq.map(() => "FAQ"),
    ...state.rerankedSite.map((h) => h.chunk.source),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return state;
}

/* ─────────── Worker 4: 답변 생성(Answer) ─────────── */

/** 모델이 JSON/펜스 등을 출력한 경우 정리 */
function sanitize(raw: string): string {
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

/** RAG 누출 제거 */
function stripLeakage(text: string): string {
  const lines = text.split(/\r?\n/);
  const kept: string[] = [];
  for (const line of lines) {
    const s = line.trim();
    if (/^===\s*.+===?\s*$/.test(s)) continue;
    if (/^\[(FAQ|SITE|Site)\s*\d+\]/i.test(s)) continue;
    if (/^(Question|Answer|Q|A):\s*$/i.test(s)) continue;
    if (/^Source:\s*messages\//i.test(s)) continue;
    if (/^\[시스템/.test(s) || /^\[System:/i.test(s)) continue;
    kept.push(line);
  }
  const out = kept.join("\n").trim();
  return out.length >= 8 ? out : text.trim();
}

function buildSystemPrompt(locale: string): string {
  const lang =
    locale === "en"
      ? "When the user writes in English, reply in English. If they write in Korean, reply in Korean."
      : "사용자가 한국어로 물으면 한국어로, 영어로 물으면 영어로 자연스럽게 답하세요.";

  return [
    "You are GuideMatch (Korea travel guide matching) customer assistant.",
    "Answer ONLY using the provided REFERENCE blocks. If insufficient, suggest support@guidematch.com.",
    "Do not invent policies, prices, or legal facts not present in REFERENCE.",
    "Keep answers concise (3–8 sentences). No markdown headings.",
    "Output plain conversational text only: no JSON, no YAML, no code blocks.",
    locale === "ko"
      ? "FAQ 원문을 그대로 복붙하지 마세요. 자연스러운 한국어 문장으로 답하세요."
      : "Do not dump FAQ text verbatim; rephrase in your own words.",
    lang,
  ].join("\n");
}

export async function runAnswer(state: PipelineState): Promise<PipelineState> {
  // 스몰톡 처리
  if (state.isSmallTalk) {
    state.answer = smallTalkFallback(state.locale);
    state.usedModel = false;
    return state;
  }

  // 재정렬된 결과로 컨텍스트 블록 재구성
  const rerankedCtx: RetrievedContext = {
    faqHits: state.rerankedFaq,
    siteHits: state.rerankedSite,
  };
  const contextBlock = formatContextBlock(rerankedCtx, state.locale).trim();

  // Gemini API 키 확인
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    state.answer = fallbackAnswer(state.query, rerankedCtx, state.locale);
    state.usedModel = false;
    return state;
  }

  // LLM 호출
  const system = buildSystemPrompt(state.locale);
  const ai = new GoogleGenAI({ apiKey });
  const MODEL = process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.0-flash";

  // 대화 내역 구성 (최근 10턴)
  let history = state.messages.slice(-10);
  let start = 0;
  while (start < history.length && history[start].role === "assistant") start++;
  history = history.slice(start);

  const refLabel =
    state.locale === "en"
      ? "REFERENCE (internal — do not copy into reply)"
      : "참고 자료(내부용 — 답변에 복사하지 마세요)";
  const userLabel = state.locale === "en" ? "Current user question" : "현재 사용자 질문";

  let lastUserIdx = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") { lastUserIdx = i; break; }
  }

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (let i = 0; i < history.length; i++) {
    const m = history[i];
    if (m.role === "user") {
      const text =
        i === lastUserIdx
          ? `${refLabel}:\n${contextBlock}\n\n${userLabel}:\n${m.content}`
          : m.content;
      contents.push({ role: "user", parts: [{ text }] });
    } else {
      contents.push({ role: "model", parts: [{ text: m.content }] });
    }
  }

  if (contents.length === 0) {
    state.answer = fallbackAnswer(state.query, rerankedCtx, state.locale);
    state.usedModel = false;
    return state;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { temperature: 0.38, systemInstruction: system },
    });
    const raw = response.text ?? "";
    const cleaned = stripLeakage(sanitize(raw));
    if (cleaned) {
      state.answer = cleaned;
      state.usedModel = true;
    } else {
      state.answer = fallbackAnswer(state.query, rerankedCtx, state.locale);
      state.usedModel = false;
    }
  } catch (err) {
    console.error("[AnswerWorker] Gemini error:", err);
    state.errors.push(`[Answer] ${String(err)}`);
    state.answer = fallbackAnswer(state.query, rerankedCtx, state.locale);
    state.usedModel = false;
  }

  return state;
}

/* ─────────── Worker 5: 평가 및 로깅(Eval & Logging) ─────────── */

export function runEvalLogging(state: PipelineState): PipelineState {
  const elapsed = Date.now() - state.startTime;

  // 간단한 규칙 기반 평가 (Vercel 서버리스에서 별도 LLM 호출 최소화)
  let score = 3; // 기본 3점
  if (state.usedModel) score += 1;
  if (state.rerankedFaq.length > 0 && state.rerankedFaq[0].score > 15) score += 1;
  if (state.isSmallTalk) score = 5; // 인사 → 항상 적절
  if (state.errors.length > 0) score = Math.max(1, score - 1);
  state.evalScore = Math.min(5, score);

  state.evalReason = state.usedModel
    ? `LLM 기반 답변 생성 완료 (${elapsed}ms)`
    : `규칙 기반 폴백 답변 사용 (${elapsed}ms)`;

  // 서버 로그 출력 (Vercel 로그에서 확인 가능)
  console.log(
    JSON.stringify({
      _type: "chatbot_log",
      timestamp: new Date().toISOString(),
      query: state.query,
      intent: state.intent,
      usedModel: state.usedModel,
      sources: state.sources,
      evalScore: state.evalScore,
      elapsed,
      errors: state.errors,
    }),
  );

  return state;
}
