import { Resend } from "resend";

function parseEnvInt(name: string, fallback: number): number {
  const v = process.env[name]?.trim();
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function parseWarnRatio(): number {
  const v = parseFloat(process.env.CHATBOT_RL_WARN_RATIO || "0.2");
  if (!Number.isFinite(v)) return 0.2;
  return Math.min(0.95, Math.max(0.05, v));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 남은 호출이 (한도 × 경고 비율) 이하로 떨어졌을 때 운영자에게 메일(쿨다운당 최대 1통).
 * 프로덕션(Vercel)에서는 Upstash 사용을 권장합니다.
 */
export async function notifyChatbotRateLimitApproaching(params: {
  ip: string;
  remaining: number;
  limit: number;
  resetMs: number;
  mode: string;
}): Promise<void> {
  if (params.remaining <= 0) return;

  const warnRatio = parseWarnRatio();
  const threshold = Math.max(1, Math.ceil(params.limit * warnRatio));
  if (params.remaining > threshold) return;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[chatbot-rate-alert] RESEND_API_KEY 없음 — 알림 메일을 보내지 않습니다.");
    return;
  }

  const cooldownMs = parseEnvInt("CHATBOT_RL_ALERT_COOLDOWN_MS", 600_000);
  const g = globalThis as typeof globalThis & { __gmChatbotRlAlertAt?: number };
  const now = Date.now();
  if (g.__gmChatbotRlAlertAt != null && now - g.__gmChatbotRlAlertAt < cooldownMs) {
    return;
  }
  g.__gmChatbotRlAlertAt = now;

  const to = (process.env.CHATBOT_RL_ALERT_EMAIL || "leeyob@gmail.com").trim();
  const from =
    process.env.CHATBOT_ALERT_FROM?.trim() || "GuideMatch <onboarding@resend.dev>";
  const when = new Date(now).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const resetAt = new Date(params.resetMs).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from,
      to: [to],
      subject: `[GuideMatch] 챗봇 API 레이트리밋 임계 근접 (남음 ${params.remaining}/${params.limit})`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 640px; line-height: 1.6; color: #111;">
          <p>챗봇 API 호출이 설정한 <strong>경고 구간</strong>에 들어왔습니다.</p>
          <ul>
            <li>시각(KST): ${escapeHtml(when)}</li>
            <li>클라이언트 IP: <code>${escapeHtml(params.ip)}</code></li>
            <li>남은 호출(추정): <strong>${params.remaining}</strong> / 한도: ${params.limit}</li>
            <li>윈도 리셋(대략, KST): ${escapeHtml(resetAt)}</li>
            <li>리밋 모드: ${escapeHtml(params.mode)}</li>
          </ul>
          <p style="color:#64748b;font-size:14px;">이 메일은 쿨다운(${Math.round(cooldownMs / 60000)}분)마다 최대 1통 발송됩니다. 환경변수: CHATBOT_RL_ALERT_COOLDOWN_MS</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[chatbot-rate-alert] Resend 실패:", e);
  }
}
