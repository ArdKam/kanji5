import assert from 'node:assert/strict';
import fs from 'node:fs';

const js=fs.readFileSync('v2-presentation.js','utf8');
const css=fs.readFileSync('v2-presentation.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const roadmap=fs.readFileSync('V2-ROADMAP.md','utf8');

assert.ok(js.includes("href='./v2-presentation.css'"));
for (const token of ['--v2-accent:','--v2-space-6:','--v2-radius:','--v2-shadow:']) assert.ok(css.includes(token),token);
for (const cls of ['v2-shell','v2-title','v2-subtitle','v2-grid','v2-card','v2-card-title','v2-input','v2-btn-primary','v2-btn-secondary','v2-progress','v2-progress-fill','v2-outcome-row']) assert.ok(css.includes('.'+cls),cls);
assert.ok(css.includes(':hover'));
assert.ok(css.includes(':focus'));
assert.ok(css.includes('@media (prefers-reduced-motion:reduce)'));
assert.ok(css.includes('@media (max-width:900px)'));
assert.ok(css.includes('@media (max-width:600px)'));
assert.match(sw,/const CACHE='kanji5-shell-v\d+'/);
assert.ok(sw.includes('"./v2-presentation.css"'));
assert.ok(roadmap.includes('### P4 — Visual System & Polish'));
assert.match(roadmap,/### P4 — Visual System & Polish ✅/);
console.log('Kanji 5 v2 P4 visual contract passed.');
