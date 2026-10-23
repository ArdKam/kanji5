import assert from 'node:assert/strict';

const core=await import('../v1.9-outcome-core.js');

assert.equal(core.normalizeOutcome('production',null).outcome,'invalid');
assert.equal(core.normalizeOutcome('production',{}).outcome,'invalid');
assert.equal(core.normalizeOutcome('production',{correct:false,quality:'wrong'}).outcome,'wrong');
assert.equal(core.normalizeOutcome('production',{quality:'unknown',correct:false}).outcome,'unknown');
assert.equal(core.normalizeOutcome('production',{correct:true,quality:'exact'},{graderVersion:'test-grader-7'}).graderVersion,'test-grader-7');

console.log('v1.9 outcome regression tests passed.');
