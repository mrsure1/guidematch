/**
 * FAQ(faq-bundled-*.json) + 사이트 코퍼스(site-corpus.json)를 Gemini 임베딩으로
 * 변환해 lib/chatbot/embeddings.json 으로 저장한다.
 *
 * - 텍스트 해시(sha1) → base64(Float32Array) 매핑. 같은 텍스트는 한 번만 임베딩.
 * - 기존 embeddings.json 의 벡터는 재사용(변경분만 새로 임베딩 → 재실행 저렴).
 * - 런타임(lib/chatbot/embeddings.ts)의 textKey/faqEmbedText 와 정규화가 동일해야 한다.
 *
 * 사용법: GEMINI_API_KEY 가 환경변수 또는 .env 에 있어야 한다.
 *   node scripts/build-chatbot-embeddings.mjs
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai/node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MODEL = process.env.GEMINI_EMBED_MODEL?.trim() || "gemini-embedding-001";
const DIM = 768;
const BATCH = 50;
const OUT = path.join(root, "lib", "chatbot", "embeddings.json");

/** .env / .env.local 의 GEMINI_API_KEY 를 process.env 에 보충 로드 */
function loadEnvKey() {
  if (process.env.GEMINI_API_KEY?.trim()) return;
  for (const name of [".env.local", ".env"]) {
    const fp = path.join(root, name);
    if (!fs.existsSync(fp)) continue;
    const raw = fs.readFileSync(fp, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) {
        process.env.GEMINI_API_KEY = m[1].replace(/^["']|["']$/g, "");
        return;
      }
    }
  }
}

function normalizeForKey(text) {
  return text.normalize("NFC").trim();
}
function faqEmbedText(question, answer) {
  return normalizeForKey(`${question}\n${answer}`);
}
function textKey(text) {
  return crypto.createHash("sha1").update(normalizeForKey(text), "utf8").digest("hex");
}

function readJson(rel) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

/** 임베딩 대상 텍스트 수집 (중복 제거) */
function collectTexts() {
  const byKey = new Map(); // key -> text
  for (const rel of ["lib/chatbot/faq-bundled-ko.json", "lib/chatbot/faq-bundled-en.json"]) {
    const rows = readJson(rel) || [];
    for (const r of rows) {
      const t = faqEmbedText(r.question, r.answer);
      byKey.set(textKey(t), t);
    }
  }
  const corpus = readJson("lib/chatbot/site-corpus.json") || [];
  for (const c of corpus) {
    const t = normalizeForKey(c.text);
    byKey.set(textKey(t), t);
  }
  return byKey;
}

function l2normalize(v) {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}
function encodeVector(float32) {
  return Buffer.from(float32.buffer, float32.byteOffset, float32.byteLength).toString("base64");
}

async function embedBatch(ai, texts, attempt = 0) {
  try {
    const res = await ai.models.embedContent({
      model: MODEL,
      contents: texts,
      config: { outputDimensionality: DIM, taskType: "RETRIEVAL_DOCUMENT" },
    });
    const embs = res.embeddings || [];
    if (embs.length !== texts.length) {
      throw new Error(`embedding count mismatch: ${embs.length} != ${texts.length}`);
    }
    return embs.map((e) => e.values);
  } catch (err) {
    if (attempt < 4) {
      const wait = 1500 * (attempt + 1);
      console.warn(`[embeddings] batch 실패(재시도 ${attempt + 1}/4, ${wait}ms): ${err?.message || err}`);
      await new Promise((r) => setTimeout(r, wait));
      return embedBatch(ai, texts, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  loadEnvKey();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("[embeddings] GEMINI_API_KEY 없음 — 임베딩 생성 건너뜀(어휘 검색만 동작).");
    process.exit(0);
  }

  const wanted = collectTexts();
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;
  const reuse = existing && existing.model === MODEL && existing.dim === DIM ? existing.vectors : {};

  const vectors = {};
  const todo = [];
  for (const [key, text] of wanted) {
    if (reuse[key]) vectors[key] = reuse[key];
    else todo.push({ key, text });
  }

  console.info(
    `[embeddings] 대상 ${wanted.size}개 / 재사용 ${Object.keys(vectors).length}개 / 신규 ${todo.length}개`,
  );

  const ai = new GoogleGenAI({ apiKey });
  for (let i = 0; i < todo.length; i += BATCH) {
    const slice = todo.slice(i, i + BATCH);
    const values = await embedBatch(ai, slice.map((s) => s.text));
    for (let j = 0; j < slice.length; j++) {
      vectors[slice[j].key] = encodeVector(l2normalize(values[j]));
    }
    console.info(`[embeddings] ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
    if (i + BATCH < todo.length) await new Promise((r) => setTimeout(r, 300));
  }

  fs.writeFileSync(OUT, JSON.stringify({ model: MODEL, dim: DIM, vectors }));
  const bytes = fs.statSync(OUT).size;
  console.info(
    `[embeddings] wrote ${Object.keys(vectors).length} vectors (${(bytes / 1024 / 1024).toFixed(2)}MB) -> ${path.relative(root, OUT)}`,
  );
}

main().catch((e) => {
  console.error("[embeddings] 실패:", e);
  process.exit(1);
});
