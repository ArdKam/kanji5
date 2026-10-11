import assert from "node:assert/strict";
import fs from "node:fs";

const polish = fs.readFileSync("frontend/src/app/reading-lab-polish.css", "utf8");
const dialog = fs.readFileSync("frontend/src/app/ReadingLabDialog.tsx", "utf8");
const reading = fs.readFileSync("frontend/src/app/ReadingLab.tsx", "utf8");

// The scoped polish layer loads after the Reader's child-component styles.
assert.ok(dialog.includes('import "./reading-lab-polish.css"'), "Reading Lab polish stylesheet must be imported by its owning dialog");

// Visual order and DOM order must match so keyboard focus follows the visible workflow.
const order = [
  reading.indexOf('reading-lab-source"'),
  reading.indexOf('className="reading-lab-reader"'),
  reading.indexOf('className="reading-lab-analysis"'),
  reading.indexOf('className="reading-lab-attention"'),
  reading.indexOf('className="reading-lab-section reading-lab-listen"'),
];
assert.ok(order.every((position) => position >= 0), "Reading Lab workflow section missing");
assert.ok(order.every((position, index) => index === 0 || position > order[index - 1]), "Reading Lab DOM order must match the focused-reading workflow");
assert.ok(!polish.includes("> .reading-lab-reader{order:"), "Avoid CSS reordering that can desynchronize keyboard focus");

// Input becomes compact after content is loaded.
assert.match(polish, /\.reading-lab:has\(\.reading-lab-reader\) \.reading-lab-input\s*\{[^}]*height:108px;[^}]*min-height:108px;/s);

// The sentence list must use the Reading Lab's outer scroll surface rather than nested scrolling.
assert.match(polish, /\.reading-lab-sentence-list\s*\{[^}]*max-height:none;[^}]*overflow:visible;/s);
assert.match(polish, /\.reading-lab-reader-text\s*\{[^}]*border:0;[^}]*box-shadow:none;/s);
assert.match(polish, /grid-template-areas:"focus focus" "position controls"/);
assert.match(polish, /@media\(max-width:760px\)\s*\{\s*\.reading-lab-reader-toolbar\s*\{[^}]*grid-template-areas:"focus" "position" "controls"/s);

// Empty state offers one clear starting path rather than repeating the same prompt.
assert.match(polish, /\.reading-lab:not\(:has\(\.reading-lab-reader\)\) \.reading-lab-input\s*\{[^}]*height:132px;[^}]*min-height:132px;/s);
assert.match(polish, /\.reading-lab:not\(:has\(\.reading-lab-reader\)\) > \.reading-lab-empty\s*\{\s*display:none;\s*\}/);
assert.match(polish, /\.reading-lab:not\(:has\(\.reading-lab-reader\)\) > \.reading-lab-listen\s*\{\s*display:none;\s*\}/);
assert.match(polish, /\.reading-lab \.reading-lab-step\s*\{\s*display:none;\s*\}/);

// Guard against visual-only changes accidentally deleting core Reading Lab behavior.
for (const contract of ["READING_LAB_STORAGE_KEY", "parseSubtitleCues", "syncReady", "speakCurrentSentence", "findLongestVocabularyMatch"]) {
  assert.ok(reading.includes(contract), `Reading Lab behavior contract missing: ${contract}`);
}

console.log("Reading Lab focused-layout contract passed.");
