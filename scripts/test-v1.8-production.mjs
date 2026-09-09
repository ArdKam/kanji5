import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const core = fs.readFileSync('v1.8-production-core.js','utf8');
const ui = fs.readFileSync('v1.5-education-ui.js','utf8');
const roadmap = fs.readFileSync('V1.8-ROADMAP.md','utf8');

const context={globalThis:{}};
vm.createContext(context);
vm.runInContext(core,context);
const api=context.globalThis.__KANJI5_V18_PRODUCTION__;
assert.ok(api,'v1.8 production core API must be exposed');

const exact=api.gradeProduction('学','学');
assert.equal(exact.correct,true);
assert.equal(exact.quality,'exact');
assert.equal(exact.score,1);

const padded=api.gradeProduction(' 学 ','学');
assert.equal(padded.correct,true);
assert.equal(padded.quality,'exact');
assert.equal(padded.score,1);

const normalized=api.gradeProduction('学','学'.normalize('NFKC'));
assert.equal(normalized.correct,true);

const wrong=api.gradeProduction('學','学');
assert.equal(wrong.correct,false);
assert.equal(wrong.quality,'wrong');
assert.equal(wrong.score,0);

const empty=api.gradeProduction('','学');
assert.equal(empty.correct,false);
assert.equal(empty.quality,'empty');
assert.equal(empty.score,0);

assert.match(ui,/edu\.mode==='production'/,'education UI must contain a production branch');
assert.match(ui,/v14EduProductionInput/,'production mode must use a learner input, not only choice buttons');
assert.match(ui,/v1\.8-production-core\.js/,'production submission must use the dedicated v1.8 grader');
assert.match(ui,/gradeProduction/,'education UI must call the production grader');
assert.match(ui,/const check=\(edu\.mode==='meaning'\|\|edu\.mode==='reading'\|\|edu\.mode==='production'/,'production must be included in the submit-button path');
assert.match(ui,/CORE\.recordKnowledge/,'production outcomes must use the existing education knowledge boundary');
assert.match(ui,/kanji5:v1\.6-education-result/,'production outcomes must emit the existing session education event');
assert.match(roadmap,/### P0-A — Production Recall/,'v1.8 roadmap must retain the P0-A production milestone');
assert.doesNotMatch(roadmap,/Production Recall[^\n]*gated/i,'v1.8 roadmap must not describe Production Recall as gated');
console.log('Kanji 5 v1.8 Production recall contract passed.');
