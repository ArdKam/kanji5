import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

function load(path,name){const context={globalThis:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path,'utf8'),context);return context.globalThis[name]}
const evaluation=load('v1.7-evaluation-core.js','__KANJI5_V17_EVALUATION__');
const baseline=load('v1.7-baseline-evaluation-core.js','__KANJI5_V17_BASELINE_EVALUATION__');

const knowledge={
  学:{production:{attempts:4,correct:2,history:[{correct:false},{correct:true}]},meaning:{attempts:3,correct:3}},
  生:{production:{attempts:2,correct:2},reading:{attempts:2,correct:1}}
};
const report=evaluation.buildEvaluationReport(knowledge);
assert.equal(report.attributes.production.attempts,6);
assert.equal(report.attributes.production.correct,4);
assert.equal(report.attributes.production.errors,1);
assert.equal(report.attributes.production.recoveryRate,1);
assert.equal(report.attributes.meaning.accuracy,1);

const insufficient=baseline.compareStrategies([
  {sessionId:'a',evaluationStrategy:'adaptive',modeResults:{meaning:{attempts:2,correct:1}}}
],{minSessions:1,minAttempts:3});
assert.equal(insufficient.status,'insufficient-data');
assert.equal(insufficient.delta.accuracy,null);

const ready=baseline.compareStrategies([
  {sessionId:'a',evaluationStrategy:'adaptive',modeResults:{meaning:{attempts:5,correct:4},production:{attempts:5,correct:3}}},
  {sessionId:'b',evaluationStrategy:'baseline',modeResults:{meaning:{attempts:5,correct:3},production:{attempts:5,correct:2}}}
],{minSessions:1,minAttempts:5});
assert.equal(ready.status,'ready');
assert.ok(ready.adaptive.attributes.production);
assert.ok(ready.delta.accuracy>0);
console.log('Kanji 5 v1.8 Evaluation 2.0 contract passed.');
