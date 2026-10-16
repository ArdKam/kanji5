import type { Language } from "./i18n";

export type LearningCopyKey =
  | "revealMeaningAndReadings"
  | "recommendedLearning"
  | "learnByTopic"
  | "topicLearningTitle"
  | "topicSearch"
  | "topicItemCount"
  | "topicAvailable"
  | "topicDue"
  | "topicNewOnly"
  | "topicStart"
  | "topicNoMatches"
  | "topicNoEligibleItems"
  | "topicSessionLabel"
  | "topicSessionComplete"
  | "topicSessionCompleteHint"
  | "backToRecommended"
  | "showMoreExamples"
  | "showFewerExamples"
  | "strokeOrderPause"
  | "strokeOrderResume";

const COPY: Record<Language, Record<LearningCopyKey, string>> = {
  fa: {
    revealMeaningAndReadings: "نمایش معنی و خوانش‌ها",
    recommendedLearning: "یادگیری پیشنهادی",
    learnByTopic: "یادگیری بر اساس موضوع",
    topicLearningTitle: "انتخاب موضوع یادگیری",
    topicSearch: "جست‌وجوی موضوع‌ها",
    topicItemCount: "کانجی دسته‌بندی‌شده",
    topicAvailable: "موارد قابل مطالعه",
    topicDue: "فقط مرورهای سررسیدشده",
    topicNewOnly: "فقط کانجی‌های جدید",
    topicStart: "شروع یادگیری این موضوع",
    topicNoMatches: "موضوعی با این عبارت پیدا نشد.",
    topicNoEligibleItems: "برای این موضوع در این حالت فعلاً کانجی قابل مطالعه‌ای وجود ندارد.",
    topicSessionLabel: "یادگیری موضوعی",
    topicSessionComplete: "این جلسهٔ موضوعی تمام شد",
    topicSessionCompleteHint: "می‌توانی موضوع دیگری انتخاب کنی یا به مسیر یادگیری پیشنهادی برگردی.",
    backToRecommended: "بازگشت به یادگیری پیشنهادی",
    showMoreExamples: "نمایش مثال‌های بیشتر",
    showFewerExamples: "نمایش مثال‌های کمتر",
    strokeOrderPause: "مکث",
    strokeOrderResume: "ادامهٔ پخش",
  },
  en: {
    revealMeaningAndReadings: "Reveal meaning & readings",
    recommendedLearning: "Recommended learning",
    learnByTopic: "Learn by topic",
    topicLearningTitle: "Choose a learning topic",
    topicSearch: "Search topics",
    topicItemCount: "categorized kanji",
    topicAvailable: "Available items",
    topicDue: "Due reviews only",
    topicNewOnly: "New kanji only",
    topicStart: "Start learning this topic",
    topicNoMatches: "No topics match this search.",
    topicNoEligibleItems: "No kanji in this topic are available for this session type right now.",
    topicSessionLabel: "TOPIC SESSION",
    topicSessionComplete: "Topic session complete",
    topicSessionCompleteHint: "Choose another topic or return to recommended learning.",
    backToRecommended: "Back to recommended learning",
    showMoreExamples: "Show more examples",
    showFewerExamples: "Show fewer examples",
    strokeOrderPause: "Pause",
    strokeOrderResume: "Resume playback",
  },
};

export function learningCopy(key: LearningCopyKey, language: Language): string {
  return COPY[language]?.[key] ?? COPY.en[key];
}

export type ReadingVocabularyExample = { word?: string; reading?: string; meaning?: string; meaningLanguage?: "en" | "fa" | "ja" | "unknown"; source?: string; sourceVersion?: string | null; reviewStatus?: "verified" | "unreviewed" | "unknown" };

/**
 * Connect an example to a priority Kanji reading only when the source word starts
 * with the target Kanji and its recorded pronunciation begins with that reading.
 * This deliberately misses rendaku/assimilated readings rather than guessing.
 */
export function selectExamplesForReading(
  character: string,
  reading: string,
  examples: ReadingVocabularyExample[],
  limit = 1,
): ReadingVocabularyExample[] {
  const target = Array.from(String(character ?? "").normalize("NFKC").trim())[0] ?? "";
  const normalizeKana = (value: string) => Array.from(String(value ?? "").normalize("NFKC").trim())
    .map(char => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : char;
    })
    .join("")
    .replace(/[.・\-‐‑‒–—\s]/g, "");
  const expected = normalizeKana(reading);
  if (!target || !expected) return [];
  const seen = new Set<string>();
  const matched: ReadingVocabularyExample[] = [];
  for (const example of Array.isArray(examples) ? examples : []) {
    const word = String(example?.word ?? "").trim();
    const pronunciation = String(example?.reading ?? "").trim();
    const meaning = String(example?.meaning ?? "").trim();
    const source = String(example?.source ?? "").trim();
    if (!word || !pronunciation || !meaning || !source || [...word].length < 2 || [...word][0] !== target) continue;
    if (!normalizeKana(pronunciation).startsWith(expected) || seen.has(word)) continue;
    seen.add(word);
    matched.push({ word, reading: pronunciation, meaning, meaningLanguage: example.meaningLanguage, source, sourceVersion: example.sourceVersion ?? null, reviewStatus: example.reviewStatus ?? "unreviewed" });
    if (matched.length >= Math.max(1, Math.min(2, limit))) break;
  }
  return matched;
}

/**
 * Fill missing legacy gloss-language metadata only when the script is a clear signal.
 * The source/review fields stay independent: language inference never marks content reviewed.
 */
export function inferMeaningLanguage(
  value: string,
  declared?: string,
  source?: string,
): "en" | "fa" | "ja" | "unknown" {
  if (declared === "en" || declared === "fa" || declared === "ja") return declared;
  const text = String(value ?? "").trim();
  if (!text) return "unknown";
  if (source === "kanjiapi.dev" || source === "jmdict") return "en";
  if (/[\u067e\u0686\u0698\u06af\u06a9\u06cc]/.test(text)) return "fa";
  const japaneseCount = (text.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
  const letterCount = (text.match(/[A-Za-z\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
  if (japaneseCount > 0 && japaneseCount >= letterCount * 0.5) return "ja";
  if (/^[\x00-\x7f]*[A-Za-z][\x00-\x7f]*$/.test(text)) return "en";
  return "unknown";
}
