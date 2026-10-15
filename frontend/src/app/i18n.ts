export type Language = "fa" | "en"; // Settings-owned language preference // Persisted bilingual presentation language

const STORAGE_KEY = "kanji5-ui-language";

type TranslationKey =
  | "title"
  | "smartLearning"
  | "more"
  | "moreMenuTitle"
  | "menuLearningTools"
  | "menuProgress"
  | "menuPreferences"
  | "appearance"
  | "themeLight"
  | "themeDark"
  | "themeSystem"
  | "closeMenu"
  | "dailySummary"
  | "of"
  | "learningBadge"
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
  | "meaningAndStructure"
  | "readings"
  | "showHiragana"
  | "showKatakana"
  | "showAllReadingsInHiragana"
  | "useNormalReadingNotation"
  | "reviewedPersianMeaningUnavailable"
  | "pageOf"
  | "actionFailed"
  | "footerTagline"
  | "onboardingEyebrow"
  | "onboardingTitle"
  | "onboardingIntro"
  | "learningLoop"
  | "learningReviewLabel"
  | "onboardingGoalTitle"
  | "onboardingGoalHint"
  | "onboardingStart"
  | "onboardingAccount"
  | "onboardingLater"
  | "onboardingWelcomeEyebrow"
  | "onboardingWelcomeTitle"
  | "onboardingWelcomeBody"
  | "onboardingLoopEyebrow"
  | "onboardingLoopTitle"
  | "onboardingLearn"
  | "onboardingLearnHint"
  | "onboardingRecall"
  | "onboardingRecallHint"
  | "onboardingReview"
  | "onboardingReviewHint"
  | "onboardingStartPointEyebrow"
  | "onboardingStartPointTitle"
  | "onboardingStartPointBody"
  | "onboardingBeginner"
  | "onboardingBeginnerHint"
  | "onboardingSomeKnowledge"
  | "onboardingSomeKnowledgeHint"
  | "onboardingAssess"
  | "onboardingAssessHint"
  | "onboardingPlacementEyebrow"
  | "onboardingPlacementTitle"
  | "onboardingPlacementLoading"
  | "onboardingPlacementRetry"
  | "onboardingPlacementUnavailable"
  | "onboardingQuestionLabel"
  | "onboardingQuestionProgress"
  | "onboardingPlacementNext"
  | "onboardingPlacementFinish"
  | "onboardingPlacementResultEyebrow"
  | "onboardingPlacementResultTitle"
  | "onboardingPlacementResultBody"
  | "onboardingPlacementRecommended"
  | "onboardingPlacementUse"
  | "onboardingPlacementRestart"
  | "onboardingRhythmEyebrow"
  | "onboardingRhythmTitle"
  | "onboardingRhythmBody"
  | "onboardingDailyNew"
  | "onboardingDailyNewHint"
  | "onboardingAccountEyebrow"
  | "onboardingAccountTitle"
  | "onboardingAccountBody"
  | "onboardingContinueGuest"
  | "onboardingGuestHint"
  | "onboardingSkip"
  | "onboardingBack"
  | "onboardingNext"
  | "onboardingClose"
  | "onboardingLanguage"
  | "onboardingSwipeHint"
  | "onboardingBrand"
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
  | "readingSpeechControls"
  | "readingSpeakText"
  | "readingSpeaking"
  | "readingStopSpeech"
  | "readingSpeechRate"
  | "readingSpeechVoice"
  | "readingSpeechVoiceDefault"
  | "readingSpeechUnsupported"
  | "componentLearningPath"
  | "componentLearningPathHint"
  | "componentLearningPathLeaf"
  | "masteryShort"
  | "notInCatalog"
  | "vocabulary"
  | "vocabularyLearningGraph"
  | "vocabularyLearningGraphHint"
  | "context"
  | "unknown"
  | "correct"
  | "wrong"
  | "nearMiss"
  | "empty"
  | "unavailable"
  | "activeRecallLabel"
  | "currentExercise"
  | "exitPractice"
  | "contentIntroductionPrompt"
  | "contentIntroductionHint"
  | "yourChoice"
  | "correctChoice"
  | "exerciseReady"
  | "answerYourself"
  | "answerPlaceholder"
  | "checkAnswer"
  | "dontKnow"
  | "productionRecallInstruction"
  | "freeRecallModality"
  | "productionModality"
  | "productionCuedModality"
  | "revealedSelfReportModality"
  | "vocabularyModality"
  | "contextModality"
  | "contentExposureModality"
  | "revealAnswer"
  | "revealedAnswer"
  | "iKnewIt"
  | "iDidntKnow"
  | "useOptionsHint"
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
  | "settingsUnsaved"
  | "settingsDiscardTitle"
  | "settingsDiscardHint"
  | "settingsKeepEditing"
  | "settingsDiscardChanges"
  | "settingsSaveChanges"
  | "settingsNoChanges"
  | "targetRetention"
  | "targetRetentionHint"
  | "difficultCardThreshold"
  | "difficultCardThresholdHint"
  | "personalMnemonicBackupTitle"
  | "personalMnemonicBackupHint"
  | "dataBackupTitle"
  | "dataBackupContains"
  | "dataBackupLast"
  | "dataBackupNever"
  | "exportBackup"
  | "restoreBackup"
  | "backupExported"
  | "backupRestoreConfirmTitle"
  | "backupRestoreConfirmHint"
  | "backupRestoreCancel"
  | "backupRestoreProceed"
  | "backupRestoreSuccess"
  | "backupInvalid"
  | "backupWriteError"
  | "backupCounts"
  | "placementLivesInPractice"
  | "placementLivesInPracticeHint"
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
  | "fsrsRetention"
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
  | "runtimeFailureTitle"
  | "runtimeFailureHint"
  | "runtimeFailureBackup"
  | "runtimeFailureReport"
  | "runtimeFailureCopied"
  | "audioUnavailable"
  | "playKanjiPronunciation"
  | "playWordPronunciation"
  | "playReading"
  | "vocabularyExamples"
  | "correctRecall"
  | "correctAnswer"
  | "dictionary"
  | "dictionaryTitle"
  | "dictionaryCardOptions"
  | "structure"
  | "additionalInformation"
  | "kanjiStructure"
  | "visualComponents"
  | "visualKanjiStructure"
  | "structureUnavailable"
  | "structureAtomic"
  | "dictionaryPlaceholder"
  | "dictionaryTopicLabel"
  | "dictionaryTopicAll"
  | "dictionaryTopicPickerTitle"
  | "dictionaryTopicCoverageNote"
  | "dictionaryTopicSearch"
  | "dictionaryTopicClearSearch"
  | "dictionaryTopicClose"
  | "dictionaryTopicNoResults"
  | "dictionaryTopicGroupBasics"
  | "dictionaryTopicGroupWorld"
  | "dictionaryTopicGroupSociety"
  | "dictionaryTopicGroupActions"
  | "dictionarySearching"
  | "dictionaryNoResults"
  | "dictionaryVocabulary"
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
  | "dictionaryMoreFilters"
  | "dictionaryActiveFiltersCount"
  | "dictionaryClearExtraFilters"
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
  | "practiceTitle"
  | "practiceRecommendedLabel"
  | "practiceRecommendedTitle"
  | "practiceRecommendedHint"
  | "practiceTopicsTitle"
  | "practiceTopicStart"
  | "practiceTopicSelectedHint"
  | "practiceTopicCount"
  | "practiceTopicsShowAll"
  | "practiceTopicsLoading"
  | "practiceTopicsLoadError"
  | "practiceTopicsRetry"
  | "practiceTopicCoverageNote"
  | "practiceAdvancedTitle"
  | "practiceAdvancedHint"
  | "practicePlacementTitle"
  | "practicePlacementHint"
  | "practiceTopicStarting"
  | "practiceTopicSessionLabel"
  | "customRecentMistakes"
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
  | "preparedMnemonicCurated"
  | "preparedMnemonicScaffold"
  | "memoryAid"
  | "mnemonicBridges"
  | "readingMnemonic"
  | "lookalikeContrast"
  | "makeMnemonicYourOwn"
  | "preparedMnemonicLoadMore"
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
  | "preparedMnemonicLibrarySearch"
  | "placementDiagnostic"
  | "placementDiagnosticHint"
  | "startDiagnostic"
  | "diagnosticResult"
  | "diagnosticSuggestedLevel"
  | "diagnosticPlacementBoundary"
  | "diagnosticPlacementUpperBound"
  | "diagnosticPlacementLimited"
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
  | "handwritingPracticeHelp"
  | "handwritingUnavailable"
  | "clearDrawing"
  | "undoLastStroke"
  | "gradeDrawing"
  | "handwritingSimilarity"
  | "handwritingGreat"
  | "handwritingGood"
  | "handwritingRetry"
  | "handwritingFeedbackStrokeCount"
  | "handwritingFeedbackOrder"
  | "handwritingFeedbackPlacement"
  | "handwritingFeedbackEndpoints"
  | "handwritingFeedbackDirection"
  | "handwritingFeedbackLength"
  | "handwritingFeedbackCurvature"
  | "handwritingFeedbackShape"
  | "handwritingStrokeDetail"
  | "handwritingHintLevel"
  | "handwritingTrace"
  | "handwritingGhost"
  | "handwritingStrokeGuide"
  | "handwritingMinimal"
  | "handwritingRecall"
  | "handwritingMoreHelp"
  | "handwritingLiveStroke"
  | "handwritingFocusStroke"
  | "handwritingFocusHint"
  | "handwritingPromptMeaning"
  | "handwritingPromptReading"
  | "handwritingPromptVocabulary"
  | "handwritingPromptContext"
  | "handwritingPromptProduction"
  | "handwritingPromptFallback"
  | "readingLab"
  | "readingTextPlaceholder"
  | "readingLabCharacters"
  | "readingLabKanji"
  | "readingLabKnownKanji"
  | "readingLabNoKnownKanji"
  | "readingLabSource"
  | "readingLabSourceTitle"
  | "readingLabImportHint"
  | "readingLabListen"
  | "readingLabListenTitle"
  | "readingLabAnalysis"
  | "readingLabCoverage"
  | "readingLabOccurrenceCoverage"
  | "readingLabHardestSentence"
  | "readingLabFamiliar"
  | "readingLabLearning"
  | "readingLabAttention"
  | "readingLabNew"
  | "readingLabAttentionEyebrow"
  | "readingLabNeedsAttention"
  | "readingLabReaderEyebrow"
  | "readingLabLegend"
  | "readingLabLegendFamiliar"
  | "readingLabLegendLearning"
  | "readingLabLegendAttention"
  | "readingLabLegendNew"
  | "readingLabEmptyEyebrow"
  | "readingLabEmptyTitle"
  | "readingLabEmptyHint"
  | "lookupKanji"
  | "importSubtitle"
  | "clearReadingText"
  | "readingLabSentenceMode"
  | "readingLabFocusControls"
  | "readingLabFocusNext"
  | "readingLabNextUnknown"
  | "readingLabHardestSentence"
  | "readingLabAutoplay"
  | "readingLabRepeatSentence"
  | "readingLabSentence"
  | "readingLabPreviousSentence"
  | "readingLabNextSentence"
  | "readingLabReadSentence"
  | "readingLabSentenceReading"
  | "readingLabWordLookupHint"
  | "readingLabWordLoading"
  | "readingLabWordTitle"
  | "readingLabWordMeaning"
  | "readingLabWordContext"
  | "readingLabWordKanji"
  | "readingLabOpenKanji"
  | "readingLabSessionRestored"
  | "readingLabSyncReady"
  | "readingLabSyncHint"
  | "readingLabSyncNeedsAudio"
  | "readingLabPlaySynced"
  | "readingLabStopSynced"
  | "readingLabTranslateSentence"
  | "readingLabTranslationLoading"
  | "readingLabTranslationUnavailable"
  | "readingLabTranslation"
  | "readingLabAddAnnotation"
  | "readingLabEditAnnotation"
  | "readingLabSaveAnnotation"
  | "readingLabAnnotation"
  | "readingLabAnnotationPlaceholder"
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
  | "accountHubTitle"
  | "accountWelcomeTitle"
  | "accountAuthAction"
  | "useMagicLink"
  | "magicLinkHint"
  | "backToSignIn"
  | "forgotPassword"
  | "passwordResetHint"
  | "sendResetLink"
  | "passwordResetSent"
  | "passwordResetError"
  | "showPassword"
  | "hidePassword"
  | "passwordPlaceholder"
  | "passwordMinimumHint"
  | "sending"
  | "setNewPassword"
  | "setPassword"
  | "setPasswordHint"
  | "passwordSetHint"
  | "setPasswordWithoutCurrent"
  | "syncIdle"
  | "lastSynced"
  | "accountCardsInSrs"
  | "accountReviewsStored"
  | "accountPersonalMnemonics"
  | "accountActions"
  | "emailReadonly"
  | "accountOverview";

const messages: Record<Language, Record<TranslationKey, string>> = {
  fa: {
    title:"Rinemi", smartLearning:"یادگیری هوشمند", more:"بیشتر", moreMenuTitle:"ابزارها و منابع", menuLearningTools:"ابزارهای یادگیری", menuProgress:"پیشرفت و تسلط", menuPreferences:"تنظیمات سریع", appearance:"ظاهر", themeLight:"روشن", themeDark:"تیره", themeSystem:"سیستم", closeMenu:"بستن منو", dailySummary:"خلاصه امروز", of:"از", learningBadge:"یادگیری",
    stats:"آمار", settings:"تنظیمات", language:"زبان", persian:"فارسی", english:"English",
    learning:"یادگیری", activeRecall:"تمرین", learningPath:"مسیر یادگیری", sessionProgress:"پیشرفت جلسه",
    goToMain:"رفتن به محتوای اصلی", learningCard:"کارت یادگیری", newKanji:"جدید", learningReview:"مرور یادگیری",
    cardBack:"پشت کارت", meaningAndStructure:"معنی و ساختار", readings:"خوانش‌ها", showHiragana:"نمایش هیراگانا", showKatakana:"نمایش کاتاکانا", showAllReadingsInHiragana:"نمایش همهٔ خوانش‌ها به هیراگانا", useNormalReadingNotation:"استفاده از شیوهٔ معمول نمایش خوانش‌ها", reviewedPersianMeaningUnavailable:"ترجمهٔ فارسی بازبینی‌شده در دسترس نیست؛ معنی منبع به انگلیسی نمایش داده می‌شود.", pageOf:"صفحه {page} از {total}", actionFailed:"خطا در عملیات", footerTagline:"یادگیریت را کوتاه، پیوسته و هدفمند نگه دار.",
    onboardingEyebrow:"شروع ساده",
    onboardingTitle:"Rinemi را برای اولین بار می‌بینی؟",
    onboardingIntro:"هر روز چند دقیقه روی کانجی‌های کاربردی کار کن؛ درس را ببین، آن را به یاد بیاور و بعد با مرور فاصله‌دار برگرد.",
    learningLoop:"چرخهٔ یادگیری",
    learningReviewLabel:"مرور",
    onboardingGoalTitle:"هدف روزانه",
    onboardingGoalHint:"یک ریتم کوچک و پایدار انتخاب کن. بعداً از تنظیمات می‌توانی آن را تغییر بدهی.",
    onboardingStart:"شروع کنیم",
    onboardingAccount:"حساب اختیاری",
    onboardingLater:"فعلاً بعداً", onboardingWelcomeEyebrow:"شروع ساده", onboardingWelcomeTitle:"به Rinemi خوش آمدی", onboardingWelcomeBody:"در چند قدم نقطهٔ شروع و ریتم روزانه‌ات را مشخص می‌کنی و بعد مستقیم وارد یادگیری می‌شوی.", onboardingLoopEyebrow:"روش یک جلسه", onboardingLoopTitle:"هر کانجی را چطور یاد می‌گیری؟", onboardingLearn:"یادگیری", onboardingLearnHint:"معنی و خوانش را یک‌جا می‌بینی.", onboardingRecall:"بازیابی", onboardingRecallHint:"قبل از دیدن پاسخ، از حافظه جواب می‌دهی.", onboardingReview:"مرور", onboardingReviewHint:"مرور بعدی بر اساس عملکردت زمان‌بندی می‌شود.", onboardingStartPointEyebrow:"نقطهٔ شروع", onboardingStartPointTitle:"از کجا شروع کنیم؟", onboardingStartPointBody:"این انتخاب فقط برای تعیین نقطهٔ شروع کانجی است؛ نتیجهٔ یک آزمون مهارت کلی ژاپنی نیست.", onboardingBeginner:"از ابتدا", onboardingBeginnerHint:"اگر هنوز یادگیری کانجی را شروع نکرده‌ای، از N5 شروع می‌کنیم.", onboardingSomeKnowledge:"کمی آشنایی دارم", onboardingSomeKnowledgeHint:"اگر بخشی از کانجی‌ها را می‌شناسی، یک نقطهٔ شروع بالاتر برای جلسهٔ اول می‌سازیم.", onboardingAssess:"سطحم را در کانجی بررسی کن", onboardingAssessHint:"یک ارزیابی کوتاه از معنی چند کانجی انجام می‌دهی.", onboardingPlacementEyebrow:"ارزیابی کانجی", onboardingPlacementTitle:"چند کانجی را بشناسیم", onboardingPlacementLoading:"در حال آماده‌سازی ارزیابی…", onboardingPlacementRetry:"تلاش دوباره", onboardingPlacementUnavailable:"ارزیابی فعلاً در دسترس نیست. می‌توانی دوباره تلاش کنی یا به انتخاب نقطهٔ شروع برگردی.", onboardingQuestionLabel:"سؤال", onboardingQuestionProgress:"پیشرفت ارزیابی", onboardingPlacementNext:"سؤال بعد", onboardingPlacementFinish:"پایان ارزیابی", onboardingPlacementResultEyebrow:"نقطهٔ شروع", onboardingPlacementResultTitle:"یک نقطهٔ شروع پیشنهادی داریم", onboardingPlacementResultBody:"این نتیجه فقط بر اساس پاسخ‌های مربوط به معنی کانجی‌هاست و برای شکل دادن به شروع مطالعه استفاده می‌شود.", onboardingPlacementRecommended:"شروع پیشنهادی", onboardingPlacementUse:"استفاده از این نقطه", onboardingPlacementRestart:"ارزیابی دوباره", onboardingRhythmEyebrow:"ریتم روزانه", onboardingRhythmTitle:"روزانه چند کانجی جدید؟", onboardingRhythmBody:"این عدد تعداد کانجی‌های جدید است؛ مرورهای فاصله‌دار همچنان توسط برنامه زمان‌بندی می‌شوند.", onboardingDailyNew:"کانجی جدید", onboardingDailyNewHint:"بعداً می‌توانی این عدد را از تنظیمات تغییر بدهی.", onboardingAccountEyebrow:"آخرین انتخاب", onboardingAccountTitle:"حساب اختیاری است", onboardingAccountBody:"می‌توانی همین حالا حساب بسازی تا پیشرفتت بین دستگاه‌ها همگام شود، یا بدون حساب یادگیری را ادامه بدهی.", onboardingContinueGuest:"ادامه به‌عنوان مهمان", onboardingGuestHint:"حالت مهمان برای شروع کامل است؛ ساخت حساب را می‌توانی بعداً انجام بدهی.", onboardingSkip:"رد کردن راه‌اندازی", onboardingBack:"قبلی", onboardingNext:"ادامه", onboardingClose:"بستن", onboardingLanguage:"زبان", onboardingSwipeHint:"برای ادامه، بکش", onboardingBrand:"Rinemi",
 showKanjiInfo:"نمایش اطلاعات کانجی",
    again:"دوباره", hard:"سخت", good:"خوب", easy:"آسان",
    meaning:"معنی", reading:"خوانش", production:"تولید", componentLearningPath:"مسیر وابستگی‌های یادگیری", componentLearningPathHint:"این پیوندها سرنخ‌های پیشنهادی یادگیری‌اند، نه تجزیهٔ دقیق شکل کانجی.", componentLearningPathLeaf:"جزء پایه", masteryShort:"تسلط", notInCatalog:"در فهرست نیست", vocabulary:"واژگان", vocabularyLearningGraph:"شبکهٔ واژگانی", vocabularyLearningGraphHint:"این واژه‌ها نشان می‌دهند این کانجی با کدام کانجی‌های جویو هم‌نشین است.", context:"بافت",
    unknown:"نمی‌دانم", correct:"درست", wrong:"نادرست", nearMiss:"نزدیک بود", empty:"خالی", unavailable:"در دسترس نیست",
    activeRecallLabel:"یادآوری فعال", currentExercise:"تمرین فعلی", exitPractice:"خروج از تمرین", contentIntroductionPrompt:"این محتوای جدید را یک‌بار با دقت مرور کن.", freeRecallModality:"یادآوری مستقل", productionModality:"تولید مستقل کانجی", productionCuedModality:"تولید کانجی با سرنخ", revealedSelfReportModality:"خودگزارش پس از نمایش پاسخ", vocabularyModality:"کامل‌کردن واژه با سرنخ", contextModality:"کامل‌کردن جمله با سرنخ", contentExposureModality:"مرور محتوای جدید", contentIntroductionHint:"فعلاً از تو پاسخ نمی‌خواهیم؛ فقط این واژه یا جمله را یاد بگیر.", yourChoice:"انتخاب شما", correctChoice:"پاسخ درست", exerciseReady:"هنوز تمرینی آماده نیست.",
    answerYourself:"پاسخ شما", answerPlaceholder:"پاسخ را وارد کنید", checkAnswer:"بررسی پاسخ", dontKnow:"نمی‌دانم", productionRecallInstruction:"اول کانجی را در ذهنت بازیابی کن؛ بعد پاسخ را ببین.", revealAnswer:"نمایش پاسخ", revealedAnswer:"پاسخ درست", iKnewIt:"بلد بودم", iDidntKnow:"نمی‌دانستم", useOptionsHint:"کمک: نمایش گزینه‌ها",
    retrySkill:"تکرار همین مهارت", nextExercise:"تمرین بعدی", backToLearning:"بازگشت به کارت یادگیری",
    sessionDetails:"جزئیات جلسه", learnerSkills:"مهارت‌های یادگیرنده", adaptiveFocus:"تمرکز تطبیقی", sessionSummary:"خلاصه جلسه",
    recentResults:"نتایج اخیر", skill:"مهارت", action:"عمل", attempts:"تلاش‌ها", right:"درست", accuracy:"دقت", recent:"اخیر", noResults:"هنوز نتیجه‌ای ثبت نشده است.",
    upcomingReviews:"مرورهای پیش‌رو", settingsUnsaved:"تغییرات ذخیره‌نشده دارید.", settingsDiscardTitle:"تغییرات ذخیره‌نشده دور ریخته شود؟", settingsDiscardHint:"تغییرات این صفحه هنوز ذخیره نشده‌اند.", settingsKeepEditing:"ادامهٔ ویرایش", settingsDiscardChanges:"دور انداختن تغییرات", settingsSaveChanges:"ذخیرهٔ تغییرات", settingsNoChanges:"همهٔ تغییرات ذخیره شده‌اند.", targetRetention:"هدف ماندگاری", targetRetentionHint:"هدف بالاتر معمولاً به مرورهای پرتکرارتری منجر می‌شود.", difficultCardThreshold:"آستانهٔ کانجی‌های دشوار", difficultCardThresholdHint:"پس از این تعداد خطای تکراری، کانجی برای توجه بیشتر علامت‌گذاری می‌شود.", personalMnemonicBackupTitle:"پشتیبان یادسپارهای شخصی", personalMnemonicBackupHint:"یادسپارهایی را که خودت ساخته‌ای خروجی بگیر یا بازیابی کن.", dataBackupTitle:"داده و پشتیبان", dataBackupContains:"شامل پیشرفت یادگیری، سابقهٔ مرور، تنظیمات و یادسپارهای شخصی.", dataBackupLast:"آخرین پشتیبان", dataBackupNever:"هرگز", exportBackup:"خروجی پشتیبان", restoreBackup:"بازیابی پشتیبان", backupExported:"پشتیبان با موفقیت خروجی گرفته شد.", backupRestoreConfirmTitle:"این پشتیبان Rinemi بازیابی شود؟", backupRestoreConfirmHint:"پیشرفت یادگیری، سابقهٔ مرور، تنظیمات و یادسپارهای شخصی فعلی جایگزین می‌شوند. ورود به حساب و cache برنامه تحت‌تأثیر قرار نمی‌گیرند.", backupRestoreCancel:"لغو", backupRestoreProceed:"بازیابی پشتیبان", backupRestoreSuccess:"پشتیبان بازیابی شد. Rinemi برای اعمال آن دوباره بارگذاری می‌شود.", backupInvalid:"فایل پشتیبان نامعتبر است یا نسخهٔ آن پشتیبانی نمی‌شود.", backupWriteError:"پشتیبان اعمال نشد و دادهٔ فعلی دست‌نخورده باقی ماند.", backupCounts:"{cards} کارت · {reviews} مرور · {mnemonics} یادسپار · {sessions} جلسه", placementLivesInPractice:"تعیین سطح در بخش تمرین است", placementLivesInPracticeHint:"آزمون تعیین سطح را از صفحهٔ شروع تمرین اجرا کن؛ جای آن در تنظیمات نیست.", settingsTitle:"تنظیمات", newKanjiPerDay:"کانجی جدید در روز", dailyReviewGoal:"هدف تعداد مرور روزانه", fsrsRetention:"هدف نگهداشت FSRS",
    leechThreshold:"آستانهٔ Leech", productionKanji:"تولید کانجی", completeVocabulary:"تکمیل واژه", contextRecall:"یادآوری بافت",
    save:"ذخیره", close:"بستن", resetProgress:"پاک کردن پیشرفت", todayReviews:"مرورهای امروز", todayNewKanji:"کانجی جدید امروز",
    learned:"یادگرفته‌شده", streak:"روز پیاپی", dailyGoal:"هدف روزانه", completed:"تکمیل شد", noSession:"جلسه‌ای برای نمایش وجود ندارد",
    startExercise:"شروع تمرین", loading:"در حال اتصال به هستهٔ یادگیری…", learningCoreError:"رابط هستهٔ یادگیری آماده نشد", tryAgain:"تلاش دوباره", runtimeFailureTitle:"یک خطای غیرمنتظره رخ داد", runtimeFailureHint:"یادگیری متوقف شده است. ابتدا دوباره بارگذاری کن؛ برای حفظ داده‌ها می‌توانی پشتیبان بگیری و گزارش خطا را کپی کنی.", runtimeFailureBackup:"پشتیبان‌گیری", runtimeFailureReport:"کپی گزارش خطا", runtimeFailureCopied:"گزارش کپی شد",
    audioUnavailable:"صدا در این مرورگر در دسترس نیست", playKanjiPronunciation:"پخش تلفظ کانجی", playWordPronunciation:"پخش تلفظ واژه",
    playReading:"پخش", vocabularyExamples:"نمونهٔ واژگانی",
    correctRecall:"بازیابی درست بود.", correctAnswer:"پاسخ درست", strokeOrder:"ترتیب نوشتن", strokeOrderLoading:"در حال بارگذاری ترتیب نوشتن…", strokeOrderUnavailable:"اطلاعات ترتیب نوشتن فعلاً در دسترس نیست.", strokeOrderAria:"نمایش ترتیب نوشتن کانجی", strokeOrderProgress:"پیشرفت ترتیب نوشتن", strokesLabel:"حرکت", previousStroke:"قبلی", playStrokeOrder:"پخش", replayStrokeOrder:"پخش دوباره", nextStroke:"بعدی", resetStrokeOrder:"شروع از اول", personalMnemonic:"یادسپار شخصی", personalMnemonicHint:"یک تداعی کوتاه بنویس که کمک کند این کانجی را به خاطر بسپاری.", mnemonicPlaceholder:"یادسپار خودت را اینجا بنویس…", saveMnemonic:"ذخیرهٔ یادسپار", editMnemonic:"ویرایش", cancel:"لغو", saving:"در حال ذخیره…", mnemonicLoadError:"یادسپار این کانجی بارگذاری نشد.", mnemonicSaveError:"ذخیرهٔ یادسپار انجام نشد.", dictionary:"فرهنگ کانجی", dictionaryTitle:"جست‌وجوی کانجی", dictionaryCardOptions:"گزینه‌های کارت", structure:"ساختار", additionalInformation:"اطلاعات تکمیلی", kanjiStructure:"ساختار دیداری کانجی", visualComponents:"اجزای مستقیم · منبع KanjiVG", visualKanjiStructure:"درخت ساختار دیداری کانجی", structureUnavailable:"ساختار معتبر برای این کانجی در دسترس نیست.", structureAtomic:"در دادهٔ منبع، جزء دیداریِ کوچک‌تری برای این کانجی ثبت نشده است.", dictionaryPlaceholder:"کانجی، خوانش یا معنی را جست‌وجو کن", dictionarySearching:"در حال جست‌وجو…", dictionaryNoResults:"نتیجه‌ای پیدا نشد.", dictionaryVocabulary:"نمونه‌های واژگانی", dictionaryVocabularyEmpty:"برای این کانجی فعلاً واژه‌ای از منبع واژگان در دسترس نیست.", dictionaryStrokes:"استروک", dictionaryGrade:"پایه", dictionaryJlpt:"JLPT", dictionaryFrequency:"فراوانی", dictionaryOn:"اُن‌یومی", dictionaryKun:"کُن‌یومی", masteryMap:"نقشهٔ تسلط", masteryMapHint:"پراکندگی وضعیت یادگیری در مجموعهٔ کانجی", masteryAverage:"میانگین", masteryMastered:"مسلط", masteryStable:"پایدار", masteryLearning:"در حال یادگیری", masteryNeedsAttention:"نیازمند توجه", masteryUnseen:"دیده‌نشده", dictionaryMastery:"تسلط", dictionaryLoading:"در حال بارگذاری کانجی‌ها…", dictionaryGrid:"فهرست کانجی‌ها", dictionaryLevel:"سطح JLPT", dictionaryMoreFilters:"فیلترهای بیشتر", dictionaryActiveFiltersCount:"تعداد فیلترهای فعال", dictionaryClearExtraFilters:"پاک کردن فیلترهای تکمیلی", allLevels:"همه", customStudy:"مطالعهٔ سفارشی", customStudyHint:"با فیلتر JLPT و تمرکز دلخواه، کارت‌های قابل‌مطالعه را برای یک جلسه انتخاب کن.", customFocus:"تمرکز مطالعه", customAvailable:"قابل مطالعه", customDue:"فقط مرورهای سررسیدشده", customNew:"فقط جدیدها", customWeak:"ضعیف / نیازمند بازیابی", customLimit:"حداکثر کارت", customStart:"شروع مطالعه", customNoCards:"برای این فیلتر فعلاً کارت قابل‌مطالعه‌ای وجود ندارد.", practiceTitle:"تمرین", practiceRecommendedLabel:"پیشنهاد Rinemi", practiceRecommendedTitle:"جلسه‌ای متناسب با نیاز فعلی تو", practiceRecommendedHint:"با یادآوری فعال، مهارت‌های نیازمند تقویت را پیدا کن.", practiceTopicsTitle:"یادگیری بر اساس موضوع", practiceTopicStart:"شروع یادگیری موضوعی", practiceTopicSelectedHint:"این جلسه در مسیر کارت‌های یادگیری و مرور باز می‌شود؛ مرورهای سررسیدشده و سقف روزانه حفظ می‌شوند.", practiceTopicCount:"کانجی", practiceTopicsShowAll:"نمایش سایر موضوع‌ها", practiceTopicsLoading:"در حال آماده‌سازی موضوع‌ها…", practiceTopicsLoadError:"فهرست کانجی‌ها بارگذاری نشد.", practiceTopicsRetry:"تلاش دوباره", practiceTopicCoverageNote:"موضوع‌ها بر پایهٔ ارتباط‌های معنایی بازبینی‌شده‌اند؛ بقیهٔ کانجی‌ها در مسیر عمومی‌اند.", practiceAdvancedTitle:"تنظیمات پیشرفتهٔ جلسه", practiceAdvancedHint:"تمرکز، سطح JLPT و تعداد کارت‌ها.", practicePlacementTitle:"هنوز نقطهٔ شروع را نمی‌دانی؟", practicePlacementHint:"این ارزیابی کوتاه فقط نقطهٔ شروع کانجی را پیشنهاد می‌کند، نه سطح کلی زبان ژاپنی را.", practiceTopicStarting:"در حال آماده‌سازی…", practiceTopicSessionLabel:"جلسهٔ موضوعی", customRecentMistakes:"اشتباهات اخیر", dictionaryTopicLabel:"موضوع", dictionaryTopicAll:"همهٔ موضوع‌ها", dictionaryTopicPickerTitle:"انتخاب موضوع", dictionaryTopicCoverageNote:"موضوع‌ها بر پایهٔ برچسب‌گذاری بازبینی‌شده‌اند؛ کانجی‌های بدون برچسب از «همهٔ موضوع‌ها» و جست‌وجوی عمومی دیکشنری همچنان در دسترس‌اند.", dictionaryTopicSearch:"جست‌وجوی موضوع‌ها", dictionaryTopicClearSearch:"پاک کردن جست‌وجو", dictionaryTopicClose:"بستن انتخاب‌گر موضوع", dictionaryTopicNoResults:"موضوعی با این جست‌وجو پیدا نشد.", dictionaryTopicGroupBasics:"زندگی روزمره", dictionaryTopicGroupWorld:"جهان و سفر", dictionaryTopicGroupSociety:"افراد و جامعه", dictionaryTopicGroupActions:"کنش و بیان", dictionarySort:"مرتب‌سازی", sortLevelAsc:"سطح: N5 ← N1", sortLevelDesc:"سطح: N1 ← N5", sortMasteryDesc:"تسلط: بیشتر ← کمتر", sortMasteryAsc:"تسلط: کمتر ← بیشتر", sortOriginal:"ترتیب اصلی", masteryOverview:"نمای کلی تسلط", masterySignal:"سیگنال تسلط", modelConfidence:"اعتماد مدل", sevenDayActivity:"فعالیت ۷ روز اخیر", reviewsCount:"مرور", preparedMnemonics:"یادسپارهای آماده", preparedMnemonicCurated:"یادسپار آماده", preparedMnemonicScaffold:"سرنخ حافظه", memoryAid:"کمک حافظه", mnemonicBridges:"سرنخ‌های حافظه", readingMnemonic:"لنگر خوانش", lookalikeContrast:"تمایز با شکل مشابه", makeMnemonicYourOwn:"یادسپار خودت را بساز", preparedMnemonicLoadMore:"نمایش بیشتر", useMnemonic:"استفاده", mnemonicApplied:"یادسپار آماده به یادسپار شخصی منتقل شد.", mnemonicOverwriteConfirm:"یادسپار شخصی فعلی جایگزین شود؟", preparedMnemonicNone:"برای این کانجی هنوز یادسپار آماده‌ای در کتابخانه نیست.", masteryDistribution:"توزیع میزان تسلط", masteryRangeLow:"۰–۲۴٪", masteryRangeDeveloping:"۲۵–۴۹٪", masteryRangeStrong:"۵۰–۷۴٪", masteryRangeMastered:"۷۵٪ به بالا", preparedMnemonicLibrary:"کتابخانهٔ یادسپارهای آماده", preparedMnemonicLibrarySearch:"جست‌وجوی کانجی یا متن یادسپار…", placementDiagnostic:"ارزیابی تعیین سطح", placementDiagnosticHint:"۱۶ سؤال معنی کانجی از N5 تا N2؛ N1 مستقیماً سنجیده نمی‌شود. نتیجه فقط نقطهٔ شروع کانجی است، نه سطح کلی ژاپنی.", startDiagnostic:"شروع ارزیابی", diagnosticResult:"نتیجه", diagnosticSuggestedLevel:"سطح پیشنهادی برای شروع:", diagnosticPlacementBoundary:"این نتیجه نزدیک مرز تعیین سطح است؛ سطح پیشنهادی را به‌عنوان نقطهٔ شروع محافظه‌کارانه در نظر بگیر و بازخورد مرورهای اول را ملاک اصلاح قرار بده.", diagnosticPlacementUpperBound:"بالاترین سطح آزموده‌شده N2 است؛ این ارزیابی N1 را مستقیماً نمی‌سنجد و N2 محافظه‌کارانه‌ترین نقطهٔ شروع برای سطح‌های بالاتر است.", diagnosticPlacementLimited:"شواهد تعیین سطح محدود است؛ این نتیجه یک پیشنهاد تقریبی برای نقطهٔ شروع است، نه سنجش دقیق مهارت کلی ژاپنی.", retakeDiagnostic:"ارزیابی دوباره", startSuggestedStudy:"شروع مطالعهٔ پیشنهادی", diagnosticQuestion:"سؤال", diagnosticMeaningPrompt:"کدام معنی با این کانجی مطابقت دارد؟", diagnosticCorrect:"درست بود.", diagnosticIncorrect:"این پاسخ درست نیست.", finishDiagnostic:"پایان ارزیابی", nextDiagnostic:"سؤال بعد", handwritingPractice:"تمرین دست‌خط", handwritingHint:"ارزیابی، شکل مسیر، ابتدا و انتهای حرکت‌ها و ترتیب آن‌ها را بررسی می‌کند.", handwritingPracticeHelp:"با ماوس، لمس یا قلم روی راهنمای کم‌رنگ بنویس. لازم نیست خط را دقیقاً با ضخامت راهنما منطبق کنی.", handwritingUnavailable:"دادهٔ لازم برای تمرین دست‌خط در دسترس نیست.", clearDrawing:"پاک کردن", undoLastStroke:"واگردانی آخرین حرکت", gradeDrawing:"ارزیابی دست‌خط", handwritingSimilarity:"شباهت مسیر", handwritingGreat:"شباهت خیلی بالا است؛ الگو را خوب دنبال کردی.", handwritingGood:"شباهت خوب است؛ یک یا دو حرکت را کمی دقیق‌تر تکرار کن.", handwritingRetry:"چند حرکت با الگو فاصله دارند؛ دوباره بنویس و به شروع و جهت حرکت توجه کن.", handwritingFeedbackStrokeCount:"تعداد حرکت‌ها با الگو یکسان نیست.", handwritingFeedbackOrder:"ترتیب بعضی حرکت‌ها با الگو متفاوت است.", handwritingFeedbackPlacement:"جایگاه یا اندازهٔ کلی نوشته از الگو فاصله دارد.", handwritingFeedbackEndpoints:"شروع یا پایان یکی از حرکت‌ها از الگو فاصله دارد.", handwritingFeedbackDirection:"جهت یکی از حرکت‌ها با الگو متفاوت است.", handwritingFeedbackLength:"طول یکی از حرکت‌ها با الگو تفاوت دارد.", handwritingFeedbackCurvature:"انحنای یکی از حرکت‌ها با الگو تفاوت دارد.", handwritingFeedbackShape:"شکل یکی از حرکت‌ها با الگو تفاوت دارد.", handwritingStrokeDetail:"حرکت {n} بیشترین فاصله را از الگو دارد.", handwritingHintLevel:"راهنما", handwritingTrace:"ردگیری", handwritingGhost:"سایه", handwritingStrokeGuide:"راهنمای حرکت", handwritingMinimal:"نشانهٔ حداقلی", handwritingRecall:"یادآوری مستقل", handwritingMoreHelp:"راهنمای بیشتر", handwritingLiveStroke:"حرکت {n}", handwritingFocusStroke:"حرکت {n} نیاز به توجه دارد", handwritingFocusHint:"الگو را کنار نوشته‌ات مقایسه کن", handwritingPromptMeaning:"معنی → کانجی", handwritingPromptReading:"خوانش → کانجی", handwritingPromptVocabulary:"واژه → کانجی", handwritingPromptContext:"بافت → کانجی", handwritingPromptProduction:"تولید → کانجی", handwritingPromptFallback:"کانجی را تولید کن", readingLab:"خواندن متن ژاپنی", readingLabSource:"منبع متن", readingLabSourceTitle:"متن ژاپنی", readingLabImportHint:"TXT فقط متن را وارد می‌کند؛ SRT و VTT زمان‌بندی جمله‌ها را برای همگام‌سازی نگه می‌دارند.", readingLabListen:"شنیدن", readingLabListenTitle:"متن را گوش کن", readingLabAnalysis:"پوشش خواندن", readingLabCoverage:"پوشش یکتای کانجی آشنا", readingLabOccurrenceCoverage:"پوشش بر اساس تعداد تکرار", readingLabHardestSentence:"سخت‌ترین جمله", readingLabFamiliar:"کانجی آشنا", readingLabLearning:"در حال یادگیری", readingLabAttention:"نیازمند توجه", readingLabNew:"جدید", readingLabAttentionEyebrow:"تمرکز بعدی", readingLabNeedsAttention:"کانجی‌های نیازمند مرور", readingLabReaderEyebrow:"خواندن", readingLabLegend:"راهنمای وضعیت کانجی", readingLabLegendFamiliar:"آشنا", readingLabLegendLearning:"در حال یادگیری", readingLabLegendAttention:"نیازمند توجه", readingLabLegendNew:"جدید", readingLabEmptyEyebrow:"شروع کن", readingLabEmptyTitle:"یک متن ژاپنی وارد کن", readingLabEmptyHint:"متن ژاپنی را وارد کن یا فایل زیرنویس بیاور تا پوشش کانجی‌ها را ببینی.", readingTextPlaceholder:"متن ژاپنی را اینجا وارد یا paste کن…", readingLabCharacters:"نویسه‌ها", readingLabKanji:"کانجی‌ها", readingLabKnownKanji:"کانجی‌های شناخته‌شده", readingReader:"حالت خواندن", readingReaderHint:"برای دیدن واژه در بافت، کانجی را لمس کن؛ اگر واژه‌ای پیدا نشود، فرهنگ کانجی باز می‌شود.", importAudio:"افزودن فایل صوتی", readingAudio:"صدای متن خواندن", readingSpeechControls:"کنترل خواندن متن", readingSpeakText:"خواندن متن", readingSpeaking:"در حال خواندن…", readingStopSpeech:"توقف خواندن", readingSpeechRate:"سرعت", readingSpeechVoice:"صدای ژاپنی", readingSpeechVoiceDefault:"پیش‌فرض مرورگر", readingSpeechUnsupported:"خواندن صوتی در این مرورگر در دسترس نیست.", readingLabNoKnownKanji:"در این متن کانجی Jōyō شناخته‌شده‌ای پیدا نشد.", lookupKanji:"مشاهده در فرهنگ کانجی", importSubtitle:"ورود TXT / SRT / VTT", clearReadingText:"پاک کردن متن", readingLabSentenceMode:"خواندن تمرکزی", readingLabFocusControls:"کنترل تمرکز", readingLabFocusNext:"تمرکز بعدی", readingLabNextUnknown:"بعدیِ ناآشنا", readingLabAutoplay:"پخش خودکار", readingLabRepeatSentence:"تکرار جمله", readingLabSentence:"جمله", readingLabPreviousSentence:"جملهٔ قبلی", readingLabNextSentence:"جملهٔ بعدی", readingLabReadSentence:"خواندن جمله", readingLabSentenceReading:"در حال خواندن جمله…", readingLabWordLookupHint:"برای یافتن طولانی‌ترین واژهٔ این جمله، کانجی را لمس کن.", readingLabWordLoading:"در حال پیدا کردن واژه…", readingLabWordTitle:"واژهٔ بافتی", readingLabWordMeaning:"معنی", readingLabWordContext:"در جمله", readingLabWordKanji:"کانجی‌های واژه", readingLabOpenKanji:"مشاهدهٔ کانجی", readingLabSessionRestored:"آخرین متن بازیابی شد", readingLabSyncReady:"همگام با صوت", readingLabSyncHint:"جملهٔ فعال با زمان پخش جلو می‌رود.", readingLabSyncNeedsAudio:"برای ادامهٔ همگام‌سازی، فایل صوتی قبلی را دوباره اضافه کن.", readingLabPlaySynced:"پخش جمله", readingLabStopSynced:"توقف صوت", readingLabTranslateSentence:"ترجمهٔ جمله", readingLabTranslationLoading:"در حال ترجمه…", readingLabTranslationUnavailable:"ترجمهٔ این جمله در منبع موجود نیست.", readingLabTranslation:"ترجمهٔ انگلیسی", readingLabAddAnnotation:"یادداشت", readingLabEditAnnotation:"ویرایش یادداشت", readingLabSaveAnnotation:"ذخیرهٔ یادداشت", readingLabAnnotation:"یادداشت شخصی", readingLabAnnotationPlaceholder:"نکته‌ای برای این جمله ثبت کن…", grammarGuide:"راهنمای گرامر", grammarProgress:"پیشرفت گرامر", previousLesson:"درس قبلی", nextLesson:"درس بعدی", contentBackup:"پشتیبان یادسپارهای شخصی", contentBackupHint:"یادسپارهای شخصی را به‌صورت فایل JSON خروجی بگیر یا روی یک دستگاه دیگر بازیابی کن.", exportContent:"خروجی JSON", importContent:"بازیابی JSON", contentBackupScope:"فقط یادسپارهای شخصی Rinemi؛ پیشرفت و تنظیمات شامل این فایل نمی‌شوند.", contentImportConfirm:"یادسپارهای موجود برای کانجی‌های داخل فایل جایگزین شوند؟", contentBackupError:"فایل پشتیبان معتبر نبود یا عملیات با خطا روبه‌رو شد.", account:"حساب", signIn:"ورود", googleAccount:"حساب Google", accountTitle:"ورود به حساب Rinemi", accountLoading:"در حال آماده‌سازی حساب…", accountUnavailable:"ورود ابری هنوز پیکربندی نشده است.", accountUnavailableHint:"تنظیمات Supabase این نسخه کامل نشده است؛ حالت مهمان همچنان کار می‌کند.", accountIntro:"با حساب وارد شو تا پیشرفتت بین دستگاه‌ها همگام شود.", continueWithGoogle:"ادامه با Google", signingIn:"در حال ورود…", guestModeHint:"می‌توانی بدون حساب هم روی همین دستگاه یاد بگیری.", accountSyncHint:"پیشرفت و یادسپارهای شخصی روی دستگاه می‌مانند و هنگام اتصال همگام می‌شوند.", syncing:"در حال همگام‌سازی…", synced:"همگام شد", syncError:"خطا در همگام‌سازی", syncNow:"همگام‌سازی الآن", signOut:"خروج از حساب", localFirst:"محلی‌اول", cloudSync:"همگام‌سازی ابری", accountMethods:"روش ورود", emailPassword:"ایمیل و رمز", magicLink:"لینک ورود", email:"ایمیل", password:"رمز عبور", signInWithEmail:"ورود با ایمیل", createAccount:"حساب نداری؟", createAccountAction:"ساخت حساب", sendMagicLink:"ارسال لینک ورود", magicLinkSent:"لینک ورود به ایمیلت ارسال شد.", accountCheckEmail:"حساب ساخته شد؛ برای ادامه ایمیلت را تأیید کن.", emailRequired:"ایمیل را وارد کن.", emailPasswordRequired:"ایمیل و رمز را وارد کن.", passwordTooShort:"رمز عبور باید حداقل ۶ نویسه باشد.", authError:"ورود انجام نشد. دوباره تلاش کن.", or:"یا", signedIn:"وارد شدی.", alreadyAccount:"حساب داری؟", googleComingSoon:"ورود با Google به‌زودی فعال می‌شود.", profile:"پروفایل", security:"امنیت", accountSync:"همگام‌سازی", displayName:"نام نمایشی", displayNameHint:"این نام کنار حسابت نمایش داده می‌شود.", saveProfile:"ذخیره پروفایل", profileSaved:"نام نمایشی ذخیره شد.", nameRequired:"نام نمایشی را وارد کن.", nameTooLong:"نام نمایشی باید حداکثر ۴۰ نویسه باشد.", currentPassword:"رمز فعلی", newPassword:"رمز جدید", confirmPassword:"تکرار رمز جدید", changePassword:"تغییر رمز عبور", passwordChanged:"رمز عبور با موفقیت تغییر کرد.", passwordRequired:"هر دو رمز عبور را وارد کن.", passwordMismatch:"رمز جدید و تکرار آن یکسان نیستند.", passwordChangeError:"تغییر رمز عبور انجام نشد.", accountHubTitle:"حساب Rinemi", accountWelcomeTitle:"از پیشرفتت محافظت کن", accountAuthAction:"عملیات حساب", useMagicLink:"ورود با لینک جادویی", magicLinkHint:"یک لینک ورود یک‌بارمصرف به ایمیلت می‌فرستیم.", backToSignIn:"بازگشت به ورود", forgotPassword:"رمز عبور را فراموش کرده‌ای؟", passwordResetHint:"ایمیل حسابت را وارد کن تا لینک بازنشانی رمز را بفرستیم.", sendResetLink:"ارسال لینک بازنشانی", passwordResetSent:"لینک بازنشانی رمز به ایمیلت ارسال شد.", passwordResetError:"ارسال لینک بازنشانی انجام نشد. دوباره تلاش کن.", showPassword:"نمایش رمز عبور", hidePassword:"پنهان کردن رمز عبور", passwordPlaceholder:"••••••••", passwordMinimumHint:"رمز عبور باید حداقل ۶ نویسه باشد.", sending:"در حال ارسال…", setNewPassword:"رمز عبور جدید را تنظیم کن", setPassword:"تنظیم رمز عبور", setPasswordHint:"برای این حساب هنوز رمز عبوری تنظیم نشده است.", passwordSetHint:"رمز عبور برای ورود ایمیلی تنظیم شده است.", syncIdle:"همگام نیست", lastSynced:"آخرین همگام‌سازی", accountCardsInSrs:"کارت در SRS", accountReviewsStored:"مرور ثبت‌شده", accountPersonalMnemonics:"یادسپار شخصی", accountActions:"عملیات حساب", setPasswordWithoutCurrent:"رمز نداری؟ تنظیمش کن", emailReadonly:"ایمیل حساب", accountOverview:"مدیریت حساب، پروفایل و امنیت", cardPage:"صفحه اطلاعات کارت", previousCardPage:"صفحه قبلی کارت", nextCardPage:"صفحه بعدی کارت", swipeForMore:"برای اطلاعات بیشتر سوایپ کن"
  },
  en: {
    title:"Rinemi", smartLearning:"Smart learning", more:"More", moreMenuTitle:"Tools & Resources", menuLearningTools:"Learning tools", menuProgress:"Progress & mastery", menuPreferences:"Quick preferences", appearance:"Appearance", themeLight:"Light", themeDark:"Dark", themeSystem:"System", closeMenu:"Close menu", dailySummary:"Today’s summary", of:"of", learningBadge:"Learning",
    stats:"Stats", settings:"Settings", language:"Language", persian:"فارسی", english:"English",
    learning:"Learning", activeRecall:"Practice", learningPath:"Learning path", sessionProgress:"Session progress",
    goToMain:"Skip to main content", learningCard:"Learning card", newKanji:"New", learningReview:"Learning review",
    cardBack:"Card back", meaningAndStructure:"Meaning & structure", readings:"Readings", showHiragana:"Show Hiragana", showKatakana:"Show Katakana", showAllReadingsInHiragana:"Show all readings in Hiragana", useNormalReadingNotation:"Use normal reading notation", reviewedPersianMeaningUnavailable:"No reviewed Persian translation is available; the source meaning is shown in English.", pageOf:"Page {page} of {total}", actionFailed:"Action failed", footerTagline:"Keep your learning short, consistent, and focused.",
    onboardingEyebrow:"A simple start",
    onboardingTitle:"New to Rinemi?",
    onboardingIntro:"Spend a few focused minutes each day on useful kanji: learn it, recall it, then come back for spaced review.",
    learningLoop:"Learning loop",
    learningReviewLabel:"Review",
    onboardingGoalTitle:"Daily goal",
    onboardingGoalHint:"Choose a small, sustainable rhythm. You can change it later in Settings.",
    onboardingStart:"Let's begin",
    onboardingAccount:"Optional account",
    onboardingLater:"Maybe later", onboardingWelcomeEyebrow:"A simple start", onboardingWelcomeTitle:"Welcome to Rinemi", onboardingWelcomeBody:"In a few steps, choose your starting point and daily rhythm, then move straight into learning.", onboardingLoopEyebrow:"How a session works", onboardingLoopTitle:"How you learn each kanji", onboardingLearn:"Learn", onboardingLearnHint:"See the key meaning and reading.", onboardingRecall:"Recall", onboardingRecallHint:"Try to answer before seeing the answer.", onboardingReview:"Review", onboardingReviewHint:"Future reviews are scheduled from your performance.", onboardingStartPointEyebrow:"Starting point", onboardingStartPointTitle:"Where should we start?", onboardingStartPointBody:"This choice is only about your kanji starting point; it is not a test of your overall Japanese proficiency.", onboardingBeginner:"Start from the beginning", onboardingBeginnerHint:"New to kanji? We will begin around N5.", onboardingSomeKnowledge:"I know some kanji", onboardingSomeKnowledgeHint:"If you already recognize some kanji, we will shape the first study session from a higher starting range.", onboardingAssess:"Check my kanji level", onboardingAssessHint:"Take a short check using the meanings of a few kanji.", onboardingPlacementEyebrow:"Kanji check", onboardingPlacementTitle:"Let’s check a few kanji", onboardingPlacementLoading:"Preparing the check…", onboardingPlacementRetry:"Try again", onboardingPlacementUnavailable:"The check is not available right now. You can retry or go back and choose a starting point.", onboardingQuestionLabel:"Question", onboardingQuestionProgress:"Question progress", onboardingPlacementNext:"Next question", onboardingPlacementFinish:"Finish check", onboardingPlacementResultEyebrow:"Starting point", onboardingPlacementResultTitle:"Here is a suggested starting point", onboardingPlacementResultBody:"This result is based only on your answers about kanji meanings and is used to shape the start of your study.", onboardingPlacementRecommended:"Suggested starting point", onboardingPlacementUse:"Use this starting point", onboardingPlacementRestart:"Retake check", onboardingRhythmEyebrow:"Daily rhythm", onboardingRhythmTitle:"How many new kanji each day?", onboardingRhythmBody:"This is the number of new kanji; spaced reviews are still scheduled by Rinemi.", onboardingDailyNew:"new kanji", onboardingDailyNewHint:"You can change this later in Settings.", onboardingAccountEyebrow:"One last choice", onboardingAccountTitle:"An account is optional", onboardingAccountBody:"Create an account to sync progress across devices, or keep learning without an account on this device.", onboardingContinueGuest:"Continue as a guest", onboardingGuestHint:"Guest mode is complete for getting started; you can create an account later.", onboardingSkip:"Skip setup", onboardingBack:"Back", onboardingNext:"Continue", onboardingClose:"Close", onboardingLanguage:"Language", onboardingSwipeHint:"Swipe to continue", onboardingBrand:"Rinemi",
    showKanjiInfo:"Show kanji information",
    again:"Again", hard:"Hard", good:"Good", easy:"Easy",
    meaning:"Meaning", reading:"Reading", production:"Production", componentLearningPath:"Learning dependency path", componentLearningPathHint:"These are learning cues, not a literal decomposition of the kanji's written shape.", componentLearningPathLeaf:"Base component", masteryShort:"Mastery", notInCatalog:"Not in catalog", vocabulary:"Vocabulary", vocabularyLearningGraph:"Vocabulary network", vocabularyLearningGraphHint:"Shows which Jōyō kanji co-occur in these vocabulary examples.", context:"Context",
    unknown:"I don't know", correct:"Correct", wrong:"Incorrect", nearMiss:"Near miss", empty:"Empty", unavailable:"Unavailable",
    activeRecallLabel:"Active recall", currentExercise:"Current exercise", exitPractice:"Exit practice", contentIntroductionPrompt:"Review this new item once.", freeRecallModality:"Independent recall", productionModality:"Independent Kanji production", productionCuedModality:"Hint-assisted Kanji choice", revealedSelfReportModality:"Post-reveal self-report", vocabularyModality:"Cued word completion", contextModality:"Cued sentence completion", contentExposureModality:"Content exposure", contentIntroductionHint:"No answer yet — just learn this word or sentence first.", yourChoice:"Your choice", correctChoice:"Correct", exerciseReady:"No exercise is ready yet.",
    answerYourself:"Your answer", answerPlaceholder:"Enter your answer", checkAnswer:"Check answer", dontKnow:"I don't know", productionRecallInstruction:"First retrieve the kanji from memory, then reveal the answer.", revealAnswer:"Reveal answer", revealedAnswer:"Correct kanji", iKnewIt:"I knew it", iDidntKnow:"I didn't know it", useOptionsHint:"Hint: show options",
    retrySkill:"Retry this skill", nextExercise:"Next exercise", backToLearning:"Back to learning card",
    sessionDetails:"Session details", learnerSkills:"Learner skills", adaptiveFocus:"Adaptive focus", sessionSummary:"Session summary",
    recentResults:"Recent results", skill:"Skill", action:"Action", attempts:"Attempts", right:"Correct", accuracy:"Accuracy", recent:"Recent", noResults:"No results recorded yet.",
    upcomingReviews:"Upcoming reviews", settingsUnsaved:"You have unsaved changes.", settingsDiscardTitle:"Discard unsaved changes?", settingsDiscardHint:"Your changes on this page have not been saved.", settingsKeepEditing:"Keep editing", settingsDiscardChanges:"Discard changes", settingsSaveChanges:"Save changes", settingsNoChanges:"All changes are saved.", targetRetention:"Target retention", targetRetentionHint:"A higher target usually means more frequent reviews.", difficultCardThreshold:"Difficult-card threshold", difficultCardThresholdHint:"Flag a kanji for extra attention after this many repeated failures.", personalMnemonicBackupTitle:"Personal mnemonic backup", personalMnemonicBackupHint:"Export or restore the mnemonics you created yourself.", dataBackupTitle:"Data & backup", dataBackupContains:"Includes learning progress, review history, settings, and personal mnemonics.", dataBackupLast:"Last backup", dataBackupNever:"Never", exportBackup:"Export backup", restoreBackup:"Restore backup", backupExported:"Backup exported successfully.", backupRestoreConfirmTitle:"Restore this Rinemi backup?", backupRestoreConfirmHint:"This replaces your current learning progress, review history, settings, and personal mnemonics. Your account sign-in and app cache are not affected.", backupRestoreCancel:"Cancel", backupRestoreProceed:"Restore backup", backupRestoreSuccess:"Backup restored. Rinemi will reload to apply it.", backupInvalid:"This backup file is invalid or from an unsupported version.", backupWriteError:"The backup could not be applied. Your current data was left unchanged.", backupCounts:"{cards} cards · {reviews} reviews · {mnemonics} mnemonics · {sessions} sessions", placementLivesInPractice:"Placement is available in Practice", placementLivesInPracticeHint:"Run the placement check from the Practice home screen; it does not belong to Settings.", settingsTitle:"Settings", newKanjiPerDay:"New kanji per day", dailyReviewGoal:"Daily review goal", fsrsRetention:"FSRS retention target",
    leechThreshold:"Leech threshold", productionKanji:"Kanji production", completeVocabulary:"Complete vocabulary", contextRecall:"Context recall",
    save:"Save", close:"Close", resetProgress:"Reset progress", todayReviews:"Today's reviews", todayNewKanji:"New kanji today",
    learned:"Learned", streak:"Streak", dailyGoal:"Daily goal", completed:"Completed", noSession:"There is no session to display",
    startExercise:"Start exercise", loading:"Connecting to the learning engine…", learningCoreError:"The learning interface could not be loaded", tryAgain:"Try again", runtimeFailureTitle:"Something went wrong", runtimeFailureHint:"Learning has been stopped. Reload first; to protect your data, you can export a backup and copy a diagnostic report.", runtimeFailureBackup:"Export backup", runtimeFailureReport:"Copy error report", runtimeFailureCopied:"Report copied",
    audioUnavailable:"Audio is not available in this browser", playKanjiPronunciation:"Play kanji pronunciation", playWordPronunciation:"Play word pronunciation",
    playReading:"Play", readingSpeechControls:"Text reading controls", readingSpeakText:"Read text aloud", readingSpeaking:"Reading…", readingStopSpeech:"Stop reading", readingSpeechRate:"Rate", readingSpeechVoice:"Japanese voice", readingSpeechVoiceDefault:"Browser default", readingSpeechUnsupported:"Text-to-speech is unavailable in this browser.", vocabularyExamples:"Vocabulary examples",
    correctRecall:"Recall was correct.", correctAnswer:"Correct answer", strokeOrder:"Stroke order", strokeOrderLoading:"Loading stroke order…", strokeOrderUnavailable:"Stroke-order data is not available right now.", strokeOrderAria:"Kanji stroke-order display", strokeOrderProgress:"Stroke-order progress", strokesLabel:"strokes", previousStroke:"Previous", playStrokeOrder:"Play", replayStrokeOrder:"Replay", nextStroke:"Next", resetStrokeOrder:"Reset", personalMnemonic:"Personal mnemonic", personalMnemonicHint:"Add a short cue that helps you remember this kanji.", mnemonicPlaceholder:"Write your mnemonic here…", saveMnemonic:"Save mnemonic", editMnemonic:"Edit", cancel:"Cancel", saving:"Saving…", mnemonicLoadError:"This kanji's mnemonic could not be loaded.", mnemonicSaveError:"The mnemonic could not be saved.", dictionary:"Kanji dictionary", dictionaryTitle:"Kanji dictionary", dictionaryCardOptions:"Card options", structure:"Structure", additionalInformation:"Additional information", kanjiStructure:"Visual kanji structure", visualComponents:"Direct components · KanjiVG", visualKanjiStructure:"Kanji visual structure tree", structureUnavailable:"Verified structure is unavailable for this kanji.", structureAtomic:"No finer visual subdivision is recorded for this kanji in the source.", dictionaryPlaceholder:"Search kanji, reading, or meaning", dictionarySearching:"Searching…", dictionaryNoResults:"No results found.", dictionaryVocabulary:"Vocabulary examples", dictionaryVocabularyEmpty:"No vocabulary examples are currently available for this kanji.", dictionaryStrokes:"Strokes", dictionaryGrade:"Grade", dictionaryJlpt:"JLPT", dictionaryFrequency:"Frequency", dictionaryOn:"On’yomi", dictionaryKun:"Kun’yomi", masteryMap:"Mastery map", masteryMapHint:"How your kanji learning is distributed across states", masteryAverage:"Average", masteryMastered:"Mastered", masteryStable:"Stable", masteryLearning:"Learning", masteryNeedsAttention:"Needs attention", masteryUnseen:"Unseen", dictionaryMastery:"Mastery", dictionaryLoading:"Loading kanji…", dictionaryGrid:"Kanji catalog", dictionaryLevel:"JLPT level", dictionaryMoreFilters:"More filters", dictionaryActiveFiltersCount:"Active filter count", dictionaryClearExtraFilters:"Clear extra filters", allLevels:"All", customStudy:"Custom study", customStudyHint:"Build a session from study-eligible cards using a JLPT level and focus.", customFocus:"Study focus", customAvailable:"Available now", customDue:"Due only", customNew:"New only", customWeak:"Weak / recovery", customLimit:"Card limit", customStart:"Start study", customNoCards:"There are no cards available for this filter right now.", practiceTitle:"Practice", practiceRecommendedLabel:"Rinemi recommendation", practiceRecommendedTitle:"A session matched to your current needs", practiceRecommendedHint:"Use active recall to find skills that need more practice.", practiceTopicsTitle:"Learn by topic", practiceTopicStart:"Start topic learning", practiceTopicSelectedHint:"This session opens in the Learning and Review experience. Due reviews and the daily new-card limit remain in effect.", practiceTopicCount:"kanji", practiceTopicsShowAll:"Browse more topics", practiceTopicsLoading:"Preparing topics…", practiceTopicsLoadError:"The kanji catalog could not be loaded.", practiceTopicsRetry:"Try again", practiceTopicCoverageNote:"Topics use reviewed semantic links; other kanji remain in general learning.", practiceAdvancedTitle:"Advanced session settings", practiceAdvancedHint:"Focus, JLPT level, and card count.", practicePlacementTitle:"Not sure where to start?", practicePlacementHint:"This short check recommends a kanji starting point; it does not measure overall Japanese proficiency.", practiceTopicStarting:"Preparing session…", practiceTopicSessionLabel:"Topic session", customRecentMistakes:"Recent mistakes", dictionaryTopicLabel:"Topic", dictionaryTopicAll:"All topics", dictionaryTopicPickerTitle:"Choose a topic", dictionaryTopicCoverageNote:"Topics use reviewed labels; unlabelled kanji remain available under All topics and in general dictionary search.", dictionaryTopicSearch:"Search topics", dictionaryTopicClearSearch:"Clear topic search", dictionaryTopicClose:"Close topic picker", dictionaryTopicNoResults:"No topics match this search.", dictionaryTopicGroupBasics:"Everyday life", dictionaryTopicGroupWorld:"World & travel", dictionaryTopicGroupSociety:"People & society", dictionaryTopicGroupActions:"Actions & expression", dictionarySort:"Sort", sortLevelAsc:"Level: N5 → N1", sortLevelDesc:"Level: N1 → N5", sortMasteryDesc:"Mastery: high → low", sortMasteryAsc:"Mastery: low → high", sortOriginal:"Original order", masteryOverview:"Mastery overview", masterySignal:"Mastery signal", modelConfidence:"Model confidence", sevenDayActivity:"7-day review activity", reviewsCount:"reviews", preparedMnemonics:"Prepared mnemonics", preparedMnemonicCurated:"Prepared mnemonic", preparedMnemonicScaffold:"Memory scaffold", memoryAid:"Memory aid", mnemonicBridges:"Memory cues", readingMnemonic:"Reading anchor", lookalikeContrast:"Lookalike contrast", makeMnemonicYourOwn:"Make your own mnemonic", preparedMnemonicLoadMore:"Load more", useMnemonic:"Use", mnemonicApplied:"Prepared mnemonic saved as your personal mnemonic.", mnemonicOverwriteConfirm:"Replace your existing personal mnemonic?", preparedMnemonicNone:"No prepared mnemonic is available for this kanji yet.", masteryDistribution:"Mastery distribution", masteryRangeLow:"0–24%", masteryRangeDeveloping:"25–49%", masteryRangeStrong:"50–74%", masteryRangeMastered:"75%+", preparedMnemonicLibrary:"Prepared mnemonic library", preparedMnemonicLibrarySearch:"Search kanji or mnemonic text…", placementDiagnostic:"Placement check", placementDiagnosticHint:"16 kanji-meaning questions from N5–N2; N1 is not directly assessed. This recommends a kanji starting point, not overall Japanese proficiency.", startDiagnostic:"Start diagnostic", diagnosticResult:"Result", diagnosticSuggestedLevel:"Suggested starting level:", diagnosticPlacementBoundary:"This result is near a placement boundary. Treat the suggested level as a conservative starting point and use early review evidence to adjust.", diagnosticPlacementUpperBound:"N2 is the highest level directly tested. N1 is not directly assessed; N2 is the conservative starting point for learners above the tested range.", diagnosticPlacementLimited:"Placement evidence is limited, so this is an approximate starting-point suggestion rather than a precise measure of overall Japanese proficiency.", retakeDiagnostic:"Retake", startSuggestedStudy:"Start suggested study", diagnosticQuestion:"Question", diagnosticMeaningPrompt:"Which meaning matches this kanji?", diagnosticCorrect:"Correct.", diagnosticIncorrect:"That is not the correct answer.", finishDiagnostic:"Finish diagnostic", nextDiagnostic:"Next question", handwritingPractice:"Handwriting practice", handwritingHint:"Grading checks stroke shape, endpoints, and order.", handwritingPracticeHelp:"Write with a mouse, touch, or stylus over the light guide. You do not need to match the guide thickness exactly.", handwritingUnavailable:"The data needed for handwriting practice is unavailable.", clearDrawing:"Clear", undoLastStroke:"Undo last stroke", gradeDrawing:"Grade handwriting", handwritingSimilarity:"Path similarity", handwritingGreat:"Very high similarity; you followed the pattern closely.", handwritingGood:"Good similarity; repeat one or two strokes a little more precisely.", handwritingRetry:"Several strokes differ from the pattern; try again and watch the stroke start and direction.", handwritingFeedbackStrokeCount:"The number of strokes does not match the pattern.", handwritingFeedbackOrder:"Some strokes are in a different order from the pattern.", handwritingFeedbackPlacement:"The overall placement or size differs from the pattern.", handwritingFeedbackEndpoints:"A stroke starts or ends away from the pattern.", handwritingFeedbackDirection:"A stroke moves in a different direction from the pattern.", handwritingFeedbackLength:"A stroke is noticeably shorter or longer than the pattern.", handwritingFeedbackCurvature:"A stroke curves differently from the pattern.", handwritingFeedbackShape:"A stroke shape differs from the pattern.", handwritingStrokeDetail:"Stroke {n} is the furthest from the pattern.", handwritingHintLevel:"Hint", handwritingTrace:"Trace", handwritingGhost:"Ghost", handwritingStrokeGuide:"Stroke guide", handwritingMinimal:"Minimal cue", handwritingRecall:"Production recall", handwritingMoreHelp:"More help", handwritingLiveStroke:"Stroke {n}", handwritingFocusStroke:"Stroke {n} needs attention", handwritingFocusHint:"Compare the guide with your writing", handwritingPromptMeaning:"Meaning → Kanji", handwritingPromptReading:"Reading → Kanji", handwritingPromptVocabulary:"Vocabulary → Kanji", handwritingPromptContext:"Context → Kanji", handwritingPromptProduction:"Production → Kanji", handwritingPromptFallback:"Produce the Kanji", readingLab:"Japanese text reader", readingLabSource:"SOURCE", readingLabSourceTitle:"Japanese text", readingLabImportHint:"TXT imports text only; SRT/VTT retain sentence timings for audio sync.", readingLabListen:"LISTEN", readingLabListenTitle:"Hear the text", readingLabAnalysis:"Reading coverage", readingLabCoverage:"unique familiar kanji coverage", readingLabOccurrenceCoverage:"occurrence-weighted coverage", readingLabHardestSentence:"Focus hardest sentence", readingLabFamiliar:"familiar kanji", readingLabLearning:"learning", readingLabAttention:"need attention", readingLabNew:"new", readingLabAttentionEyebrow:"NEXT FOCUS", readingLabNeedsAttention:"Kanji to review", readingLabReaderEyebrow:"READ", readingLabLegend:"Kanji status legend", readingLabLegendFamiliar:"Familiar", readingLabLegendLearning:"Learning", readingLabLegendAttention:"Needs attention", readingLabLegendNew:"New", readingLabEmptyEyebrow:"GET STARTED", readingLabEmptyTitle:"Add Japanese text", readingLabEmptyHint:"Enter Japanese text or import subtitles to see its kanji coverage.", readingTextPlaceholder:"Paste Japanese text here…", readingLabCharacters:"Characters", readingLabKanji:"Kanji", readingLabKnownKanji:"Known kanji", readingReader:"Reader mode", readingReaderHint:"Tap a kanji to open its contextual word; if none is found, its dictionary entry opens.", importAudio:"Add audio file", readingAudio:"Reader audio", readingLabNoKnownKanji:"No known Jōyō kanji were found in this text.", lookupKanji:"View in kanji dictionary", importSubtitle:"Import TXT / SRT / VTT", clearReadingText:"Clear text", readingLabSentenceMode:"FOCUSED READING", readingLabFocusControls:"Focus controls", readingLabFocusNext:"Focus next", readingLabNextUnknown:"Next unknown", readingLabAutoplay:"Autoplay", readingLabRepeatSentence:"Repeat sentence", readingLabSentence:"Sentence", readingLabPreviousSentence:"Previous sentence", readingLabNextSentence:"Next sentence", readingLabReadSentence:"Read sentence", readingLabSentenceReading:"Reading sentence…", readingLabWordLookupHint:"Tap to find the longest matching word in this sentence.", readingLabWordLoading:"Finding a vocabulary word…", readingLabWordTitle:"Context word", readingLabWordMeaning:"Meaning", readingLabWordContext:"In this sentence", readingLabWordKanji:"Kanji in the word", readingLabOpenKanji:"Open kanji", readingLabSessionRestored:"Last reading restored", readingLabSyncReady:"Synced to audio", readingLabSyncHint:"The active sentence follows playback.", readingLabSyncNeedsAudio:"Re-add the previous audio file to continue synchronized reading.", readingLabPlaySynced:"Play sentence", readingLabStopSynced:"Stop audio", readingLabTranslateSentence:"Translate sentence", readingLabTranslationLoading:"Looking up translation…", readingLabTranslationUnavailable:"No matching translation is available for this sentence.", readingLabTranslation:"English translation", readingLabAddAnnotation:"Add note", readingLabEditAnnotation:"Edit note", readingLabSaveAnnotation:"Save note", readingLabAnnotation:"Personal note", readingLabAnnotationPlaceholder:"Add a short note about this sentence…", grammarGuide:"Grammar guide", grammarProgress:"Grammar progress", previousLesson:"Previous lesson", nextLesson:"Next lesson", contentBackup:"Personal mnemonic backup", contentBackupHint:"Export your personal mnemonics as JSON or restore them on another device.", exportContent:"Export JSON", importContent:"Restore JSON", contentBackupScope:"Personal Rinemi mnemonics only; progress and settings are not included.", contentImportConfirm:"Replace existing mnemonics for the kanji in this file?", contentBackupError:"The backup was invalid or the operation failed.", account:"Account", signIn:"Sign in", googleAccount:"Google account", accountTitle:"Sign in to Rinemi", accountLoading:"Preparing your account…", accountUnavailable:"Cloud sign-in is not configured yet.", accountUnavailableHint:"Supabase configuration is not complete for this build; guest mode still works.", accountIntro:"Sign in to sync progress across devices.", continueWithGoogle:"Continue with Google", signingIn:"Signing in…", guestModeHint:"You can also keep learning on this device without an account.", accountSyncHint:"Progress and personal mnemonics stay on this device and sync when connected.", syncing:"Syncing…", synced:"Synced", syncError:"Sync error", syncNow:"Sync now", signOut:"Sign out", localFirst:"Local-first", cloudSync:"Cloud sync", accountMethods:"Sign-in method", emailPassword:"Email & password", magicLink:"Magic link", email:"Email", password:"Password", signInWithEmail:"Sign in with email", createAccount:"Need an account?", createAccountAction:"Create account", sendMagicLink:"Send magic link", magicLinkSent:"A sign-in link was sent to your email.", accountCheckEmail:"Your account was created. Check your email to continue.", emailRequired:"Enter your email.", emailPasswordRequired:"Enter your email and password.", passwordTooShort:"Password must be at least 6 characters.", authError:"Sign-in failed. Please try again.", or:"or", signedIn:"Signed in.", alreadyAccount:"Already have an account?", googleComingSoon:"Google sign-in will be enabled soon.", profile:"Profile", security:"Security", accountSync:"Sync", displayName:"Display name", displayNameHint:"Shown beside your account.", saveProfile:"Save profile", profileSaved:"Display name saved.", nameRequired:"Enter a display name.", nameTooLong:"Display name must be 40 characters or fewer.", currentPassword:"Current password", newPassword:"New password", confirmPassword:"Confirm new password", changePassword:"Change password", passwordChanged:"Password changed successfully.", passwordRequired:"Enter both passwords.", passwordMismatch:"The new passwords do not match.", passwordChangeError:"Password change failed.", accountHubTitle:"Rinemi Account", accountWelcomeTitle:"Protect your progress", accountAuthAction:"Account actions", useMagicLink:"Use a magic link", magicLinkHint:"We’ll email you a one-time sign-in link.", backToSignIn:"Back to sign in", forgotPassword:"Forgot password?", passwordResetHint:"Enter your account email to receive a reset link.", sendResetLink:"Send reset link", passwordResetSent:"A password reset link was sent to your email.", passwordResetError:"We couldn’t send the reset link. Please try again.", showPassword:"Show password", hidePassword:"Hide password", passwordPlaceholder:"••••••••", passwordMinimumHint:"Use at least 6 characters for your password.", sending:"Sending…", setNewPassword:"Set a new password", setPassword:"Set password", setPasswordHint:"No password is currently set for this account.", passwordSetHint:"Password sign-in is available for this account.", syncIdle:"Not synced", lastSynced:"Last synced", accountCardsInSrs:"SRS cards", accountReviewsStored:"Reviews stored", accountPersonalMnemonics:"Personal mnemonics", accountActions:"Account actions", setPasswordWithoutCurrent:"Don’t have a password? Set one", emailReadonly:"Account email", accountOverview:"Manage your account, profile, and security", cardPage:"Card information page", previousCardPage:"Previous card information page", nextCardPage:"Next card information page", swipeForMore:"Swipe for more information"
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
    document.title = language === "fa" ? "Rinemi — پنج کانجی در روز" : "Rinemi — Five kanji a day";
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
