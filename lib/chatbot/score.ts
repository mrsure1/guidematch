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

/**
 * 검색·매칭 질의를 FAQ 표현(매칭/추천/어떻게 등)과 맞추기 위한 확장 + 영어/차용어 정규화.
 */
export function expandQueryForRetrieval(raw: string): string {
  let s = raw.trim();
  s = s.replace(/\bsearch\b/gi, "검색").replace(/서치/gi, "검색");

  const h = hangulOnly(s);
  const hasGuide = /가이드/.test(h);
  const discovery =
    hasGuide &&
    /(검색|매칭|찾기|추천|찾을|고르|선택|리스트|목록|서치)/.test(h + s.toLowerCase());
  const howTo = /(어떻게|방법|하나요|해\?|해요|되나요|할 수|하는법)/.test(h);

  if (discovery) {
    s += " 가이드매칭 매칭진행 지역날짜인원 입력 조건 추천 선택 순차";
  }
  if (hasGuide && (discovery || howTo)) {
    s += " 어떻게진행 진행되나요";
  }

  if (/(환불|환급)/.test(h)) {
    s += " 환불 환급 취소 전액 부분 처리 기간 카드사 은행 승인 예약취소";
  }

  return s;
}

/** 가이드 찾기/매칭 질문인데 연락 문제 FAQ가 끼어드는 것을 줄이기 */
function guideDiscoveryMismatchPenalty(query: string, question: string, answer: string): number {
  const qh = hangulOnly(query);
  const searchIntent =
    /(검색|매칭|찾기|추천|찾을|고르|선택|리스트|목록)/.test(qh) || /search/i.test(query);
  const troubleIntent = /(연락|메시지|소통|안돼|안 돼|연결안|연결이 안|안 나타|나타나지|언어소통)/.test(
    qh.replace(/\s/g, ""),
  );

  if (!searchIntent || troubleIntent) return 1;

  const blob = `${question}\n${answer}`;
  if (
    /가이드와 연락이/.test(blob) ||
    /가이드와 언어 소통이/.test(blob) ||
    /가이드가 안 나타나/.test(blob) ||
    /플랫폼 메시지와 등록된 연락처/.test(blob)
  ) {
    return 0.2;
  }
  return 1;
}

/** 가이드 매칭·검색·추천 흐름 FAQ 가중 */
function guideDiscoveryBoost(query: string, question: string, answer: string): number {
  const qh = hangulOnly(query);
  const qx = expandQueryForRetrieval(query);
  const discovery =
    /(검색|매칭|찾기|추천|찾을|고르|선택|리스트|목록)/.test(qh) || /search|서치/i.test(query + qx);
  if (!/가이드/.test(qh) || !discovery) return 1;

  const blob = `${question}\n${answer}`;
  if (/(매칭|추천|선택|입력|조건에 맞|순차|지역.*날짜|날짜.*인원)/.test(blob)) {
    return 1.45;
  }
  return 1;
}

/**
 * 질문에 뚜렷한 주제(환불 등)가 있는데, FAQ 본문에 그 주제가 없으면 '어떻게'만 겹친 오답을 줄임.
 */
function refundAndPaymentTopicGate(query: string, question: string, answer: string): number {
  const qh = hangulOnly(query);
  const blob = `${question}\n${answer}`;

  if (/(환불|환급)/.test(qh) && !/(회원가입|회원 가입|로그인|비밀번호|탈퇴|이메일 변경|휴대폰)/.test(qh)) {
    if (/(환불|환급)/.test(blob)) return 1.65;
    if (/(취소).{0,12}(환불|결제|마이페이지|예약|요청)/.test(blob) || /(환불|전액).{0,8}취소/.test(blob)) {
      return 0.9;
    }
    return 0.1;
  }

  if (/(^결제[^가]*어떻게|결제는 어떻게|결제 방법|결제수단)/.test(query) || /(결제수단|결제 방법)/.test(qh)) {
    if (/(결제|환불|카드|계좌|페이팔|토스)/.test(blob) && !/(회원가입|소셜 계정으로 가입)/.test(blob)) {
      return 1.35;
    }
  }

  return 1;
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
  const expanded = expandQueryForRetrieval(query);

  const base = Math.max(
    scoreText(expanded, question) * 1.2,
    scoreText(expanded, answer) * 0.88,
    scoreText(expanded, `${question} ${answer}`),
    scoreText(query, question) * 1.05,
    scoreText(query, answer) * 0.82,
  );

  const qh = hangulOnly(query);
  const qq = hangulOnly(question);
  let bonus = 0;
  if (qh.length >= 3 && qq.length >= 3) {
    if (qq.includes(qh) || qh.includes(qq)) bonus += 28;
    bonus += hangulBigramJaccard(query, question) * 34;
    bonus += hangulBigramJaccard(query, answer) * 12;
    bonus += hangulBigramJaccard(expanded, question) * 10;
  }

  const cq = query.toLowerCase().replace(/\s+/g, "");
  const cqQ = question.toLowerCase().replace(/\s+/g, "");
  if (cq.length >= 4 && cqQ.length >= 4 && (cqQ.includes(cq) || cq.includes(cqQ))) {
    bonus += 14;
  }

  let score = base + bonus;
  score *= guideDiscoveryMismatchPenalty(query, question, answer);
  score *= guideDiscoveryBoost(query, question, answer);
  score *= refundAndPaymentTopicGate(query, question, answer);

  return score;
}
