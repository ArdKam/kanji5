import assert from 'node:assert/strict';
import { buildSessionPlan, nextPlannedMode, weakestMode } from '../v1.6-session-core.js';

const now=Date.parse('2026-01-01T00:00:00Z');
const plan=buildSessionPlan({}, { count: 10, now });
assert.equal(plan.target,10);
assert.equal(plan.modes.length,5);
assert.equal(plan.modes.reduce((sum,item)=>sum+item.plannedCount,0),10);
assert.ok(Math.abs(plan.modes.reduce((sum,item)=>sum+item.share,0)-1)<1e-9);
assert.ok(plan.modes.every(item=>item.plannedCount>=0));
assert.ok(plan.priority.length>0);

const weak={
  meaning:{attempts:20,correct:19,lastAt:'2025-12-31T00:00:00Z'},
  reading:{attempts:20,correct:7,lastAt:'2025-12-31T00:00:00Z'},
  production:{attempts:20,correct:18,lastAt:'2025-12-31T00:00:00Z'},
  vocabulary:{attempts:20,correct:19,lastAt:'2025-12-31T00:00:00Z'},
  context:{attempts:20,correct:18,lastAt:'2025-12-31T00:00:00Z'}
};
const weakPlan=buildSessionPlan({一:weak},{count:10,now});
assert.equal(weakPlan.modes[0].mode,'reading');
assert.equal(weakestMode(weakPlan),'reading');
assert.equal(nextPlannedMode(weakPlan,Object.fromEntries(weakPlan.modes.map(item=>[item.mode,item.plannedCount])),['meaning','reading','production']), 'reading');
assert.equal(nextPlannedMode(weakPlan,{reading:0,meaning:2,production:2,vocabulary:0,context:0},['meaning','reading','production']), 'production');

const untouched=buildSessionPlan({一:{meaning:{attempts:30,correct:30},reading:{attempts:30,correct:30},production:{attempts:30,correct:30},vocabulary:{attempts:30,correct:30},context:{attempts:0,correct:0}}},{count:10,now});
assert.ok(untouched.modes.find(item=>item.mode==='context').plannedCount>=1);
console.log('Kanji 5 v1.6 adaptive session core tests passed.');
