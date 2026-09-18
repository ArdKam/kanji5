import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=fs.readFileSync('index.html','utf8');
const registry=fs.readFileSync('v2-runtime-registry.js','utf8');
const presentation=fs.readFileSync('v2-presentation.js','utf8');
const boundary=fs.readFileSync('v1.9-v2-boundary.js','utf8');
const review=fs.readFileSync('review-runtime.js','utf8');
const educationCore=fs.readFileSync('v1.4-education-core.js','utf8');
const educationUi=fs.readFileSync('v1.5-education-ui.js','utf8');
const session=fs.readFileSync('v1.6-session.js','utf8');
const learner=fs.readFileSync('v1.9-learner-model.js','utf8');

assert.match(index,/\.\/v2-runtime-registry\.js/);
assert.ok(index.indexOf('./v2-runtime-registry.js') < index.indexOf('./v1.5-state.js'));

assert.match(registry,/__KANJI5_RUNTIME__/);
assert.match(registry,/register\(name,value\)/);
assert.match(registry,/get\(name\)/);
assert.match(registry,/Object\.freeze\(R\)/);

const presentationGlobals=[...new Set(presentation.match(/__KANJI5_[A-Z0-9_]+/g)||[])];
assert.deepEqual(presentationGlobals,['__KANJI5_RUNTIME__']);

assert.match(boundary,/runtime\.get\('state'\)/);
assert.match(boundary,/runtime\.get\('learner\.model'\)/);
assert.match(boundary,/runtime\.get\('review\.bridge'\)/);
assert.match(boundary,/runtime\.register\('v2\.boundary'/);

assert.match(review,/runtime\.register\('review\.runtime'/);
assert.match(review,/runtime\.register\('review\.bridge'/);
assert.match(educationCore,/runtime\.register\('education\.core'/);
assert.match(educationUi,/runtime\.register\('education\.bridge'/);
assert.match(session,/runtime\.register\('session\.api'/);
assert.match(learner,/runtime\.register\('learner\.model'/);

console.log('Kanji 5 v2 runtime registry contract passed.');
