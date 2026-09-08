import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const core = fs.readFileSync('v1.8-production-core.js','utf8');
const ui = fs.readFileSync('v1.5-education-ui.js','utf8');
const roadmap = fs.readFileSync('V1.7-ROADMAP.md','utf8');

const context={globalThis:{}};
vm.createContext(context);
vm.runInContext(core,context);
const api=context.globalThis.__KANJI5_V18_PRODUCTION__;
assert.ok(api,'v1.8 production core API must be exposed');
assert.deepEqual(api.gradeProduction('学','学'),{correct:true,quality:'exact',score:1});
assert.deepEqual(api.gradeProduction(' 学 ','学'),{correct:true,quality:'exact',score:1});
assert.deepEqual(api.gradeProduction('學','学'),{correct:false,quality:'wrong',score:0});
assert.deepEqual(api.gradeProduction('','学'),{correct:false,quality:'empty',score:0});
assert.match(ui,/edu\.mode==='production'/,'education UI must contain a production branch');
assert.match(ui,/v14EduProductionInput/,'production mode must use a learner input, not only choice buttons');
assert.match(ui,/v1\.8-production-core\.js/,'production submission must use the dedicated v1.8 grader');
assert.match(ui,/gradeProduction/,'education UI must call the production grader');
assert.match(ui,/edu\.mode==='production'\)\?/,'production must be included in the submit-button path');
assert.doesNotMatch(ui,/data-choice="\$\{safe\(c\.character\)\}"[^`]*production/,'production mode must not depend on choice-button markup');
assert.doesNotMatch(roadmap,/Production.*gated/i,'the v1.7 roadmap must no longer describe Production as gated');
console.log('Kanji 5 v1.8 Production recall contract passed.');
