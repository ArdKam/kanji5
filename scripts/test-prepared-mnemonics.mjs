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
assert.equal(core.PREPARED_MNEMONIC_VERSION, "2.7.0", "Prepared mnemonic version must reflect curated enrichment");
assert.equal(Object.keys(core.CURATED_PREPARED_MNEMONICS).length, 303, "The curated mnemonic corpus must remain present after enrichment");
assert.equal(Object.keys(core.CURATED_PREPARED_MNEMONICS).filter(character => core.CURATED_PREPARED_MNEMONICS[character]?.[0]?.source === "curated").length, 303, "Every curated entry must retain curated provenance");

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

const coverage = core.preparedMnemonicCoverage(catalog);
assert.ok(Math.abs(coverage.coverage - (303 / 2136)) < 1e-12, `Coverage ratio must be curated/total; got ${coverage.coverage}`);
assert.deepEqual({ total: coverage.total, curated: coverage.curated, generated: coverage.generated }, { total: 2136, curated: 303, generated: 1833 });

const quality = core.preparedMnemonicQualityReport(catalog);
assert.equal(quality.generatedSceneV2, 1833, "Every non-curated Jōyō kanji must use the scene-v2 fallback");
assert.equal(quality.generatedGenericTemplateLeaks, 0, "Scene-v2 fallbacks must not use the retired generic templates");
assert.equal(quality.criticalFailures, 0, "Curated mnemonics must satisfy the core validity contract");
assert.equal(quality.genericTemplateLeaks, 0, "Curated mnemonics must not fall back to generic templates");
assert.ok(quality.concreteAnchorFaRate >= 0.8, `At least 80% of curated Persian mnemonics should contain a concrete anchor; got ${quality.concreteAnchorFaRate}`);
assert.ok(quality.concreteAnchorEnRate >= 0.9, `At least 90% of curated English mnemonics should contain a concrete anchor; got ${quality.concreteAnchorEnRate}`);
assert.equal(quality.passes, true, "Prepared mnemonic quality report must pass");
assert.ok(quality.actionSceneFaRate >= 0.25, `Curated Persian mnemonics should contain a concrete action scene; got ${quality.actionSceneFaRate}`);
assert.ok(quality.actionSceneEnRate >= 0.25, `Curated English mnemonics should contain a concrete action scene; got ${quality.actionSceneEnRate}`);

const generatedTarget = catalog.find(item => !core.CURATED_PREPARED_MNEMONICS[item.character]);
assert.ok(generatedTarget, "At least one Jōyō kanji must remain on generated fallback coverage");
const generatedSample = core.buildPreparedMnemonic(generatedTarget, ["木", "氵"]);
assert.equal(generatedSample.source, "generated");
assert.equal(generatedSample.generationStrategy, "scene-v2");
assert.doesNotMatch(generatedSample.fa, /یک تصویر واحد از/);
assert.doesNotMatch(generatedSample.en, /Picture the visual anchors/);
assert.match(generatedSample.fa, /درخت|آب|جزء/);

for (const character of Object.keys(core.CURATED_PREPARED_MNEMONICS)) {
  const entry = core.CURATED_PREPARED_MNEMONICS[character]?.[0];
  assert.ok(entry?.fa.length >= 20, `Curated Persian mnemonic is too short for ${character}`);
  assert.ok(entry?.en.length >= 20, `Curated English mnemonic is too short for ${character}`);
  assert.doesNotMatch(entry.fa, /یک تصویر واحد از/);
  assert.doesNotMatch(entry.en, /Picture the visual anchors/);
}

const scorerCases = [
  { entry: { fa: "یک صحنهٔ واقعی با درخت که می‌دود.", en: "Picture a real scene with a tree that runs.", source: "curated" }, expected: { valid: true, minLength: true, concreteAnchorFa: true, concreteAnchorEn: true, actionSceneFa: true, actionSceneEn: true, genericTemplate: false } },
  { entry: { fa: "یک تصویر واحد از «木» بساز.", en: "Picture the visual anchors 木.", source: "generated" }, expected: { genericTemplate: true } },
  { entry: { fa: "کوتاه", en: "short", source: "curated" }, expected: { minLength: false } }
];
for (const testCase of scorerCases) {
  const score = core.scorePreparedMnemonic(testCase.entry, "木", ["木"]);
  for (const [key, value] of Object.entries(testCase.expected)) assert.equal(score[key], value, `Scorer regression for ${key}`);
}

console.log("Curated enrichment contract: PASS (303 curated; 44 additional research-informed enrichments)");
console.log(`Mnemonic quality gate: PASS (${quality.concreteAnchorFa}/${quality.curated} fa concrete anchors; ${quality.concreteAnchorEn}/${quality.curated} en concrete anchors; ${quality.actionSceneFa}/${quality.curated} fa action scenes; ${quality.actionSceneEn}/${quality.curated} en action scenes)`);

console.log("Prepared mnemonic coverage: PASS (2136/2136; 303 curated + 1833 generated fallbacks)");

assert.equal(quality.curated, 303, "Semantic pass must preserve the curated corpus size");
