import assert from 'node:assert/strict';
import fs from 'node:fs';
const runtime=fs.readFileSync('v1.9-learning-evaluation.js','utf8');
const core=fs.readFileSync('v1.9-learning-evaluation-core.js','utf8');
assert.match(runtime,/readSessionHistory/);assert.match(runtime,/__KANJI5_V19_EVALUATION__/);assert.match(runtime,/evaluate\(options/);assert.match(runtime,/compare\(records/);assert.match(runtime,/baseline\(options/);assert.doesNotMatch(runtime,/writeKnowledge|writeComponents|writeSessionHistory/);assert.match(core,/buildBaselinePlan/);assert.match(core,/evidenceSufficiency/);assert.match(core,/recommendation/);console.log('Kanji 5 v1.9 learning evaluation runtime boundary passed.');
