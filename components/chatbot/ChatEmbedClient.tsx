"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useI18n } from "@/components/providers/LocaleProvider";
import { localizePath } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chatbot/types";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
};

export function ChatEmbedClient({ locale: serverLocale }: Props) {
  const { messages, locale } = useI18n();
  const c = messages.common.chatbot;
  const effectiveLocale = locale ?? serverLocale;

  const [items, setItems] = useState<ChatMessage[]>(() => [
    {
      role: "assistant",
      content:
        effectiveLocale === "en"
          ? "Hi! I’m the GuideMatch assistant. Ask me about matching, bookings, payments, or guides — I answer from our FAQ and site content."
          : `${c.windowSubtitle} FAQ와 사이트 안내를 바탕으로 답해 드립니다.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  /** React 18/19: setState 업데이터는 비동기 핸들러에서 fetch 직전에 실행되지 않을 수 있어 payload가 []가 되는 경우가 있음 */
  const itemsRef = useRef<ChatMessage[]>(items);
  const apiPath = localizePath(effectiveLocale, "/api/chatbot/chat");

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextUser: ChatMessage = { role: "user", content: text };
    setInput("");

    const messagesForApi = [...itemsRef.current, nextUser];
    itemsRef.current = messagesForApi;
    setItems(messagesForApi);

    setLoading(true);

    const requestUrl =
      typeof window !== "undefined" ? new URL(apiPath, window.location.origin).toString() : apiPath;

    try {
      const res = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          messages: messagesForApi,
          locale: effectiveLocale,
        }),
      });
      const raw = await res.text();
      let data = {} as {
        answer?: string;
        error?: string;
        rateLimited?: boolean;
        retryAfterSec?: number;
      };
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        console.error("[chatbot] JSON 파싱 실패, 응답 앞부분:", raw.slice(0, 200));
        throw new Error(
          effectiveLocale === "en"
            ? "Invalid server response (not JSON). Check network or deployment."
            : "서버 응답 형식이 올바르지 않습니다. 배포·네트워크를 확인해 주세요.",
        );
      }

      if (res.status === 429 && data.answer?.trim()) {
        const base = data.answer.trim();
        const suffix =
          effectiveLocale === "en"
            ? "\n\n— Traffic is high right now; this reply is from our FAQ only (AI generation was skipped to save quota)."
            : `\n\n— 현재 이용량이 많아 AI 생성 없이 FAQ·안내 문구만으로 답변했습니다. 잠시 후(${data.retryAfterSec ?? "?"}초 뒤) 다시 시도해 보실 수 있습니다.`;
        const withAssistant = [...itemsRef.current, { role: "assistant" as const, content: base + suffix }];
        itemsRef.current = withAssistant;
        setItems(withAssistant);
        return;
      }

      if (!res.ok) {
        const detail = data.error?.trim();
        throw new Error(detail || (effectiveLocale === "en" ? `Request failed (${res.status})` : `요청 실패 (${res.status})`));
      }
      const answer = data.answer?.trim() || (effectiveLocale === "en" ? "No answer returned." : "응답이 비어 있습니다.");
      const withAssistant = [...itemsRef.current, { role: "assistant" as const, content: answer }];
      itemsRef.current = withAssistant;
      setItems(withAssistant);
    } catch (e) {
      console.error("[chatbot] send failed:", e);
      const fromServer = e instanceof Error && e.message && e.message !== "request failed" ? e.message : "";
      const msg =
        fromServer ||
        (effectiveLocale === "en"
          ? "Something went wrong. Please try again or email support@guidematch.com."
          : c.error);
      const failed = [...itemsRef.current, { role: "assistant" as const, content: msg }];
      itemsRef.current = failed;
      setItems(failed);
    } finally {
      setLoading(false);
    }
  }, [apiPath, c.error, effectiveLocale, input, loading]);

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="relative z-10 shrink-0 border-b border-slate-200/70 bg-white/85 px-4 py-3 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.2)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff385c]/35 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-slate-900/5 ring-1 ring-slate-200/80 shadow-sm">
            <Image src="/logo.png" alt="GuideMatch" fill sizes="44px" className="object-contain p-1" priority />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-black tracking-tight text-slate-900">{c.windowTitle}</h1>
              <span className="hidden items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 sm:inline-flex">
                <Sparkles className="h-3 w-3" />
                RAG
              </span>
            </div>
            <p className="truncate text-xs font-medium text-slate-500">{c.windowSubtitle}</p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {items.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={cn(
                "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                m.role === "user"
                  ? "ml-auto bg-slate-900 text-white"
                  : "mr-auto border border-slate-200/80 bg-white text-slate-800",
              )}
            >
              {m.content}
            </div>
          ))}
          {loading ? (
            <div className="mr-auto flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-500 shadow-sm">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#ff385c]" />
              {c.thinking}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200/70 bg-[#fcfaf7]/95 px-3 py-3 backdrop-blur-md">
        <p className="mx-auto mb-2 max-w-lg text-center text-[10px] font-medium text-slate-400">{c.disclaimer}</p>
        <div className="mx-auto flex max-w-lg gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={c.inputPlaceholder}
            className="min-w-0 flex-1 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-inner shadow-slate-200/40 outline-none ring-0 transition placeholder:text-slate-400 focus:border-[#ff385c]/40 focus:shadow-[0_0_0_3px_rgba(255,56,92,0.12)]"
            disabled={loading}
            aria-label={c.inputPlaceholder}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff385c] to-rose-600 text-white shadow-lg shadow-rose-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={c.send}
          >
            <Send className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
