import assert from 'node:assert/strict';
import fs from 'node:fs';

const learner=fs.readFileSync('v1.9-learner-model.js','utf8');
const planner=fs.readFileSync('v1.9-adaptive-planner.js','utf8');
const feedback=fs.readFileSync('v1.6-session-feedback.js','utf8');

const runtimeModules=[
  'v1.9-adaptive-planner.js',
  'v1.9-recovery.js',
  'v1.9-learning-evaluation.js',
  'v1.9-v2-boundary.js',
];
for(const module of runtimeModules){
  const escaped=module.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  assert.match(
    learner,
    new RegExp(`void import\\(['"]\\./${escaped}['"]\\)\\.catch\\(error\\s*=>\\s*reportModuleLoadFailure\\(['"]\\./${escaped}['"],error\\)\\)`),
    `${module} load failure must be reported, not swallowed`
  );
}
assert.match(learner,/function reportModuleLoadFailure\(module,error\)/);
assert.match(learner,/capture\('dynamic-import-failure',error,\{module,dataAffected:'unknown'\}\)/);
assert.match(learner,/console\.error\('Rinemi module failed to load\.'/);
assert.doesNotMatch(learner,/import\(['"]\.\/v1\.9-[^'"]+['"]\)\.catch\(\(\)=>\{\}\)/);

// The planner is loaded before education/session feedback is necessarily ready.
// It must park on the readiness event rather than spin with zero-delay timers.
assert.match(planner,/document\.addEventListener\('kanji5:v1\.6-session-auth-ready'/);
assert.doesNotMatch(planner,/if\(!auth\)\{setTimeout\(install,0\);return\}/);
assert.match(feedback,/window\.__KANJI5_V16_SESSION_AUTH__=Object\.freeze/);
assert.match(feedback,/document\.dispatchEvent\(new CustomEvent\('kanji5:v1\.6-session-auth-ready'\)\)/);
console.log('Rinemi learner runtime import observability and event-driven planner initialization passed.');
