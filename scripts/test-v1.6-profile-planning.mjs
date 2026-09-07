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
assert.equal(baseline.profileAware,false);
assert.equal(profiled.profileAware,true);
assert.equal(profiled.modes.find(x=>x.mode==='reading').profileAttempts,120);
assert.equal(profiled.modes.find(x=>x.mode==='reading').profileAccuracy,35);
assert.equal(profiled.priority[0],'reading');
assert.ok(profiled.modes.find(x=>x.mode==='reading').plannedCount>baseline.modes.find(x=>x.mode==='reading').plannedCount);
assert.equal(profiled.modes.reduce((sum,item)=>sum+item.plannedCount,0),10);
assert.ok(Math.abs(profiled.modes.reduce((sum,item)=>sum+item.share,0)-1)<1e-9);
const remaining=Object.fromEntries(profiled.modes.map(item=>[item.mode,item.plannedCount]));
const beforeProfileScore=profiled.modes.find(x=>x.mode==='reading').score;
remaining.reading=Math.max(0,remaining.reading-1);
const rebalanced=rebalanceSessionPlan(profiled,remaining,{reading:{attempts:1,correct:0}},{now});
assert.equal(rebalanced.plan.modes.find(x=>x.mode==='reading').profileAttempts,120);
assert.notEqual(rebalanced.plan.modes.find(x=>x.mode==='reading').score,beforeProfileScore);
assert.equal(Object.values(rebalanced.remaining).reduce((a,b)=>a+b,0),9);
console.log('v1.6 profile-aware planning tests passed.');
