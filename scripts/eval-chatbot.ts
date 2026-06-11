/**
 * 챗봇 검색 정확도 측정 하니스.
 *
 *   npx tsx scripts/eval-chatbot.ts                # 하이브리드(어휘+임베딩) + 재작성
 *   npx tsx scripts/eval-chatbot.ts --no-embed     # 어휘 검색만 (베이스라인)
 *   npx tsx scripts/eval-chatbot.ts --no-rewrite   # 멀티턴 재작성 끄기
 *   npx tsx scripts/eval-chatbot.ts --verbose      # 실패 케이스 출력
 *
 * golden-set.json: { id, persona, type, query, expect, messages? }
 * expect 는 정답 FAQ 의 질문 문자열(번들에 존재).
 */
import fs from "fs";
import path from "path";
import { retrieveForQuery } from "../lib/chatbot/rag";
import { embedQuery } from "../lib/chatbot/embeddings";
import { rewriteQueryForRetrieval } from "../lib/chatbot/query-rewrite";
import type { ChatMessage } from "../lib/chatbot/types";

// 파라미터 스윕을 빠르고 결정적으로 하기 위한 디스크 캐시(질의 임베딩·재작성).
// SEM_* 가중치는 이 캐시에 영향받지 않으므로 코사인만 재계산되어 즉시 반영된다.
const CACHE_FP = path.join(process.cwd(), "tmp", "eval-cache.json");
type Cache = { emb: Record<string, string>; rewrite: Record<string, string> };
let CACHE: Cache = { emb: {}, rewrite: {} };
try {
  CACHE = JSON.parse(fs.readFileSync(CACHE_FP, "utf8"));
} catch {
  /* fresh */
}
let cacheDirty = false;
function b64ToF32(b64: string): Float32Array {
  const buf = Buffer.from(b64, "base64");
  const out = new Float32Array(buf.byteLength / 4);
  for (let i = 0; i < out.length; i++) out[i] = buf.readFloatLE(i * 4);
  return out;
}
async function cachedEmbed(q: string): Promise<Float32Array | null> {
  if (CACHE.emb[q]) return b64ToF32(CACHE.emb[q]);
  const v = await embedQuery(q);
  if (v) {
    CACHE.emb[q] = Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString("base64");
    cacheDirty = true;
  }
  return v;
}
async function cachedRewrite(id: string, msgs: ChatMessage[], locale: string): Promise<string> {
  if (CACHE.rewrite[id]) return CACHE.rewrite[id];
  const r = await rewriteQueryForRetrieval(msgs, locale);
  CACHE.rewrite[id] = r;
  cacheDirty = true;
  return r;
}

// .env 의 GEMINI_API_KEY 보충 로드
function loadEnvKey() {
  if (process.env.GEMINI_API_KEY?.trim()) return;
  for (const name of [".env.local", ".env"]) {
    const fp = path.join(process.cwd(), name);
    if (!fs.existsSync(fp)) continue;
    for (const line of fs.readFileSync(fp, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) {
        process.env.GEMINI_API_KEY = m[1].replace(/^["']|["']$/g, "");
        return;
      }
    }
  }
}

type GoldenItem = {
  id: string;
  persona: "traveler" | "guide";
  type: "direct" | "paraphrase" | "followup";
  query: string;
  expect: string;
  messages?: ChatMessage[];
};

const args = process.argv.slice(2);
const useEmbed = !args.includes("--no-embed");
const useRewrite = !args.includes("--no-rewrite");
const verbose = args.includes("--verbose");
const LOCALE = "ko";
const TOPK = 5;

function rankOf(expect: string, hits: { row: { question: string } }[]): number {
  for (let i = 0; i < hits.length; i++) {
    if (hits[i].row.question === expect) return i + 1;
  }
  return 0; // not found in top list
}

async function main() {
  loadEnvKey();
  const fp = path.join(process.cwd(), "lib", "chatbot", "eval", "golden-set.json");
  const golden = JSON.parse(fs.readFileSync(fp, "utf8")) as GoldenItem[];

  const buckets: Record<string, { n: number; top1: number; top3: number; top5: number; mrr: number }> = {};
  const add = (k: string, rank: number) => {
    const b = (buckets[k] ??= { n: 0, top1: 0, top3: 0, top5: 0, mrr: 0 });
    b.n++;
    if (rank === 1) b.top1++;
    if (rank >= 1 && rank <= 3) b.top3++;
    if (rank >= 1 && rank <= 5) b.top5++;
    if (rank >= 1) b.mrr += 1 / rank;
  };

  const failures: string[] = [];

  for (const item of golden) {
    const msgs: ChatMessage[] =
      item.messages && item.messages.length
        ? item.messages
        : [{ role: "user", content: item.query }];

    let searchQuery = item.query;
    if (useRewrite && item.type === "followup") {
      searchQuery = await cachedRewrite(item.id, msgs, LOCALE);
    }
    const emb = useEmbed ? await cachedEmbed(searchQuery) : null;
    const ctx = retrieveForQuery(searchQuery, LOCALE, emb);
    const rank = rankOf(item.expect, ctx.faqHits.slice(0, TOPK));

    add("ALL", rank);
    add(`persona:${item.persona}`, rank);
    add(`type:${item.type}`, rank);

    if (rank !== 1 && verbose) {
      const top = ctx.faqHits.slice(0, 3).map((h) => h.row.question).join(" | ");
      failures.push(
        `[${item.id} ${item.type}] q="${item.query}"\n   rewrite="${searchQuery}"\n   expect="${item.expect}" rank=${rank || ">5"}\n   top3: ${top}`,
      );
    }
  }

  const mode = `${useEmbed ? "HYBRID(lex+embed)" : "LEXICAL-only"}${useRewrite ? " +rewrite" : ""}`;
  console.log(`\n=== Chatbot retrieval eval — ${mode} — n=${golden.length} ===\n`);
  const order = ["ALL", "persona:traveler", "persona:guide", "type:direct", "type:paraphrase", "type:followup"];
  const pct = (x: number, n: number) => `${((x / n) * 100).toFixed(1)}%`;
  console.log("bucket".padEnd(20), "n".padStart(4), "Top-1".padStart(8), "Top-3".padStart(8), "Top-5".padStart(8), "MRR".padStart(7));
  for (const k of order) {
    const b = buckets[k];
    if (!b) continue;
    console.log(
      k.padEnd(20),
      String(b.n).padStart(4),
      pct(b.top1, b.n).padStart(8),
      pct(b.top3, b.n).padStart(8),
      pct(b.top5, b.n).padStart(8),
      (b.mrr / b.n).toFixed(3).padStart(7),
    );
  }

  if (verbose && failures.length) {
    console.log(`\n--- ${failures.length} misses (not Top-1) ---`);
    for (const f of failures) console.log(f);
  }

  if (cacheDirty) {
    fs.mkdirSync(path.dirname(CACHE_FP), { recursive: true });
    fs.writeFileSync(CACHE_FP, JSON.stringify(CACHE));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
