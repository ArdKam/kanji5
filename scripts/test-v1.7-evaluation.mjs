import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../v1.7-evaluation-core.js',import.meta.url),'utf8');
const context={globalThis:{}};
vm.runInNewContext(source,context,{filename:'v1.7-evaluation-core.js'});
const api=context.globalThis.__KANJI5_V17_EVALUATION__;
assert.ok(api);
assert.deepEqual(Array.from(api.ATTRIBUTES),['meaning','reading','production','vocabulary','context']);

const summary=api.summarizeAttribute({attempts:4,correct:3,history:[{correct:false},{correct:true},{correct:false},{correct:false},{correct:true}]});
assert.equal(summary.attempts,4);
assert.equal(summary.correct,3);
assert.equal(summary.accuracy,0.75);
assert.equal(summary.errors,3);
assert.equal(summary.recoveryOpportunities,3);
assert.equal(summary.recoveries,1);
assert.equal(summary.recoveryRate,1/3);
assert.ok(summary.uncertainty>0);

const knowledge={
  A:{meaning:{attempts:4,correct:3,history:[{correct:false},{correct:true},{correct:true},{correct:true}]},reading:{attempts:2,correct:1,history:[{correct:false},{correct:true}]},production:{attempts:0,correct:0}},
  B:{meaning:{attempts:2,correct:1,history:[{correct:true},{correct:false}]},reading:{attempts:3,correct:3,history:[{correct:true},{correct:true},{correct:true}]}}
};
const report=api.buildEvaluationReport(knowledge,{generatedAt:new Date(0).toISOString()});
assert.equal(report.schemaVersion,1);
assert.equal(report.attributes.meaning.attempts,6);
assert.equal(report.attributes.meaning.correct,4);
assert.equal(report.attributes.meaning.accuracy,2/3);
assert.equal(report.attributes.meaning.errors,2);
assert.equal(report.attributes.meaning.recoveryOpportunities,1);
assert.equal(report.attributes.meaning.recoveries,1);
assert.equal(report.attributes.meaning.recoveryRate,1);
assert.equal(report.attributes.production.attempts,0);
assert.equal(report.attributes.production.uncertainty,0.5);
assert.equal(report.total.attempts,9);
assert.equal(report.total.correct,7);

const noHistory=api.summarizeAttribute({attempts:10,correct:8});
assert.equal(noHistory.recoveryRate,null);

console.log('v1.7 evaluation core: PASS');
