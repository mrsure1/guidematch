"use client";

import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/routing";
import { GuideMatchChatDock } from "@/components/support/GuideMatchChatDock";

/** 결제 등 팝업 전용 라우트 — 챗봇 FAB 숨김 */
const HIDDEN_PATH_PREFIXES = ["/payment-popup"];

function shouldHideChatbot(pathname: string | null): boolean {
  if (!pathname) return true;
  const internal = stripLocalePrefix(pathname);

  if (internal === "/embed/chatbot" || internal.startsWith("/embed/chatbot/")) {
    return true;
  }

  for (const prefix of HIDDEN_PATH_PREFIXES) {
    if (internal === prefix || internal.startsWith(`${prefix}/`)) {
      return true;
    }
  }

  return false;
}

/**
 * 팝업·임베드 페이지를 제외한 모든 화면에 플로팅 챗봇을 표시합니다.
 */
export function GlobalChatbotDock() {
  const pathname = usePathname();
  if (shouldHideChatbot(pathname)) return null;
  return <GuideMatchChatDock />;
}
