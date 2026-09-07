import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../v1.7-evaluation-core.js',import.meta.url),'utf8');
const context={globalThis:{},Date};
vm.runInNewContext(source,context,{filename:'v1.7-evaluation-core.js'});
const api=context.globalThis.__KANJI5_V17_EVALUATION__;
assert.ok(api);

const history=api.summarizeHistory([
  {correct:false,at:'1'},
  {correct:true,at:'2'},
  {correct:false,at:'3'},
  {correct:false,at:'4'},
  {correct:true,at:'5'}
]);
assert.equal(history.errors,3);
assert.equal(history.recoveryOpportunities,3);
assert.equal(history.recoveries,2);
assert.equal(history.recoveryRate,2/3);

const knowledge={
  A:{meaning:{attempts:4,correct:3,history:[{correct:false},{correct:true},{correct:true},{correct:true}]},reading:{attempts:3,correct:1,history:[{correct:false},{correct:false},{correct:true}]}},
  B:{reading:{attempts:2,correct:2,history:[{correct:true},{correct:true}]}},
};
const metrics=api.buildAttributeMetrics(knowledge);
assert.equal(metrics.meaning.attempts,4);
assert.equal(metrics.meaning.accuracy,0.75);
assert.equal(metrics.reading.attempts,5);
assert.equal(metrics.reading.accuracy,0.6);
assert.equal(metrics.reading.errors,2);
assert.equal(metrics.reading.recoveryRate,1);
assert.ok(metrics.reading.uncertainty<metrics.meaning.uncertainty);

const report=api.buildEvaluationReport(knowledge,{generatedAt:'2026-01-01T00:00:00.000Z'});
assert.equal(report.schemaVersion,1);
assert.equal(report.generatedAt,'2026-01-01T00:00:00.000Z');
assert.equal(report.total.attempts,9);
assert.equal(report.total.correct,6);
assert.equal(report.total.accuracy,6/9);

const compared=api.comparePolicyOutcomes([
  {policy:'adaptive',attempts:4,correct:3},
  {policy:'adaptive',attempts:2,correct:1},
  {policy:'baseline',attempts:5,correct:3}
]);
assert.equal(compared.adaptive.attempts,6);
assert.equal(compared.adaptive.correct,4);
assert.equal(compared.adaptive.accuracy,4/6);
assert.equal(compared.baseline.attempts,5);
assert.equal(compared.baseline.correct,3);
assert.equal(compared.baseline.accuracy,3/5);

const threshold=api.chooseThresholdCandidate([0.1,0.2,0.3],[
  {attempts:3,weakness:0.25,outcomeDelta:0.2},
  {attempts:3,weakness:0.15,outcomeDelta:0.1},
  {attempts:1,weakness:0.35,outcomeDelta:0.9}
],{minimumAttempts:3});
assert.equal(threshold.threshold,0.1);
assert.equal(threshold.sample,2);
assert.ok(Math.abs(threshold.signal-0.3)<1e-12);

console.log('v1.7 evaluation core: PASS');
