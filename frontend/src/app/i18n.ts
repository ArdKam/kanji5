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
  | "readingReader"
  | "readingReaderHint"
  | "importAudio"
  | "readingAudio"
  | "componentLearningPath"
  | "componentLearningPathHint"
  | "componentLearningPathLeaf"
  | "masteryShort"
  | "notInCatalog"
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
  | "dictionaryVocabulary"
  | "dictionaryVocabularyHint"
  | "dictionaryVocabularyEmpty"
  | "dictionaryStrokes"
  | "dictionaryGrade"
  | "dictionaryJlpt"
  | "dictionaryFrequency"
  | "dictionaryOn"
  | "dictionaryKun"
  | "dictionaryMastery"
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
  | "strokeOrder"
  | "strokeOrderHint"
  | "strokeOrderLoading"
  | "strokeOrderUnavailable"
  | "strokeOrderAria"
  | "strokeOrderProgress"
  | "strokesLabel"
  | "previousStroke"
  | "playStrokeOrder"
  | "replayStrokeOrder"
  | "nextStroke"
  | "resetStrokeOrder"
  | "mnemonicPlaceholder"
  | "saveMnemonic"
  | "editMnemonic"
  | "cancel"
  | "saving"
  | "mnemonicLoadError"
  | "mnemonicSaveError"
  | "sevenDayActivity"
  | "reviewsCount"
  | "preparedMnemonics"
  | "preparedMnemonicsHint"
  | "useMnemonic"
  | "mnemonicApplied"
  | "mnemonicOverwriteConfirm"
  | "preparedMnemonicNone"
  | "masteryDistribution"
  | "masteryRangeLow"
  | "masteryRangeDeveloping"
  | "masteryRangeStrong"
  | "masteryRangeMastered"
  | "preparedMnemonicLibrary"
  | "preparedMnemonicLibraryHint"
  | "preparedMnemonicLibrarySearch"
  | "placementDiagnostic"
  | "placementDiagnosticHint"
  | "startDiagnostic"
  | "diagnosticResult"
  | "diagnosticSuggestedLevel"
  | "retakeDiagnostic"
  | "startSuggestedStudy"
  | "diagnosticQuestion"
  | "diagnosticMeaningPrompt"
  | "diagnosticCorrect"
  | "diagnosticIncorrect"
  | "finishDiagnostic"
  | "nextDiagnostic"
  | "handwritingPractice"
  | "handwritingHint"
  | "handwritingUnavailable"
  | "clearDrawing"
  | "gradeDrawing"
  | "handwritingGreat"
  | "handwritingGood"
  | "handwritingRetry"
  | "readingLab"
  | "readingLabHint"
  | "readingTextPlaceholder"
  | "readingLabCharacters"
  | "readingLabKanji"
  | "readingLabKnownKanji"
  | "readingLabNoKnownKanji"
  | "lookupKanji"
  | "importSubtitle"
  | "clearReadingText"
  | "grammarGuide"
  | "grammarProgress"
  | "previousLesson"
  | "nextLesson"
  | "contentBackup"
  | "contentBackupHint"
  | "exportContent"
  | "importContent"
  | "contentBackupScope"
  | "contentImportConfirm"
  | "contentBackupError"
  | "account"
  | "signIn"
  | "googleAccount"
  | "accountTitle"
  | "accountLoading"
  | "accountUnavailable"
  | "accountUnavailableHint"
  | "accountIntro"
  | "continueWithGoogle"
  | "signingIn"
  | "guestModeHint"
  | "accountSyncHint"
  | "syncing"
  | "synced"
  | "syncError"
  | "syncNow"
  | "signOut"
  | "localFirst"
  | "cloudSync"
  | "accountMethods"
  | "emailPassword"
  | "magicLink"
  | "email"
  | "password"
  | "signInWithEmail"
  | "createAccount"
  | "createAccountAction"
  | "sendMagicLink"
  | "magicLinkSent"
  | "accountCheckEmail"
  | "emailRequired"
  | "emailPasswordRequired"
  | "passwordTooShort"
  | "authError"
  | "or"
  | "signedIn"
  | "alreadyAccount"
  | "googleComingSoon"
  | "profile"
  | "security"
  | "accountSync"
  | "displayName"
  | "displayNameHint"
  | "saveProfile"
  | "profileSaved"
  | "nameRequired"
  | "nameTooLong"
  | "currentPassword"
  | "newPassword"
  | "confirmPassword"
  | "changePassword"
  | "passwordChanged"
  | "passwordRequired"
  | "passwordMismatch"
  | "passwordChangeError"
  | "emailReadonly"
  | "accountOverview"
  | "passwordHint";

const messages: Record<Language, Record<TranslationKey, string>> = {
  fa: {
    title:"کانجی ۵",
    stats:"آمار", settings:"تنظیمات", language:"زبان", persian:"فارسی", english:"English",
    learning:"یادگیری", activeRecall:"یادآوری فعال", learningPath:"مسیر یادگیری", sessionProgress:"پیشرفت جلسه",
    goToMain:"رفتن به محتوای اصلی", learningCard:"کارت یادگیری", newKanji:"جدید", learningReview:"مرور یادگیری",
    cardBack:"پشت کارت", showKanjiInfo:"نمایش اطلاعات کانجی",
    again:"دوباره", hard:"سخت", good:"خوب", easy:"آسان",
    meaning:"معنی", reading:"خوانش", production:"تولید", componentLearningPath:"مسیر یادگیری اجزای کانجی", componentLearningPathHint:"اجزای سازنده را از پایه تا کانجی ببین و برای هر جزء تسلط فعلی را بررسی کن.", componentLearningPathLeaf:"جزء پایه", masteryShort:"تسلط", notInCatalog:"در فهرست نیست", vocabulary:"واژگان", context:"بافت",
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
    correctRecall:"بازیابی درست بود.", correctAnswer:"پاسخ درست", strokeOrder:"ترتیب نوشتن", strokeOrderHint:"ترتیب هر حرکت را ببین و با آن همراه شو.", strokeOrderLoading:"در حال بارگذاری ترتیب نوشتن…", strokeOrderUnavailable:"اطلاعات ترتیب نوشتن فعلاً در دسترس نیست.", strokeOrderAria:"نمایش ترتیب نوشتن کانجی", strokeOrderProgress:"پیشرفت ترتیب نوشتن", strokesLabel:"حرکت", previousStroke:"قبلی", playStrokeOrder:"پخش", replayStrokeOrder:"پخش دوباره", nextStroke:"بعدی", resetStrokeOrder:"شروع از اول", personalMnemonic:"یادسپار شخصی", personalMnemonicHint:"یک تصویر، داستان، ارتباط یا عبارت کوتاه بنویس که این کانجی را برایت قابل‌یادآوری‌تر کند.", mnemonicPlaceholder:"یادسپار خودت را اینجا بنویس…", saveMnemonic:"ذخیرهٔ یادسپار", editMnemonic:"ویرایش", cancel:"لغو", saving:"در حال ذخیره…", mnemonicLoadError:"یادسپار این کانجی بارگذاری نشد.", mnemonicSaveError:"ذخیرهٔ یادسپار انجام نشد.", dictionary:"فرهنگ کانجی", dictionaryTitle:"جست‌وجوی کانجی", dictionaryPlaceholder:"کانجی، خوانش یا معنی را جست‌وجو کن", dictionaryHint:"می‌توانی خود کانجی، خوانش یا معنی انگلیسی آن را وارد کنی.", dictionarySearching:"در حال جست‌وجو…", dictionaryNoResults:"نتیجه‌ای پیدا نشد.", dictionaryVocabulary:"نمونه‌های واژگانی", dictionaryVocabularyHint:"چند واژهٔ رایج شامل این کانجی برای دیدن آن در بافت واژگانی.", dictionaryVocabularyEmpty:"برای این کانجی فعلاً واژه‌ای از منبع واژگان در دسترس نیست.", dictionaryStrokes:"استروک", dictionaryGrade:"پایه", dictionaryJlpt:"JLPT", dictionaryFrequency:"فراوانی", dictionaryOn:"اُن‌یومی", dictionaryKun:"کُن‌یومی", masteryMap:"نقشهٔ تسلط", masteryMapHint:"پراکندگی وضعیت یادگیری در مجموعهٔ کانجی", masteryAverage:"میانگین", masteryMastered:"مسلط", masteryStable:"پایدار", masteryLearning:"در حال یادگیری", masteryNeedsAttention:"نیازمند توجه", masteryUnseen:"دیده‌نشده", dictionaryMastery:"تسلط", dictionaryLoading:"در حال بارگذاری کانجی‌ها…", dictionaryGrid:"فهرست کانجی‌ها", dictionaryLevel:"سطح JLPT", allLevels:"همه", customStudy:"مطالعهٔ سفارشی", customStudyHint:"با سطح JLPT فعلی و یک تمرکز مشخص، فقط کانجی‌های قابل‌مطالعه را در یک جلسه جدا کن.", customFocus:"تمرکز مطالعه", customAvailable:"قابل مطالعه", customDue:"فقط مرورهای سررسیدشده", customNew:"فقط جدیدها", customWeak:"ضعیف / نیازمند بازیابی", customLimit:"حداکثر کارت", customStart:"شروع مطالعه", customNoCards:"برای این فیلتر فعلاً کارت قابل‌مطالعه‌ای وجود ندارد.", dictionarySort:"مرتب‌سازی", sortLevelAsc:"سطح: N5 ← N1", sortLevelDesc:"سطح: N1 ← N5", sortMasteryDesc:"تسلط: بیشتر ← کمتر", sortMasteryAsc:"تسلط: کمتر ← بیشتر", sortOriginal:"ترتیب اصلی", masteryOverview:"نمای کلی تسلط", masterySignal:"سیگنال تسلط", modelConfidence:"اعتماد مدل", sevenDayActivity:"فعالیت ۷ روز اخیر", reviewsCount:"مرور", preparedMnemonics:"یادسپارهای آماده", preparedMnemonicsHint:"چند یادسپار کوتاه و از پیش آماده برای شروع؛ می‌توانی آن را به یادسپار شخصی خود تبدیل کنی.", useMnemonic:"استفاده", mnemonicApplied:"یادسپار آماده به یادسپار شخصی منتقل شد.", mnemonicOverwriteConfirm:"یادسپار شخصی فعلی جایگزین شود؟", preparedMnemonicNone:"برای این کانجی هنوز یادسپار آماده‌ای در کتابخانه نیست.", masteryDistribution:"توزیع میزان تسلط", masteryRangeLow:"۰–۲۴٪", masteryRangeDeveloping:"۲۵–۴۹٪", masteryRangeStrong:"۵۰–۷۴٪", masteryRangeMastered:"۷۵٪ به بالا", preparedMnemonicLibrary:"کتابخانهٔ یادسپارهای آماده", preparedMnemonicLibraryHint:"یادسپارهای آماده را جست‌وجو کن و همان‌جا روی کانجی ذخیره کن.", preparedMnemonicLibrarySearch:"جست‌وجوی کانجی یا متن یادسپار…", placementDiagnostic:"ارزیابی تعیین سطح", placementDiagnosticHint:"۱۲ سؤال کوتاه از معنی کانجی‌های N5 تا N2. نتیجه به پیشرفتت دست نمی‌زند و فقط برای تعیین نقطهٔ شروع استفاده می‌شود.", startDiagnostic:"شروع ارزیابی", diagnosticResult:"نتیجه", diagnosticSuggestedLevel:"سطح پیشنهادی برای شروع:", retakeDiagnostic:"ارزیابی دوباره", startSuggestedStudy:"شروع مطالعهٔ پیشنهادی", diagnosticQuestion:"سؤال", diagnosticMeaningPrompt:"کدام معنی با این کانجی مطابقت دارد؟", diagnosticCorrect:"درست بود.", diagnosticIncorrect:"این پاسخ درست نیست.", finishDiagnostic:"پایان ارزیابی", nextDiagnostic:"سؤال بعد", handwritingPractice:"تمرین دست‌خط", handwritingHint:"کانجی را روی راهنمای کم‌رنگ بکش؛ ارزیابی بر اساس میزان پوشش شکل انجام می‌شود.", handwritingUnavailable:"دادهٔ لازم برای تمرین دست‌خط در دسترس نیست.", clearDrawing:"پاک کردن", gradeDrawing:"ارزیابی دست‌خط", handwritingGreat:"بسیار نزدیک بود.", handwritingGood:"خوب بود؛ کمی دقیق‌تر بنویس.", handwritingRetry:"شکل با الگو فاصله دارد؛ دوباره امتحان کن.", readingLab:"آزمایشگاه خواندن", readingLabHint:"یک متن ژاپنی وارد کن؛ کانجی‌های Jōyō از متن استخراج می‌شوند و با یک لمس می‌توانی جزئیات هر کانجی را ببینی.", readingTextPlaceholder:"متن ژاپنی را اینجا وارد یا paste کن…", readingLabCharacters:"نویسه‌ها", readingLabKanji:"کانجی‌ها", readingLabKnownKanji:"کانجی‌های شناخته‌شده", readingReader:"حالت خواندن", readingReaderHint:"کانجی‌های شناخته‌شده را با توجه به تسلط فعلی ببین؛ برای جزئیات روی هر کانجی بزن.", importAudio:"افزودن فایل صوتی", readingAudio:"صدای متن خواندن", readingLabNoKnownKanji:"در این متن کانجی Jōyō شناخته‌شده‌ای پیدا نشد.", lookupKanji:"مشاهده در فرهنگ کانجی", importSubtitle:"ورود TXT / SRT / VTT", clearReadingText:"پاک کردن متن", grammarGuide:"راهنمای گرامر", grammarProgress:"پیشرفت گرامر", previousLesson:"درس قبلی", nextLesson:"درس بعدی", contentBackup:"پشتیبان یادسپارهای شخصی", contentBackupHint:"یادسپارهای شخصی را به‌صورت فایل JSON خروجی بگیر یا روی یک دستگاه دیگر بازیابی کن.", exportContent:"خروجی JSON", importContent:"بازیابی JSON", contentBackupScope:"فقط یادسپارهای شخصی Kanji5؛ پیشرفت و تنظیمات شامل این فایل نمی‌شوند.", contentImportConfirm:"یادسپارهای موجود برای کانجی‌های داخل فایل جایگزین شوند؟", contentBackupError:"فایل پشتیبان معتبر نبود یا عملیات با خطا روبه‌رو شد.", account:"حساب", signIn:"ورود", googleAccount:"حساب Google", accountTitle:"ورود به حساب Kanji5", accountLoading:"در حال آماده‌سازی حساب…", accountUnavailable:"ورود ابری هنوز پیکربندی نشده است.", accountUnavailableHint:"تنظیمات Supabase این نسخه کامل نشده است؛ حالت مهمان همچنان کار می‌کند.", accountIntro:"با حساب خودت وارد شو تا پیشرفتت بین دستگاه‌ها همگام شود. می‌توانی با ایمیل و رمز، لینک ورود یک‌بارمصرف، یا Google وارد شوی. یادگیری بدون حساب هم در همین دستگاه ادامه پیدا می‌کند.", continueWithGoogle:"ادامه با Google", signingIn:"در حال ورود…", guestModeHint:"ورود اختیاری است و بدون حساب هم می‌توانی از Kanji5 استفاده کنی.", accountSyncHint:"پیشرفت، یادسپارهای شخصی و وضعیت یادگیری این حساب به‌صورت محلی نگه‌داری و هنگام اتصال همگام می‌شوند.", syncing:"در حال همگام‌سازی…", synced:"همگام شد", syncError:"خطا در همگام‌سازی", syncNow:"همگام‌سازی الآن", signOut:"خروج از حساب", localFirst:"Local-first", cloudSync:"Cloud sync", accountMethods:"روش ورود", emailPassword:"ایمیل و رمز", magicLink:"لینک ورود", email:"ایمیل", password:"رمز عبور", signInWithEmail:"ورود با ایمیل", createAccount:"حساب نداری؟", createAccountAction:"ساخت حساب", sendMagicLink:"ارسال لینک ورود", magicLinkSent:"لینک ورود به ایمیلت ارسال شد.", accountCheckEmail:"حساب ساخته شد؛ برای ادامه ایمیلت را تأیید کن.", emailRequired:"ایمیل را وارد کن.", emailPasswordRequired:"ایمیل و رمز را وارد کن.", passwordTooShort:"رمز عبور باید حداقل ۶ نویسه باشد.", authError:"ورود انجام نشد. دوباره تلاش کن.", or:"یا", signedIn:"وارد شدی.", alreadyAccount:"حساب داری؟", googleComingSoon:"ورود با Google به‌زودی فعال می‌شود.", profile:"پروفایل", security:"امنیت", accountSync:"همگام‌سازی", displayName:"نام نمایشی", displayNameHint:"این نام کنار حساب تو در Kanji5 نمایش داده می‌شود.", saveProfile:"ذخیره پروفایل", profileSaved:"نام نمایشی ذخیره شد.", nameRequired:"نام نمایشی را وارد کن.", nameTooLong:"نام نمایشی باید حداکثر ۴۰ نویسه باشد.", currentPassword:"رمز فعلی", newPassword:"رمز جدید", confirmPassword:"تکرار رمز جدید", changePassword:"تغییر رمز عبور", passwordChanged:"رمز عبور با موفقیت تغییر کرد.", passwordRequired:"هر دو رمز عبور را وارد کن.", passwordMismatch:"رمز جدید و تکرار آن یکسان نیستند.", passwordChangeError:"تغییر رمز عبور انجام نشد.", emailReadonly:"ایمیل حساب", accountOverview:"مدیریت حساب، پروفایل و امنیت", passwordHint:"برای تغییر رمز، ابتدا رمز فعلی را وارد کن.", cardPage:"صفحه اطلاعات کارت", previousCardPage:"صفحه قبلی کارت", nextCardPage:"صفحه بعدی کارت", swipeForMore:"برای اطلاعات بیشتر سوایپ کن"
  },
  en: {
    title:"Kanji 5",
    stats:"Stats", settings:"Settings", language:"Language", persian:"فارسی", english:"English",
    learning:"Learning", activeRecall:"Active Recall", learningPath:"Learning path", sessionProgress:"Session progress",
    goToMain:"Skip to main content", learningCard:"Learning card", newKanji:"New", learningReview:"Learning review",
    cardBack:"Card back", showKanjiInfo:"Show kanji information",
    again:"Again", hard:"Hard", good:"Good", easy:"Easy",
    meaning:"Meaning", reading:"Reading", production:"Production", componentLearningPath:"Component learning path", componentLearningPathHint:"See the visual building blocks and their current Jōyō mastery.", componentLearningPathLeaf:"Base component", masteryShort:"Mastery", notInCatalog:"Not in catalog", vocabulary:"Vocabulary", context:"Context",
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
    correctRecall:"Recall was correct.", correctAnswer:"Correct answer", strokeOrder:"Stroke order", strokeOrderHint:"Watch the stroke sequence and follow each movement.", strokeOrderLoading:"Loading stroke order…", strokeOrderUnavailable:"Stroke-order data is not available right now.", strokeOrderAria:"Kanji stroke-order display", strokeOrderProgress:"Stroke-order progress", strokesLabel:"strokes", previousStroke:"Previous", playStrokeOrder:"Play", replayStrokeOrder:"Replay", nextStroke:"Next", resetStrokeOrder:"Reset", personalMnemonic:"Personal mnemonic", personalMnemonicHint:"Write a brief image, story, association, or phrase that makes this kanji easier for you to remember.", mnemonicPlaceholder:"Write your mnemonic here…", saveMnemonic:"Save mnemonic", editMnemonic:"Edit", cancel:"Cancel", saving:"Saving…", mnemonicLoadError:"This kanji's mnemonic could not be loaded.", mnemonicSaveError:"The mnemonic could not be saved.", dictionary:"Kanji dictionary", dictionaryTitle:"Kanji dictionary", dictionaryPlaceholder:"Search kanji, reading, or meaning", dictionaryHint:"Search by the kanji itself, a reading, or an English meaning.", dictionarySearching:"Searching…", dictionaryNoResults:"No results found.", dictionaryVocabulary:"Vocabulary examples", dictionaryVocabularyHint:"A few common words containing this kanji, for seeing it in lexical context.", dictionaryVocabularyEmpty:"No vocabulary examples are currently available for this kanji.", dictionaryStrokes:"Strokes", dictionaryGrade:"Grade", dictionaryJlpt:"JLPT", dictionaryFrequency:"Frequency", dictionaryOn:"On’yomi", dictionaryKun:"Kun’yomi", masteryMap:"Mastery map", masteryMapHint:"How your kanji learning is distributed across states", masteryAverage:"Average", masteryMastered:"Mastered", masteryStable:"Stable", masteryLearning:"Learning", masteryNeedsAttention:"Needs attention", masteryUnseen:"Unseen", dictionaryMastery:"Mastery", dictionaryLoading:"Loading kanji…", dictionaryGrid:"Kanji catalog", dictionaryLevel:"JLPT level", allLevels:"All", customStudy:"Custom study", customStudyHint:"Use the current JLPT filter and a focus to build a session from cards that are safe to study now.", customFocus:"Study focus", customAvailable:"Available now", customDue:"Due only", customNew:"New only", customWeak:"Weak / recovery", customLimit:"Card limit", customStart:"Start study", customNoCards:"There are no cards available for this filter right now.", dictionarySort:"Sort", sortLevelAsc:"Level: N5 → N1", sortLevelDesc:"Level: N1 → N5", sortMasteryDesc:"Mastery: high → low", sortMasteryAsc:"Mastery: low → high", sortOriginal:"Original order", masteryOverview:"Mastery overview", masterySignal:"Mastery signal", modelConfidence:"Model confidence", sevenDayActivity:"7-day review activity", reviewsCount:"reviews", preparedMnemonics:"Prepared mnemonics", preparedMnemonicsHint:"Short, prewritten memory cues to get you started; you can save one as your personal mnemonic.", useMnemonic:"Use", mnemonicApplied:"Prepared mnemonic saved as your personal mnemonic.", mnemonicOverwriteConfirm:"Replace your existing personal mnemonic?", preparedMnemonicNone:"No prepared mnemonic is available for this kanji yet.", masteryDistribution:"Mastery distribution", masteryRangeLow:"0–24%", masteryRangeDeveloping:"25–49%", masteryRangeStrong:"50–74%", masteryRangeMastered:"75%+", preparedMnemonicLibrary:"Prepared mnemonic library", preparedMnemonicLibraryHint:"Search prepared mnemonics and save one directly to the kanji.", preparedMnemonicLibrarySearch:"Search kanji or mnemonic text…", placementDiagnostic:"Placement check", placementDiagnosticHint:"12 short meaning questions using kanji from N5 through N2. It does not change your progress; it only helps choose a starting level.", startDiagnostic:"Start diagnostic", diagnosticResult:"Result", diagnosticSuggestedLevel:"Suggested starting level:", retakeDiagnostic:"Retake", startSuggestedStudy:"Start suggested study", diagnosticQuestion:"Question", diagnosticMeaningPrompt:"Which meaning matches this kanji?", diagnosticCorrect:"Correct.", diagnosticIncorrect:"That is not the correct answer.", finishDiagnostic:"Finish diagnostic", nextDiagnostic:"Next question", handwritingPractice:"Handwriting practice", handwritingHint:"Trace the kanji over the light guide; grading uses overlap with the reference shape.", handwritingUnavailable:"The data needed for handwriting practice is unavailable.", clearDrawing:"Clear", gradeDrawing:"Grade handwriting", handwritingGreat:"Very close.", handwritingGood:"Good match; try to trace a little more precisely.", handwritingRetry:"The shape is still far from the reference; try again.", readingLab:"Reading lab", readingLabHint:"Paste Japanese text to extract Jōyō kanji from it. Tap any detected kanji to open its dictionary details.", readingTextPlaceholder:"Paste Japanese text here…", readingLabCharacters:"Characters", readingLabKanji:"Kanji", readingLabKnownKanji:"Known kanji", readingReader:"Reader mode", readingReaderHint:"See Jōyō kanji with their current mastery and open any one for details.", importAudio:"Add audio file", readingAudio:"Reader audio", readingLabNoKnownKanji:"No known Jōyō kanji were found in this text.", lookupKanji:"View in kanji dictionary", importSubtitle:"Import TXT / SRT / VTT", clearReadingText:"Clear text", grammarGuide:"Grammar guide", grammarProgress:"Grammar progress", previousLesson:"Previous lesson", nextLesson:"Next lesson", contentBackup:"Personal mnemonic backup", contentBackupHint:"Export your personal mnemonics as JSON or restore them on another device.", exportContent:"Export JSON", importContent:"Restore JSON", contentBackupScope:"Personal Kanji5 mnemonics only; progress and settings are not included.", contentImportConfirm:"Replace existing mnemonics for the kanji in this file?", contentBackupError:"The backup was invalid or the operation failed.", account:"Account", signIn:"Sign in", googleAccount:"Google account", accountTitle:"Sign in to Kanji5", accountLoading:"Preparing your account…", accountUnavailable:"Cloud sign-in is not configured yet.", accountUnavailableHint:"Supabase configuration is not complete for this build; guest mode still works.", accountIntro:"Sign in to sync your progress across devices. You can use email and password, a magic link, or Google. You can keep learning without an account on this device.", continueWithGoogle:"Continue with Google", signingIn:"Signing in…", guestModeHint:"Sign-in is optional. Kanji5 remains usable without an account.", accountSyncHint:"Progress, personal mnemonics, and learning state stay local-first and sync when connected.", syncing:"Syncing…", synced:"Synced", syncError:"Sync error", syncNow:"Sync now", signOut:"Sign out", localFirst:"Local-first", cloudSync:"Cloud sync", accountMethods:"Sign-in method", emailPassword:"Email & password", magicLink:"Magic link", email:"Email", password:"Password", signInWithEmail:"Sign in with email", createAccount:"Need an account?", createAccountAction:"Create account", sendMagicLink:"Send magic link", magicLinkSent:"A sign-in link was sent to your email.", accountCheckEmail:"Your account was created. Check your email to continue.", emailRequired:"Enter your email.", emailPasswordRequired:"Enter your email and password.", passwordTooShort:"Password must be at least 6 characters.", authError:"Sign-in failed. Please try again.", or:"or", signedIn:"Signed in.", alreadyAccount:"Already have an account?", googleComingSoon:"Google sign-in will be enabled soon.", profile:"Profile", security:"Security", accountSync:"Sync", displayName:"Display name", displayNameHint:"This name is shown with your Kanji5 account.", saveProfile:"Save profile", profileSaved:"Display name saved.", nameRequired:"Enter a display name.", nameTooLong:"Display name must be 40 characters or fewer.", currentPassword:"Current password", newPassword:"New password", confirmPassword:"Confirm new password", changePassword:"Change password", passwordChanged:"Password changed successfully.", passwordRequired:"Enter both passwords.", passwordMismatch:"The new passwords do not match.", passwordChangeError:"Password change failed.", emailReadonly:"Account email", accountOverview:"Manage your account, profile, and security", passwordHint:"Enter your current password before choosing a new one.", cardPage:"Card information page", previousCardPage:"Previous card information page", nextCardPage:"Next card information page", swipeForMore:"Swipe for more information"
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
