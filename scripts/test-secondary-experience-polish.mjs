import assert from "node:assert/strict";
import fs from "node:fs";

const styles=fs.readFileSync("frontend/src/styles.css","utf8");
const dictionaryCss=fs.readFileSync("frontend/src/app/dictionary.css","utf8");
const settings=fs.readFileSync("frontend/src/app/SettingsDialog.tsx","utf8");
const backup=fs.readFileSync("frontend/src/app/DataBackup.tsx","utf8");
const state=fs.readFileSync("v1.5-state.js","utf8");
const grammar=fs.readFileSync("frontend/src/app/GrammarGuide.tsx","utf8");
const reading=fs.readFileSync("frontend/src/app/ReadingLab.tsx","utf8");
const mnemonics=fs.readFileSync("frontend/src/app/MnemonicsDialog.tsx","utf8");

assert.match(styles,/\.dialog\.secondary-page-dialog\{[\s\S]*?position:fixed;[\s\S]*?inset:50% auto auto 50%;[\s\S]*?transform:translate\(-50%,-50%\)/);
assert.ok(styles.includes(".stats-hero"),"stats hero hierarchy missing");
assert.ok(styles.includes(".settings-save-region"),"settings sticky action region missing");
assert.ok(styles.includes(".reading-lab-analysis"),"reading analysis hierarchy missing");
assert.ok(styles.includes(".prepared-mnemonic-library-row"),"mnemonic library row polish missing");

assert.ok(dictionaryCss.includes(".grammar-progress-track"),"grammar progress track missing");
assert.ok(dictionaryCss.includes(".grammar-feedback.incorrect"),"grammar incorrect feedback state missing");
assert.ok(dictionaryCss.includes(".reading-lab-analysis"),"reading lab final style override missing");

assert.ok(!settings.includes("ThemePreference"),"Settings should not own theme preference");
assert.ok(!settings.includes("onLanguageChange"),"Settings should not own language preference");
for(const heading of ["Learning","Review scheduling","Data & backup"]) {
  assert.ok(settings.includes(heading),`Settings section missing: ${heading}`);
}

assert.ok(grammar.includes("GRAMMAR_PROGRESS_KEY"),"Grammar session persistence missing");
assert.ok(grammar.includes("grammar-retry"),"Grammar retry action missing");
assert.match(grammar,/disabled=\{!checked\|\|selectedOption!==lesson\.answer/);

assert.ok(reading.includes("reading-lab-analysis"),"Reading Lab learner-facing analysis missing");
assert.ok(reading.includes("getMasteryBucket"),"Reading Lab mastery classification missing");
assert.ok(reading.includes("reading-lab-source")&&reading.includes("reading-lab-listen")&&reading.includes("reading-lab-reader"),"Reading Lab workflow hierarchy missing");
assert.match(reading,/counts\.familiar \/ extracted\.length/);
assert.match(reading,/readingLabCoverage/);
assert.ok(reading.includes("splitReadingSentences"),"Reading Lab sentence segmentation missing");
assert.ok(reading.includes("activeSentenceIndex"),"Reading Lab focused sentence state missing");
assert.ok(reading.includes("reading-lab-reader-toolbar"),"Reading Lab sentence controls missing");
assert.ok(reading.includes("speakCurrentSentence"),"Reading Lab sentence playback missing");
assert.ok(reading.includes("getVocabulary"),"Reading Lab contextual vocabulary lookup missing");
assert.ok(reading.includes("findLongestVocabularyMatch"),"Reading Lab must use longest-match vocabulary resolution");
assert.ok(reading.includes("READING_LAB_STORAGE_KEY"),"Reading Lab durable session storage missing");
assert.ok(reading.includes("parseSubtitleCues"),"Reading Lab subtitle cue parsing missing");
assert.ok(reading.includes("syncReady"),"Reading Lab audio/subtitle synchronization state missing");
const readingDialog=fs.readFileSync("frontend/src/app/ReadingLabDialog.tsx","utf8");
assert.ok(readingDialog.includes("DictionaryKanjiCard"),"Reading Lab dictionary should remain an overlay");
assert.ok(readingDialog.includes("selectedKanji"),"Reading Lab dictionary selection state missing");
assert.ok(readingDialog.includes("onClose={() => setSelectedKanji(null)}"),"Reading Lab dictionary overlay close should return to the lab");
assert.ok(readingDialog.includes("ReadingLabWordCard"),"Reading Lab word lookup overlay missing");
const readingWord=fs.readFileSync("frontend/src/app/ReadingLabWordCard.tsx","utf8");
assert.ok(readingWord.includes("selection.item.word"),"Reading Lab word card should expose matched vocabulary word");

assert.ok(mnemonics.includes("item?.meanings"),"Mnemonic search does not include meanings");
assert.ok(mnemonics.includes("item?.on"),"Mnemonic search does not include on readings");
assert.ok(mnemonics.includes("item?.kun"),"Mnemonic search does not include kun readings");

console.log("Kanji5 secondary experience polish contract passed.");

assert.ok(settings.includes('DataBackup'),"Settings data backup surface missing");
assert.ok(!settings.includes('PlacementDiagnostic')&&!settings.includes('onRetakePlacement'),"Placement should not be owned by Settings");
assert.ok(settings.includes('settingsUnsaved')&&settings.includes('settingsDiscardTitle'),"Settings dirty-state UX missing");
assert.ok(settings.includes('settings-reset-trigger'),"Compact destructive action trigger missing");
assert.ok(!settings.includes('ناحیهٔ خطر')&&!settings.includes('Danger zone'),"Destructive section label should not be shown to users");
assert.ok(backup.includes('createBackup')&&backup.includes('restoreBackup'),"Full backup UI actions missing");
assert.ok(state.includes('PORTABLE_BACKUP_FORMAT')&&state.includes('portableBackup(')&&state.includes('restorePortableBackup('),"Portable backup state contract missing");
