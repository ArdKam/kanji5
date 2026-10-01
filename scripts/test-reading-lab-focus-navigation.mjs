import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readingLab = await readFile(new URL("../frontend/src/app/ReadingLab.tsx", import.meta.url), "utf8");
const i18n = await readFile(new URL("../frontend/src/app/i18n.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../frontend/src/app/reading-lab-focus.css", import.meta.url), "utf8");

assert.match(readingLab, /const focusableTargets = useMemo\(/);
assert.match(readingLab, /getMasteryBucket\(item\) !== "familiar"/);
assert.match(readingLab, /const unknownTargets = useMemo\(/);
assert.match(readingLab, /getMasteryBucket\(target\.item\) === "new"/);
assert.match(readingLab, /const focusCursorRef = useRef/);
assert.match(readingLab, /const focusNextTarget = /);
assert.match(readingLab, /focusCursorRef\.current = \{ sentenceIndex, characterIndex: index \ }/);
assert.match(readingLab, /selectSentence\(next\.sentenceIndex, false\)/);
assert.match(readingLab, /readerKanjiRefs\.current\.get\(key\)/);
assert.match(readingLab, /focusCursorRef\.current = \{ sentenceIndex: next\.sentenceIndex, characterIndex: next\.characterIndex \ }/);
assert.match(readingLab, /readingLabFocusNext/);
assert.match(readingLab, /readingLabNextUnknown/);
assert.match(i18n, /readingLabFocusControls/);
assert.match(i18n, /readingLabFocusNext/);
assert.match(i18n, /readingLabNextUnknown/);
assert.match(styles, /\.reading-lab-focus-controls/);

console.log("Reading Lab focus navigation contract: PASS");
