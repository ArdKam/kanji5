import assert from 'node:assert/strict';
import { V2_BOUNDARY_VERSION, MODES, OUTCOMES, buildSessionViewModel, buildExerciseViewModel, buildFeedbackViewModel, buildLearnerSkillSummary, buildSessionSummary, buildAdaptiveReasonViewModel, buildLearningCardViewModel, buildStatsViewModel, buildBoundarySnapshot, isV2BoundarySnapshot } from '../v1.9-v2-contract-core.js';

assert.equal(V2_BOUNDARY_VERSION,'1.9.0-v2-boundary-contract');
assert.deepEqual(MODES,['meaning','reading','production','vocabulary','context']);
assert.ok(OUTCOMES.includes('unknown')&&OUTCOMES.includes('near_miss'));
const session=buildSessionViewModel({sessionId:'s1',status:'active',resumed:true,remainingModes:{meaning:1,reading:2},modeResults:{meaning:{attempts:2,correct:1,lastOutcome:'wrong',lastAt:'2026-09-15T00:00:00Z',graderVersion:'1.9.0-production'}}});
assert.deepEqual(session.remainingModes,{meaning:1,reading:2,production:0,vocabulary:0,context:0});
assert.equal(session.modeResults.meaning.lastOutcome,'wrong');
assert.equal(session.resumed,true);
const exercise=buildExerciseViewModel({mode:'production',prompt:'Select the Kanji',character:'学',choices:['学','字','校','字'],contentId:42,provenance:'local'});
assert.equal(exercise.mode,'production');assert.equal(exercise.character,'学');assert.equal(exercise.contentId,'42');assert.equal(exercise.exercise,'typed-kanji-production');assert.equal(exercise.modality,'independent-typed-production');assert.deepEqual(exercise.choices,['学','字','校','字']);
const learning=buildLearningCardViewModel({active:true,character:'学',isNew:true,revealed:false,meanings:['study','learning'],on:['ガク'],kun:['まなぶ'],hint:'Learn this kanji'});
assert.equal(learning.kind,'learning-card');assert.equal(learning.character,'学');assert.equal(learning.isNew,true);assert.equal(learning.revealed,false);assert.deepEqual(learning.meanings,['study','learning']);assert.deepEqual(learning.learnerMeanings.primary,['study','learning']);assert.deepEqual(learning.learnerReadings.coreOn,['ガク']);assert.deepEqual(learning.learnerReadings.coreKun,['まなぶ']);
const feedback=buildFeedbackViewModel({mode:'reading',outcome:'near_miss',score:0.7,retryCount:1,recovered:true});
assert.equal(feedback.outcome,'near_miss');assert.equal(feedback.recovered,true);assert.equal(feedback.retryCount,1);
const learner=buildLearnerSkillSummary({version:'1.9.0-learner-model',attributes:{reading:{state:'weak',accuracy:.4,recentAccuracy:.3,confidence:.6,momentum:-.2,attempts:5,recentAttempts:3,repeatedFailure:true}}});
assert.equal(learner.modelVersion,'1.9.0-learner-model');assert.equal(learner.attributes.reading.state,'weak');assert.equal(learner.attributes.reading.attempts,5);assert.equal(learner.attributes.reading.recentAttempts,3);
const stats=buildStatsViewModel({
  masteryDistribution:{unseen:10,learning:5,attention:2,stable:3,mastered:1,average:.64,total:21},
  evaluation:{
    sessions:8,completedSessions:7,totalAttempts:40,accuracy:.8,unknownRate:.1,recoveryRate:.6,repeatedFailureRate:.05,
    attributeCoverage:1,averageRecallsPerSession:5,sessionCompletionRate:.875,
    modeDistribution:{meaning:10,reading:8,production:8,vocabulary:7,context:7},
    attributes:{meaning:{attempts:10,accuracy:.8,recentAccuracy:.9,retentionRate:.75,recoveryRate:.5,repeatedFailureRate:.1}},
    evidence:{sessions:8,attempts:40,sufficient:true,reason:'sufficient'}
  }
});
assert.equal(stats.evaluation.recoveryRate,.6);
assert.equal(stats.evaluation.attributeCoverage,1);
assert.equal(stats.evaluation.sessionCompletionRate,.875);
assert.equal(stats.evaluation.attributes.meaning.retentionRate,.75);
assert.equal(stats.evaluation.evidence.sufficient,true);
assert.equal(stats.evaluation.modeDistribution.context,7);
const summary=buildSessionSummary({sessionId:'s1',status:'complete',modeResults:{meaning:{attempts:2,correct:1},reading:{attempts:1,correct:1}}});
assert.equal(summary.attempts,3);assert.equal(summary.correct,2);assert.equal(summary.completionStatus,'complete');
const reason=buildAdaptiveReasonViewModel({mode:'reading',action:'repair',reasons:['recent failure','weak recent accuracy'],score:3});
assert.equal(reason.reasons.length,2);
const snapshot=buildBoundarySnapshot({session,learning,exercise,feedback,learner,adaptiveReason:reason});
assert.equal(isV2BoundarySnapshot(snapshot),true);
assert.equal(snapshot.learning.kind,'learning-card');
assert.equal(Object.prototype.hasOwnProperty.call(snapshot.session,'rawStorage'),false);
console.log('Kanji 5 v1.9 v2 boundary contract passed.');
