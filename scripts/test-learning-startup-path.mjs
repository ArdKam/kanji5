import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../frontend/src/app/App.tsx',import.meta.url),'utf8');
const session=await readFile(new URL('../v1.6-session.js',import.meta.url),'utf8');
const review=await readFile(new URL('../review-runtime.js',import.meta.url),'utf8');
const boundary=await readFile(new URL('../v1.9-v2-boundary.js',import.meta.url),'utf8');
const engine=await readFile(new URL('../frontend/src/app/engine.ts',import.meta.url),'utf8');
const p0=await readFile(new URL('../v1.3-p0.js',import.meta.url),'utf8');
const learner=await readFile(new URL('../v1.9-learner-model.js',import.meta.url),'utf8');

const mustContain=(source,value,label)=>assert.ok(source.includes(value),label);

for (const name of ['DictionaryPage','StatsDialog','SettingsDialog','PracticeHome','GrammarDialog','ReadingLabDialog','MnemonicsDialog','HandwritingPractice']) {
  assert.match(app,new RegExp('const '+name+' = lazy\\('),`Non-learning surface ${name} must be deferred off the startup renderer bundle`);
  assert.doesNotMatch(app,new RegExp('import \\{ '+name+' \\} from'),`Non-learning surface ${name} must not be statically imported`);
}


mustContain(session,'let planPromise=null;const loadPlanApi=','Session plan import must be lazy');
assert.doesNotMatch(session,/const planPromise=import\('\.\/v1\.6-session-core\.js'\)/);
mustContain(session,'function start(){if(!IS_LEGACY)return;','Legacy dashboard startup must not run in modern mode');
mustContain(session,'void loadPlanApi()','Session plan API remains available on explicit use');

mustContain(p0,"const prefetchFsrs=()=>{if(!window.__KANJI5_P0_FSRS_PROMISE)","P0 must retain the shared FSRS compatibility path");
mustContain(review,"const shared=window.__KANJI5_P0_FSRS_PROMISE;","Review runtime must consume the shared FSRS promise when present");
mustContain(review,"const loadPromise=shared?shared.then(mod=>","Review runtime must preserve the shared promise as the preferred FSRS load path");
mustContain(review,"let modernStartupReady=false;","Modern review runtime must start with full-snapshot notifications gated");
mustContain(review,"function notifyV2Learning(){if(!IS_LEGACY&&!modernStartupReady)return;","Pre-ready Learning refreshes must be suppressed");
mustContain(review,"buildQueue();next();modernStartupReady=true;document.dispatchEvent(new CustomEvent('kanji5:v1.9-review-ready'))","Review runtime must signal readiness only after queue initialization");
mustContain(boundary,'async function startupSnapshot(){','Boundary must expose a Learning-first snapshot path');
mustContain(boundary,'async function publishStartupSnapshot(){','Boundary must publish a startup snapshot');
mustContain(boundary,"document.addEventListener('kanji5:v1.9-review-ready',()=>{void publishStartupSnapshot()},{once:true})","Startup snapshot waits for actual review readiness");
assert.doesNotMatch(boundary,/setTimeout\(\(\)=>\{void refreshLearning\(\)\},100\)/);
assert.doesNotMatch(boundary,/setTimeout\(\(\)=>\{void refreshLearning\(\)\},500\)/);
mustContain(boundary,'startupSnapshot,refreshLearning','Startup snapshot must cross the public boundary');

mustContain(engine,'startupSnapshot: () => Promise<Snapshot>','Boundary type must declare startupSnapshot');
mustContain(engine,'export async function startupSnapshot(): Promise<Snapshot>','Engine adapter must expose startupSnapshot');
mustContain(p0,"if(isLegacy)prefetchFsrs();","Legacy mode keeps the eager FSRS path");
mustContain(p0,"window.requestIdleCallback(prefetchFsrs,{timeout:2500})","Modern mode defers FSRS prefetch");
mustContain(learner,"window.requestIdleCallback(scheduleLearnerHydration,{timeout:2200})","Modern mode defers learner-model hydration");
assert.doesNotMatch(learner,/void updateCore\(\);\s*document\.addEventListener/);

console.log('Learning startup path contract: PASS');
