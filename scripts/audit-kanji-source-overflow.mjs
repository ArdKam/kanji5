import assert from "node:assert/strict";
import { appendFile, readFile } from "node:fs/promises";

const SOURCE_COMMIT = "f79c68c9e35c6f8269a6b66e86c63c3713db06a0";
const SOURCE_URL = "https://raw.githubusercontent.com/jkindrix/japanese-language-data/" + SOURCE_COMMIT + "/data/core/kanji-joyo.json";
const EXPECTED_COUNT = 2136;
const [snapshotText, response, radicalMapText] = await Promise.all([
  readFile(new URL("../kanji-data.json", import.meta.url), "utf8"),
  fetch(SOURCE_URL, { cache: "no-store" }),
  readFile(new URL("../kanji-radical-map.json", import.meta.url), "utf8"),
]);
assert.equal(response.ok, true, "Pinned Jōyō source fetch failed: HTTP " + response.status);
const source = await response.json();
const snapshot = JSON.parse(snapshotText);
const radicalMap = JSON.parse(radicalMapText);
const sourceEntries = Array.isArray(source.kanji) ? source.kanji : [];
const snapshotEntries = Array.isArray(snapshot.kanji) ? snapshot.kanji : [];
assert.equal(sourceEntries.length, EXPECTED_COUNT, "Pinned source must contain 2,136 entries");
assert.equal(snapshotEntries.length, EXPECTED_COUNT, "Generated snapshot must contain 2,136 entries");
const sourceByCharacter = new Map(sourceEntries.map(entry => [entry.character, entry]));
const snapshotByCharacter = new Map(snapshotEntries.map(entry => [entry.character, entry]));
assert.equal(sourceByCharacter.size, EXPECTED_COUNT, "Pinned source characters must be unique");
assert.equal(snapshotByCharacter.size, EXPECTED_COUNT, "Snapshot characters must be unique");
assert.deepEqual([...sourceByCharacter.keys()].filter(character => !snapshotByCharacter.has(character)), [], "Snapshot is missing a source character");
assert.deepEqual([...snapshotByCharacter.keys()].filter(character => !sourceByCharacter.has(character)), [], "Snapshot contains a character outside the pinned source");

const fields = [
  { output: "meaning", input: entry => entry.meanings?.en || [], formerCap: 3 },
  { output: "on", input: entry => entry.readings?.on || [], formerCap: 4 },
  { output: "kun", input: entry => entry.readings?.kun || [], formerCap: 4 },
];
const report = {
  source: "KANJIDIC2 via jkindrix/japanese-language-data",
  sourceCommit: SOURCE_COMMIT,
  sourceEntries: sourceEntries.length,
  snapshotEntries: snapshotEntries.length,
  fields: {},
  entriesWithAnyFormerOverflow: 0,
  sampleEntries: [],
  sourceProjectionMismatches: [],
  metadataMismatches: { strokes: 0, grade: 0, jlpt: 0, frequency: 0, radical: 0 },
  orderMismatches: 0,
};
const formerOverflowCharacters = new Set();
const mismatch = (character, field, expected, stored) => {
  if (report.sourceProjectionMismatches.length < 100) report.sourceProjectionMismatches.push({ character, field, expected, stored });
};
for (const field of fields) {
  let sourceValues = 0, storedValues = 0, previouslyTruncatedValues = 0, entriesAboveFormerCap = 0, mismatches = 0;
  for (const [character, sourceEntry] of sourceByCharacter) {
    const values = field.input(sourceEntry);
    const stored = snapshotByCharacter.get(character)[field.output];
    sourceValues += values.length;
    storedValues += Array.isArray(stored) ? stored.length : 0;
    if (values.length > field.formerCap) {
      entriesAboveFormerCap += 1;
      previouslyTruncatedValues += values.length - field.formerCap;
      formerOverflowCharacters.add(character);
      const existing = report.sampleEntries.find(entry => entry.character === character);
      const item = existing || { character, valuesBeyondFormerCap: {} };
      item.valuesBeyondFormerCap[field.output] = values.length - field.formerCap;
      if (!existing && report.sampleEntries.length < 50) report.sampleEntries.push(item);
    }
    if (JSON.stringify(stored) !== JSON.stringify(values)) {
      mismatches += 1;
      mismatch(character, field.output, values, stored);
    }
  }
  report.fields[field.output] = {
    sourceValues, storedValues, entriesAboveFormerCap,
    valuesBeyondFormerCapNowRetained: previouslyTruncatedValues,
    missingOrDifferentValues: mismatches,
  };
}
report.entriesWithAnyFormerOverflow = formerOverflowCharacters.size;

const sorted = sourceEntries.slice().sort((a, b) => {
  const af = a.frequency == null ? Infinity : Number(a.frequency);
  const bf = b.frequency == null ? Infinity : Number(b.frequency);
  return af - bf;
});
for (let index = 0; index < sorted.length; index += 1) {
  const expected = sorted[index], stored = snapshotEntries[index];
  if (stored.order !== index + 1 || stored.character !== expected.character) {
    report.orderMismatches += 1;
    mismatch(stored.character, "order", { character: expected.character, order: index + 1 }, { character: stored.character, order: stored.order });
  }
  for (const [field, expectedValue, storedValue] of [
    ["strokes", expected.stroke_count, stored.strokes],
    ["grade", expected.grade, stored.grade],
    ["jlpt", expected.jlpt_waller || null, stored.jlpt],
    ["frequency", expected.frequency, stored.frequency],
  ]) {
    if (JSON.stringify(expectedValue) !== JSON.stringify(storedValue)) {
      report.metadataMismatches[field] += 1;
      mismatch(stored.character, field, expectedValue, storedValue);
    }
  }
  if (radicalMap.kanji[expected.character] !== expected.radical?.classical) {
    report.metadataMismatches.radical += 1;
    mismatch(stored.character, "radical", expected.radical?.classical, radicalMap.kanji[expected.character]);
  }
  if (stored.id !== expected.character || stored.character !== expected.character) {
    mismatch(stored.character, "identity", expected.character, { id: stored.id, character: stored.character });
  }
}
report.completeProjectionMismatchCount =
  Object.values(report.fields).reduce((sum, field) => sum + field.missingOrDifferentValues, 0) +
  Object.values(report.metadataMismatches).reduce((sum, value) => sum + value, 0) +
  report.orderMismatches;

console.log("Rinemi pinned-source completeness audit");
console.log(JSON.stringify(report, null, 2));
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const lines = [
    "## Rinemi pinned-source completeness audit",
    "",
    "Source: jkindrix/japanese-language-data at " + SOURCE_COMMIT,
    "",
    "| Field | Source values | Stored values | Records above former cap | Values formerly excluded now retained | Projection mismatches |",
    "|---|---:|---:|---:|---:|---:|",
    ...Object.entries(report.fields).map(([field, values]) => "| " + field + " | " + values.sourceValues + " | " + values.storedValues + " | " + values.entriesAboveFormerCap + " | " + values.valuesBeyondFormerCapNowRetained + " | " + values.missingOrDifferentValues + " |"),
    "",
    "Distinct kanji with at least one field above its former cap: " + report.entriesWithAnyFormerOverflow,
    "",
    "Metadata mismatches: " + JSON.stringify(report.metadataMismatches),
    "Order mismatches: " + report.orderMismatches,
    "Complete projection mismatches: " + report.completeProjectionMismatchCount,
  ];
  await appendFile(summaryPath, lines.join("\n") + "\n", "utf8");
}
assert.equal(report.sourceProjectionMismatches.length, 0,
  "Generated data must be an exact lossless projection of the pinned source for meanings, readings, metadata, order, identity, and classical radical assignments");
assert.deepEqual(report.metadataMismatches, { strokes: 0, grade: 0, jlpt: 0, frequency: 0, radical: 0 },
  "KANJIDIC2-derived metadata or classical radical mappings differ from the pinned source");
assert.equal(report.orderMismatches, 0, "Frequency order differs from the source projection");
assert.deepEqual(Object.fromEntries(Object.entries(report.fields).map(([field, values]) => [field, values.sourceValues])), {
  meaning: 7937, on: 2850, kun: 3905,
}, "Update reviewed source counts if the pinned revision changes");
assert.deepEqual(Object.fromEntries(Object.entries(report.fields).map(([field, values]) => [field, values.valuesBeyondFormerCapNowRetained])), {
  meaning: 2402, on: 6, kun: 339,
}, "Formerly truncated source values must all be retained");
