const LANGUAGE_DEFINITIONS = [
  {
    canonical: "korean",
    label: "한국어",
    aliases: ["korean", "ko", "kr", "한국어", "한글", "한국말", "조선말"],
  },
  {
    canonical: "english",
    label: "영어",
    aliases: ["english", "en", "eng", "영어", "잉글리시"],
  },
  {
    canonical: "japanese",
    label: "일본어",
    aliases: ["japanese", "ja", "jp", "일본어", "일어", "日本語"],
  },
  {
    canonical: "chinese",
    label: "중국어",
    aliases: ["chinese", "zh", "cn", "중국어", "중문", "中文", "만다린", "보통화"],
  },
  {
    canonical: "french",
    label: "프랑스어",
    aliases: ["french", "fr", "프랑스어", "français", "francais"],
  },
  {
    canonical: "vietnamese",
    label: "베트남어",
    aliases: ["vietnamese", "vi", "베트남어", "tiếng việt", "tieng viet"],
  },
  {
    canonical: "thai",
    label: "태국어",
    aliases: ["thai", "th", "태국어", "ภาษาไทย"],
  },
  {
    canonical: "filipino",
    label: "필리핀어",
    aliases: ["filipino", "tagalog", "tl", "필리핀어", "타갈로그어"],
  },
  {
    canonical: "hindi",
    label: "힌디어",
    aliases: ["hindi", "hi", "힌디어", "हिन्दी"],
  },
  {
    canonical: "arabic",
    label: "아랍어",
    aliases: ["arabic", "ar", "아랍어", "العربية"],
  },
] as const;

type LanguageDefinition = (typeof LANGUAGE_DEFINITIONS)[number];
type CanonicalLanguage = LanguageDefinition["canonical"];

const LANGUAGE_BY_CANONICAL = new Map<CanonicalLanguage, LanguageDefinition>(
  LANGUAGE_DEFINITIONS.map((item) => [item.canonical, item]),
);

const ALIAS_TO_CANONICAL = new Map<string, CanonicalLanguage>();
for (const language of LANGUAGE_DEFINITIONS) {
  for (const alias of language.aliases) {
    ALIAS_TO_CANONICAL.set(normalizeSearchText(alias), language.canonical);
  }
}

const ALIAS_ENTRIES = Array.from(ALIAS_TO_CANONICAL.entries());
const LANGUAGE_SPLIT_REGEX = /[,/|·•&]+|\s+\+\s+|\s+및\s+|\s+and\s+/gi;

export const GUIDE_LANGUAGE_FILTER_OPTIONS = [
  "상관없음",
  ...LANGUAGE_DEFINITIONS.map((item) => item.label),
] as const;

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

function splitLanguageChunks(value: string): string[] {
  return value
    .split(LANGUAGE_SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function canonicalizeLanguage(value: string): CanonicalLanguage[] {
  const chunks = splitLanguageChunks(value);
  const found = new Set<CanonicalLanguage>();

  for (const chunk of chunks) {
    const normalizedChunk = normalizeSearchText(chunk);
    if (!normalizedChunk) continue;

    const directMatch = ALIAS_TO_CANONICAL.get(normalizedChunk);
    if (directMatch) {
      found.add(directMatch);
      continue;
    }

    for (const [alias, canonical] of ALIAS_ENTRIES) {
      if (alias.length < 2) continue;
      if (normalizedChunk.includes(alias)) {
        found.add(canonical);
      }
    }
  }

  return Array.from(found);
}

export function expandLanguageSearchTerms(value: unknown): string[] {
  const values = toStringArray(value);
  const terms = new Set<string>();

  for (const rawValue of values) {
    const trimmed = rawValue.trim();
    if (!trimmed) continue;

    terms.add(trimmed);

    for (const canonical of canonicalizeLanguage(trimmed)) {
      const definition = LANGUAGE_BY_CANONICAL.get(canonical);
      if (!definition) continue;

      terms.add(definition.label);
      for (const alias of definition.aliases) {
        terms.add(alias);
      }
    }
  }

  return Array.from(terms);
}
