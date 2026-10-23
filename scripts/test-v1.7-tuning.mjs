import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../v1.7-tuning-core.js',import.meta.url),'utf8');
const context={globalThis:{}};
vm.runInNewContext(source,context,{filename:'v1.7-tuning-core.js'});
const api=context.globalThis.__KANJI5_V17_TUNING__;
assert.ok(api);
assert.deepEqual(Array.from(api.DEFAULT_THRESHOLDS),[0.1,0.15,0.2,0.25,0.3]);
assert.equal(api.recencyWeight('2026-09-08T13:00:00Z',Date.parse('2026-09-08T13:00:00Z'),30),1);
assert.equal(api.recencyWeight('2026-09-01T13:00:00Z',Date.parse('2026-09-08T13:00:00Z'),7),0.5);

const rows=[
  {attempts:4,correct:3,at:'2026-09-08T12:00:00Z'},
  {attempts:4,correct:2,at:'2026-09-01T12:00:00Z'}
];
const summary=api.summarizeOutcomes(rows,{now:Date.parse('2026-09-08T12:00:00Z'),halfLifeDays:7});
assert.equal(summary.attempts,8);
assert.equal(summary.correct,5);
assert.equal(summary.accuracy,5/8);
assert.ok(summary.weightedAccuracy>summary.accuracy);
assert.ok(summary.uncertainty<0.34);

const threshold=api.chooseThreshold([0.1,0.2,0.3],[
  {attempts:4,weakness:0.12,outcomeDelta:0.1},
  {attempts:4,weakness:0.25,outcomeDelta:0.2},
  {attempts:2,weakness:0.35,outcomeDelta:0.9}
],{minimumAttempts:3});
assert.equal(threshold.status,'ready');
assert.equal(threshold.threshold,0.1);
assert.equal(threshold.sample,2);
assert.ok(Math.abs(threshold.signal-0.3)<1e-12);

const recency=api.chooseRecencyHalfLife([7,30],[
  {attempts:4,correct:4,at:'2026-09-08T11:00:00Z'},
  {attempts:4,correct:0,at:'2026-08-20T11:00:00Z'}
],{now:Date.parse('2026-09-08T11:00:00Z'),minimumAttempts:3});
assert.equal(recency.status,'ready');
assert.equal(recency.halfLifeDays,7);

const secondary=api.chooseSecondaryAttribute([
  {attribute:'meaning',score:0.4},
  {attribute:'reading',score:0.2},
  {attribute:'production',score:0.1}
],{primary:'meaning',minScore:0.15});
assert.equal(secondary,'reading');

const recommendation=api.buildTuningRecommendation({
  thresholdRows:rows.map((r,i)=>({...r,weakness:0.2+i*0.1,outcomeDelta:0.1+i*0.2})),
  recencyRows:rows,
  rankedAttributes:[{attribute:'reading',score:0.3},{attribute:'meaning',score:0.1}]
},{primary:'meaning',minimumAttempts:3});
assert.equal(recommendation.schemaVersion,1);
assert.equal(recommendation.status,'ready');
assert.equal(recommendation.secondaryAttribute,'reading');
assert.equal(recommendation.applied,false);

const insufficient=api.buildTuningRecommendation();
assert.equal(insufficient.status,'insufficient-data');
assert.equal(insufficient.applied,false);

console.log('v1.7 tuning core: PASS');
