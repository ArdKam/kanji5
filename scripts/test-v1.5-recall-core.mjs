import assert from 'node:assert/strict';
import {
  RECALL_MODES,
  applyRecallOutcome,
  componentAccuracy,
  componentSignal,
  normalize,
  selectFocus
} from '../v1.5-recall-core.js';

assert.deepEqual(RECALL_MODES, ['meaning', 'reading']);
assert.equal(normalize('  学　 '), '学');
assert.equal(normalize('  Good Answer  '), 'goodanswer');
assert.equal(componentAccuracy({ attempts: 0, correct: 0 }), 0);
assert.equal(componentAccuracy({ attempts: 2, correct: 2 }), 0.75);
assert.equal(componentAccuracy({ attempts: 4, correct: 1, score: 0.5 }), 0.25);

const item = { character: '学', meaning: ['study', 'learning'], on: ['ガク'], kun: ['まなぶ'] };
const focus = selectFocus(item, 'meaning', {
  study: { attempts: 3, correct: 3 },
  learning: { attempts: 3, correct: 0 }
});
assert.equal(focus?.raw, 'learning', 'focus selection must choose the weakest component');
assert.equal(selectFocus(item, 'reading', {
  ガク: { attempts: 2, correct: 2 },
  まなぶ: { attempts: 1, correct: 0 }
})?.raw, 'まなぶ');
assert.equal(selectFocus(null, 'meaning'), null);
assert.equal(selectFocus(item, 'unsupported'), null);

const signal = componentSignal({
  meaning: {
    study: { attempts: 2, correct: 2, lastAt: '2026-09-01T00:00:00.000Z' },
    learning: { attempts: 2, correct: 0, lastAt: '2026-09-02T00:00:00.000Z' }
  },
  reading: {}
});
assert.ok(signal.meaning.accuracy > 0 && signal.meaning.accuracy < 1);
assert.equal(signal.meaning.attempts, 4);
assert.equal(signal.meaning.lastAt, '2026-09-02T00:00:00.000Z');
assert.equal(signal.reading.accuracy, null);
assert.equal(signal.reading.attempts, 0);

const original = { meaning: { study: { attempts: 1, correct: 1, score: 1 } }, reading: {} };
const correct = applyRecallOutcome(original, 'meaning', 'study', 'correct', '2026-09-04T00:00:00.000Z');
assert.notStrictEqual(correct, original);
assert.deepEqual(original.meaning.study, { attempts: 1, correct: 1, score: 1 });
assert.equal(correct.meaning.study.attempts, 2);
assert.equal(correct.meaning.study.correct, 2);
assert.equal(correct.meaning.study.score, 2);

const unknown = applyRecallOutcome(original, 'meaning', 'study', 'unknown', '2026-09-04T00:00:01.000Z');
assert.equal(unknown.meaning.study.attempts, 2);
assert.equal(unknown.meaning.study.correct, 1);
assert.equal(unknown.meaning.study.score, 1.25);
assert.equal(unknown.meaning.study.unknown, 1);
assert.equal(unknown.updatedAt, '2026-09-04T00:00:01.000Z');

console.log('Kanji 5 v1.5 recall core tests passed.');
