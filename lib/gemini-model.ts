/**
 * Gemini 모델명 해석기 (공유).
 *
 * 운영 환경변수 `GEMINI_CHAT_MODEL` 이 단종된 모델로 고정돼 있어도 서비스가 깨지지
 * 않도록, 알려진 단종 모델은 무시하고 안전한 기본값으로 폴백한다.
 * (gemini-2.0-flash 는 generateContent 에서 404 "no longer available" 를 반환함)
 */
const DEFAULT_CHAT_MODEL = "gemini-2.5-flash";

/** generateContent 호출이 차단되는(또는 곧 차단될) 모델 — env로 지정돼도 무시한다. */
const DEPRECATED = new Set([
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro",
  "gemini-pro",
]);

function pick(envValue: string | undefined, fallback: string): string {
  const v = envValue?.trim();
  if (v && !DEPRECATED.has(v)) return v;
  return fallback;
}

/** 챗봇 답변·번역에 쓰는 채팅 모델. */
export function resolveChatModel(): string {
  return pick(process.env.GEMINI_CHAT_MODEL, DEFAULT_CHAT_MODEL);
}

/** 멀티턴 질의 재작성 모델(별도 지정 없으면 채팅 모델과 동일 정책). */
export function resolveRewriteModel(): string {
  return pick(process.env.GEMINI_REWRITE_MODEL, resolveChatModel());
}
