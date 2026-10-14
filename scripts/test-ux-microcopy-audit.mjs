import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const app = read("frontend/src/app/App.tsx");
const i18n = read("frontend/src/app/i18n.ts");
const learningCopy = read("frontend/src/app/learning-copy.ts");
const practice = read("frontend/src/app/PracticeHome.tsx");
const customStudy = read("frontend/src/app/CustomStudyPanel.tsx");
const dictionary = read("frontend/src/app/DictionaryPage.tsx");
const vocabulary = read("frontend/src/app/VocabularyExamples.tsx");
const settings = read("frontend/src/app/SettingsDialog.tsx");
const stats = read("frontend/src/app/StatsDialog.tsx");
const account = read("frontend/src/app/AccountDialog.tsx");
const reading = read("frontend/src/app/ReadingLab.tsx");
const readingWord = read("frontend/src/app/ReadingLabWordCard.tsx");
const mnemonicSupport = read("frontend/src/app/MnemonicSupport.tsx");
const mnemonics = read("frontend/src/app/MnemonicsDialog.tsx");
const dataBackup = read("frontend/src/app/DataBackup.tsx");
const mnemonicBackup = read("frontend/src/app/MnemonicBackup.tsx");
const handwriting = read("frontend/src/app/HandwritingPractice.tsx");
const strokeOrder = read("frontend/src/app/StrokeOrderViewer.tsx");
const structure = read("frontend/src/app/KanjiStructureDialog.tsx");
const learningPath = read("frontend/src/app/ComponentLearningPath.tsx");
const topicDialog = read("frontend/src/app/TopicLearningDialog.tsx");
const onboarding = read("frontend/src/app/onboarding/OnboardingFlow.tsx");

const removedTranslationKeys = [
  "menuGrammarHint", "menuReadingHint", "menuMnemonicHint", "menuStatsHint", "menuSettingsHint",
  "practiceIntro", "practiceTopicsHint", "settingsIntro", "learningSettingsHint",
  "reviewSchedulingHint", "targetRetentionHelper", "practiceSkillProductionHint",
  "practiceSkillVocabularyHint", "practiceSkillContextHint", "dataBackupHint", "dictionaryHint",
  "dictionaryVocabularyHint", "preparedMnemonicsHint", "preparedMnemonicLibraryHint",
  "mnemonicBridgesHint", "readingLabSourceHint", "setNewPasswordHint", "passwordHint",
  "strokeOrderHint", "handwritingHint", "onboardingLoopBody"
];
for (const key of removedTranslationKeys) assert.ok(!i18n.includes(`"${key}"`), `obsolete translation key remains: ${key}`);
assert.ok(!learningCopy.includes("recommendedLearningHint") && !learningCopy.includes("topicLearningIntro"), "unused/duplicate learning-copy keys should be removed");

assert.ok(!app.includes('t("menuGrammarHint"') && !app.includes('t("menuSettingsHint"'), "menu items should not render duplicate subtitles");
for (const label of ["grammarGuide", "readingLab", "preparedMnemonics", "stats", "settings"]) assert.ok(app.includes(`aria-label={t("${label}"`), `menu accessible name missing: ${label}`);

assert.ok(!practice.includes('t("practiceIntro"'), "generic practice intro repeats the two primary paths");
assert.ok(!practice.includes('t("practiceTopicsHint"'), "topic card subtitle repeats its title and contents");
assert.ok(!practice.includes('t("practiceTopicSelectedHint"'), "selected-topic behavior hint should appear only once");
assert.ok(customStudy.includes('t("practiceTopicSelectedHint"'), "topic session behavior hint should remain in its working context");
const allTopicsStart = practice.indexOf('<details className="practice-all-topics">');
const allTopicsEnd = practice.indexOf("</details>", allTopicsStart);
const coverageNote = practice.indexOf("practiceTopicCoverageNote", allTopicsStart);
assert.ok(allTopicsStart >= 0 && coverageNote > allTopicsStart && coverageNote < allTopicsEnd, "topic coverage note should be disclosed only after expanding the topic list");
assert.ok(i18n.includes("This recommends a kanji starting point") && i18n.includes("نه سطح کلی ژاپنی"), "placement diagnostic boundary must remain explicit");

assert.ok(dictionary.includes('t("dictionaryPlaceholder", language)'), "search needs a visible placeholder and accessible label");
assert.ok(!dictionary.includes("dictionary-search-hint") && !dictionary.includes('t("dictionaryHint"'), "dictionary search should not repeat its placeholder");
assert.ok(!dictionary.includes('t("preparedMnemonicsHint"'), "prepared mnemonic panel should not repeat its controls");
assert.ok(!vocabulary.includes('t("dictionaryVocabularyHint"'), "vocabulary section should not restate its title");
assert.ok(vocabulary.includes('t("vocabularyLearningGraphHint"'), "the non-obvious co-occurrence graph should remain explained");

assert.ok(!settings.includes('t("settingsIntro"') && !settings.includes('t("learningSettingsHint"') && !settings.includes('t("reviewSchedulingHint"') && !settings.includes('t("dataBackupHint"'), "Settings should not repeat section purpose as subtitles");
assert.ok(!settings.includes("practiceSkillProductionHint") && !settings.includes("practiceSkillVocabularyHint") && !settings.includes("practiceSkillContextHint"), "toggle labels should not repeat the same purpose underneath");
assert.ok(settings.includes('t("targetRetentionHint"') && settings.includes('t("difficultCardThresholdHint"'), "review consequences and the repeated-failure threshold must remain described");
for (const id of ["settings-learning-heading","settings-scheduling-heading","settings-data-heading","settings-support-heading"]) assert.ok(settings.includes(`id="${id}"`) && settings.includes(`aria-labelledby="${id}"`), `Settings heading association missing: ${id}`);
assert.ok(settings.includes("settingsUnsaved") && settings.includes("settingsDiscardTitle") && settings.includes("settings-reset-trigger") && settings.includes("This action cannot be undone"), "unsaved-change and destructive reset safeguards must remain");

assert.ok(stats.includes("Performance details") && stats.includes("جزئیات عملکرد"), "advanced heading should be clear in both languages");
assert.ok((stats.match(/stats-footnote/g) || []).length >= 2, "statistical methodology footnotes must remain");
assert.ok(stats.includes("model confidence") && stats.includes("evidence is sufficient") && stats.includes("اطمینان مدل"), "accuracy, model evidence and comparison limitations must remain clear");
assert.ok(!stats.includes('language === "fa" ? "فعالیت" : "Activity"'), "activity eyebrow should not duplicate the seven-day title");

assert.ok(!account.includes('t("setNewPasswordHint"') && !account.includes('t("passwordHint"'), "account forms should not repeat current/new password labels");
assert.ok(account.includes('t("passwordMinimumHint"'), "minimum password length must remain visible outside the placeholder");
assert.ok(account.includes('t("guestModeHint"') && account.includes('t("accountSyncHint"'), "guest availability and actual sync behavior must remain available");

assert.ok(!reading.includes('t("readingLabSourceHint"'), "Reading Lab source hint duplicates the empty-state action");
assert.ok(reading.includes('t("readingLabEmptyHint"') && reading.includes('t("readingLabImportHint"') && reading.includes('t("readingLabSyncHint"') && reading.includes('t("readingReaderHint"'), "empty state, file-format behavior, sync and non-obvious reader action must remain");
assert.ok(reading.includes('title={t("readingLabWordLookupHint"') && reading.includes('aria-label={character + " — " + t("readingLabWordLookupHint"'), "kanji lookup must retain actionable screen-reader guidance");
assert.ok(!readingWord.includes("readingLabWordLookupHint"), "word result should not repeat the instruction after the action");

assert.ok(!mnemonicSupport.includes("mnemonicBridgesHint") && mnemonicSupport.includes('t("mnemonicBridges")'), "memory-cue section title should carry the meaning without a duplicate subtitle");
assert.ok(mnemonics.includes("does not replace scheduled reviews") && mnemonics.includes("جای مرور زمان‌بندی‌شده را نمی‌گیرد"), "prepared mnemonic library must state that cues do not replace scheduled reviews");
assert.ok(mnemonics.includes("copy.replaceHint") && mnemonics.includes("hasPersonalMnemonic"), "mnemonic replacement warning must remain conditional on replacing an existing mnemonic");
assert.ok(dataBackup.includes("backupRestoreConfirmHint") && dataBackup.includes("candidate.summary"), "restore confirmation must preserve scope and impact details");
assert.ok(mnemonicBackup.includes("contentBackupHint"), "personal-mnemonic backup must continue to identify its portable scope");

assert.ok(!handwriting.includes('t("handwritingHint"'), "collapsed handwriting header should not repeat canvas guidance");
assert.ok(handwriting.includes('t("handwritingPracticeHelp"') && handwriting.includes("aria-describedby"), "expanded canvas must retain touch/mouse/pen instructions and accessible description");
assert.ok(!strokeOrder.includes('t("strokeOrderHint"'), "stroke-order heading should not repeat obvious playback instructions");
assert.ok(strokeOrder.includes('t("strokeOrderLoading"') && strokeOrder.includes("KanjiVG · CC BY-SA 3.0"), "stroke loading and source attribution must remain");
assert.ok(!structure.includes('note={t("visualComponents"'), "structure dialog should not repeat the source label");
assert.ok(structure.includes("ریشه‌شناسی تاریخی") && structure.includes("historical etymology"), "KanjiVG's historical-etymology limitation must remain bilingual");
assert.ok(learningPath.includes('t("componentLearningPathHint"'), "component learning-path caveat must remain");
assert.ok(!topicDialog.includes('learningCopy("topicLearningIntro"'), "topic dialog should not repeat the same intro in the header and footer");
assert.ok(topicDialog.includes('learningCopy("topicSearch"') && topicDialog.includes('learningCopy("topicNoMatches"'), "topic search and its empty state must remain");
assert.ok(!onboarding.includes('t("onboardingLoopBody"') && onboarding.includes('t("onboardingLearnHint"') && onboarding.includes('t("onboardingRecallHint"') && onboarding.includes('t("onboardingReviewHint"'), "onboarding should keep the distinct learning/retrieval/review steps without a duplicate intro");

for (const key of ["practiceRecommendedHint", "practiceAdvancedHint", "customStudyHint", "practiceTopicCoverageNote", "readingLabImportHint", "readingLabSyncHint", "readingReaderHint", "accountIntro", "guestModeHint", "accountSyncHint", "placementDiagnosticHint"]) {
  const occurrences = [...i18n.matchAll(new RegExp(`\\b${key}\\s*:`, "g"))].length;
  assert.equal(occurrences, 2, `translation must have one Fa and one English value: ${key}`);
}
console.log("Rinemi UX microcopy audit contract passed.");
