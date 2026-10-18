import type { Language } from "./i18n";

export type LearningCopyKey =
  | "revealMeaningAndReadings"
  | "rateRecall"
  | "recallBeforeReveal"
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
    rateRecall: "چقدر خوب به یاد آوردی؟",
    recallBeforeReveal: "پیش از دیدن پاسخ، هر معنایی یا خوانشی را که به یاد می‌آوری حدس بزن.",
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
    rateRecall: "How well did you recall it?",
    recallBeforeReveal: "Before revealing, try to recall any meaning or reading you know.",
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
