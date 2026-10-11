import assert from "node:assert/strict";
import fs from "node:fs";

const polish = fs.readFileSync("frontend/src/app/reading-lab-focus.css", "utf8");
const reading = fs.readFileSync("frontend/src/app/ReadingLab.tsx", "utf8");

// Populated Reading Lab puts the reading surface ahead of optional analysis and audio setup.
assert.match(polish, /\.reading-lab:has\(\.reading-lab-reader\) > \.reading-lab-reader\s*\{\s*order:2;/);
assert.match(polish, /\.reading-lab:has\(\.reading-lab-reader\) > \.reading-lab-analysis\s*\{\s*order:3;/);
assert.match(polish, /\.reading-lab:has\(\.reading-lab-reader\) \.reading-lab-input\s*\{[^}]*height:108px;[^}]*min-height:108px;/s);

// The sentence list must use the Reading Lab's outer scroll surface rather than nested scrolling.
assert.match(polish, /\.reading-lab-sentence-list\s*\{[^}]*max-height:none;[^}]*overflow:visible;/s);
assert.match(polish, /\.reading-lab-reader-text\s*\{[^}]*border:0;[^}]*box-shadow:none;/s);
assert.match(polish, /grid-template-areas:"focus focus" "position controls"/);
assert.match(polish, /@media\(max-width:760px\)\s*\{\s*\.reading-lab-reader-toolbar\s*\{[^}]*grid-template-areas:"focus" "position" "controls"/s);

// Guard against visual-only changes accidentally deleting core Reading Lab behavior.
for (const contract of ["READING_LAB_STORAGE_KEY", "parseSubtitleCues", "syncReady", "speakCurrentSentence", "findLongestVocabularyMatch"]) {
  assert.ok(reading.includes(contract), `Reading Lab behavior contract missing: ${contract}`);
}

console.log("Reading Lab focused-layout contract passed.");
