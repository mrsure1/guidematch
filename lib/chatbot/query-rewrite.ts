/**
 * 멀티턴 질의 재작성(Query Rewriting).
 *
 * "그건 며칠 걸려요?" 같은 후속 질문은 직전 대화 맥락이 있어야 검색이 된다.
 * - 후속 질문으로 판단될 때만 동작(단발성 질문은 그대로 → 불필요한 호출/지연 없음).
 * - 키가 있으면 Gemini Flash로 독립형 질의로 재작성, 실패/키없음이면 직전
 *   사용자 발화를 이어붙이는 무비용 휴리스틱으로 폴백한다.
 * 답변 LLM은 전체 대화 맥락을 따로 받으므로, 이 재작성은 "검색 질의"에만 쓰인다.
 */
import type { ChatMessage } from "@/lib/chatbot/types";
import { resolveRewriteModel } from "@/lib/gemini-model";
import { GoogleGenAI } from "@google/genai/node";

function lastUserText(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content.trim();
  }
  return "";
}

function prevUserText(messages: ChatMessage[]): string {
  let seenLast = false;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      if (!seenLast) {
        seenLast = true;
        continue;
      }
      return messages[i].content.trim();
    }
  }
  return "";
}

// 대명사·생략·이어짐 신호. 한국어/영어 모두 커버.
const FOLLOWUP_RE =
  /(그건|그게|그거|그건요|그럼|그러면|그때|거기|저거|저건|위에|방금|아까|이건|이거|그 다음|그다음|그후|그 후|then|that one|those|it\b|its\b|this one|the (first|second|other) one|what about|how about|and (you|the))/i;

/** 후속(맥락 의존) 질문일 가능성이 높은가 */
export function isLikelyFollowUp(messages: ChatMessage[]): boolean {
  const hasPrior = messages.some((m) => m.role === "assistant");
  if (!hasPrior) return false;
  const last = lastUserText(messages);
  if (!last) return false;

  const compact = last.replace(/\s+/g, "");
  // 매우 짧은 질문 또는 대명사/이어짐 신호가 있으면 후속으로 간주
  if (compact.length <= 12) return true;
  if (FOLLOWUP_RE.test(last)) return true;
  return false;
}

/** 무비용 폴백: 직전 사용자 발화를 검색 질의에 이어붙인다(중복 시 생략). */
function heuristicRewrite(messages: ChatMessage[]): string {
  const last = lastUserText(messages);
  const prev = prevUserText(messages);
  if (!prev) return last;
  if (last.includes(prev) || prev.includes(last)) return last;
  return `${prev} ${last}`.trim();
}

/**
 * 검색용 독립형 질의를 만든다. 후속이 아니면 마지막 질문 그대로 반환.
 */
export async function rewriteQueryForRetrieval(
  messages: ChatMessage[],
  locale: string,
): Promise<string> {
  const last = lastUserText(messages);
  if (!isLikelyFollowUp(messages)) return last;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return heuristicRewrite(messages);

  // 최근 6턴만 맥락으로 사용
  const recent = messages.slice(-6);
  const transcript = recent
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const lang = locale === "en" ? "English" : "Korean";
  const instruction = [
    "You rewrite a follow-up message into a single standalone search query.",
    "Resolve pronouns and ellipsis using the conversation. Keep it short (one line, no quotes).",
    `Write the query in ${lang}. Output ONLY the query text, nothing else.`,
    "If the last user message is already standalone, return it unchanged.",
  ].join(" ");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: resolveRewriteModel(),
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${instruction}\n\nConversation:\n${transcript}\n\nStandalone search query:`,
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        maxOutputTokens: 64,
        // thinking이 켜지면 64토큰 예산을 소진해 빈 응답이 나오므로 끈다.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const out = (res.text ?? "").trim().replace(/^["'`]+|["'`]+$/g, "").split(/\r?\n/)[0]?.trim();
    if (out && out.length >= 2 && out.length <= 200) return out;
    return heuristicRewrite(messages);
  } catch (e) {
    console.warn("[chatbot] query rewrite 실패, 휴리스틱 폴백:", e instanceof Error ? e.message : e);
    return heuristicRewrite(messages);
  }
}
