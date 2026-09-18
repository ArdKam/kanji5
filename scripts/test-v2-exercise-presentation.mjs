import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const js=read('v2-presentation.js');
const core=read('v1.9-v2-contract-core.js');
const edu=read('v1.5-education-ui.js');

assert.match(js,/function renderStimulus/);
for(const cls of ['v2-exercise-card','v2-mode-badge','v2-stimulus','v2-kanji','v2-feedback-card','v2-insights','v2LearningCard','v2ProductionChoices','v2-production-choice']) assert.ok(js.includes(cls),cls);
for(const token of ['stimulus','masked-vocabulary','masked-context','inputPlaceholder','choices']) assert.ok(core.includes(token)||edu.includes(token),token);
assert.ok(core.includes("kind:'learning-card'"),'learning card contract must exist');
assert.ok(js.includes('snapshot?.learning?.active'),'default presentation must be able to consume learning state');
assert.ok(js.includes('!snapshot?.exercise?.mode'),'explicit exercise must override the new-card learning card');
assert.doesNotMatch(js,/Session ID/);
assert.doesNotMatch(js,/Plan revision/);
assert.doesNotMatch(js,/Content ID|ContentId|Plan revision|Session ID/);
assert.match(edu,/kind:'meaning'/);
assert.match(edu,/kind:'masked-vocabulary'/);
assert.match(edu,/kind:'masked-context'/);
assert.match(edu,/choices=chooseChoices\(edu\.item\)\.map/);
assert.match(edu,/renderChoices\(chooseChoices\(item\)\)/);
console.log('Kanji 5 v2 learning-first and production-choice presentation contract passed.');
