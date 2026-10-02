import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readingLab = await readFile(new URL("../frontend/src/app/ReadingLab.tsx", import.meta.url), "utf8");
const i18n = await readFile(new URL("../frontend/src/app/i18n.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../frontend/src/app/reading-lab-coverage.css", import.meta.url), "utf8");
const e2e = await readFile(new URL("../e2e/react-presentation-migration.spec.mjs", import.meta.url), "utf8");

for (const marker of [
  "const occurrenceCoverage = useMemo(",
  "let recognized = 0;",
  'getMasteryBucket(item) === "familiar"',
  "const sentenceFocus = useMemo(",
  "const weightedRisk = recognized",
  "const hardestSentence = useMemo(",
  "const focusSentence = (nextIndex: number) =>",
  "focusSentence(hardestSentence.sentenceIndex)",
]) {
  assert.ok(readingLab.includes(marker), `Reading Lab missing coverage-refinement marker: ${marker}`);
}

for (const key of [
  "readingLabUniqueCoverage",
  "readingLabOccurrenceCoverage",
  "readingLabFocusTargetEyebrow",
  "readingLabFocusTarget",
  "readingLabFocusSentence",
]) {
  assert.ok(i18n.includes(key), `Missing Reading Lab coverage translation key: ${key}`);
}

assert.ok(styles.includes(".reading-lab-coverage-metrics"), "Missing coverage metric styles");
assert.ok(styles.includes(".reading-lab-hardest-sentence"), "Missing hardest-sentence styles");
assert.ok(e2e.includes("reading-lab-hardest-sentence"), "E2E must cover the hardest-sentence target");
assert.ok(e2e.includes("name:'تمرکز روی جمله'"), "E2E must exercise the focus-target control");

console.log("Reading Lab coverage refinement contract: PASS");
