import { loadFaqRows } from "@/lib/chatbot/faq";
import { loadSiteCorpus } from "@/lib/chatbot/corpus";
import { scoreText, scoreFaqRelevance, expandQueryForRetrieval } from "@/lib/chatbot/score";
import type { FaqRow, SiteChunk } from "@/lib/chatbot/types";

function hasHangul(s: string): boolean {
  return /[가-힣]/.test(s);
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
        ? "End of reference. Answer the user in natural conversational English (or Korean only if they wrote Korean). Do not paste these headers, brackets, or JSON."
        : "위 참고만 사용하고, 사용자에게 자연스러운 문장으로 답하세요. 위 표기(===, [FAQ] 등)나 JSON 형태로 그대로 출력하지 마세요.",
    );
  }

  return parts.join("\n\n");
}

export function fallbackAnswer(query: string, ctx: RetrievedContext, locale: string): string {
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
