import { loadFaqRows } from "@/lib/chatbot/faq";
import { loadSiteCorpus } from "@/lib/chatbot/corpus";
import {
  scoreText,
  scoreFaqRelevance,
  scoreFaqLexicalOnly,
  expandQueryForRetrieval,
} from "@/lib/chatbot/score";
import {
  cosine,
  embedQuery,
  faqEmbedText,
  getDocEmbedding,
  normalizeForKey,
} from "@/lib/chatbot/embeddings";
import type { FaqRow, SiteChunk } from "@/lib/chatbot/types";

/**
 * 시맨틱(임베딩) 점수를 어휘 점수에 더하는 가중치. 어휘 점수와 같은 스케일(0~수십)에
 * 맞춰, 어휘 겹침이 없어도 의미가 맞으면 상위로 올라오도록 한다. 임베딩이 없으면 0.
 */
// 골든셋(scripts/eval-chatbot.ts)으로 튜닝한 값. 임베딩이 어휘보다 정확도가 높아
// 시맨틱에 큰 가중치를 주되, 고유명사·정확매칭 변별을 위해 어휘도 의미 있게 남긴다.
const SEM_BOOST_FAQ = Number(process.env.CHATBOT_SEM_BOOST_FAQ) || 120;
const SEM_BOOST_SITE = Number(process.env.CHATBOT_SEM_BOOST_SITE) || 50;
/** 코사인 베이스라인 제거: FLOOR 이하는 0, [FLOOR,1]을 [0,1]로 재척도. */
const SEM_FLOOR = Number(process.env.CHATBOT_SEM_FLOOR) || 0.6;

/** 질의 임베딩 vs 문서 텍스트의 시맨틱 점수(0~weight). 임베딩 없으면 0. */
function semBoost(
  queryEmbedding: Float32Array | null | undefined,
  docText: string,
  weight: number,
): number {
  if (!queryEmbedding) return 0;
  const doc = getDocEmbedding(docText);
  if (!doc) return 0;
  const c = cosine(queryEmbedding, doc);
  const s = (c - SEM_FLOOR) / (1 - SEM_FLOOR);
  return s > 0 ? s * weight : 0;
}

function hasHangul(s: string): boolean {
  return /[가-힣]/.test(s);
}

/** 인사·짧은 감사 등 — FAQ 불릿 폴백을 쓰면 안 됨 */
export function isSmallTalkOnly(query: string): boolean {
  const t = query.trim().replace(/[`"'“”‘’]+/g, "");
  if (!t) return true;
  if (t.length > 48) return false;
  const lower = t.toLowerCase();
  return (
    /^(hi|hello|hey|hiya|yo|sup|good\s+(morning|afternoon|evening)|howdy|thanks?|thank\s+you|thx|안녕(?:하세요)?|반가(?:워요|습니다)|고마워(?:요)?|감사(?:합니다)?)[\s!.?,~…]*$/i.test(
      lower,
    ) || /^hi[\s,]+there[\s!.?,]*$/i.test(lower)
  );
}

export function smallTalkFallback(locale: string): string {
  return locale === "en"
    ? "Hi! I’m the GuideMatch assistant. Ask me about guide matching, bookings, payments, or cancellations — I’ll answer from our FAQ and site info."
    : "안녕하세요! 가이드 매칭·예약·결제·취소 등 궁금한 점을 물어보시면 FAQ와 사이트 안내를 바탕으로 답해 드립니다.";
}

export type RetrievedContext = {
  faqHits: { row: FaqRow; score: number }[];
  siteHits: { chunk: SiteChunk; score: number }[];
};

const TOP_FAQ = 8;
const TOP_SITE = 8;

/**
 * UI 로케일과 질문 언어가 다를 때(예: /en 에서 한국어 질문) 올바른 FAQ CSV를 쓴다.
 */
function selectFaqCorpusForQuery(query: string, uiLocale: string): FaqRow[] {
  const q = query.trim();
  const hasHangul = /[가-힣]/.test(q);
  const hasEnoughLatin = /[a-zA-Z]{4,}/.test(q);

  if (uiLocale === "en" && hasHangul) {
    return loadFaqRows("ko");
  }
  if (uiLocale === "ko" && hasEnoughLatin && !hasHangul) {
    return loadFaqRows("en");
  }
  return loadFaqRows(uiLocale);
}

function rankFaqByLexical(query: string, faqs: FaqRow[]) {
  return faqs
    .map((row) => ({ row, score: scoreFaqLexicalOnly(query, row.question, row.answer) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * 질의를 임베딩한 뒤 하이브리드(어휘+시맨틱) 검색을 수행한다.
 * 키·임베딩이 없으면 queryEmbedding이 null이 되어 어휘 검색만으로 동작한다.
 */
export async function retrieveWithEmbedding(
  query: string,
  locale: string,
): Promise<RetrievedContext> {
  const queryEmbedding = await embedQuery(query);
  return retrieveForQuery(query, locale, queryEmbedding);
}

export function retrieveForQuery(
  query: string,
  locale: string,
  queryEmbedding?: Float32Array | null,
): RetrievedContext {
  const q = query.normalize("NFC").trim();
  const faqs = selectFaqCorpusForQuery(q, locale);
  const corpus = loadSiteCorpus();

  const combined = faqs.map((row) => {
    const gated = scoreFaqRelevance(q, row.question, row.answer);
    const lexical = scoreFaqLexicalOnly(q, row.question, row.answer);
    const lex = Math.max(gated, lexical * 0.94);
    const sem = semBoost(queryEmbedding, faqEmbedText(row.question, row.answer), SEM_BOOST_FAQ);
    return { row, score: lex + sem };
  });

  combined.sort((a, b) => b.score - a.score);
  const maxScore = combined[0]?.score ?? 0;

  let faqScored: { row: FaqRow; score: number }[];
  if (maxScore <= 0 && faqs.length > 0) {
    faqScored = rankFaqByLexical(q, faqs).slice(0, TOP_FAQ).filter((x) => x.score > 0);
    if (faqScored.length === 0) {
      faqScored = rankFaqByLexical(q, faqs).slice(0, Math.min(5, faqs.length));
    }
  } else {
    const floor =
      maxScore > 0
        ? Math.min(maxScore * 0.42, Math.max(0.035, maxScore * 0.052))
        : 0;
    faqScored = combined.filter((x) => x.score >= floor).slice(0, TOP_FAQ);
    if (faqScored.length === 0 && combined.length > 0) {
      faqScored = combined.slice(0, TOP_FAQ);
    }
    if (faqScored.length < 3 && maxScore > 0) {
      const seen = new Set(faqScored.map((x) => x.row.question));
      for (const x of combined) {
        if (faqScored.length >= TOP_FAQ) break;
        if (!seen.has(x.row.question)) {
          seen.add(x.row.question);
          faqScored.push(x);
        }
      }
    }
  }

  const qx = expandQueryForRetrieval(q);
  const queryPrefersKo = /[가-힣]/.test(q);
  const siteLocaleForBoost = queryPrefersKo ? "ko" : locale;

  const siteScored = corpus
    .map((chunk) => {
      let score = Math.max(scoreText(qx, chunk.text), scoreText(q, chunk.text) * 0.92);
      if (chunk.locale && (chunk.locale === locale || chunk.locale === siteLocaleForBoost)) {
        score *= 1.06;
      }
      score += semBoost(queryEmbedding, normalizeForKey(chunk.text), SEM_BOOST_SITE);
      return { chunk, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_SITE);

  return { faqHits: faqScored, siteHits: siteScored };
}

export function formatContextBlock(ctx: RetrievedContext, locale: string): string {
  const en = locale === "en";
  const parts: string[] = [];

  if (ctx.faqHits.length) {
    parts.push(
      en
        ? "=== Official FAQ (reference; may be in Korean) ==="
        : "=== FAQ (공식 FAQ CSV) ===",
    );
    ctx.faqHits.forEach((h, i) => {
      parts.push(
        en
          ? `[${i + 1}] Question: ${h.row.question}\nAnswer: ${h.row.answer}`
          : `[FAQ ${i + 1}] Q: ${h.row.question}\nA: ${h.row.answer}`,
      );
    });
  }

  if (ctx.siteHits.length) {
    parts.push(
      en
        ? "=== Site copy excerpts (i18n / support / legal snippets) ==="
        : "=== 사이트 콘텐츠 (번역·랜딩·고객센터 등 추출) ===",
    );
    ctx.siteHits.forEach((h, i) => {
      const srcLabel = en ? "Source" : "출처";
      parts.push(`[${en ? "Site" : "SITE"} ${i + 1}] ${srcLabel}: ${h.chunk.source}\n${h.chunk.text}`);
    });
  }

  if (parts.length) {
    parts.push(
      en
        ? "End of REFERENCE. Reply in natural conversational prose only. Never paste the above structure, file paths, or JSON."
        : "위는 참고(REFERENCE)입니다. 고객에게 보여줄 말만 자연스러운 문장으로 답하세요. 위 표기·파일 경로·JSON을 출력하지 마세요.",
    );
  }

  return parts.join("\n\n");
}

export function fallbackAnswer(query: string, ctx: RetrievedContext, locale: string): string {
  if (isSmallTalkOnly(query)) {
    return smallTalkFallback(locale);
  }
  const en = locale === "en";
  const bestFaq = ctx.faqHits[0];
  const hangulQuery = hasHangul(query);
  const directMin = hangulQuery ? 6 : 9;
  if (bestFaq && bestFaq.score >= directMin && !(en && hasHangul(bestFaq.row.answer))) {
    return bestFaq.row.answer;
  }

  if (!ctx.faqHits.length && !ctx.siteHits.length) {
    return en
      ? "We could not find matching help text on the site. Please contact support@guidematch.com or use the Support inquiry form."
      : "관련된 안내 문구를 찾지 못했습니다. 고객센터(support@guidematch.com) 또는 사이트의 1:1 문의로 연락해 주세요.";
  }

  // FAQ 직답 점수 미달·LLM 실패·모호한 질문 등 — 긴 불릿 나열 대신 짧게 안내
  return en
    ? "I couldn’t match that to a clear topic. Try asking about guide matching, bookings, payments, or cancellations with a bit more detail — or use the Support page / support@guidematch.com."
    : "질문을 정확히 이해하기 어렵습니다. 가이드 매칭·예약·결제·취소 등 구체적으로 다시 물어봐 주시거나, 고객센터·support@guidematch.com으로 문의해 주세요.";
}
