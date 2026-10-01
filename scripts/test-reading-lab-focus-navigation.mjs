import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readingLab = await readFile(new URL("../frontend/src/app/ReadingLab.tsx", import.meta.url), "utf8");
const i18n = await readFile(new URL("../frontend/src/app/i18n.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../frontend/src/app/reading-lab-focus.css", import.meta.url), "utf8");

for (const value of [
  "const focusableTargets = useMemo(",
  'getMasteryBucket(item) !== "familiar"',
  "const unknownTargets = useMemo(",
  'getMasteryBucket(target.item) === "new"',
  "const focusCursorRef = useRef",
  "const focusNextTarget = ",
  "focusCursorRef.current",
  "selectSentence(next.sentenceIndex, false)",
  "readerKanjiRefs.current.get(key)",
  "readingLabFocusNext",
  "readingLabNextUnknown",
]) {
  assert.ok(readingLab.includes(value), `Reading Lab missing required focus-navigation marker: ${value}`);
}

assert.ok(/characterIndex:\s*index/.test(readingLab), "Reading Lab must track the focused kanji character index");
assert.ok(/characterIndex:\s*next\.characterIndex/.test(readingLab), "Reading Lab must advance from the tracked focus cursor");
assert.ok(i18n.includes("readingLabFocusControls"), "Missing Reading Lab focus-control translation key");
assert.ok(i18n.includes("readingLabFocusNext"), "Missing Reading Lab focus-next translation key");
assert.ok(i18n.includes("readingLabNextUnknown"), "Missing Reading Lab next-unknown translation key");
assert.ok(styles.includes(".reading-lab-focus-controls"), "Missing scoped Reading Lab focus-control styles");

console.log("Reading Lab focus navigation contract: PASS");
