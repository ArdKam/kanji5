import assert from 'node:assert/strict';
import fs from 'node:fs';

const presentation=fs.readFileSync('v2-presentation.js','utf8');
const css=fs.readFileSync('v2-presentation.css','utf8');

assert.match(presentation,/function renderExercise\(snapshot\)[\s\S]*ui\.card\(/);
assert.match(presentation,/function renderExercise\(snapshot\)[\s\S]*ui\.badge\(/);
assert.match(presentation,/function renderExercise\(snapshot\)[\s\S]*ui\.choice\(/);
assert.match(presentation,/function renderExercise\(snapshot\)[\s\S]*ui\.button\(/);
assert.match(css,/\.v2-exercise-card::before/);
assert.match(css,/\.v2-production-choice:hover:not\(:disabled\)/);
console.log('Kanji 5 Test visual primitive contract passed.');
