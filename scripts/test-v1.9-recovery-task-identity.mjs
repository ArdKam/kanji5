import assert from 'node:assert/strict';

const core=await import('../v1.9-recovery-core.js');

const first=core.classifyRecoveryOutcome(
  {mode:'production',outcome:'wrong',correct:false,character:'学',taskId:'学:production:card-1',contentId:'card-1'},
  {mode:'production',taskId:'学:production:card-1',character:'学',contentId:'card-1'}
);
assert.equal(first.retryable,true);
assert.equal(first.taskId,'学:production:card-1');

const state=core.createRecoveryState('production',{
  taskId:first.taskId,
  character:'学',
  contentId:'card-1',
  startedAt:'2026-09-19T00:00:00.000Z'
});
const pending=core.applyRecoveryOutcome(state,first);
assert.equal(pending.state,'pending_retry');
assert.equal(pending.taskId,first.taskId);

const retrying=core.consumeRetry(pending,'2026-09-19T00:01:00.000Z');
assert.equal(retrying.state,'retrying');
assert.equal(retrying.retryCount,1);

const otherTask=core.classifyRecoveryOutcome(
  {mode:'production',outcome:'correct',correct:true,character:'校',taskId:'校:production:card-2',contentId:'card-2'},
  {mode:'production',taskId:'校:production:card-2',character:'校',contentId:'card-2'}
);
const unchanged=core.applyRecoveryOutcome(retrying,otherTask);
assert.notEqual(unchanged.state,'recovered');
assert.equal(unchanged.recovered,false);

const recovered=core.applyRecoveryOutcome(
  retrying,
  core.classifyRecoveryOutcome(
    {mode:'production',outcome:'correct',correct:true,character:'学',taskId:'学:production:card-1',contentId:'card-1'},
    {mode:'production',taskId:'学:production:card-1',character:'学',contentId:'card-1'}
  )
);
assert.equal(recovered.state,'recovered');
assert.equal(recovered.recovered,true);

console.log('v1.9 recovery task-identity regression tests passed.');
