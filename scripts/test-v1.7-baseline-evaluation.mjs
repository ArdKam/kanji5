import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../v1.7-baseline-evaluation-core.js',import.meta.url),'utf8');
const context={globalThis:{}};
vm.runInNewContext(source,context,{filename:'v1.7-baseline-evaluation-core.js'});
const api=context.globalThis.__KANJI5_V17_BASELINE_EVALUATION__;
assert.ok(api);
assert.deepEqual(Array.from(api.STRATEGIES),['adaptive','baseline']);

const history=[
  {sessionId:'a1',status:'completed',evaluationStrategy:'adaptive',evaluationSchemaVersion:1,modeResults:{meaning:{attempts:4,correct:3},reading:{attempts:2,correct:1}},endedAt:'2026-09-01T10:00:00Z'},
  {sessionId:'a2',status:'completed',evaluationStrategy:'adaptive',evaluationSchemaVersion:1,modeResults:{meaning:{attempts:2,correct:2},reading:{attempts:2,correct:1}},endedAt:'2026-09-02T10:00:00Z'},
  {sessionId:'b1',status:'completed',evaluationStrategy:'baseline',evaluationSchemaVersion:1,modeResults:{meaning:{attempts:4,correct:2},reading:{attempts:2,correct:1}},endedAt:'2026-09-01T11:00:00Z'},
  {sessionId:'legacy',modeResults:{meaning:{attempts:10,correct:9}},endedAt:'2026-09-01T12:00:00Z'}
];

const adaptive=api.summarizeSessions(history,'adaptive');
assert.equal(adaptive.sessions,2);
assert.equal(adaptive.attempts,10);
assert.equal(adaptive.correct,7);
assert.equal(adaptive.accuracy,0.7);
assert.equal(adaptive.attributes.meaning.attempts,6);
assert.equal(adaptive.attributes.meaning.correct,5);

const baseline=api.summarizeSessions(history,'baseline');
assert.equal(baseline.sessions,1);
assert.equal(baseline.attempts,6);
assert.equal(baseline.correct,3);
assert.equal(baseline.accuracy,0.5);

const report=api.compareStrategies(history);
assert.equal(report.status,'ready');
assert.equal(report.adaptive.accuracy,0.7);
assert.equal(report.baseline.accuracy,0.5);
assert.equal(report.delta.accuracy,0.2);
assert.equal(report.evidence.eligibleSessions,3);
assert.equal(report.evidence.excludedSessions,1);

const insufficient=api.compareStrategies(history.filter(x=>x.evaluationStrategy!=='baseline'));
assert.equal(insufficient.status,'insufficient-data');
assert.equal(insufficient.delta.accuracy,null);

console.log('v1.7 persisted adaptive/baseline evaluation: PASS');
