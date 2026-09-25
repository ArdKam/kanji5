import assert from 'node:assert/strict';
import fs from 'node:fs';

const feedback=fs.readFileSync('v1.6-session-feedback.js','utf8');
const session=fs.readFileSync('v1.6-session.js','utf8');
const production=fs.readFileSync('v1.8-production-core.js','utf8');
const vocabulary=fs.readFileSync('v1.8-vocabulary-core.js','utf8');
const context=fs.readFileSync('v1.8-context-core.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

assert.equal(fs.existsSync('v1.8-learning-ux.js'),false,'retired v1.8 Learning UX module must remain removed');
assert.doesNotMatch(feedback,/v1\.8-learning-ux\.js/);
assert.doesNotMatch(session,/v1\.8-learning-ux\.js/);
assert.doesNotMatch(sw,/["']\.\/v1\.8-learning-ux\.js["']/);
assert.match(production,/function gradeProduction/);
assert.match(vocabulary,/function gradeVocabulary/);
assert.match(context,/function gradeContext/);
assert.match(sw,/["']\.\/v1\.8-production-core\.js["']/);
assert.match(sw,/["']\.\/v1\.8-vocabulary-core\.js["']/);
assert.match(sw,/["']\.\/v1\.8-context-core\.js["']/);

console.log('Kanji 5 v1.8 runtime contract passed: grading cores remain active and retired Learning UX remains absent.');
