import { NextResponse } from "next/server";
import { generateFaqOnlyReply } from "@/lib/chatbot/generate-reply";
import { orchestrate } from "@/lib/chatbot/orchestrator";
import { persistChatbotTurn } from "@/lib/chatbot/persist-chat";
import { notifyChatbotRateLimitApproaching } from "@/lib/chatbot/rate-limit-alert";
import { checkChatbotRateLimit, getClientIp } from "@/lib/chatbot/rate-limit";
import type { ChatMessage } from "@/lib/chatbot/types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 96 * 1024;
const MAX_TOTAL_MESSAGE_CHARS = 12_000;
const MAX_SINGLE_MESSAGE_CHARS = 3_000;

function isChatMessage(x: unknown): x is ChatMessage {
  if (!x || typeof x !== "object") return false;
  const m = x as ChatMessage;
  return (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length > 0;
}

function validateMessagePayload(messages: ChatMessage[]): string | null {
  let total = 0;
  for (const m of messages) {
    const len = m.content.length;
    if (len > MAX_SINGLE_MESSAGE_CHARS) {
      return `메시지 한 건은 ${MAX_SINGLE_MESSAGE_CHARS}자 이하로 보내 주세요.`;
    }
    total += len;
  }
  if (total > MAX_TOTAL_MESSAGE_CHARS) {
    return `전체 대화 텍스트는 ${MAX_TOTAL_MESSAGE_CHARS}자 이하로 보내 주세요.`;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const cl = request.headers.get("content-length");
    if (cl) {
      const n = parseInt(cl, 10);
      if (Number.isFinite(n) && n > MAX_BODY_BYTES) {
        return NextResponse.json(
          { error: `요청 본문이 너무 큽니다. (${MAX_BODY_BYTES}바이트 이하)` },
          { status: 413 },
        );
      }
    }

    const body = (await request.json()) as {
      messages?: unknown;
      locale?: string;
      conversationId?: string | null;
    };
    const raw = body.messages;
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json({ error: "messages 배열이 필요합니다." }, { status: 400 });
    }

    const messages = raw.filter(isChatMessage) as ChatMessage[];
    if (messages.length === 0) {
      return NextResponse.json({ error: "유효한 메시지가 없습니다." }, { status: 400 });
    }

    const payloadErr = validateMessagePayload(messages);
    if (payloadErr) {
      return NextResponse.json({ error: payloadErr }, { status: 400 });
    }

    const locale = body.locale === "en" ? "en" : "ko";
    const ip = getClientIp(request);
    const rl = await checkChatbotRateLimit(ip);

    if (!rl.ok) {
      const result = await generateFaqOnlyReply(messages, locale);
      const retryAfterSec = Math.max(1, Math.ceil((rl.resetMs - Date.now()) / 1000));
      const fullAnswer = result.answer;
      const savedId = await persistChatbotTurn({
        messages,
        locale,
        conversationId: body.conversationId,
        assistantAnswer: fullAnswer,
        usedModel: false,
      });
      return NextResponse.json(
        {
          answer: fullAnswer,
          usedModel: false,
          rateLimited: true,
          retryAfterSec,
          conversationId: savedId ?? body.conversationId ?? null,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        },
      );
    }

    void notifyChatbotRateLimitApproaching({
      ip,
      remaining: rl.remaining,
      limit: rl.limit,
      resetMs: rl.resetMs,
      mode: rl.mode,
    });

    const result = await orchestrate(messages, locale);
    const savedId = await persistChatbotTurn({
      messages,
      locale,
      conversationId: body.conversationId,
      assistantAnswer: result.answer,
      usedModel: result.usedModel,
    });

    return NextResponse.json({
      answer: result.answer,
      usedModel: result.usedModel,
      intent: result.intent,
      sources: result.sources,
      evalScore: result.evalScore,
      conversationId: savedId ?? body.conversationId ?? null,
    });
  } catch (e) {
    console.error("[chatbot/chat]", e);
    return NextResponse.json({ error: "챗봇 응답 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
