"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/components/providers/LocaleProvider";
import { OPEN_GUIDEMATCH_CHATBOT_EVENT } from "@/lib/chatbot/open-dock-event";
import { localizePath } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

export function GuideMatchChatDock() {
  const { locale, messages } = useI18n();
  const c = messages.common.chatbot;

  const embedSrc = useMemo(() => localizePath(locale, "/embed/chatbot"), [locale]);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsAnimating(true);
      window.setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 220);
    } else {
      setIsOpen(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleToggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleToggle]);

  useEffect(() => {
    if (!isOpen) setIsLoaded(false);
  }, [isOpen]);

  useEffect(() => {
    const onOpenDock = () => setIsOpen(true);
    window.addEventListener(OPEN_GUIDEMATCH_CHATBOT_EVENT, onOpenDock);
    return () => window.removeEventListener(OPEN_GUIDEMATCH_CHATBOT_EVENT, onOpenDock);
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className={cn(
            "fixed z-[9998] overflow-hidden rounded-[1.35rem] sm:rounded-[1.75rem]",
            "bottom-[calc(1rem+3.75rem)] right-3 sm:bottom-[calc(1.25rem+4rem)] sm:right-5",
            "h-[min(74vh,660px)] w-[min(100%,calc(100vw-1.5rem))] max-w-[440px]",
            "bg-transparent",
            "shadow-[0_32px_90px_-18px_rgba(15,23,42,0.55),0_12px_28px_-8px_rgba(15,23,42,0.28)]",
            "ring-1 ring-slate-900/[0.08]",
            "transition duration-200 ease-out",
            isAnimating ? "translate-y-3 scale-[0.96] opacity-0" : "translate-y-0 opacity-100",
          )}
          role="dialog"
          aria-label={c.openLabel}
        >
          <div className="relative h-full w-full rounded-[1.35rem] sm:rounded-[1.75rem] bg-white p-[10px] sm:p-[11px]">
            <div className="pointer-events-none absolute inset-[10px] rounded-[1.05rem] sm:inset-[11px] sm:rounded-[1.2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]" />
            <button
              type="button"
              onClick={handleToggle}
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/45 text-white shadow-md backdrop-blur-md transition hover:bg-slate-900/60"
              aria-label={c.closeLabel}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            <div className="relative h-full w-full overflow-hidden rounded-[1.05rem] bg-[#fbf8f3] ring-1 ring-slate-200/80 sm:rounded-[1.2rem]">
              {!isLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#fbf8f3]">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#ff385c]" />
                  <p className="text-xs font-medium text-slate-500">{c.loading}</p>
                </div>
              )}
              <iframe
                src={embedSrc}
                title={c.windowTitle}
                className="h-full w-full border-0"
                onLoad={() => setIsLoaded(true)}
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "fixed bottom-4 right-3 z-[9999] flex h-14 w-14 items-center justify-center overflow-hidden sm:bottom-5 sm:right-5 sm:h-16 sm:w-16",
          "rounded-2xl bg-white",
          "shadow-[0_18px_44px_-10px_rgba(249,115,22,0.45),0_10px_24px_-8px_rgba(15,23,42,0.25)] ring-2 ring-white transition",
          "hover:scale-[1.04] hover:shadow-[0_22px_50px_-12px_rgba(249,115,22,0.4)] active:scale-[0.97]",
          isOpen && "bg-gradient-to-br from-slate-800 to-slate-900 ring-white/90",
        )}
        aria-label={isOpen ? c.closeLabel : c.openLabel}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" strokeWidth={2} />
        ) : (
          <Image
            src="/chatbot-fab.png"
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-cover"
            priority
          />
        )}
      </button>
    </>
  );
}
