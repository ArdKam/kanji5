import assert from 'node:assert/strict';

const core=await import('../v1.9-learning-evaluation-core.js');

const wrong={
  at:'2026-09-19T00:00:00.000Z',
  mode:'production',
  character:'学',
  taskId:'学:production:card-1',
  outcome:'wrong',
  correct:false
};
const unrelatedCorrect={
  at:'2026-09-19T00:01:00.000Z',
  mode:'production',
  character:'校',
  taskId:'校:production:card-2',
  outcome:'correct',
  correct:true
};
const unrelated=core.evaluateSessions([{sessionId:'s1',endedAt:unrelatedCorrect.at,modeResults:{production:{attempts:2,correct:1}},educationEvents:{production:[wrong,unrelatedCorrect]}}]);
assert.equal(unrelated.recoveryRate,0);
assert.equal(unrelated.attributes.production.recoveryOpportunities,0);

const retryWrong={...wrong};
const retryCorrect={
  at:'2026-09-19T00:01:00.000Z',
  mode:'production',
  character:'学',
  taskId:'学:production:card-1',
  retryOf:'学:production:card-1',
  recovery:true,
  recoveryAttempt:1,
  outcome:'correct',
  correct:true
};
const linked=core.evaluateSessions([{sessionId:'s2',endedAt:retryCorrect.at,modeResults:{production:{attempts:2,correct:1}},educationEvents:{production:[retryWrong,retryCorrect]}}]);
assert.equal(linked.attributes.production.recoveryOpportunities,1);
assert.equal(linked.attributes.production.recoveries,1);
assert.equal(linked.attributes.production.recoveryRate,1);

console.log('v1.9 recovery evaluation-link regression tests passed.');
