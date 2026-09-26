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
assert.equal(Object.keys(core.CURATED_PREPARED_MNEMONICS).length, 39, "The original curated 39 mnemonics must remain intact");

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
assert.deepEqual(coverage, { total: 2136, curated: 39, generated: 2097, coverage: 1 });
assert.match(core.buildPreparedMnemonic({ character: "海", meaning: ["sea"] }, ["毎", "氵"]).fa, /毎・氵|معنی «sea»/);

console.log("Prepared mnemonic coverage: PASS (2136/2136; 39 curated + 2097 generated fallbacks)");
