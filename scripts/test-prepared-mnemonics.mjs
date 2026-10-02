import assert from "node:assert/strict";
import fs from "node:fs";

const core = await import("../frontend/src/app/prepared-mnemonic-core.js");
const data = JSON.parse(fs.readFileSync("kanji-data.json", "utf8"));
const catalog = Array.isArray(data?.kanji) ? data.kanji.map(item => ({
  character: item.character,
  meaning: item.meaning,
  meanings: item.meaning
})) : [];

assert.equal(catalog.length, 2136, "Prepared mnemonic coverage must target all 2,136 Jōyō kanji");
assert.equal(core.PREPARED_MNEMONIC_VERSION, "2.6.0", "Prepared mnemonic version must reflect curated enrichment");
assert.equal(Object.keys(core.CURATED_PREPARED_MNEMONICS).length, 259, "The original 39 plus 220 enriched curated mnemonics must remain present");
assert.equal(Object.keys(core.CURATED_PREPARED_MNEMONICS).filter(character => core.CURATED_PREPARED_MNEMONICS[character]?.[0]?.source === "curated").length, 259, "Every curated entry must retain curated provenance");

for (const item of catalog) {
  const mnemonic = core.buildPreparedMnemonic(item, []);
  assert.equal(typeof mnemonic.fa, "string");
  assert.equal(typeof mnemonic.en, "string");
  assert.ok(mnemonic.fa.trim().length > 0, `Missing Persian mnemonic for ${item.character}`);
  assert.ok(mnemonic.en.trim().length > 0, `Missing English mnemonic for ${item.character}`);
}

const entries = core.buildPreparedMnemonicEntries(catalog, () => []);
assert.equal(entries.length, 2136, "Prepared mnemonic library must expose every catalog kanji");
assert.equal(new Set(entries.map(entry => entry.character)).size, 2136, "Prepared mnemonic library contains duplicate characters");

const curatedEntries = Object.fromEntries(Object.entries(core.CURATED_PREPARED_MNEMONICS).map(([character, values]) => [character, values?.[0]]));
const faTexts = Object.values(curatedEntries).map(entry => String(entry?.fa ?? "").replace(/\s+/g, " ").trim());
const enTexts = Object.values(curatedEntries).map(entry => String(entry?.en ?? "").replace(/\s+/g, " ").trim());
assert.equal(new Set(faTexts).size, faTexts.length, "Curated Persian mnemonic corpus contains exact duplicates");
assert.equal(new Set(enTexts).size, enTexts.length, "Curated English mnemonic corpus contains exact duplicates");

// Human-reviewed semantic sentinel set (2026-10-02): representative shape, component,
// directional, lexical, and high-confusion kanji. These anchors guard against regressions
// in the reviewed corpus without pretending that a regex can judge mnemonic quality alone.
const semanticReviewSentinels = [
  ["日", /خورشید/, /sun/i],
  ["月", /ماه/, /moon/i],
  ["火", /آتش/, /flames?/i],
  ["水", /آب/, /water/i],
  ["木", /درخت/, /tree/i],
  ["生", /جوانه/, /sprout/i],
  ["行", /مسافر|قدم/, /traveler|moving/i],
  ["左", /دست|چپ/, /hand|left/i],
  ["右", /دست|راست/, /hand|right/i],
  ["前", /جلو|جلوی/, /front/i],
  ["後", /پشت|عقب/, /behind/i],
  ["入", /داخل|وارد/, /inward|step in/i],
  ["出", /بیرون|خارج/, /out|exit|emerge/i],
  ["言", /حرف|دهان|واژه/, /spoken words?|strokes/i],
  ["家", /خانه|سقف|خوک/, /household|roof/i],
  ["題", /سؤال|موضوع|برگه/, /question|topic|page/i],
  ["勝", /رقیب|زور|پیروزی/, /rival|victory|beat/i],
  ["機", /دستگاه|سازوکار|چوب/, /machine|mechanism|frame/i],
  ["議", /حرف|بحث|میز/, /debating|table|debate/i],
  ["共", /دست|هم/, /hands?|together/i],
];
for (const [character, faPattern, enPattern] of semanticReviewSentinels) {
  const entry = curatedEntries[character];
  assert.ok(entry, `Semantic-review sentinel missing for ${character}`);
  assert.match(entry.fa, faPattern, `Persian semantic anchor missing for ${character}`);
  assert.match(entry.en, enPattern, `English semantic anchor missing for ${character}`);
}


const coverage = core.preparedMnemonicCoverage(catalog);
assert.deepEqual(coverage, { total: 2136, curated: 259, generated: 1877, coverage: 1 });

const quality = core.preparedMnemonicQualityReport(catalog);
assert.equal(quality.criticalFailures, 0, "Curated mnemonics must satisfy the core validity contract");
assert.equal(quality.genericTemplateLeaks, 0, "Curated mnemonics must not fall back to generic templates");
assert.ok(quality.concreteAnchorFaRate >= 0.8, `At least 80% of curated Persian mnemonics should contain a concrete anchor; got ${quality.concreteAnchorFaRate}`);
assert.ok(quality.concreteAnchorEnRate >= 0.9, `At least 90% of curated English mnemonics should contain a concrete anchor; got ${quality.concreteAnchorEnRate}`);
assert.equal(quality.passes, true, "Prepared mnemonic quality report must pass");
assert.ok(quality.actionSceneFaRate >= 0.25, `Curated Persian mnemonics should contain a concrete action scene; got ${quality.actionSceneFaRate}`);
assert.ok(quality.actionSceneEnRate >= 0.25, `Curated English mnemonics should contain a concrete action scene; got ${quality.actionSceneEnRate}`);

const generatedTarget = catalog.find(item => !core.CURATED_PREPARED_MNEMONICS[item.character]);
assert.ok(generatedTarget, "At least one Jōyō kanji must remain on generated fallback coverage");
assert.match(core.buildPreparedMnemonic(generatedTarget, ["毎", "氵"]).fa, /毎・氵/);

for (const character of Object.keys(core.CURATED_PREPARED_MNEMONICS)) {
  const entry = core.CURATED_PREPARED_MNEMONICS[character]?.[0];
  assert.ok(entry?.fa.length >= 20, `Curated Persian mnemonic is too short for ${character}`);
  assert.ok(entry?.en.length >= 20, `Curated English mnemonic is too short for ${character}`);
  assert.doesNotMatch(entry.fa, /یک تصویر واحد از/);
  assert.doesNotMatch(entry.en, /Picture the visual anchors/);
}

console.log("Curated enrichment contract: PASS (259 curated; 220 new high-frequency enrichments)");
console.log(`Mnemonic quality gate: PASS (${quality.concreteAnchorFa}/${quality.curated} fa concrete anchors; ${quality.concreteAnchorEn}/${quality.curated} en concrete anchors; ${quality.actionSceneFa}/${quality.curated} fa action scenes; ${quality.actionSceneEn}/${quality.curated} en action scenes)`);

console.log("Prepared mnemonic coverage: PASS (2136/2136; 259 curated + 1877 generated fallbacks)");
console.log(`Semantic sentinel review: PASS (${semanticReviewSentinels.length} representative curated kanji; exact-duplicate guard active)`);

assert.equal(quality.generated, 1877, "Generated fallback count must remain explicit");
assert.equal(quality.generatedSourceFailures, 0, "Generated fallback entries must retain generated provenance");
assert.equal(quality.generatedMeaningFailures, 0, "Generated fallback entries must contain substantive bilingual scaffolds");
assert.ok(quality.generatedMeaningRate >= 1, `Every generated fallback should meet minimum scaffold length; got ${quality.generatedMeaningRate}`);
assert.ok(quality.generatedMeaningConnectedRate >= 0.99, `Generated fallbacks should explicitly connect to their catalog meaning; got ${quality.generatedMeaningConnectedRate}`);
assert.equal(quality.generatedComponentConnectedRate, 1, "Generated fallbacks without components should remain valid scaffold coverage");

assert.equal(quality.curated, 259, "Semantic pass must preserve the curated corpus size");
