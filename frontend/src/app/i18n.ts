export type Language = "fa" | "en"; // Settings-owned language preference // Persisted bilingual presentation language

const STORAGE_KEY = "kanji5-ui-language";

type TranslationKey =
  | "title"
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
  | "correctRecall"
  | "correctAnswer"
  | "dictionary"
  | "dictionaryTitle"
  | "dictionaryPlaceholder"
  | "dictionaryHint"
  | "dictionarySearching"
  | "dictionaryNoResults"
  | "dictionaryStrokes"
  | "dictionaryGrade"
  | "dictionaryJlpt"
  | "dictionaryFrequency"
  | "dictionaryOn"
  | "dictionaryKun"
  | "dictionaryMastery"
  | "dictionaryCardTitle"
  | "dictionaryLoading"
  | "dictionaryGrid"
  | "dictionaryLevel"
  | "allLevels"
  | "dictionarySort"
  | "masteryMap"
  | "masteryMapHint"
  | "masteryAverage"
  | "masteryMastered"
  | "masteryStable"
  | "masteryLearning"
  | "masteryNeedsAttention"
  | "masteryUnseen"
  | "sortLevelAsc"
  | "sortLevelDesc"
  | "sortMasteryDesc"
  | "sortMasteryAsc"
  | "sortOriginal"
  | "customStudy"
  | "customStudyHint"
  | "customFocus"
  | "customAvailable"
  | "customDue"
  | "customNew"
  | "customWeak"
  | "customLimit"
  | "customStart"
  | "customNoCards"
  | "cardPage"
  | "previousCardPage"
  | "nextCardPage"
  | "swipeForMore"
  | "masteryOverview"
  | "masterySignal"
  | "modelConfidence"
  | "personalMnemonic"
  | "personalMnemonicHint"
  | "mnemonicPlaceholder"
  | "saveMnemonic"
  | "editMnemonic"
  | "cancel"
  | "saving"
  | "mnemonicLoadError"
  | "mnemonicSaveError"
  | "sevenDayActivity"
  | "reviewsCount";

const messages: Record<Language, Record<TranslationKey, string>> = {
  fa: {
    title:"کانجی ۵",
    stats:"آمار", settings:"تنظیمات", language:"زبان", persian:"فارسی", english:"English",
    learning:"یادگیری", activeRecall:"یادآوری فعال", learningPath:"مسیر یادگیری", sessionProgress:"پیشرفت جلسه",
    goToMain:"رفتن به محتوای اصلی", learningCard:"کارت یادگیری", newKanji:"جدید", learningReview:"مرور یادگیری",
    cardBack:"پشت کارت", showKanjiInfo:"نمایش اطلاعات کانجی",
    again:"دوباره", hard:"سخت", good:"خوب", easy:"آسان",
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
    playReading:"پخش", vocabularyExamples:"نمونهٔ واژگانی",
    correctRecall:"بازیابی درست بود.", correctAnswer:"پاسخ درست", personalMnemonic:"یادسپار شخصی", personalMnemonicHint:"یک تصویر، داستان، ارتباط یا عبارت کوتاه بنویس که این کانجی را برایت قابل‌یادآوری‌تر کند.", mnemonicPlaceholder:"یادسپار خودت را اینجا بنویس…", saveMnemonic:"ذخیرهٔ یادسپار", editMnemonic:"ویرایش", cancel:"لغو", saving:"در حال ذخیره…", mnemonicLoadError:"یادسپار این کانجی بارگذاری نشد.", mnemonicSaveError:"ذخیرهٔ یادسپار انجام نشد.", dictionary:"فرهنگ کانجی", dictionaryTitle:"جست‌وجوی کانجی", dictionaryPlaceholder:"کانجی، خوانش یا معنی را جست‌وجو کن", dictionaryHint:"می‌توانی خود کانجی، خوانش یا معنی انگلیسی آن را وارد کنی.", dictionarySearching:"در حال جست‌وجو…", dictionaryNoResults:"نتیجه‌ای پیدا نشد.", dictionaryStrokes:"استروک", dictionaryGrade:"پایه", dictionaryJlpt:"JLPT", dictionaryFrequency:"فراوانی", dictionaryOn:"اُن‌یومی", dictionaryKun:"کُن‌یومی", masteryMap:"نقشهٔ تسلط", masteryMapHint:"پراکندگی وضعیت یادگیری در مجموعهٔ کانجی", masteryAverage:"میانگین", masteryMastered:"مسلط", masteryStable:"پایدار", masteryLearning:"در حال یادگیری", masteryNeedsAttention:"نیازمند توجه", masteryUnseen:"دیده‌نشده", dictionaryMastery:"تسلط", dictionaryCardTitle:"کارت کانجی", dictionaryLoading:"در حال بارگذاری کانجی‌ها…", dictionaryGrid:"فهرست کانجی‌ها", dictionaryLevel:"سطح JLPT", allLevels:"همه", customStudy:"مطالعهٔ سفارشی", customStudyHint:"با سطح JLPT فعلی و یک تمرکز مشخص، فقط کانجی‌های قابل‌مطالعه را در یک جلسه جدا کن.", customFocus:"تمرکز مطالعه", customAvailable:"قابل مطالعه", customDue:"فقط مرورهای سررسیدشده", customNew:"فقط جدیدها", customWeak:"ضعیف / نیازمند بازیابی", customLimit:"حداکثر کارت", customStart:"شروع مطالعه", customNoCards:"برای این فیلتر فعلاً کارت قابل‌مطالعه‌ای وجود ندارد.", dictionarySort:"مرتب‌سازی", sortLevelAsc:"سطح: N5 ← N1", sortLevelDesc:"سطح: N1 ← N5", sortMasteryDesc:"تسلط: بیشتر ← کمتر", sortMasteryAsc:"تسلط: کمتر ← بیشتر", sortOriginal:"ترتیب اصلی", masteryOverview:"نمای کلی تسلط", masterySignal:"سیگنال تسلط", modelConfidence:"اعتماد مدل", sevenDayActivity:"فعالیت ۷ روز اخیر", reviewsCount:"مرور", cardPage:"صفحه اطلاعات کارت", previousCardPage:"صفحه قبلی کارت", nextCardPage:"صفحه بعدی کارت", swipeForMore:"برای اطلاعات بیشتر سوایپ کن"
  },
  en: {
    title:"Kanji 5",
    stats:"Stats", settings:"Settings", language:"Language", persian:"فارسی", english:"English",
    learning:"Learning", activeRecall:"Active Recall", learningPath:"Learning path", sessionProgress:"Session progress",
    goToMain:"Skip to main content", learningCard:"Learning card", newKanji:"New", learningReview:"Learning review",
    cardBack:"Card back", showKanjiInfo:"Show kanji information",
    again:"Again", hard:"Hard", good:"Good", easy:"Easy",
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
    playReading:"Play", vocabularyExamples:"Vocabulary examples",
    correctRecall:"Recall was correct.", correctAnswer:"Correct answer", personalMnemonic:"Personal mnemonic", personalMnemonicHint:"Write a brief image, story, association, or phrase that makes this kanji easier for you to remember.", mnemonicPlaceholder:"Write your mnemonic here…", saveMnemonic:"Save mnemonic", editMnemonic:"Edit", cancel:"Cancel", saving:"Saving…", mnemonicLoadError:"This kanji's mnemonic could not be loaded.", mnemonicSaveError:"The mnemonic could not be saved.", dictionary:"Kanji dictionary", dictionaryTitle:"Kanji dictionary", dictionaryPlaceholder:"Search kanji, reading, or meaning", dictionaryHint:"Search by the kanji itself, a reading, or an English meaning.", dictionarySearching:"Searching…", dictionaryNoResults:"No results found.", dictionaryStrokes:"Strokes", dictionaryGrade:"Grade", dictionaryJlpt:"JLPT", dictionaryFrequency:"Frequency", dictionaryOn:"On’yomi", dictionaryKun:"Kun’yomi", masteryMap:"Mastery map", masteryMapHint:"How your kanji learning is distributed across states", masteryAverage:"Average", masteryMastered:"Mastered", masteryStable:"Stable", masteryLearning:"Learning", masteryNeedsAttention:"Needs attention", masteryUnseen:"Unseen", dictionaryMastery:"Mastery", dictionaryCardTitle:"Kanji card", dictionaryLoading:"Loading kanji…", dictionaryGrid:"Kanji catalog", dictionaryLevel:"JLPT level", allLevels:"All", customStudy:"Custom study", customStudyHint:"Use the current JLPT filter and a focus to build a session from cards that are safe to study now.", customFocus:"Study focus", customAvailable:"Available now", customDue:"Due only", customNew:"New only", customWeak:"Weak / recovery", customLimit:"Card limit", customStart:"Start study", customNoCards:"There are no cards available for this filter right now.", dictionarySort:"Sort", sortLevelAsc:"Level: N5 → N1", sortLevelDesc:"Level: N1 → N5", sortMasteryDesc:"Mastery: high → low", sortMasteryAsc:"Mastery: low → high", sortOriginal:"Original order", masteryOverview:"Mastery overview", masterySignal:"Mastery signal", modelConfidence:"Model confidence", sevenDayActivity:"7-day review activity", reviewsCount:"reviews", cardPage:"Card information page", previousCardPage:"Previous card information page", nextCardPage:"Next card information page", swipeForMore:"Swipe for more information"
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
    document.title = language === "fa" ? "Kanji 5 — پنج کانجی در روز" : "Kanji 5 — Five kanji a day";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", language === "fa" ? "۵ کانجی مهم ژاپنی در روز با مرور فاصله‌دار تطبیقی" : "Five important Japanese kanji a day with adaptive spaced review");
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
  showKanjiInfo:"Show kanji information",
  answerPlaceholder:"Enter your answer",
  exerciseReady:"No exercise is ready yet.",
  correctRecall:"Recall was correct.",
  correctAnswer:"Correct answer",
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
