import assert from 'node:assert/strict';
import {buildLearnerModel,projectKanjiAttributes,rankAttributes,LEARNER_MODEL_VERSION,ATTRIBUTES} from '../v1.9-learner-model-core.js';
const t='2026-09-15T00:00:00.000Z';
const rows=[{sessionId:'a',endedAt:'2026-09-01T00:00:00.000Z',modeResults:{meaning:{attempts:2,correct:2,lastAt:t,lastCorrect:true},reading:{attempts:2,correct:1,lastAt:t,lastCorrect:false}}},{sessionId:'b',endedAt:'2026-09-05T00:00:00.000Z',modeResults:{meaning:{attempts:1,correct:1,lastAt:t,lastCorrect:true},reading:{attempts:1,correct:1,lastAt:t,lastCorrect:true}}},{sessionId:'c',endedAt:'2026-09-10T00:00:00.000Z',modeResults:{meaning:{attempts:1,correct:1,lastAt:t,lastCorrect:true},reading:{attempts:1,correct:0,lastAt:t,lastCorrect:false}}}];
const model=buildLearnerModel(rows,{now:Date.parse('2026-09-15T00:00:00.000Z')});assert.equal(model.version,LEARNER_MODEL_VERSION);assert.deepEqual(Object.keys(model.attributes),ATTRIBUTES);assert.equal(model.attributes.meaning.attempts,4);assert.equal(model.attributes.reading.errorStreak,1);assert.ok(model.attributes.meaning.confidence>0&&model.attributes.meaning.confidence<=1);assert.equal(buildLearnerModel([]).attributes.meaning.state,'unseen');
const stableRows=[
  {sessionId:'s1',endedAt:'2026-09-01T00:00:00.000Z',modeResults:{meaning:{attempts:1,correct:1,lastAt:t,lastCorrect:true}}},
  {sessionId:'s2',endedAt:'2026-09-02T00:00:00.000Z',modeResults:{meaning:{attempts:1,correct:1,lastAt:t,lastCorrect:true}}},
  {sessionId:'s3',endedAt:'2026-09-03T00:00:00.000Z',modeResults:{meaning:{attempts:1,correct:1,lastAt:t,lastCorrect:true}}}
];
assert.equal(buildLearnerModel(stableRows).attributes.meaning.state,'stable');
const knowledge={学:{exposedAt:t,meaning:{attempts:6,correct:6,lastAt:t,lastOutcome:'correct',lastCorrect:true},reading:{attempts:3,correct:1,lastAt:t,lastOutcome:'wrong',lastCorrect:false},production:{attempts:0},vocabulary:{attempts:2,correct:1,lastAt:t,lastOutcome:'correct',lastCorrect:true},context:{attempts:2,correct:2,lastAt:t,lastOutcome:'correct',lastCorrect:true}}};const projected=projectKanjiAttributes(knowledge,'学');assert.equal(projected.attributes.meaning.state,'mastered');assert.equal(projected.attributes.reading.state,'weak');const ranked=rankAttributes(projected);assert.equal(ranked[0].mode,'reading');assert.ok(ranked[0].score>=ranked.at(-1).score);
const sparse=projectKanjiAttributes({日:{exposedAt:t,reading:{attempts:1,correct:0,lastAt:t,lastOutcome:'wrong',lastCorrect:false},meaning:{attempts:1,correct:1,lastAt:t,lastOutcome:'correct',lastCorrect:true}}},'日');assert.equal(sparse.attributes.reading.state,'learning');assert.ok(sparse.attributes.reading.confidence<.5);
const unknown=projectKanjiAttributes({月:{exposedAt:t,reading:{attempts:2,correct:0,lastAt:t,lastOutcome:'unknown',lastCorrect:false}}},'月');assert.equal(unknown.attributes.reading.state,'weak');
const repeat=buildLearnerModel([{sessionId:'x',endedAt:'2026-09-10T00:00:00.000Z',modeResults:{reading:{attempts:1,correct:0,lastAt:t,lastCorrect:false}}},{sessionId:'y',endedAt:'2026-09-11T00:00:00.000Z',modeResults:{reading:{attempts:1,correct:0,lastAt:t,lastCorrect:false}}}]);assert.equal(repeat.attributes.reading.state,'weak');assert.equal(repeat.attributes.reading.errorStreak,2);
console.log('Kanji 5 v1.9 learner model fixtures passed.');

const semantic=projectKanjiAttributes({学:{reading:{attempts:4,correct:3,lastAt:'2026-09-15T00:00:00.000Z'}}},'学',{now:Date.parse('2026-09-16T00:00:00.000Z')}).attributes.reading;
assert.ok(semantic.performance,'Skill state must expose performance separately from mastery');
assert.equal(semantic.performance.accuracy,.75,'Performance accuracy mismatch');
assert.equal(semantic.mastery,(3+1)/(4+2),'Mastery must not be aliased to raw performance');
assert.equal(semantic.retention,null,'Retention must remain unverified until delayed evidence exists');
assert.equal(semantic.retentionVerified,false,'Retention verification must be explicit');
assert.equal(typeof semantic.confidence,'number','Confidence must remain distinct from mastery');
assert.equal(typeof semantic.state,'string','State must remain distinct from performance');
console.log('Kanji 5 semantic skill-state contract passed.');

import {projectHandwritingSkill} from '../v1.9-learner-model-core.js';
const handwritingEvidence=[
 {at:'2026-09-01T00:00:00.000Z',outcome:'wrong',score:.55,evidence:{shape:.5,direction:.7,feedbackCode:'shape',feedbackStroke:2}},
 {at:'2026-09-02T00:00:00.000Z',outcome:'correct',score:.90,evidence:{shape:.88,direction:.96,feedbackCode:'good'}},
 {at:'2026-09-03T00:00:00.000Z',outcome:'correct',score:.94,evidence:{shape:.92,direction:.98,feedbackCode:'good'}},
 {at:'2026-09-04T00:00:00.000Z',outcome:'correct',score:.96,evidence:{shape:.94,direction:.99,feedbackCode:'good'}}
];
const handwriting=projectHandwritingSkill(handwritingEvidence);assert.equal(handwriting.attempts,4);assert.equal(handwriting.correct,3);assert.equal(handwriting.state,'learning');assert.ok(handwriting.score>.80&&handwriting.score<.90);assert.ok((handwriting.consistency??0)>.8);assert.equal(handwriting.weakestMetric,'shape');
const mastered=projectHandwritingSkill([{at:'2026-09-01T00:00:00.000Z',outcome:'correct',score:.94,evidence:{shape:.94}},{at:'2026-09-02T00:00:00.000Z',outcome:'correct',score:.95,evidence:{shape:.95}},{at:'2026-09-03T00:00:00.000Z',outcome:'correct',score:.96,evidence:{shape:.96}},{at:'2026-09-04T00:00:00.000Z',outcome:'correct',score:.97,evidence:{shape:.97}}]);assert.equal(mastered.state,'mastered');
const projectedHandwriting=projectKanjiAttributes({学:{}},'学',{evidenceByMode:{handwriting:handwritingEvidence}});assert.equal(projectedHandwriting.skills.handwriting.attempts,4);assert.equal(projectedHandwriting.attributes.meaning.state,'unseen');console.log('Kanji 5 handwriting learner-skill fixtures passed.');
