import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const js=read('v2-presentation.js');
const core=read('v1.9-v2-contract-core.js');
const edu=read('v1.5-education-ui.js');

assert.match(js,/function renderStimulus/);
for(const cls of ['v2-exercise-card','v2-mode-badge','v2-stimulus','v2-kanji','v2-feedback-card','v2-insights']) assert.ok(js.includes(cls),cls);
for(const token of ['stimulus','masked-vocabulary','masked-context','inputPlaceholder']) assert.ok(core.includes(token)||edu.includes(token),token);
assert.doesNotMatch(js,/Session ID/);
assert.doesNotMatch(js,/Plan revision/);
assert.doesNotMatch(js,/Content ID|ContentId|Plan revision|Session ID/);
assert.match(edu,/kind:'meaning'/);
assert.match(edu,/kind:'masked-vocabulary'/);
assert.match(edu,/kind:'masked-context'/);
console.log('Kanji 5 v2 exercise-first presentation contract passed.');
