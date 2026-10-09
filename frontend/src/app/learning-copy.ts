import type { Language } from "./i18n";

export type LearningCopyKey =
  | "revealMeaningAndReadings"
  | "recommendedLearning"
  | "recommendedLearningHint"
  | "learnByTopic"
  | "topicLearningTitle"
  | "topicLearningIntro"
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
    recommendedLearningHint: "ادامهٔ مسیر متناسب با پیشرفتت",
    learnByTopic: "یادگیری بر اساس موضوع",
    topicLearningTitle: "انتخاب موضوع یادگیری",
    topicLearningIntro: "موضوعی را انتخاب کن و کانجی‌های دسته‌بندی‌شدهٔ آن را در یک جلسهٔ متمرکز یاد بگیر.",
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
    recommendedLearningHint: "Continue the path shaped by your progress",
    learnByTopic: "Learn by topic",
    topicLearningTitle: "Choose a learning topic",
    topicLearningIntro: "Choose a subject and study its currently categorized kanji in a focused session.",
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
