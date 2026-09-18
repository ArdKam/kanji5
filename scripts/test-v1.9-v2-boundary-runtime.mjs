import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync('v1.9-v2-boundary.js','utf8');
assert.match(s,/window\.__KANJI5_V19_V2_BOUNDARY__/);assert.match(s,/async function snapshot/);assert.match(s,/async function setExercise/);assert.match(s,/async function setFeedback/);assert.match(s,/async function setAdaptiveReason/);assert.match(s,/__KANJI5_V19_V2_LAST_SNAPSHOT__/);assert.match(s,/kanji5:v1\.9-v2-view-models/);assert.match(s,/kanji5:v1\.6-education-result/);assert.match(s,/kanji5:v1\.9-feedback/);assert.doesNotMatch(s,/getElementById|querySelector|innerHTML|style\.|classList/);
const sw=fs.readFileSync('sw.js','utf8');assert.match(sw,/v1\.9-v2-contract-core\.js/);assert.match(sw,/v1\.9-v2-boundary\.js/);assert.match(sw,/kanji5-shell-v74/);
console.log('Kanji 5 v1.9 v2 boundary runtime wiring passed.');
