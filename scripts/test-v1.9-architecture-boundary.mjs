import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const pure=['v1.9-outcome-core.js','v1.9-learner-model-core.js','v1.9-adaptive-planner-core.js','v1.9-recovery-core.js','v1.9-learning-evaluation-core.js','v1.9-data-quality-core.js','v1.9-data-integrity-core.js','v1.9-v2-contract-core.js'];
for(const file of pure){const s=read(file);assert.doesNotMatch(s,/document\.|window\.|localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\./,`${file} must remain browser-free`)}
const boundary=read('v1.9-v2-boundary.js');
assert.match(boundary,/__KANJI5_V19_V2_BOUNDARY__/);assert.match(boundary,/setExercise/);assert.match(boundary,/setFeedback/);assert.match(boundary,/setAdaptiveReason/);assert.match(boundary,/kanji5:v1.9-v2-view-models/);
const learner=read('v1.9-learner-model.js');assert.match(learner,/v1\.9-v2-boundary\.js/);
const planner=read('v1.9-adaptive-planner.js');assert.match(planner,/__KANJI5_V16_SESSION_AUTH__/);assert.match(planner,/consumeMode/);assert.match(planner,/nextMode/);
const recovery=read('v1.9-recovery.js');assert.match(recovery,/v1\.9-feedback/);
const evaluation=read('v1.9-learning-evaluation.js');assert.match(evaluation,/readSessionHistory/);assert.match(evaluation,/structuredClone/);
assert.doesNotMatch(read('v1.9-adaptive-planner-core.js'),/localStorage|sessionStorage|document|window|fetch\(/);
assert.doesNotMatch(read('v1.9-learning-evaluation-core.js'),/localStorage|sessionStorage|document|window|fetch\(/);
assert.doesNotMatch(read('v1.9-v2-contract-core.js'),/localStorage|sessionStorage|document|window|fetch\(/);
console.log('Kanji 5 v1.9 architecture/dependency boundary passed.');

const learnerCore=read('v1.9-learner-model-core.js');assert.match(learnerCore,/projectHandwritingSkill/);assert.match(learnerCore,/skills:\{handwriting/);const learnerRuntime=read('v1.9-learner-model.js');assert.match(learnerRuntime,/mode:String\(detail\.mode\)/);assert.match(learnerRuntime,/evidence:sanitizeEvidence/);const reactEngine=read('frontend/src/app/engine.ts');assert.match(reactEngine,/getHandwritingSkill/);assert.match(reactEngine,/recordHandwritingGrade/);assert.doesNotMatch(reactEngine,/localStorage|sessionStorage|FSRS|adaptive-planner/);
const handwriting=read('frontend/src/app/HandwritingPractice.tsx');assert.doesNotMatch(handwriting,/from\s+["'][^"']*(?:engine|v1\.9)[^"']*["']/i);assert.doesNotMatch(handwriting,/__KANJI5_V19|FSRS|learnerModel|adaptivePlanner|recovery/i);
const dictionary=read('frontend/src/app/DictionaryPage.tsx');assert.match(dictionary,/getHandwritingSkill/);assert.match(dictionary,/recordHandwritingGrade/);console.log('Kanji 5 handwriting learner-model integration boundary passed.');
