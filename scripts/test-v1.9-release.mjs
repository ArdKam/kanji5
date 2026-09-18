import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const pkg=JSON.parse(read('package.json'));
const roadmap=read('V1.9-ROADMAP.md');
const readme=read('README.md');
const changelog=read('CHANGELOG.md');
const architecture=read('ARCHITECTURE.md');
const sw=read('sw.js');
const workflow=read('.github/workflows/build-v1.8.yml');
const index=read('index.html');
const learnerRuntime=read('v1.9-learner-model.js');

assert.equal(pkg.version,'1.9.0');
assert.match(pkg.scripts?.test??'',/scripts\/test-all\.mjs/);
assert.match(pkg.scripts?.['test:v1.9:release']??'',/test-v1\.9-release\.mjs/);

for(const stage of ['P0','P1','P2','P3','P4','P5','P6','P7']) {
  assert.match(roadmap,new RegExp('^## '+stage+' — .*✅$','m'));
}
assert.match(readme,/## v1\.9 — Learning Engine/);
assert.match(readme,/\*\*v1\.9\.0 — implementation P0 through P7 is complete on `main`\.\*\*/);
assert.match(changelog,/## \[1\.9\.0\] — 2026-09-18/);
assert.match(architecture,/## V2 presentation contracts/);
assert.match(architecture,/v1\.9-v2-contract-core\.js/);
assert.match(architecture,/v1\.9-v2-boundary\.js/);
assert.match(sw,/const CACHE='kanji5-shell-v77'/);
for(const file of [
  'v1.9-outcome-core.js','v1.9-learner-model-core.js','v1.9-learner-model.js',
  'v1.9-adaptive-planner-core.js','v1.9-adaptive-planner.js',
  'v1.9-recovery-core.js','v1.9-recovery.js','v1.9-recovery-ui.js',
  'v1.9-learning-evaluation-core.js','v1.9-learning-evaluation.js',
  'v1.9-data-quality-core.js','v1.9-data-integrity-core.js',
  'v1.9-v2-contract-core.js','v1.9-v2-boundary.js'
]) assert.ok(fs.existsSync(file),'required v1.9 runtime file missing: '+file);
for(const spec of [
  'e2e/v1.9-p0-outcome.spec.mjs','e2e/v1.9-p1-learner-model.spec.mjs',
  'e2e/v1.9-p2-adaptive-planner.spec.mjs','e2e/v1.9-p3-recovery.spec.mjs',
  'e2e/v1.9-p4-learning-evaluation.spec.mjs','e2e/v1.9-p5-data-offline.spec.mjs',
  'e2e/v1.9-p6-v2-boundary.spec.mjs'
]) assert.ok(fs.existsSync(spec),'required v1.9 browser spec missing: '+spec);
assert.match(workflow,/name: Build Kanji 5 v1\.8\/v1\.9/);
assert.match(workflow,/scripts\/test-v1\.9-release\.mjs/);
assert.match(workflow,/e2e\/v1\.9-p6-v2-boundary\.spec\.mjs/);
assert.match(workflow,/workflow_dispatch:/);
assert.ok(index.includes('./v1.9-v2-boundary.js')||learnerRuntime.includes("import('./v1.9-v2-boundary.js')"),'v2 boundary must be wired into the runtime');
console.log('Kanji 5 v1.9 release contract passed.');
