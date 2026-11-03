import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("frontend/src/app/dictionary.css", "utf8");
const focus = fs.readFileSync("frontend/src/app/reading-lab-focus.css", "utf8");
const dialog = fs.readFileSync("frontend/src/app/ReadingLabDialog.tsx", "utf8");
const reading = fs.readFileSync("frontend/src/app/ReadingLab.tsx", "utf8");

assert.ok(!dialog.includes("reading-lab-polish.css"), "Do not add a separate Reading Lab CSS bundle");
const order = [
  reading.indexOf('className="reading-lab-section reading-lab-source"'),
  reading.indexOf('className="reading-lab-reader"'),
  reading.indexOf('className="reading-lab-analysis"'),
  reading.indexOf('className="reading-lab-attention"'),
  reading.indexOf('className="reading-lab-section reading-lab-listen"'),
];
assert.ok(order.every(position => position >= 0), "Reading Lab workflow sections must remain present");
assert.ok(order.every((position,index) => index === 0 || position > order[index-1]), "DOM order must follow source → read → analysis → attention → audio");

const populatedStart = reading.indexOf('{value.trim() ? (');
const populatedEnd = reading.indexOf('        </>\n      ) : (', populatedStart);
const listen = reading.indexOf('className="reading-lab-section reading-lab-listen"');
assert.ok(populatedStart >= 0 && populatedEnd > populatedStart && listen > populatedStart && listen < populatedEnd, "Audio controls must exist only with populated reading content");
assert.ok(!reading.includes('className="reading-lab-step"'), "Redundant numbered section markers must be absent");
assert.ok(css.includes('.reading-lab{display:grid;align-content:start;'), "Reading Lab layout must align content at the start");
assert.ok(css.includes('.reading-lab-section{display:grid;align-content:start;'), "Reading sections must not stretch vertically");
assert.ok(css.includes('.reading-lab-input{display:block;width:100%;height:132px;min-height:132px;'), "Source editor must use the compact height");
assert.ok(css.includes('.reading-lab-reader-text{padding:2px 0;border:0;border-radius:0;background:transparent;'), "Reader text should use the focused editorial surface");
const sentenceList = css.match(/\.reading-lab-sentence-list\s*\{([^}]*)\}/);
assert.ok(sentenceList && /max-height\s*:\s*none/.test(sentenceList[1]) && /overflow\s*:\s*visible/.test(sentenceList[1]), "Sentence list must not become a nested scroll container");
assert.ok(css.includes('.dialog.secondary-page-dialog .reading-lab{') && css.includes('overflow-y:auto;'), "The Reading Lab itself must remain the single scroll container");
assert.ok(css.includes('.dialog.secondary-page-dialog.reading-lab-dialog:not(:has(.reading-lab-reader))'), "Empty dialog must size intrinsically");
assert.ok(!focus.includes('!important') && focus.includes('.reading-lab-focus-button{min-height:44px;'), "Focus controls must retain accessible touch targets without overrides");
assert.ok(!css.includes('flex:0 0 36px!important'), "Do not add important-based mobile navigation patches");
assert.ok(css.includes('grid-template-areas:"focus" "position" "controls"'), "Mobile reader controls must have a predictable vertical hierarchy");
assert.ok(reading.includes('t("readingLabEmptyHint", language)'), "Compact empty state must retain reading guidance");
assert.ok(reading.includes('t("readingLabImportHint", language)') && reading.includes('t("readingLabSyncHint", language)'), "Subtitle import and audio synchronization guidance must remain available");
for (const contract of ["READING_LAB_STORAGE_KEY","parseSubtitleCues","syncReady","speakCurrentSentence","findLongestVocabularyMatch"]) {
  assert.ok(reading.includes(contract), `Reading Lab behavior contract missing: ${contract}`);
}
console.log("Reading Lab focused-layout contract passed.");
