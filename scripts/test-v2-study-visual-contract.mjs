import assert from 'node:assert/strict';
import fs from 'node:fs';

const presentation=fs.readFileSync('v2-presentation.js','utf8');
const css=fs.readFileSync('v2-presentation.css','utf8');

assert.match(presentation,/function renderLearning\(snapshot\)[\s\S]*ui\.card\(/);
assert.match(presentation,/function renderLearning\(snapshot\)[\s\S]*ui\.badge\(/);
assert.match(presentation,/function renderLearning\(snapshot\)[\s\S]*ui\.kanji\(/);
assert.match(presentation,/function renderLearning\(snapshot\)[\s\S]*ui\.button\(/);
assert.match(presentation,/function renderReviewCard\(snapshot\)[\s\S]*ui\.card\(/);
assert.match(presentation,/function renderReviewCard\(snapshot\)[\s\S]*ui\.badge\(/);
assert.match(presentation,/function renderReviewCard\(snapshot\)[\s\S]*ui\.kanji\(/);
assert.match(css,/\.v2-learning-card::before/);
assert.match(css,/\.v2-learning-rating\[data-rating="Good"\]\{background:var\(--v2-success-soft\)\}/);
console.log('Kanji 5 Study visual primitive contract passed.');
