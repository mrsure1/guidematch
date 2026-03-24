import { loadFaqRows } from "@/lib/chatbot/faq";
import { loadSiteCorpus } from "@/lib/chatbot/corpus";
import { scoreText, scoreFaqRelevance, expandQueryForRetrieval } from "@/lib/chatbot/score";
import type { FaqRow, SiteChunk } from "@/lib/chatbot/types";

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

export function retrieveForQuery(query: string, locale: string): RetrievedContext {
  const faqs = loadFaqRows(locale);
  const corpus = loadSiteCorpus();

  let faqScored = faqs
    .map((row) => {
      const score = scoreFaqRelevance(query, row.question, row.answer);
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_FAQ);

  if (faqScored.length === 0 && faqs.length > 0) {
    faqScored = faqs.slice(0, TOP_FAQ).map((row) => ({ row, score: 0.01 }));
  }

  const qx = expandQueryForRetrieval(query);
  const siteScored = corpus
    .map((chunk) => {
      let score = Math.max(scoreText(qx, chunk.text), scoreText(query, chunk.text) * 0.92);
      if (chunk.locale && chunk.locale === locale) score *= 1.08;
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
  if (bestFaq && bestFaq.score >= 8 && !(en && hasHangul(bestFaq.row.answer))) {
    return bestFaq.row.answer;
  }

  if (!ctx.faqHits.length && !ctx.siteHits.length) {
    return en
      ? "We could not find matching help text on the site. Please contact support@guidematch.com or use the Support inquiry form."
      : "관련된 안내 문구를 찾지 못했습니다. 고객센터(support@guidematch.com) 또는 사이트의 1:1 문의로 연락해 주세요.";
  }

  const lines: string[] = en
    ? ["Here is what we found in the FAQ and site copy:", ""]
    : ["아래는 사이트·FAQ에서 찾은 참고 정보입니다.", ""];
  for (const h of ctx.faqHits.slice(0, 3)) {
    if (en && hasHangul(h.row.answer)) {
      lines.push(`• (FAQ) ${h.row.question}`, `  ${h.row.answer.slice(0, 220)}${h.row.answer.length > 220 ? "…" : ""}`, "");
    } else {
      lines.push(`• ${h.row.question}`, `  ${h.row.answer}`, "");
    }
  }
  const siteOrdered = en
    ? [...ctx.siteHits.filter((h) => h.chunk.locale === "en"), ...ctx.siteHits.filter((h) => h.chunk.locale !== "en")]
    : ctx.siteHits;
  for (const h of siteOrdered.slice(0, 4)) {
    lines.push(`• (${h.chunk.source})`, `  ${h.chunk.text.slice(0, 280)}${h.chunk.text.length > 280 ? "…" : ""}`, "");
  }
  lines.push(
    en
      ? "For binding terms, check the booking flow and Terms of Service on the site."
      : "정확한 조건은 예약·결제 단계 안내와 이용약관을 함께 확인해 주세요.",
  );
  return lines.join("\n");
}
