import assert from "node:assert/strict";
import { appendFile, readFile } from "node:fs/promises";

const SOURCE_COMMIT = "f79c68c9e35c6f8269a6b66e86c63c3713db06a0";
const SOURCE_URL = "https://raw.githubusercontent.com/jkindrix/japanese-language-data/" + SOURCE_COMMIT + "/data/core/kanji-joyo.json";
const EXPECTED_COUNT = 2136;
const [snapshotText, response] = await Promise.all([
  readFile(new URL("../kanji-data.json", import.meta.url), "utf8"),
  fetch(SOURCE_URL, { cache: "no-store" }),
]);
assert.equal(response.ok, true, "Pinned Jōyō source fetch failed: HTTP " + response.status);
const source = await response.json();
const snapshot = JSON.parse(snapshotText);
const sourceEntries = Array.isArray(source.kanji) ? source.kanji : [];
const snapshotEntries = Array.isArray(snapshot.kanji) ? snapshot.kanji : [];
assert.equal(sourceEntries.length, EXPECTED_COUNT, "Pinned source must contain 2,136 entries");
assert.equal(snapshotEntries.length, EXPECTED_COUNT, "Generated snapshot must contain 2,136 entries");

const sourceByCharacter = new Map(sourceEntries.map(entry => [entry.character, entry]));
assert.equal(sourceByCharacter.size, EXPECTED_COUNT, "Pinned source characters must be unique");
const snapshotByCharacter = new Map(snapshotEntries.map(entry => [entry.character, entry]));
assert.equal(snapshotByCharacter.size, EXPECTED_COUNT, "Snapshot characters must be unique");
assert.deepEqual([...sourceByCharacter.keys()].filter(character => !snapshotByCharacter.has(character)), [],
  "Snapshot is missing a source character");
assert.deepEqual([...snapshotByCharacter.keys()].filter(character => !sourceByCharacter.has(character)), [],
  "Snapshot contains a character outside the pinned source");

const fields = [
  { output: "meaning", input: entry => entry.meanings?.en || [], cap: 3 },
  { output: "on", input: entry => entry.readings?.on || [], cap: 4 },
  { output: "kun", input: entry => entry.readings?.kun || [], cap: 4 },
];
const report = {
  source: "KANJIDIC2 via jkindrix/japanese-language-data",
  sourceCommit: SOURCE_COMMIT,
  sourceEntries: sourceEntries.length,
  snapshotEntries: snapshotEntries.length,
  fields: {},
  entriesWithAnyOverflow: 0,
  sampleOverflowEntries: [],
  transformMismatches: [],
};

const overflowCharacters = new Set();
for (const field of fields) {
  let sourceValues = 0;
  let storedValues = 0;
  let omittedValues = 0;
  let affectedEntries = 0;
  let mismatches = 0;
  for (const [character, sourceEntry] of sourceByCharacter) {
    const values = field.input(sourceEntry);
    const stored = snapshotByCharacter.get(character)[field.output];
    const expected = values.slice(0, field.cap);
    sourceValues += values.length;
    storedValues += Array.isArray(stored) ? stored.length : 0;
    if (values.length > field.cap) {
      const omitted = values.length - field.cap;
      omittedValues += omitted;
      affectedEntries += 1;
      overflowCharacters.add(character);
      const existing = report.sampleOverflowEntries.find(entry => entry.character === character);
      const item = existing || { character, omitted: {} };
      item.omitted[field.output] = omitted;
      if (!existing && report.sampleOverflowEntries.length < 50) report.sampleOverflowEntries.push(item);
    }
    if (JSON.stringify(stored) !== JSON.stringify(expected)) {
      mismatches += 1;
      if (report.transformMismatches.length < 50) {
        report.transformMismatches.push({ character, field: field.output, expected, stored });
      }
    }
  }
  report.fields[field.output] = { cap: field.cap, sourceValues, storedValues, entriesOverCap: affectedEntries, valuesBeyondCap: omittedValues, transformMismatches: mismatches };
}
report.entriesWithAnyOverflow = overflowCharacters.size;

console.log("Rinemi pinned-source overflow audit");
console.log(JSON.stringify(report, null, 2));
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const lines = [
    "## Rinemi pinned-source completeness audit",
    "",
    "Source: jkindrix/japanese-language-data at " + SOURCE_COMMIT,
    "",
    "| Field | Source values | Stored values | Entries above cap | Values beyond cap | Transform mismatches |",
    "|---|---:|---:|---:|---:|---:|",
    ...Object.entries(report.fields).map(([field, values]) => "| " + field + " | " + values.sourceValues + " | " + values.storedValues + " | " + values.entriesOverCap + " | " + values.valuesBeyondCap + " | " + values.transformMismatches + " |"),
    "",
    "Entries with at least one over-cap field: " + report.entriesWithAnyOverflow,
    "",
    "The cap counts quantify source values omitted by the current transform; confirm learner-facing display needs before changing UI density."
  ];
  await appendFile(summaryPath, lines.join("\n") + "\n", "utf8");
}
assert.equal(report.transformMismatches.reduce((sum, field) => sum + 1, 0), 0,
  "Current catalog differs from the documented capped source transform; inspect the audit JSON before regenerating the data.");
