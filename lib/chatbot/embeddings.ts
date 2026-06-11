/**
 * 임베딩 기반 시맨틱 검색 지원 모듈.
 *
 * - 빌드 타임: `scripts/build-chatbot-embeddings.mjs`가 FAQ·사이트 코퍼스를
 *   Gemini 임베딩으로 변환해 `embeddings.json`에 저장한다(텍스트 해시 → 벡터).
 * - 런타임: 사용자 질문 1건만 라이브로 임베딩하고, 코퍼스 벡터와 코사인 유사도를
 *   계산해 어휘 점수에 더한다(하이브리드).
 *
 * 키가 없거나 embeddings.json이 없으면 전부 graceful 폴백(어휘 검색만).
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai/node";

export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL?.trim() || "gemini-embedding-001";
export const EMBED_DIM = 768;

type EmbeddingsFile = {
  model: string;
  dim: number;
  vectors: Record<string, string>; // textKey -> base64(Float32Array)
};

type LoadedEmbeddings = {
  dim: number;
  vectors: Map<string, Float32Array>;
};

let cache: LoadedEmbeddings | null = null;
let loadAttempted = false;

/** 코퍼스/질문에 공통으로 적용하는 정규화 — 빌드·런타임 해시가 일치해야 한다. */
export function normalizeForKey(text: string): string {
  return text.normalize("NFC").trim();
}

/** FAQ 한 행을 임베딩할 때 쓰는 표준 텍스트(빌드 스크립트와 반드시 동일하게 유지). */
export function faqEmbedText(question: string, answer: string): string {
  return normalizeForKey(`${question}\n${answer}`);
}

export function textKey(text: string): string {
  return crypto.createHash("sha1").update(normalizeForKey(text), "utf8").digest("hex");
}

function decodeBase64Vector(b64: string): Float32Array {
  const buf = Buffer.from(b64, "base64");
  // Buffer.buffer는 풀(pool)을 공유할 수 있으므로 정확한 구간만 복사한다.
  const out = new Float32Array(buf.byteLength / 4);
  for (let i = 0; i < out.length; i++) {
    out[i] = buf.readFloatLE(i * 4);
  }
  return out;
}

function loadEmbeddingsFile(): LoadedEmbeddings {
  if (cache) return cache;
  if (loadAttempted) return cache ?? { dim: EMBED_DIM, vectors: new Map() };
  loadAttempted = true;

  const fp = path.join(process.cwd(), "lib", "chatbot", "embeddings.json");
  const empty: LoadedEmbeddings = { dim: EMBED_DIM, vectors: new Map() };
  if (!fs.existsSync(fp)) {
    cache = empty;
    return cache;
  }
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const parsed = JSON.parse(raw) as EmbeddingsFile;
    const vectors = new Map<string, Float32Array>();
    for (const [k, v] of Object.entries(parsed.vectors ?? {})) {
      vectors.set(k, decodeBase64Vector(v));
    }
    cache = { dim: parsed.dim || EMBED_DIM, vectors };
  } catch (e) {
    console.error("[chatbot] embeddings.json 로드 실패:", e);
    cache = empty;
  }
  return cache;
}

export function embeddingsAvailable(): boolean {
  return loadEmbeddingsFile().vectors.size > 0;
}

/** 코퍼스 문서(또는 FAQ 표준 텍스트)에 대해 사전 계산된 벡터 조회. */
export function getDocEmbedding(text: string): Float32Array | null {
  return loadEmbeddingsFile().vectors.get(textKey(text)) ?? null;
}

/** 두 벡터의 코사인 유사도. 저장 벡터는 정규화되어 있으나 안전하게 계산한다. */
export function cosine(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function l2normalize(v: number[]): Float32Array {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

// 동일 람다 내 반복 질문에 대한 소형 캐시.
const queryCache = new Map<string, Float32Array | null>();

/**
 * 사용자 질문 1건을 라이브로 임베딩(RETRIEVAL_QUERY). 키·코퍼스 임베딩이 없거나
 * 오류면 null을 반환하고, 호출부는 어휘 검색만으로 동작한다.
 */
export async function embedQuery(query: string): Promise<Float32Array | null> {
  const q = normalizeForKey(query);
  if (!q) return null;
  if (!embeddingsAvailable()) return null;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  if (queryCache.has(q)) return queryCache.get(q) ?? null;

  const dim = loadEmbeddingsFile().dim || EMBED_DIM;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: [q],
      config: { outputDimensionality: dim, taskType: "RETRIEVAL_QUERY" },
    });
    const values = res.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      queryCache.set(q, null);
      return null;
    }
    const vec = l2normalize(values);
    if (queryCache.size > 200) queryCache.clear();
    queryCache.set(q, vec);
    return vec;
  } catch (e) {
    console.error("[chatbot] embedQuery 실패:", e instanceof Error ? e.message : e);
    queryCache.set(q, null);
    return null;
  }
}
