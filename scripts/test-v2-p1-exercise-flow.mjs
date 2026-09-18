import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const ui=read('v1.5-education-ui.js');
const presentation=read('v2-presentation.js');
const roadmap=read('V2-ROADMAP.md');
const sw=read('sw.js');
const spec=read('e2e/v2-p1-exercise-flow.spec.mjs');

assert.match(ui,/const isV2=\(\)=>/);
assert.match(ui,/publishV2Exercise/);
assert.match(ui,/__KANJI5_EDU_BRIDGE__/);
assert.match(ui,/submitValue/);
assert.match(ui,/async function retry/);
assert.match(ui,/if\(isV2\(\)\)return/);
assert.match(presentation,/v2AnswerInput/);
assert.match(presentation,/v2Submit/);
assert.match(presentation,/v2DontKnow/);
assert.match(presentation,/v2Retry/);
assert.match(presentation,/__KANJI5_EDU_BRIDGE__/);
assert.match(roadmap,/### P1 — Exercise Flow Migration ✅/);
assert.match(sw,/const CACHE='kanji5-shell-v71'/);
assert.ok(spec.includes('v2 P1 exercise flow'));
console.log('Kanji 5 v2 P1 exercise migration contract passed.');
