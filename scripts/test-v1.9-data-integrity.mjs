import assert from 'node:assert/strict';
import { inferOutcome, migrateOutcomeRecord, migrateRecoveryEvidence, migrateLearnerEvidence, migrateComponents, migrateSessionHistory, DATA_INTEGRITY_VERSION } from '../v1.9-data-integrity-core.js';

assert.equal(DATA_INTEGRITY_VERSION,'1.9.0-data-integrity');
assert.equal(inferOutcome({correct:true,quality:'exact'}),'correct');
assert.equal(inferOutcome({correct:false,quality:'unknown'}),'unknown');
assert.equal(inferOutcome({correct:false,quality:'wrong'}),'wrong');

const outcome=migrateOutcomeRecord({correct:true,quality:'exact'});
assert.equal(outcome.changed,true);
assert.deepEqual(outcome.record,{correct:true,quality:'exact',outcome:'correct',schemaVersion:1,score:1,graderVersion:'legacy-unversioned'});

const recovery=migrateRecoveryEvidence({correct:true,quality:'exact',retryOf:'x'});
assert.equal(recovery.record.outcome,'correct');
assert.equal(recovery.record.recovery,true);
assert.equal(recovery.record.recoveryAttempt,0);
assert.equal(recovery.record.recordedAt,'1970-01-01T00:00:00.000Z');

const evidence=migrateLearnerEvidence({学:[{correct:false,quality:'wrong',mode:'reading'}]});
assert.equal(evidence.changed,true);
assert.equal(evidence.value.学[0].outcome,'wrong');
assert.equal(evidence.value.学[0].mode,'reading');

const components=migrateComponents({v19LearnerModel:{kanji:{}},v19LearnerEvidence:{学:[{correct:false,quality:'unknown',mode:'meaning'}]}});
assert.equal(components.changed,true);
assert.equal(components.value.v19LearnerModel.version,'1.9.0-learner-model');
assert.equal(components.value.v19LearnerEvidence.学[0].outcome,'unknown');

const history=migrateSessionHistory([{status:'active',sessionId:'a'},{sessionId:'b'}]);
assert.equal(history.changed,true);
assert.equal(history.value[0].schemaVersion,2);
assert.equal(history.value[1].schemaVersion,1);

console.log('v1.9 data-integrity tests passed');
