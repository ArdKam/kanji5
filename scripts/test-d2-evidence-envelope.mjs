import assert from 'node:assert/strict';
import { EVIDENCE_SCHEMA_VERSION, buildEvidenceEnvelope, hasRawLearnerInput } from '../v2-evidence-core.js';
import { normalizeOutcome } from '../v1.9-outcome-core.js';

const envelope=buildEvidenceEnvelope({
  attemptId:'attempt-1',timestamp:'2026-10-02T12:00:00.000Z',
  domain:'vocabulary',contentId:'vocabulary:kanjiapi.dev:abc',
  cardId:'card:vocabulary:kanjiapi.dev:abc:reading:type-answer',
  mode:'vocabulary',attribute:'reading',outcome:'correct',score:1,
  graderVersion:'2.0.0-vocabulary',learnerModelVersion:'1.9.0-learner-model',
  plannerVersion:'1.9.0-adaptive-planner',
  evidence:{selectedIndex:1,answer:'学校',rawInput:'学校'}
});
assert.equal(EVIDENCE_SCHEMA_VERSION,1);
assert.equal(envelope.domainSchemaVersion,1);
assert.equal(envelope.domain,'vocabulary');
assert.equal(envelope.contentId,'vocabulary:kanjiapi.dev:abc');
assert.equal(envelope.cardId,'card:vocabulary:kanjiapi.dev:abc:reading:type-answer');
assert.equal(envelope.attribute,'reading');
assert.equal(envelope.learnerModelVersion,'1.9.0-learner-model');
assert.equal(envelope.plannerVersion,'1.9.0-adaptive-planner');
assert.equal(envelope.evidence.selectedIndex,1);
assert.equal(envelope.evidence.answer,undefined);
assert.equal(envelope.evidence.rawInput,undefined);
assert.equal(hasRawLearnerInput(envelope),false);

const outcome=normalizeOutcome('vocabulary',{correct:true,quality:'exact',score:1,evidence:{input:'secret',selectedIndex:2}},{
  domain:'vocabulary',contentId:'vocabulary:abc',cardId:'card:vocabulary:abc:reading:type-answer',
  attribute:'reading',graderVersion:'2.0.0-vocabulary',learnerModelVersion:'1.9.0-learner-model',
  plannerVersion:'1.9.0-adaptive-planner',attemptId:'attempt-2',timestamp:'2026-10-02T12:01:00.000Z'
});
assert.equal(outcome.evidenceEnvelope.contentId,'vocabulary:abc');
assert.equal(outcome.evidenceEnvelope.cardId,'card:vocabulary:abc:reading:type-answer');
assert.equal(outcome.evidenceEnvelope.attribute,'reading');
assert.equal(outcome.evidenceEnvelope.evidence.selectedIndex,2);
assert.equal(outcome.evidenceEnvelope.evidence.input,undefined);
assert.equal(outcome.evidenceEnvelope.attemptId,'attempt-2');

console.log('Kanji 5 D2 evidence envelope contract passed.');
