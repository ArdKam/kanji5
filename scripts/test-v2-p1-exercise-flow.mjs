import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const ui=read('v1.5-education-ui.js');
const presentation=read('v2-presentation.js');
const core=read('v1.9-v2-contract-core.js');
const roadmap=read('V2-ROADMAP.md');
const sw=read('sw.js');
const spec=read('e2e/v2-p1-exercise-flow.spec.mjs');
const learningSpec=read('e2e/v2-learning-first.spec.mjs');

assert.match(ui,/const isV2=\(\)=>/);
assert.match(ui,/publishV2Exercise/);
assert.match(ui,/chooseChoices\(edu\.item\)/);
assert.match(ui,/__KANJI5_EDU_BRIDGE__/);
assert.match(ui,/submitValue/);
assert.match(ui,/async function retry/);
assert.match(presentation,/v2LearningCard/);
assert.doesNotMatch(presentation,/v2ProductionChoices/);
assert.match(presentation,/v2StartPractice/);
assert.match(core,/kind:'learning-card'/);
assert.match(core,/inputPlaceholder|prompt/);
assert.match(roadmap,/### P1 — Exercise Flow Migration ✅/);
assert.match(sw,/const CACHE='kanji5-shell-v\d+'/);
assert.ok(spec.includes('v2 P1 exercise flow'));
assert.ok(learningSpec.includes('first-time learner sees the learning card'));
console.log('Kanji 5 v2 P1 learning-first and production retrieval contract passed.');
