import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('v2-presentation.css','utf8');

for(const token of ['--v2-motion-fast:','--v2-motion-base:','--v2-motion-rise:','--v2-motion-stamp:','--v2-motion-ease:']){
  assert.ok(css.includes(token),'Missing motion token '+token);
}
assert.match(css,/\.v2-learning-card\s*,\s*\.v2-exercise-card\s*\{[\s\S]*?animation:\s*v2-rise/);
assert.match(css,/\.v2-feedback-card\s*\{[\s\S]*?animation:\s*v2-stamp/);
assert.match(css,/@keyframes\s+v2-rise/);
assert.match(css,/@keyframes\s+v2-stamp/);
assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation(?:-duration)?\s*:/);
console.log('Kanji 5 v2 shared motion contract passed.');