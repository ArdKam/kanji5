import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const core=read('v1.9-v2-contract-core.js');
const boundary=read('v1.9-v2-boundary.js');
const presentation=read('v2-presentation.js');
const roadmap=read('V2-ROADMAP.md');
const sw=read('sw.js');
const spec=read('e2e/v2-p2-session-ia.spec.mjs');

assert.match(core,/plannedTotal/);
assert.match(core,/remainingTotal/);
assert.match(core,/completionFraction/);
assert.match(core,/buildRecentOutcomesViewModel/);
assert.match(core,/recentOutcomes/);
assert.match(boundary,/function recentOutcomes/);
assert.match(boundary,/v19LearnerEvidence/);
assert.match(boundary,/recentOutcomes\(\)/);
assert.match(presentation,/پیشرفت جلسه/);
assert.match(presentation,/پاسخ‌های اخیر/);
assert.match(presentation,/remainingTotal/);
assert.match(roadmap,/### P2 — Session & Learner Information Architecture ✅/);
assert.match(sw,/const CACHE='kanji5-shell-v\d+'/);
assert.ok(spec.includes('v2 P2 session information architecture'));
console.log('Kanji 5 v2 P2 information architecture contract passed.');
