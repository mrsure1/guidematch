/**
 * 오케스트레이터(Orchestrator)
 *
 * 5대 워커를 순차적으로 실행하고, 개별 워커 실패 시 Fallback을 제공합니다.
 * Vercel 서버리스에서 동작하도록 설계되었습니다.
 *
 * 파이프라인 흐름:
 *   Query Understanding → Retrieval → Rerank → Answer → Eval & Logging
 */

import type { ChatMessage } from "@/lib/chatbot/types";
import {
  createInitialState,
  runQueryUnderstanding,
  runRetrieval,
  runRerank,
  runAnswer,
  runEvalLogging,
  type PipelineState,
} from "@/lib/chatbot/workers";

export type OrchestratorResult = {
  answer: string;
  usedModel: boolean;
  intent: string;
  sources: string[];
  evalScore: number;
  debug?: {
    elapsed: number;
    faqCount: number;
    siteCount: number;
    errors: string[];
  };
};

/**
 * 전체 챗봇 파이프라인을 실행하는 메인 함수
 *
 * @param messages - 대화 내역
 * @param locale   - 사용자 언어 ("ko" | "en")
 * @returns 최종 답변 및 메타데이터
 */
export async function orchestrate(
  messages: ChatMessage[],
  locale: string,
): Promise<OrchestratorResult> {
  let state: PipelineState = createInitialState(messages, locale);

  try {
    // Step 1: 질문 이해
    state = runQueryUnderstanding(state);

    // Step 2: 문서 검색
    state = runRetrieval(state);

    // Step 3: 재정렬
    state = runRerank(state);

    // Step 4: 답변 생성 (비동기 - LLM 호출)
    state = await runAnswer(state);

    // Step 5: 평가 및 로깅
    state = runEvalLogging(state);
  } catch (err) {
    // 전체 파이프라인 Fallback
    console.error("[Orchestrator] 전체 파이프라인 에러:", err);
    const fallbackMsg =
      locale === "en"
        ? "An error occurred while processing your question. Please try again or contact support@guidematch.com."
        : "질문 처리 중 오류가 발생했습니다. 다시 시도하시거나 support@guidematch.com으로 문의해 주세요.";

    return {
      answer: fallbackMsg,
      usedModel: false,
      intent: "error",
      sources: [],
      evalScore: 0,
      debug: {
        elapsed: Date.now() - state.startTime,
        faqCount: 0,
        siteCount: 0,
        errors: [...state.errors, String(err)],
      },
    };
  }

  return {
    answer: state.answer,
    usedModel: state.usedModel,
    intent: state.intent,
    sources: state.sources,
    evalScore: state.evalScore,
    debug: {
      elapsed: Date.now() - state.startTime,
      faqCount: state.rerankedFaq.length,
      siteCount: state.rerankedSite.length,
      errors: state.errors,
    },
  };
}
