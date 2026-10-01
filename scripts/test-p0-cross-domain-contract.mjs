import assert from 'node:assert/strict';
import { normalizeOutcome } from '../v1.9-outcome-core.js';
import { buildSessionPlan } from '../v1.6-session-core.js';
import { buildStatsViewModel, buildSessionViewModel, buildExerciseViewModel, buildFeedbackViewModel } from '../v1.9-v2-contract-core.js';
import * as network from '../v1.5-network.js';

const outcome=normalizeOutcome('vocabulary',{correct:true,quality:'exact',score:1},{contentId:'vocabulary:abc'});
assert.equal(outcome.domain,'kanji');
assert.equal(outcome.skill,'word-completion');
assert.equal(outcome.exercise,'word-completion');
assert.equal(outcome.contentId,'vocabulary:abc');
assert.equal(outcome.domainSchemaVersion,1);

const plan=buildSessionPlan({日:{meaning:{attempts:2,correct:2},reading:{attempts:2,correct:1}}},{count:10,now:Date.parse('2026-10-01T00:00:00Z')});
assert.equal(plan.domain,'kanji');
assert.equal(plan.domainSchemaVersion,1);
assert.equal(plan.modes.find(x=>x.mode==='vocabulary')?.domain,'kanji');
assert.equal(plan.modes.find(x=>x.mode==='vocabulary')?.skill,'word-completion');

const stats=buildStatsViewModel({totalReviews:4,studiedCount:2,deckSize:2136});
assert.equal(stats.domains.kanji.domain,'kanji');
assert.equal(stats.domains.kanji.totalReviews,4);

const session=buildSessionViewModel({sessionId:'s1',status:'active',domain:'kanji',remainingModes:{meaning:1}});
assert.equal(session.domain,'kanji');
assert.equal(session.modeResults.vocabulary.skill,'word-completion');
const exercise=buildExerciseViewModel({mode:'vocabulary',contentId:'vocabulary:abc'});
assert.equal(exercise.domain,'kanji');
assert.equal(exercise.skill,'word-completion');
const feedback=buildFeedbackViewModel({mode:'context',contentId:'sentence:10',outcome:'correct'});
assert.equal(feedback.domain,'kanji');
assert.equal(feedback.skill,'context');

const originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{
  const value=String(url);
  if(value.includes('/v1/words/')){
    return {ok:true,json:async()=>[{variants:[{written:'学校',pronounced:'がっこう'}],meanings:[{glosses:['school','school building']}]}]};
  }
  if(value.includes('/v1/sentences')){
    return {ok:true,json:async()=>({data:[{id:123,text:'学校へ行く。',translations:[[{text:'I go to school.'}]]}]})};
  }
  throw new Error('unexpected URL '+value);
};
try{
  const words=await network.fetchWords('学');
  assert.match(words[0].contentId,/^vocabulary:kanjiapi\.dev:[0-9a-f]{8}$/);
  const sentences=await network.fetchContextSentences('学');
  assert.equal(sentences[0].contentId,'sentence:123');
  assert.equal(sentences[0].id,123);
}finally{globalThis.fetch=originalFetch}

console.log('Kanji 5 P0 cross-domain contracts passed.');
