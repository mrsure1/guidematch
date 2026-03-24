import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
  mode: "upstash" | "memory";
};

function parseEnvInt(name: string, fallback: number): number {
  const v = process.env[name]?.trim();
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getChatbotRateLimitConfig() {
  return {
    limit: parseEnvInt("CHATBOT_RL_LIMIT", 30),
    windowSec: parseEnvInt("CHATBOT_RL_WINDOW_SEC", 60),
  };
}

function memorySlidingWindow(ip: string, limit: number, windowMs: number): RateLimitResult {
  const g = globalThis as typeof globalThis & { __gmChatbotRLMem?: Map<string, number[]> };
  if (!g.__gmChatbotRLMem) g.__gmChatbotRLMem = new Map();
  const store = g.__gmChatbotRLMem;
  const now = Date.now();
  let arr = store.get(ip) ?? [];
  arr = arr.filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    const oldest = Math.min(...arr);
    return { ok: false, remaining: 0, limit, resetMs: oldest + windowMs, mode: "memory" };
  }
  arr.push(now);
  store.set(ip, arr);
  return { ok: true, remaining: limit - arr.length, limit, resetMs: now + windowMs, mode: "memory" };
}

let cachedLimiter: { key: string; ratelimit: Ratelimit } | null = null;

function getUpstashRatelimit(limit: number, windowSec: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;

  const key = `${limit}:${windowSec}`;
  if (cachedLimiter?.key === key) return cachedLimiter.ratelimit;

  const redis = new Redis({ url, token });
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: "guidematch:chatbot",
  });
  cachedLimiter = { key, ratelimit };
  return ratelimit;
}

export async function checkChatbotRateLimit(ip: string): Promise<RateLimitResult> {
  const { limit, windowSec } = getChatbotRateLimitConfig();
  const windowMs = windowSec * 1000;

  const upstash = getUpstashRatelimit(limit, windowSec);
  if (upstash) {
    const r = await upstash.limit(ip);
    await r.pending.catch(() => {});
    return {
      ok: r.success,
      remaining: r.remaining,
      limit: r.limit,
      resetMs: r.reset,
      mode: "upstash",
    };
  }

  return memorySlidingWindow(ip, limit, windowMs);
}

export function getClientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);
  return "unknown";
}
