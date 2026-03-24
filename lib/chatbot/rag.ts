import { loadFaqRows } from "@/lib/chatbot/faq";
import { loadSiteCorpus } from "@/lib/chatbot/corpus";
import { scoreText, scoreFaqRelevance } from "@/lib/chatbot/score";
import type { FaqRow, SiteChunk } from "@/lib/chatbot/types";

export type RetrievedContext = {
  faqHits: { row: FaqRow; score: number }[];
  siteHits: { chunk: SiteChunk; score: number }[];
};

const TOP_FAQ = 8;
const TOP_SITE = 8;

export function retrieveForQuery(query: string, locale: string): RetrievedContext {
  const faqs = loadFaqRows();
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

  const siteScored = corpus
    .map((chunk) => {
      let score = scoreText(query, chunk.text);
      if (chunk.locale && chunk.locale === locale) score *= 1.08;
      return { chunk, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_SITE);

  return { faqHits: faqScored, siteHits: siteScored };
}

export function formatContextBlock(ctx: RetrievedContext): string {
  const parts: string[] = [];

  if (ctx.faqHits.length) {
    parts.push("=== FAQ (공식 FAQ CSV) ===");
    ctx.faqHits.forEach((h, i) => {
      parts.push(`[FAQ ${i + 1}] Q: ${h.row.question}\nA: ${h.row.answer}`);
    });
  }

  if (ctx.siteHits.length) {
    parts.push("=== 사이트 콘텐츠 (번역·랜딩·고객센터 등 추출) ===");
    ctx.siteHits.forEach((h, i) => {
      parts.push(`[SITE ${i + 1}] 출처: ${h.chunk.source}\n${h.chunk.text}`);
    });
  }

  return parts.join("\n\n");
}

export function fallbackAnswer(query: string, ctx: RetrievedContext, locale: string): string {
  const en = locale === "en";
  const bestFaq = ctx.faqHits[0];
  if (bestFaq && bestFaq.score >= 8) {
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
    lines.push(`• ${h.row.question}`, `  ${h.row.answer}`, "");
  }
  for (const h of ctx.siteHits.slice(0, 4)) {
    lines.push(`• (${h.chunk.source})`, `  ${h.chunk.text.slice(0, 280)}${h.chunk.text.length > 280 ? "…" : ""}`, "");
  }
  lines.push(
    en
      ? "For binding terms, check the booking flow and Terms of Service on the site."
      : "정확한 조건은 예약·결제 단계 안내와 이용약관을 함께 확인해 주세요.",
  );
  return lines.join("\n");
}
