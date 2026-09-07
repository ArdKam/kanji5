import assert from 'node:assert/strict';
import { buildSessionPlan, rebalanceSessionPlan } from '../v1.6-session-core.js';

const now=Date.parse('2026-01-01T00:00:00Z');
const baseline=buildSessionPlan({}, {count:10,now});
const profile={schemaVersion:1,sessions:12,skills:{
  meaning:{attempts:120,correct:108},
  reading:{attempts:120,correct:42},
  production:{attempts:120,correct:108},
  vocabulary:{attempts:120,correct:108},
  context:{attempts:120,correct:108}
}};
const profiled=buildSessionPlan({}, {count:10,now,profile});
const baselineReading=baseline.modes.find(x=>x.mode==='reading');
const profiledReading=profiled.modes.find(x=>x.mode==='reading');
assert.equal(baseline.profileAware,false);
assert.equal(profiled.profileAware,true);
assert.equal(profiledReading.profileAttempts,120);
assert.equal(profiledReading.profileAccuracy,35);
assert.equal(profiled.priority[0],'reading');
assert.ok(profiledReading.score>baselineReading.score);
assert.equal(profiled.modes.reduce((sum,item)=>sum+item.plannedCount,0),10);
assert.equal(profiled.modes.reduce((sum,item)=>sum+item.share,0),1);
const remaining=Object.fromEntries(profiled.modes.map(item=>[item.mode,item.plannedCount]));
const beforeProfileScore=profiledReading.score;
remaining.reading=Math.max(0,remaining.reading-1);
const rebalanced=rebalanceSessionPlan(profiled,remaining,{reading:{attempts:1,correct:0}},{now});
const rebalancedReading=rebalanced.plan.modes.find(x=>x.mode==='reading');
assert.equal(rebalancedReading.profileAttempts,120);
assert.notEqual(rebalancedReading.score,beforeProfileScore);
assert.equal(Object.values(rebalanced.remaining).reduce((a,b)=>a+b,0),9);
console.log('v1.6 profile-aware planning tests passed.');
