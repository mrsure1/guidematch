function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** 띄어쓰기 없는 한국어 질문도 FAQ와 맞추기 위한 음절 2-gram */
function hangulBigrams(s: string): string[] {
  const h = s.replace(/[^가-힣]/g, "");
  if (h.length < 2) return [];
  const out: string[] = [];
  for (let i = 0; i < h.length - 1; i++) {
    out.push(h.slice(i, i + 2));
  }
  return [...new Set(out)];
}

function extractKeywords(query: string): string[] {
  const n = normalize(query);
  const words = n.split(/\s+/).filter((w) => w.length > 1);
  const hangul = query.match(/[가-힣]{2,}/g) ?? [];
  const latin = query.match(/[a-zA-Z]{3,}/g) ?? [];
  const bi = hangulBigrams(query);
  return [
    ...new Set([
      ...words,
      ...hangul.map((h) => h.toLowerCase()),
      ...latin.map((x) => x.toLowerCase()),
      ...bi,
    ]),
  ];
}

export function scoreText(query: string, text: string): number {
  const qk = extractKeywords(query);
  const tn = normalize(text);
  if (qk.length === 0) return 0;

  let score = 0;
  for (const kw of qk) {
    const k = kw.toLowerCase();
    if (tn.includes(k)) score += k.length >= 3 ? 2 : 1;
  }

  const pn = normalize(query);
  if (pn.length >= 4 && tn.includes(pn)) score += 6;

  return score;
}

function hangulOnly(s: string): string {
  return s.replace(/[^가-힣]/g, "");
}

/** 질문↔FAQ 제목 간 2-gram 자카드 (0~1) */
function hangulBigramJaccard(a: string, b: string): number {
  const ah = hangulOnly(a);
  const bh = hangulOnly(b);
  if (ah.length < 2 || bh.length < 2) return 0;
  const A = new Set<string>();
  for (let i = 0; i < ah.length - 1; i++) A.add(ah.slice(i, i + 2));
  const B = new Set<string>();
  for (let i = 0; i < bh.length - 1; i++) B.add(bh.slice(i, i + 2));
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter += 1;
  }
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * FAQ 한 행에 대한 검색 점수 (질문 표현이 달라도 비슷한 의미로 잡히도록 강화).
 */
export function scoreFaqRelevance(query: string, question: string, answer: string): number {
  const base = Math.max(
    scoreText(query, question) * 1.2,
    scoreText(query, answer) * 0.88,
    scoreText(query, `${question} ${answer}`),
  );

  const qh = hangulOnly(query);
  const qq = hangulOnly(question);
  let bonus = 0;
  if (qh.length >= 3 && qq.length >= 3) {
    if (qq.includes(qh) || qh.includes(qq)) bonus += 28;
    bonus += hangulBigramJaccard(query, question) * 34;
    bonus += hangulBigramJaccard(query, answer) * 12;
  }

  const cq = query.toLowerCase().replace(/\s+/g, "");
  const cqQ = question.toLowerCase().replace(/\s+/g, "");
  if (cq.length >= 4 && cqQ.length >= 4 && (cqQ.includes(cq) || cq.includes(cqQ))) {
    bonus += 14;
  }

  return base + bonus;
}
