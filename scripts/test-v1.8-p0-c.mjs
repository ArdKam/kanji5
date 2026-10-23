import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync('v1.5-education-ui.js','utf8');
const context=fs.readFileSync('v1.8-context-core.js','utf8');
const e2e=fs.readFileSync('e2e/v1.8-context.spec.mjs','utf8');

assert.match(ui,/edu\.mode==='context'/);
assert.match(ui,/v1\.8-context-core\.js/);
assert.match(ui,/gradeContext/);
assert.match(ui,/v14EduContextInput/);
assert.match(ui,/CORE\.recordKnowledge/);
assert.match(ui,/kanji5:v1\.6-education-result/);
assert.match(context,/export function gradeContext/);
assert.match(e2e,/renders Context as a real learner-input exercise/);
assert.match(e2e,/grades an exact Context response as correct/);
assert.match(e2e,/does not record an empty Context submission/);
assert.match(e2e,/preserves Context outcome after reload/);
console.log('Kanji 5 v1.8 P0-C structural contract passed.');
