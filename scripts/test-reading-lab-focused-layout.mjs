import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("frontend/src/app/dictionary.css", "utf8");
const styles = fs.readFileSync("frontend/src/styles.css", "utf8");
const focus = fs.readFileSync("frontend/src/app/reading-lab-focus.css", "utf8");
const dialog = fs.readFileSync("frontend/src/app/ReadingLabDialog.tsx", "utf8");
const reading = fs.readFileSync("frontend/src/app/ReadingLab.tsx", "utf8");

assert.ok(!dialog.includes("reading-lab-polish.css"), "Do not add a separate Reading Lab CSS bundle");
const order = [
  reading.indexOf('reading-lab-source"'),
  reading.indexOf('className="reading-lab-reader"'),
  reading.indexOf('className="reading-lab-analysis"'),
  reading.indexOf('className="reading-lab-attention"'),
  reading.indexOf('className="reading-lab-section reading-lab-listen"'),
];
assert.ok(order.every(position => position >= 0), "Reading Lab workflow section missing");
assert.ok(order.every((position,index) => index === 0 || position > order[index-1]), "Reading Lab DOM order must match focused-reading workflow");
assert.match(css, /\\.reading-lab\\{display:grid;align-content:start;/);
assert.match(css, /\\.reading-lab-section\\{display:grid;align-content:start;/);
assert.match(css, /\\.reading-lab-input\\{[^}]*height:132px;[^}]*min-height:132px;/);
assert.match(css, /\\.reading-lab-reader-text\\{padding:2px 0;border:0;border-radius:0;background:transparent;/);
assert.match(css, /\\.reading-lab-sentence-list\\{[^}]*max-height:none;overflow:visible;/);
assert.match(css, /\\.reading-lab-reader-toolbar\\{display:grid;[^}]*grid-template-areas:"focus focus" "position controls"/);
assert.ok(css.includes('grid-template-areas:"focus" "position" "controls"'), "Mobile Reader controls should have a clear vertical hierarchy");
assert.match(focus, /\\.reading-lab-focus-controls\\{[^}]*grid-area:focus;gap:6px;/);
assert.match(focus, /\\.reading-lab-focus-button\\{min-height:32px;/);
assert.ok(!css.includes("max-height:42dvh"), "Sentence list must not reintroduce nested scrolling on mobile");
assert.ok(styles.includes(".dialog.secondary-page-dialog.reading-lab-dialog:not(:has(.reading-lab-reader)){height:auto;min-height:0;max-height:min(520px,calc(100dvh - 32px));}"), "Empty dialog should use intrinsic height on desktop");
assert.ok(styles.includes("@media(max-width:760px){.dialog.secondary-page-dialog.reading-lab-dialog:not(:has(.reading-lab-reader)){height:auto!important;min-height:0!important;max-height:min(520px,calc(100dvh - 32px))!important;}}"), "Empty dialog should override the mobile minimum height");
assert.ok(!reading.includes('className="reading-lab-step"'), "Redundant section numbers should be removed");
assert.ok(reading.includes('{value.trim() ? ('), "Audio setup must only render when reading content exists");
for (const contract of ["READING_LAB_STORAGE_KEY","parseSubtitleCues","syncReady","speakCurrentSentence","findLongestVocabularyMatch"]) {
  assert.ok(reading.includes(contract), `Reading Lab behavior contract missing: ${contract}`);
}
console.log("Reading Lab focused-layout contract passed.");
