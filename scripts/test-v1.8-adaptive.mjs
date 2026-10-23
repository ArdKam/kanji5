import assert from 'node:assert/strict';
import { buildSessionPlan, nextPlannedMode, rebalanceSessionPlan } from '../v1.6-session-core.js';

const knowledge={
  '学':{
    meaning:{attempts:8,correct:8,lastAt:'2026-09-15T08:00:00.000Z'},
    reading:{attempts:8,correct:7,lastAt:'2026-09-15T08:10:00.000Z'},
    production:{attempts:8,correct:2,lastAt:'2026-09-15T08:20:00.000Z'},
    vocabulary:{attempts:4,correct:3,lastAt:'2026-09-15T08:30:00.000Z'},
    context:{attempts:4,correct:4,lastAt:'2026-09-15T08:40:00.000Z'}
  }
};
const profile={schemaVersion:2,sessions:8,skills:{
  meaning:{attempts:20,correct:19,recentAccuracy:95,momentum:.1,recentErrors:0,recoveryRate:0},
  reading:{attempts:20,correct:17,recentAccuracy:80,momentum:-.1,recentErrors:2,recoveryRate:.5},
  production:{attempts:20,correct:6,recentAccuracy:30,momentum:-.8,recentErrors:5,recoveryRate:.2},
  vocabulary:{attempts:20,correct:17,recentAccuracy:80,momentum:0,recentErrors:1,recoveryRate:1},
  context:{attempts:20,correct:20,recentAccuracy:100,momentum:.2,recentErrors:0,recoveryRate:0}
}};
const plan=buildSessionPlan(knowledge,{count:10,profile,now:Date.parse('2026-09-15T12:00:00.000Z')});
const production=plan.modes.find(x=>x.mode==='production');
const context=plan.modes.find(x=>x.mode==='context');
assert.ok(production);
assert.ok(production.profileRecentErrors>=5);
assert.ok(production.score>context.score,'recent production errors must influence sequencing');
assert.ok(plan.modes.every(x=>['meaning','reading','production','vocabulary','context'].includes(x.mode)),'planner may only use supported modes');
assert.equal(plan.target,10);

const rebalanced=rebalanceSessionPlan(plan,{meaning:2,reading:2,production:2,vocabulary:2,context:2},{meaning:{attempts:1,correct:1},reading:{attempts:1,correct:0},production:{attempts:2,correct:0,lastCorrect:false},vocabulary:{attempts:1,correct:1},context:{attempts:1,correct:1}},{now:Date.parse('2026-09-15T12:01:00.000Z')});
assert.ok(rebalanced.plan);
assert.ok((rebalanced.plan.modes.find(x=>x.mode==='production')?.score||0)>(rebalanced.plan.modes.find(x=>x.mode==='meaning')?.score||0));
assert.equal(Object.values(rebalanced.remaining).reduce((a,b)=>a+b,0),10);
assert.equal(nextPlannedMode(rebalanced.plan,rebalanced.remaining,['meaning','reading','production','vocabulary','context']),rebalanced.plan.priority[0]);
console.log('Kanji 5 v1.8 Adaptive Recall 2.0 contract passed.');
