import assert from "node:assert/strict";
import fs from "node:fs";

const support = fs.readFileSync("frontend/src/app/mnemonic-support.ts", "utf8");
const app = fs.readFileSync("frontend/src/app/App.tsx", "utf8");
const breakdown = fs.readFileSync("frontend/src/app/ComponentBreakdown.tsx", "utf8");
const panel = fs.readFileSync("frontend/src/app/MnemonicSupport.tsx", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

assert.match(support, /export const COMPONENT_LABELS/);
assert.match(support, /export function getComponentLabel/);
assert.match(support, /export const CONFUSABLE_GROUPS/);
assert.match(support, /export function getConfusableCue/);
assert.match(support, /export function getConfusableNetwork/);
assert.match(support, /export function buildMnemonicSupport/);
assert.match(support, /export function getMnemonicSupportPresentationMode/);

const labelKeys = [...support.matchAll(/^  "([^"]+)": \{ fa:/gm)].map(match => match[1]);
assert.ok(new Set(labelKeys).size >= 60, `Expected at least 60 named visual components, found ${new Set(labelKeys).size}`);

const groupIds = [...support.matchAll(/^    id: "([^"]+)",$/gm)].map(match => match[1]);
assert.ok(new Set(groupIds).size >= 20, `Expected at least 20 confusion groups, found ${new Set(groupIds).size}`);
assert.match(support, /members: \["未", "末"\]/);
assert.match(support, /members: \["大", "犬", "太"\]/);
assert.match(support, /members: \["清", "情", "晴"\]/);
assert.match(support, /members: \["間", "問"\]/);
assert.match(support, /basis: "stroke"/);
assert.match(support, /basis: "component"/);
assert.match(support, /basis: "enclosure"/);

assert.match(support, /pickVocabularyExample/);
assert.match(support, /function normalizeKana/);
assert.match(support, /function readingMatchScore/);
assert.match(support, /preferredReadings/);
assert.match(support, /best\.readingScore === 0/);
assert.match(support, /readingExample/);
assert.match(support, /Anchor the reading/);
assert.match(support, /READING_KEYWORDS/);
assert.match(support, /getReadingKeyword/);
assert.match(support, /keywordEn/);
assert.match(support, /keywordFa/);
assert.doesNotMatch(support, /keywordStrength/, "Removed reading keywordStrength field must not return to the public mnemonic contract");
assert.match(support, /sheep/);
assert.match(support, /Kyoto/);
assert.match(support, /cake/);
assert.match(support, /egg/);
assert.match(support, /soup/);
assert.ok((support.match(/^  "[^"]+": \{\n    "reading":/gm) ?? []).length >= 60, "Reading keyword map must remain substantial");
assert.match(support, /lexical context/);

const readingDataStart = support.indexOf("export const READING_KEYWORDS");
const componentDataStart = support.indexOf("export const COMPONENT_LABELS");
assert.ok(readingDataStart >= 0 && componentDataStart > readingDataStart, "Reading keyword data source must be present");
let readingDataCode = support.slice(readingDataStart, componentDataStart);
readingDataCode = readingDataCode.replace(
  "export const READING_KEYWORDS: Readonly<Record<string, ReadingKeyword>> =",
  "const READING_KEYWORDS ="
);
const readingFnStart = support.indexOf("function normalizeKatakana");
const readingFnEnd = support.indexOf("export type ConfusableBasis", readingFnStart);
assert.ok(readingFnStart >= 0 && readingFnEnd > readingFnStart, "Reading keyword runtime functions must be present");
let readingFnCode = support.slice(readingFnStart, readingFnEnd)
  .replace("function normalizeKatakana(value: string): string", "function normalizeKatakana(value)")
  .replace("export function getReadingKeyword(reading: string): ReadingKeyword | null", "function getReadingKeyword(reading)");
const readingRuntime = Function(`${readingDataCode};${readingFnCode}; return { getReadingKeyword };`)();
assert.equal(readingRuntime.getReadingKeyword("シ")?.keywordEn, "sheep", "Runtime keyword lookup must execute against the real map");
assert.equal(readingRuntime.getReadingKeyword("shi")?.keywordEn, undefined, "English transliteration is not a reading-key lookup");
assert.equal(readingRuntime.getReadingKeyword("シ")?.keywordFa, "گوسفند", "Runtime keyword lookup must preserve the curated Persian anchor");
const qualityHooks = {
  "シ": "sheep",
  "セイ": "sail",
  "ショ": "shop",
  "ケン": "kennel",
  "ク": "coop",
  "ゴ": "goal",
  "コン": "cone",
  "アン": "ant",
  "ブ": "boot",
  "ダン": "dawn",
  "ナン": "naan",
  "ミン": "mint",
  "キュウ": "cube",
  "メイ": "mail",
  "フ": "hoop",
  "ヨウ": "yoyo",
  "ワ": "wall",
  "ギ": "gear",
  "マイ": "mice",
  "ユウ": "ewe",
  "ジン": "jean",
  "オウ": "oak"
};
const keywordMapStart = support.indexOf("export const READING_KEYWORDS");
const keywordMapEnd = support.indexOf("export const COMPONENT_LABELS", keywordMapStart);
let keywordMapCode = support.slice(keywordMapStart, keywordMapEnd)
  .replace(
    "export const READING_KEYWORDS: Readonly<Record<string, ReadingKeyword>> = Object.freeze(",
    "const READING_KEYWORDS = "
  )
  .replace(/\}\);\s*$/, "}");
const keywordMap = Function(`${keywordMapCode}; return READING_KEYWORDS;`)();
const keywordEntries = Object.values(keywordMap);
assert.equal(keywordEntries.length, 151, "Phonetic hook audit should retain only the current quality-filtered set");
assert.equal(
  new Set(keywordEntries.map(entry => entry.keywordEn.trim().toLowerCase())).size,
  keywordEntries.length,
  "Each active phonetic hook should have a distinct keyword to avoid cross-reading cue collision"
);
assert.equal(
  keywordEntries.filter(entry => entry.keywordEn.trim().length <= 2).length,
  0,
  "Active phonetic hooks must not use one- or two-character English anchors"
);
for (const [reading, keyword] of Object.entries(qualityHooks)) {
  assert.equal(readingRuntime.getReadingKeyword(reading)?.keywordEn, keyword, `Quality hook regression for ${reading}`);
}
assert.equal(readingRuntime.getReadingKeyword("ガ"), null, "Weak synthetic single-mora hook ガ should stay removed");
assert.equal(readingRuntime.getReadingKeyword("ジキ"), null, "Synthetic G-key hook should stay removed");
assert.equal(readingRuntime.getReadingKeyword("ジカ"), null, "Synthetic G-car hook should stay removed");

const exampleFnStart = support.indexOf("function normalizeKana");
const exampleFnEnd = support.indexOf("export function buildMnemonicSupport", exampleFnStart);
assert.ok(exampleFnStart >= 0 && exampleFnEnd > exampleFnStart, "Vocabulary selector source must be present");
let exampleCode = support.slice(exampleFnStart, exampleFnEnd)
  .replace("function normalizeKana(value: string): string", "function normalizeKana(value)")
  .replace("function readingMatchScore(exampleReading: string, targetReading: string): number", "function readingMatchScore(exampleReading, targetReading)")
  .replace(
    "function pickVocabularyExample(\n  examples: MnemonicExample[] | undefined,\n  character: string,\n  preferredReadings: string[] = []\n): MnemonicExample | null",
    "function pickVocabularyExample(\n  examples,\n  character,\n  preferredReadings = []\n)"
  );
assert.doesNotMatch(exampleCode, /:\s*(?:string|number|boolean|MnemonicExample|MnemonicExample\[\])/);
const exampleRuntime = Function(`${exampleCode}; return { pickVocabularyExample };`)();
const selectedReadingExample = exampleRuntime.pickVocabularyExample(
  [
    { word: "海苔", reading: "のり", meaning: "seaweed" },
    { word: "海外", reading: "かいがい", meaning: "overseas" }
  ],
  "海",
  ["カイ"]
);
assert.equal(selectedReadingExample?.word, "海外", "Reading-aware selector must reject a character match with an unrelated reading");
assert.equal(
  exampleRuntime.pickVocabularyExample([{ word: "海苔", reading: "のり", meaning: "seaweed" }], "海", ["カイ"]),
  null,
  "Reading-aware selector must return no example when preferred reading has no supported match"
);
assert.equal(
  exampleRuntime.pickVocabularyExample(
    [
      { word: "外国", reading: "がいこく", meaning: "foreign country" },
      { word: "海外", reading: "かいがい", meaning: "overseas" }
    ],
    "海",
    ["カイ"]
  )?.word,
  "海外",
  "Reading-aware selector must not infer a character's reading from an internal kanji occurrence"
);

assert.match(support, /CONFUSABLE_CUES/);
assert.match(support, /getMnemonicHintStage/);
assert.match(support, /getMnemonicHintPlan/);
assert.match(support, /case "new":/);
assert.match(support, /case "recovery":/);
assert.match(support, /case "early":/);
assert.match(support, /case "stable":/);
assert.match(support, /case "mastered":/);
assert.match(support, /latestWasWrong/);
assert.match(support, /currentFailures\.length >= 2/);
assert.doesNotMatch(support, /context\.engineHint/, "Mnemonic policy must not reintroduce the removed UI-only engineHint fallback");

assert.match(breakdown, /getComponentLabel/);
assert.match(breakdown, /component-breakdown-label/);
assert.match(app, /buildMnemonicSupport\(/);
assert.match(app, /getMnemonicHintStage/);
assert.match(app, /<MnemonicSupportPanel/);
assert.match(app, /hintStage=\{mnemonicHintStage\}/);
assert.match(app, /<Learning card=\{snapshot\.learning\} snapshot=\{snapshot\}/);

assert.match(panel, /mnemonic-support-confusable/);
assert.match(panel, /mnemonic-support-reading/);
assert.match(panel, /mnemonic-support-vocab-row/);
assert.match(panel, /<details className/);
assert.match(panel, /<summary className="mnemonic-support-header"/);
assert.match(panel, /hintStage\?: MnemonicHintStage/);
assert.match(panel, /getMnemonicHintPlan/);
assert.match(panel, /data-hint-stage=\{stage\}/);
assert.match(panel, /data-hint-focus=\{hintFocus\}/);
assert.match(panel, /stage === "mastered"/);
assert.match(panel, /plan\.showConfusable/);
assert.match(panel, /plan\.showReading/);
assert.match(panel, /plan\.showVocabulary/);
assert.match(sw, /const DATA_CACHE='kanji5-data-v25'/, "Mnemonic component data cache must be versioned");
assert.match(sw, /kanji-components\.json/, "Component data must be included in the offline data cache");

assert.match(panel, /hintFocus\?: MnemonicHintFocus/);
assert.match(support, /wordStartsWithCharacter/);

assert.match(app, /data-mnemonic-source/);
assert.match(app, /preparedMnemonicCurated/);
assert.match(app, /preparedMnemonicScaffold/);
assert.match(app, /preparedMnemonic\.source==="curated"/);
assert.match(app, /makeMnemonicYourOwn/);
assert.match(app, /setMnemonicEditing\(true\)/);
assert.match(app, /preparedMode!=="hidden"/);


const bigGroupStart = support.indexOf('id: "大犬太"');
const bigGroupEnd = support.indexOf('    id: "', bigGroupStart + 1);
const bigGroup = support.slice(bigGroupStart, bigGroupEnd < 0 ? support.length : bigGroupEnd);
assert.equal((bigGroup.match(/"大": \{/g) ?? []).length, 1, "The 大 group must keep one target cue");
assert.match(bigGroup, /"犬": \{/);
assert.match(bigGroup, /"太": \{/);


const kanjiData = JSON.parse(fs.readFileSync("kanji-data.json", "utf8"));
const joyo = new Set((kanjiData.kanji ?? []).map(item => item.character));

const groupStart = support.indexOf("export const CONFUSABLE_GROUPS");
const groupEnd = support.indexOf("\nconst CONFUSABLE_CUES", groupStart);
assert.ok(groupStart >= 0 && groupEnd > groupStart, "Confusion group source must be present");
const groupCode = support
  .slice(groupStart, groupEnd)
  .replace("export const CONFUSABLE_GROUPS: Readonly<ConfusableGroup[]> =", "const CONFUSABLE_GROUPS =");
const confusionGroups = Function(`${groupCode}; return CONFUSABLE_GROUPS;`)();
const confusionCharacters = new Set(confusionGroups.flatMap(group => group.members));
assert.equal(confusionGroups.length, 29, "Confusion network group count must remain explicit and auditable");
assert.equal(confusionCharacters.size, 59, "Confusion network character count must remain stable");
assert.equal([...confusionCharacters].filter(character => !joyo.has(character)).length, 0, "Every confusion-network member must be a Jōyō kanji");
assert.equal(confusionGroups.filter(group => group.members.length < 2 || group.members.some(character => !group.cues[character])).length, 0, "Every confusion group must be bidirectional and have target-specific cues");

const hintStart = support.indexOf("function numericSignal");
const hintEnd = support.indexOf("export type MnemonicSupportPresentationMode", hintStart);
assert.ok(hintStart >= 0 && hintEnd > hintStart, "Adaptive hint logic must be present");
let hintCode = support.slice(hintStart, hintEnd);
const planTypeStart = hintCode.indexOf("export type MnemonicHintPlan");
const planFunctionStart = hintCode.indexOf("export function getMnemonicHintPlan", planTypeStart);
assert.ok(planTypeStart >= 0 && planFunctionStart > planTypeStart, "Adaptive hint plan type/function markers must remain present");
hintCode = hintCode.slice(0, planTypeStart) + hintCode.slice(planFunctionStart);
hintCode = hintCode.replace(/export type PreparedMnemonicPresentationMode = "[^"]+"(?: \| "[^"]+")*;\n\n/, "");
hintCode = hintCode
  .replace("function numericSignal(value: unknown): number | null", "function numericSignal(value)")
  .replace("function stateIsMastered(value: unknown): boolean", "function stateIsMastered(value)")
  .replace("function isWeakSkill(skill?: MnemonicLearnerSkill): boolean", "function isWeakSkill(skill)")
  .replace("function recentFailureIsCurrent(item: { correct?: boolean; outcome?: string; at?: string }): boolean", "function recentFailureIsCurrent(item)")
  .replace("function getMnemonicHintStage(context: MnemonicHintContext = {}): MnemonicHintStage", "function getMnemonicHintStage(context = {})")
  .replace("function getMnemonicHintFocus(context: MnemonicHintContext = {}): MnemonicHintFocus", "function getMnemonicHintFocus(context = {})")
  .replace("function getMnemonicHintPlan(stage: MnemonicHintStage, focus: MnemonicHintFocus = \"both\"): MnemonicHintPlan", "function getMnemonicHintPlan(stage, focus = \"both\")")
  .replace("(value): value is number =>", "value =>")
  .replaceAll("export function ", "function ");
assert.doesNotMatch(hintCode, /\bexport\s/);
const hintFns = Function(`${hintCode}; return { getMnemonicHintStage, getMnemonicHintFocus, getMnemonicHintPlan };`)();
assert.equal(hintFns.getMnemonicHintStage({ character: "未", isNew: true }), "new");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", recentOutcomes: [], learner: { meaning: { state: "stable", confidence: .9 }, reading: { state: "stable", confidence: .9 } } }), "stable");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", recentOutcomes: [{ character: "未", correct: false, outcome: "wrong", at: new Date().toISOString() }], learner: { meaning: { state: "stable", confidence: .9 }, reading: { state: "stable", confidence: .9 } } }), "recovery");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", recentOutcomes: [{ character: "未", correct: false, outcome: "wrong", at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }], learner: { meaning: { state: "stable", confidence: .9 }, reading: { state: "stable", confidence: .9 } } }), "stable");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", learner: { meaning: { state: "learning", confidence: .9, repeatedFailure: true }, reading: { state: "stable", confidence: .9 } } }), "recovery");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", learner: { meaning: { state: "unseen", confidence: 0, accuracy: 0, recentAccuracy: 0 }, reading: { state: "unseen", confidence: 0, accuracy: 0, recentAccuracy: 0 } } }), "stable");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", learner: { meaning: { confidence: .6, recentAccuracy: .65, state: "learning" }, reading: { confidence: .9, state: "stable" } } }), "early");
assert.equal(hintFns.getMnemonicHintFocus({ learner: { meaning: { state: "learning", confidence: .6, recentAccuracy: .65 }, reading: { state: "stable", confidence: .9 } } }), "meaning");
assert.equal(hintFns.getMnemonicHintFocus({ learner: { meaning: { state: "stable", confidence: .9 }, reading: { state: "learning", confidence: .6, recentAccuracy: .65 } } }), "reading");
assert.equal(hintFns.getMnemonicHintFocus({ learner: { meaning: { state: "learning", confidence: .6, recentAccuracy: .65 }, reading: { state: "learning", confidence: .6, recentAccuracy: .65 } } }), "both");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", learner: { meaning: { confidence: .9, state: "stable" }, reading: { confidence: .9, state: "stable" } } }), "stable");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", learner: { meaning: { confidence: .6, state: "mastered" }, reading: { confidence: .6, state: "mastered" } } }), "mastered");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", learner: { meaning: { state: "recovering", confidence: .8, recentAccuracy: .7 }, reading: { state: "stable", confidence: .9 } }  }), "recovery");
assert.equal(hintFns.getMnemonicHintStage({ character: "未", learner: { meaning: { state: "learning", confidence: .9, errorStreak: 2 }, reading: { state: "stable", confidence: .9 } } }), "recovery");
assert.deepEqual(hintFns.getMnemonicHintPlan("recovery", "meaning"), { stage: "recovery", focus: "meaning", expandedByDefault: false, showReading: false, showVocabulary: false, showConfusable: true, preparedMode: "expanded" });
assert.deepEqual(hintFns.getMnemonicHintPlan("recovery", "reading"), { stage: "recovery", focus: "reading", expandedByDefault: true, showReading: true, showVocabulary: false, showConfusable: false, preparedMode: "collapsed" });

assert.deepEqual(hintFns.getMnemonicHintPlan("new", "both"), { stage: "new", focus: "both", expandedByDefault: true, showReading: true, showVocabulary: true, showConfusable: true, preparedMode: "expanded" });
assert.deepEqual(hintFns.getMnemonicHintPlan("recovery", "both"), { stage: "recovery", focus: "both", expandedByDefault: true, showReading: true, showVocabulary: false, showConfusable: true, preparedMode: "expanded" });
assert.deepEqual(hintFns.getMnemonicHintPlan("early", "reading"), { stage: "early", focus: "reading", expandedByDefault: true, showReading: true, showVocabulary: false, showConfusable: true, preparedMode: "collapsed" });
assert.deepEqual(hintFns.getMnemonicHintPlan("early", "meaning"), { stage: "early", focus: "meaning", expandedByDefault: false, showReading: true, showVocabulary: false, showConfusable: true, preparedMode: "expanded" });
assert.deepEqual(hintFns.getMnemonicHintPlan("early", "both"), { stage: "early", focus: "both", expandedByDefault: true, showReading: true, showVocabulary: false, showConfusable: true, preparedMode: "expanded" });
assert.deepEqual(hintFns.getMnemonicHintPlan("stable", "meaning"), { stage: "stable", focus: "meaning", expandedByDefault: false, showReading: true, showVocabulary: false, showConfusable: false, preparedMode: "collapsed" });
assert.deepEqual(hintFns.getMnemonicHintPlan("mastered", "both"), { stage: "mastered", focus: "both", expandedByDefault: false, showReading: false, showVocabulary: false, showConfusable: false, preparedMode: "hidden" });

const adaptivePlanSource = support.slice(hintStart, hintEnd);
assert.match(adaptivePlanSource, /preparedMode: "expanded"/);
assert.match(adaptivePlanSource, /preparedMode: "collapsed"/);
assert.match(adaptivePlanSource, /preparedMode: "hidden"/);
assert.match(adaptivePlanSource, /repeatedFailure/);
assert.match(adaptivePlanSource, /errorStreak/);
assert.match(adaptivePlanSource, /momentum/);
assert.match(adaptivePlanSource, /0\.75/);
assert.match(adaptivePlanSource, /0\.60/);
assert.match(adaptivePlanSource, /7 \* 24 \* 60 \* 60 \* 1000/);


console.log(`Mnemonic support contract: PASS (${new Set(labelKeys).size} named components; ${new Set(groupIds).size} confusion groups)`);
