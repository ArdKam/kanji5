import assert from 'node:assert/strict';
import fs from 'node:fs';

const js=fs.readFileSync('v2-presentation.js','utf8');
const css=fs.readFileSync('v2-presentation.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const roadmap=fs.readFileSync('V2-ROADMAP.md','utf8');

assert.ok(js.includes("stylesheet.href='./v2-presentation.css'"));
for(const token of ['--v2-accent:','--v2-bg:','--v2-radius:','--v2-shadow:'])assert.ok(css.includes(token),token);
for(const cls of ['v2-shell','v2-title','v2-header','v2-session-bar','v2-grid','v2-exercise-card','v2-mode-pill','v2-stimulus','v2-input','v2-btn-primary','v2-btn-secondary','v2-feedback','v2-skill-grid','v2-reason-card','v2-recent-card'])assert.ok(css.includes('.'+cls),cls);
assert.ok(js.includes('v2Stimulus'));
assert.ok(js.includes('پیشرفت جلسه'));
assert.ok(css.includes(':hover'));
assert.ok(css.includes(':focus'));
assert.ok(css.includes('@media (prefers-reduced-motion:reduce)'));
assert.ok(css.includes('@media (max-width:960px)'));
assert.ok(css.includes('@media (max-width:640px)'));
assert.match(sw,/const CACHE='kanji5-shell-v\d+'/);
assert.ok(sw.includes('"./v2-presentation.css"'));
assert.ok(roadmap.includes('### P4 — Visual System & Polish'));
assert.match(roadmap,/### P4 — Visual System & Polish ✅/);
console.log('Kanji 5 v2 P4 visual contract passed.');
