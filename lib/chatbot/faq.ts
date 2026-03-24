import fs from "fs";
import path from "path";
import type { FaqRow } from "@/lib/chatbot/types";

/** locale별 FAQ 캐시 (ko: faq_data.csv, en: faq_data_english.csv) */
const cache = new Map<string, FaqRow[]>();

function parseLine(line: string): FaqRow | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("Question,")) return null;

  const quoted = trimmed.match(/^(.+),"(.*)"$/);
  if (quoted) {
    return {
      question: quoted[1].trim(),
      answer: quoted[2].replace(/""/g, '"').trim(),
    };
  }

  const i = trimmed.indexOf(",");
  if (i === -1) return null;
  const question = trimmed.slice(0, i).trim();
  const answer = trimmed.slice(i + 1).trim();
  if (question.length < 2 || answer.length < 2) return null;
  return { question, answer };
}

function parseCsv(raw: string): FaqRow[] {
  const lines = raw.split(/\r?\n/);
  const rows: FaqRow[] = [];
  for (const line of lines) {
    const row = parseLine(line);
    if (row) rows.push(row);
  }
  return rows;
}

function readFirstExisting(paths: string[]): string {
  for (const fp of paths) {
    try {
      if (fs.existsSync(fp)) {
        return fs.readFileSync(fp, "utf8");
      }
    } catch {
      /* try next */
    }
  }
  return "";
}

const KO_FAQ_PATHS = [
  path.join(process.cwd(), "ChatBot", "faq_data.csv"),
  path.join(process.cwd(), "chatbot", "faq_data.csv"),
];

const EN_FAQ_PATHS = [
  path.join(process.cwd(), "ChatBot", "faq_data_english.csv"),
  path.join(process.cwd(), "chatbot", "faq_data_english.csv"),
];

/**
 * FAQ CSV 로드. `en`이면 `faq_data_english.csv`, 그 외는 `faq_data.csv`.
 * 영어 파일이 없거나 비어 있으면 한국어 FAQ로 폴백합니다.
 */
export function loadFaqRows(locale = "ko"): FaqRow[] {
  const key = locale === "en" ? "en" : "ko";
  const hit = cache.get(key);
  if (hit) return hit;

  let raw = "";
  if (key === "en") {
    raw = readFirstExisting(EN_FAQ_PATHS);
    if (!raw.trim()) {
      console.warn(
        "[chatbot] faq_data_english.csv를 찾지 못했거나 비어 있습니다. 한국어 FAQ로 대체합니다.",
      );
      raw = readFirstExisting(KO_FAQ_PATHS);
    }
  } else {
    raw = readFirstExisting(KO_FAQ_PATHS);
  }

  raw = raw.replace(/^\uFEFF/, "");
  if (!raw.trim()) {
    console.error("[chatbot] FAQ CSV를 찾거나 읽을 수 없습니다. 경로:", KO_FAQ_PATHS.join(", "));
    cache.set(key, []);
    return [];
  }

  const rows = parseCsv(raw);
  cache.set(key, rows);
  return rows;
}
