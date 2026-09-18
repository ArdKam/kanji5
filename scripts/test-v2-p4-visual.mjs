import assert from 'node:assert/strict';
import fs from 'node:fs';

const js=fs.readFileSync('v2-presentation.js','utf8');
const css=fs.readFileSync('v2-presentation.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const roadmap=fs.readFileSync('V2-ROADMAP.md','utf8');
const quality=fs.readFileSync('V2-VISUAL-QUALITY.md','utf8');

assert.equal((js.match(/function renderDailySummary\(/g)||[]).length,1);
assert.doesNotMatch(js,/readLegacyMetric\(/);
assert.ok(css.includes('--v2-shadow-hover:'));
assert.ok(css.includes('--v2-shadow-focus:'));
assert.ok(css.includes('backdrop-filter:blur(14px)'));
assert.ok(css.includes('@media (prefers-color-scheme:dark)'));
assert.ok(css.includes('@media (prefers-reduced-motion:reduce)'));
assert.ok(css.includes('safe-area-inset-bottom'));
assert.ok(css.includes('.v2-production-choice:hover'));
for(const cls of ['v2-header','.v2-daily-stat','.v2-exercise-card','.v2-learning-card','.v2-btn-primary','.v2-dialog']){
  assert.ok(css.includes(cls),cls);
}
assert.ok(sw.includes("const CACHE='kanji5-shell-v97'"));
assert.match(roadmap,/### P4 — Visual System & Polish ✅/);
assert.match(quality,/### Phase A — Foundation ✅/);
console.log('Kanji 5 v2 professional visual quality contract passed.');
