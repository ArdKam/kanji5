import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outcome = await import(path.join(root, 'v1.9-outcome-core.js'));

for (const mode of outcome.MODES) {
  const exact = outcome.normalizeOutcome(mode, { correct: true, quality: 'exact', score: 1 });
  assert.equal(exact.schemaVersion, 1);
  assert.equal(exact.mode, mode);
  assert.equal(exact.outcome, 'correct');
  assert.equal(exact.correct, true);
  assert.equal(exact.quality, 'exact');
  assert.equal(exact.graderVersion, `1.9.0-${mode}`);

  const wrong = outcome.normalizeOutcome(mode, { correct: false, quality: 'wrong', score: 0 });
  assert.equal(wrong.outcome, 'wrong');
  assert.equal(wrong.correct, false);

  const unknown = outcome.normalizeOutcome(mode, { correct: false, outcome: 'unknown', quality: 'unknown', score: 0 });
  assert.equal(unknown.outcome, 'unknown');
  assert.equal(unknown.correct, false);

  const empty = outcome.normalizeOutcome(mode, { correct: false, quality: 'empty', score: 0 });
  assert.equal(empty.outcome, 'empty');
}

assert.throws(() => outcome.normalizeOutcome('other', { correct: false }), /UNSUPPORTED_EDUCATION_MODE/);

const education = fs.readFileSync(path.join(root, 'v1.4-education-core.js'), 'utf8');
const eduContext = { window: {}, globalThis: {} };
vm.createContext(eduContext);
vm.runInContext(education, eduContext);
const edu = eduContext.window.__KANJI5_EDU_CORE__;
assert.ok(edu, 'education core API must be exposed');
assert.equal(edu.gradeMeaning('school', ['school']).correct, true);
assert.equal(edu.gradeReading('がく', ['がく']).correct, true);

const production = fs.readFileSync(path.join(root, 'v1.8-production-core.js'), 'utf8');
const prodContext = { globalThis: {} };
vm.createContext(prodContext);
vm.runInContext(production, prodContext);
assert.equal(prodContext.globalThis.__KANJI5_V18_PRODUCTION__.gradeProduction('学', '学').correct, true);

const vocabulary = await import(path.join(root, 'v1.8-vocabulary-core.js'));
assert.equal(vocabulary.gradeVocabulary('学生', '学生').correct, true);

const context = await import(path.join(root, 'v1.8-context-core.js'));
assert.equal(context.gradeContext('学', '学').correct, true);

const ui = fs.readFileSync(path.join(root, 'v1.5-education-ui.js'), 'utf8');
assert.match(ui, /v1\.9-outcome-core\.js/, 'education UI must normalize learner outcomes through the v1.9 contract');
assert.match(ui, /outcome:'unknown'/, 'Dont Know must remain an explicit unknown outcome');
assert.match(ui, /lastOutcome=outcome\.outcome/, 'knowledge persistence must retain the distinguishable outcome');
assert.match(ui, /graderVersion=outcome\.graderVersion/, 'knowledge persistence must retain grader version');

const feedback = fs.readFileSync(path.join(root, 'v1.6-session-feedback.js'), 'utf8');
assert.match(feedback, /lastOutcome/, 'session feedback must persist the outcome class');
assert.match(feedback, /lastQuality/, 'session feedback must persist grading quality');
assert.match(feedback, /outcomeSchemaVersion/, 'session feedback must persist the outcome schema version');

console.log('Kanji 5 v1.9 outcome contract passed.');
