import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const css=await readFile("frontend/src/experience-nav.css","utf8");

assert.doesNotMatch(css,/\\n/,"Experience navigation CSS must not contain literal escaped newlines");
assert.match(css,/grid-template-columns:\s*repeat\(3,1fr\)/);
assert.match(css,/\.experience-tab-indicator/);
assert.match(css,/env\(safe-area-inset-bottom\)/);

console.log("Kanji 5 experience-navigation CSS contract passed.");
