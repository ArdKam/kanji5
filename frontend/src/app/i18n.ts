export type Language = "fa" | "en";

const STORAGE_KEY = "kanji5-ui-language";

type TranslationKey =
  | "title"
  | "subtitle"
  | "stats"
  | "settings"
  | "language"
  | "persian"
  | "english"
  | "learning"
  | "activeRecall"
  | "learningPath"
  | "sessionProgress"
  | "goToMain"
  | "learningCard"
  | "newKanji"
  | "learningReview"
  | "cardBack"
  | "showKanjiInfo"
  | "firstLook"
  | "reviewQuality"
  | "again"
  | "hard"
  | "good"
  | "easy"
  | "meaning"
  | "reading"
  | "production"
  | "vocabulary"
  | "context"
  | "unknown"
  | "correct"
  | "wrong"
  | "nearMiss"
  | "empty"
  | "unavailable"
  | "activeRecallLabel"
  | "currentExercise"
  | "exerciseReady"
  | "answerYourself"
  | "answerPlaceholder"
  | "checkAnswer"
  | "dontKnow"
  | "retrySkill"
  | "nextExercise"
  | "backToLearning"
  | "sessionDetails"
  | "learnerSkills"
  | "adaptiveFocus"
  | "sessionSummary"
  | "recentResults"
  | "skill"
  | "action"
  | "attempts"
  | "right"
  | "accuracy"
  | "recent"
  | "noResults"
  | "upcomingReviews"
  | "settingsTitle"
  | "newKanjiPerDay"
  | "dailyReviewGoal"
  | "leechThreshold"
  | "productionKanji"
  | "completeVocabulary"
  | "contextRecall"
  | "save"
  | "close"
  | "resetProgress"
  | "todayReviews"
  | "todayNewKanji"
  | "learned"
  | "streak"
  | "dailyGoal"
  | "completed"
  | "noSession"
  | "startExercise"
  | "loading"
  | "learningCoreError"
  | "tryAgain"
  | "audioUnavailable"
  | "playKanjiPronunciation"
  | "playWordPronunciation"
  | "playReading"
  | "vocabularyExamples"
  | "showCardHint"
  | "correctRecall"
  | "correctAnswer";

const messages: Record<Language, Record<TranslationKey, string>> = {
  fa: {
    title:"کانجی ۵", subtitle:"پنج کانجی مهم ژاپنی در روز، با مرور تطبیقی",
    stats:"آمار", settings:"تنظیمات", language:"زبان", persian:"فارسی", english:"English",
    learning:"یادگیری", activeRecall:"یادآوری فعال", learningPath:"مسیر یادگیری", sessionProgress:"پیشرفت جلسه",
    goToMain:"رفتن به محتوای اصلی", learningCard:"کارت یادگیری", newKanji:"آشنایی با کانجی", learningReview:"مرور یادگیری",
    cardBack:"پشت کارت", showKanjiInfo:"نمایش اطلاعات کانجی", firstLook:"اول کانجی را ببین و بعد اطلاعات آن را باز کن.",
    reviewQuality:"کیفیت مرور بعدی را انتخاب کن.", again:"دوباره", hard:"سخت", good:"خوب", easy:"آسان",
    meaning:"معنی", reading:"خوانش", production:"تولید", vocabulary:"واژگان", context:"بافت",
    unknown:"نمی‌دانم", correct:"درست", wrong:"نادرست", nearMiss:"نزدیک بود", empty:"خالی", unavailable:"در دسترس نیست",
    activeRecallLabel:"یادآوری فعال", currentExercise:"تمرین فعلی", exerciseReady:"هنوز تمرینی آماده نیست.",
    answerYourself:"پاسخ شما", answerPlaceholder:"پاسخ را وارد کنید", checkAnswer:"بررسی پاسخ", dontKnow:"نمی‌دانم",
    retrySkill:"تکرار همین مهارت", nextExercise:"تمرین بعدی", backToLearning:"بازگشت به کارت یادگیری",
    sessionDetails:"جزئیات جلسه", learnerSkills:"مهارت‌های یادگیرنده", adaptiveFocus:"تمرکز تطبیقی", sessionSummary:"خلاصه جلسه",
    recentResults:"نتایج اخیر", skill:"مهارت", action:"عمل", attempts:"تلاش‌ها", right:"درست", accuracy:"دقت", recent:"اخیر", noResults:"هنوز نتیجه‌ای ثبت نشده است.",
    upcomingReviews:"مرورهای پیش‌رو", settingsTitle:"تنظیمات", newKanjiPerDay:"کانجی جدید در روز", dailyReviewGoal:"هدف تعداد مرور روزانه",
    leechThreshold:"آستانهٔ Leech", productionKanji:"تولید کانجی", completeVocabulary:"تکمیل واژه", contextRecall:"یادآوری بافت",
    save:"ذخیره", close:"بستن", resetProgress:"پاک کردن پیشرفت", todayReviews:"مرورهای امروز", todayNewKanji:"کانجی جدید امروز",
    learned:"یادگرفته‌شده", streak:"روز پیاپی", dailyGoal:"هدف روزانه", completed:"تکمیل شد", noSession:"جلسه‌ای برای نمایش وجود ندارد",
    startExercise:"شروع تمرین", loading:"در حال اتصال به هستهٔ یادگیری…", learningCoreError:"رابط هستهٔ یادگیری آماده نشد", tryAgain:"تلاش دوباره",
    audioUnavailable:"صدا در این مرورگر در دسترس نیست", playKanjiPronunciation:"پخش تلفظ کانجی", playWordPronunciation:"پخش تلفظ واژه",
    playReading:"پخش", vocabularyExamples:"نمونهٔ واژگانی", showCardHint:"اول کانجی را ببین و بعد اطلاعات آن را باز کن.",
    correctRecall:"بازیابی درست بود.", correctAnswer:"پاسخ درست"
  },
  en: {
    title:"Kanji 5", subtitle:"Five important Japanese kanji a day, with adaptive review",
    stats:"Stats", settings:"Settings", language:"Language", persian:"فارسی", english:"English",
    learning:"Learning", activeRecall:"Active Recall", learningPath:"Learning path", sessionProgress:"Session progress",
    goToMain:"Skip to main content", learningCard:"Learning card", newKanji:"Introducing this kanji", learningReview:"Learning review",
    cardBack:"Card back", showKanjiInfo:"Show kanji information", firstLook:"First look at the kanji, then reveal its information.",
    reviewQuality:"Choose the quality of the next review.", again:"Again", hard:"Hard", good:"Good", easy:"Easy",
    meaning:"Meaning", reading:"Reading", production:"Production", vocabulary:"Vocabulary", context:"Context",
    unknown:"I don't know", correct:"Correct", wrong:"Incorrect", nearMiss:"Near miss", empty:"Empty", unavailable:"Unavailable",
    activeRecallLabel:"Active recall", currentExercise:"Current exercise", exerciseReady:"No exercise is ready yet.",
    answerYourself:"Your answer", answerPlaceholder:"Enter your answer", checkAnswer:"Check answer", dontKnow:"I don't know",
    retrySkill:"Retry this skill", nextExercise:"Next exercise", backToLearning:"Back to learning card",
    sessionDetails:"Session details", learnerSkills:"Learner skills", adaptiveFocus:"Adaptive focus", sessionSummary:"Session summary",
    recentResults:"Recent results", skill:"Skill", action:"Action", attempts:"Attempts", right:"Correct", accuracy:"Accuracy", recent:"Recent", noResults:"No results recorded yet.",
    upcomingReviews:"Upcoming reviews", settingsTitle:"Settings", newKanjiPerDay:"New kanji per day", dailyReviewGoal:"Daily review goal",
    leechThreshold:"Leech threshold", productionKanji:"Kanji production", completeVocabulary:"Complete vocabulary", contextRecall:"Context recall",
    save:"Save", close:"Close", resetProgress:"Reset progress", todayReviews:"Today's reviews", todayNewKanji:"New kanji today",
    learned:"Learned", streak:"Streak", dailyGoal:"Daily goal", completed:"Completed", noSession:"There is no session to display",
    startExercise:"Start exercise", loading:"Connecting to the learning engine…", learningCoreError:"The learning interface could not be loaded", tryAgain:"Try again",
    audioUnavailable:"Audio is not available in this browser", playKanjiPronunciation:"Play kanji pronunciation", playWordPronunciation:"Play word pronunciation",
    playReading:"Play", vocabularyExamples:"Vocabulary examples", showCardHint:"First look at the kanji, then reveal its information.",
    correctRecall:"Recall was correct.", correctAnswer:"Correct answer"
  }
};

let currentLanguage: Language = typeof window === "undefined" ? "fa" : getLanguage();

export function getLanguage(): Language {
  if (typeof window === "undefined") return "fa";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "fa" ? stored : "fa";
}

export function setLanguage(language: Language): void {
  currentLanguage = language;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
  }
}

export function t(key: TranslationKey, language: Language = currentLanguage): string {
  return messages[language][key] ?? messages.fa[key] ?? key;
}

export function formatNumber(value: number, language: Language): string {
  const rounded = String(Math.max(0, Math.round(value)));
  return language === "fa" ? rounded.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]) : rounded;
}

const dynamicTranslations: Record<string, string> = {
  "اول کانجی را ببین و بعد اطلاعات آن را باز کن.": "showCardHint",
  "نمایش اطلاعات کانجی": "showKanjiInfo",
  "پاسخ را وارد کنید": "answerPlaceholder",
  "هنوز تمرینی آماده نیست.": "exerciseReady",
  "بازیابی درست بود.": "correctRecall",
  "پاسخ درست": "correctAnswer",
  "دیده نشده":"unseen",
  "معرفی شده":"introduced",
  "در حال یادگیری":"learningState",
  "ضعیف":"weak",
  "در حال بازیابی":"recovering",
  "پایدار":"stable",
  "مسلط":"mastered",
  "ترمیم":"repair",
  "تقویت":"reinforce",
  "بازیابی":"recover",
  "حفظ":"maintain",
  "اکتشاف":"explore"
};

const dynamicEn: Record<string,string> = {
  unseen:"Not seen", introduced:"Introduced", learningState:"Learning", weak:"Weak",
  recovering:"Recovering", stable:"Stable", mastered:"Mastered", repair:"Repair",
  reinforce:"Reinforce", recover:"Recover", maintain:"Maintain", explore:"Explore"
};

export function localizeDynamic(value: string | undefined, language: Language, fallback = ""): string {
  const clean = String(value ?? "").trim();
  if (!clean) return fallback;
  const key = dynamicTranslations[clean];
  if (!key) return clean;
  if (language === "en") return dynamicEn[key] ?? clean;
  return clean;
}

export function applyLanguage(language: Language): void {
  currentLanguage = language;
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
  }
}
