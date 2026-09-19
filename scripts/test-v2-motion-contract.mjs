import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('v2-presentation.css','utf8');

assert.match(css,/--v2-motion-fast:/);
assert.match(css,/--v2-motion-base:/);
assert.match(css,/--v2-motion-rise:/);
assert.match(css,/--v2-motion-stamp:/);
assert.match(css,/--v2-motion-ease:/);
assert.match(css,/\.v2-learning-card,\s*\.v2-exercise-card\{\s*animation:v2-rise/);
assert.match(css,/\.v2-feedback-card\{\s*animation:v2-stamp/);
assert.match(css,/@keyframes v2-rise/);
assert.match(css,/@keyframes v2-stamp/);
assert.match(css,/@media \(prefers-reduced-motion:reduce\)[\s\S]*animation:none!important/);
console.log('Kanji 5 v2 shared motion contract passed.');
