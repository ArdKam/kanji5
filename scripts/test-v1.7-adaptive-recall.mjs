import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../v1.7-adaptive-recall-core.js',import.meta.url),'utf8');
const context={globalThis:{},Date};
vm.runInNewContext(source,context,{filename:'v1.7-adaptive-recall-core.js'});
const api=context.globalThis.__KANJI5_V17_ADAPTIVE_RECALL__;
assert.ok(api);
assert.deepEqual(api.ATTRIBUTES,['meaning','reading','production','vocabulary','context']);

const strong={meaning:{attempts:20,correct:19},reading:{attempts:20,correct:4},production:{attempts:20,correct:18},vocabulary:{attempts:20,correct:19},context:{attempts:20,correct:17}};
assert.deepEqual(api.selectRecallAttributes(strong,{maxAttributes:2}),['reading','context']);

const unseen={meaning:{attempts:0,correct:0},reading:{attempts:10,correct:9},production:{attempts:10,correct:9},vocabulary:{attempts:10,correct:9},context:{attempts:10,correct:9}};
assert.deepEqual(api.selectRecallAttributes(unseen,{maxAttributes:2}),['meaning','reading']);

const plan=api.buildAdaptiveRecallPlan({A:strong},{cardId:'A',maxAttributes:2,now:0});
assert.equal(plan.schemaVersion,1);
assert.equal(plan.cardId,'A');
assert.equal(plan.primary,'reading');
assert.deepEqual(plan.attributes,['reading','context']);
console.log('v1.7 adaptive recall core: PASS');
