import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readingLab = await readFile(new URL("../frontend/src/app/ReadingLab.tsx", import.meta.url), "utf8");
const i18n = await readFile(new URL("../frontend/src/app/i18n.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../frontend/src/app/reading-lab-playback.css", import.meta.url), "utf8");
const e2e = await readFile(new URL("../e2e/react-presentation-migration.spec.mjs", import.meta.url), "utf8");

for (const marker of [
  "const [sentenceAutoplay, setSentenceAutoplay]",
  "const sentenceAutoplayRef = useRef(false);",
  "sentenceAutoplayRef.current = sentenceAutoplay;",
  "function speakSentenceAtIndex(index: number)",
  "const repeatCurrentSentence = () =>",
  "seekAudioToSentence(clamped, sentenceAutoplayRef.current)",
  "readingLabRepeatSentence",
  "readingLabAutoplay",
  "aria-pressed={sentenceAutoplay}",
]) {
  assert.ok(readingLab.includes(marker), `Reading Lab missing sentence-playback marker: ${marker}`);
}

assert.ok(readingLab.includes("onend = () =>"), "TTS sentence playback must react to utterance completion");
assert.ok(readingLab.includes("const nextIndex = index + 1;"), "Autoplay must advance to the next sentence");
assert.ok(readingLab.includes("setSentenceAutoplay(false);"), "Autoplay must stop at the end of the text");
assert.ok(i18n.includes("readingLabAutoplay"), "Missing autoplay translation key");
assert.ok(i18n.includes("readingLabRepeatSentence"), "Missing repeat-sentence translation key");
assert.ok(styles.includes(".reading-lab-sentence-autoplay"), "Missing scoped autoplay styles");
assert.ok(e2e.includes("reading-lab-sentence-repeat"), "E2E must cover repeat sentence");
assert.ok(e2e.includes("aria-pressed','true'"), "E2E must cover enabling autoplay");
assert.ok(e2e.includes("__KANJI5_LAST_UTTERANCE__"), "E2E must control TTS completion deterministically");

console.log("Reading Lab sentence playback contract: PASS");
