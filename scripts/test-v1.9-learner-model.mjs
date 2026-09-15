import assert from 'node:assert/strict';
import {buildLearnerModel,projectKanjiAttributes,rankAttributes,LEARNER_MODEL_VERSION,ATTRIBUTES} from '../v1.9-learner-model-core.js';
const t='2026-09-15T00:00:00.000Z';
const rows=[
 {sessionId:'a',endedAt:'2026-09-01T00:00:00.000Z',modeResults:{meaning:{attempts:2,correct:2,lastAt:t,lastCorrect:true},reading:{attempts:2,correct:1,lastAt:t,lastCorrect:false}}},
 {sessionId:'b',endedAt:'2026-09-05T00:00:00.000Z',modeResults:{meaning:{attempts:1,correct:1,lastAt:t,lastCorrect:true},reading:{attempts:1,correct:1,lastAt:t,lastCorrect:true}}},
 {sessionId:'c',endedAt:'2026-09-10T00:00:00.000Z',modeResults:{meaning:{attempts:1,correct:1,lastAt:t,lastCorrect:true},reading:{attempts:1,correct:0,lastAt:t,lastCorrect:false}}}
];
const model=buildLearnerModel(rows,{now:Date.parse('2026-09-15T00:00:00.000Z')});
assert.equal(model.version,LEARNER_MODEL_VERSION);
assert.deepEqual(Object.keys(model.attributes),ATTRIBUTES);
assert.equal(model.attributes.meaning.attempts,4);
assert.equal(model.attributes.reading.errorStreak,1);
assert.ok(model.attributes.meaning.confidence>0&&model.attributes.meaning.confidence<=1);
assert.equal(buildLearnerModel([]).attributes.meaning.state,'unseen');
const knowledge={学:{exposedAt:t,meaning:{attempts:6,correct:6,lastAt:t,lastOutcome:'correct',lastCorrect:true},reading:{attempts:3,correct:1,lastAt:t,lastOutcome:'wrong',lastCorrect:false},production:{attempts:0},vocabulary:{attempts:2,correct:1,lastAt:t,lastOutcome:'correct',lastCorrect:true},context:{attempts:2,correct:2,lastAt:t,lastOutcome:'correct',lastCorrect:true}}};
const projected=projectKanjiAttributes(knowledge,'学');
assert.equal(projected.attributes.meaning.state,'mastered');
assert.equal(projected.attributes.reading.state,'learning');
const ranked=rankAttributes(projected);
assert.equal(ranked[0].mode,'reading');
assert.ok(ranked[0].score>=ranked.at(-1).score);
console.log('Kanji 5 v1.9 learner model fixtures passed.');
