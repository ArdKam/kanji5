import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = path => fs.readFileSync(path, 'utf8');
const index=read('index.html'),p0=read('v1.5-p0.js'),recallCore=read('v1.5-recall-core.js'),state=read('v1.5-state.js'),sw=read('sw.js'),core=read('v1.4-education-core.js'),ui=read('v1.5-education-ui.js'),runtime=read('v1.2-runtime-fixes.js'),supabase=read('supabase-sync.js'),fsrsSync=read('v1.5-fsrs-sync-core.js'),reviewRuntime=read('review-runtime.js'),migration=read('v1.4-education-migration.js'),boundary=read('v1.9-v2-boundary.js');

const legacySources=[
  './v1.4-education-migration.js','./v1.4-education-core.js','./v1.5-p0.js',
  './v1.2-enhancements.js','./v1.2-runtime-fixes.js','./v1.9-recovery.js','./v1.5-education-ui.js'
];
assert.match(index,/<script src="\.\/v1\.5-state\.js"><\/script>/);
assert.match(index,/<script src="\.\/v1\.3-p0\.js"><\/script>/);
assert.match(index,/legacyScripts\s*=\s*\[/);
for(const src of legacySources)assert.match(index,new RegExp(src.replaceAll('.','\\.') ),`legacy loader lost ${src}`);
for(const src of legacySources)assert.doesNotMatch(index,new RegExp(`<script[^>]+src="\\${src.replaceAll('.','\\.')}"[^>]*><\\/script>`),`legacy runtime is still directly wired: ${src}`);

assert.ok(p0.includes("import('./v1.5-recall-core.js')"));
assert.ok(p0.includes('function enhanceRecall()'));
assert.ok(p0.includes('recordFocusedRecall'));
assert.ok(!p0.includes('observer.observe(document.body'));
assert.ok(!p0.includes('window.fetch='));
for(const token of ['export const RECALL_MODES','export function normalize','export function componentAccuracy','export function componentSignal','export function selectFocus','export function applyRecallOutcome'])assert.match(recallCore,new RegExp(token.replace(/[.*+?^{}()|[\\]\\]/g,'\\$&')));
assert.doesNotMatch(p0,/function normalize\(/);

for(const dependency of ['./v1.5-state.js','./v1.5-network.js','./v1.5-education-sync-core.js','./v1.5-fsrs-sync-core.js','./v1.5-sync-core.js','./v1.8-production-core.js','./v1.8-vocabulary-core.js','./v1.8-context-core.js'])assert.ok(sw.includes(`"${dependency}"`),`${dependency} missing from offline shell`);
for(const legacyOnly of ['./v1.5-p0.js','./v1.5-recall-core.js','./v1.2-enhancements.js','./v1.2-runtime-fixes.js'])assert.ok(!sw.includes(`"${legacyOnly}"`),`${legacyOnly} should not be in the default precache`);
assert.ok(!sw.includes('./v1.8-learning-ux.js'));
assert.ok(!sw.includes('./v1.9-recovery-ui.js'));
assert.ok(sw.includes("const API_ORIGIN='https://kanjiapi.dev'"));
assert.ok(sw.includes("const TATOEBA_ORIGIN='https://api.tatoeba.org'"));
assert.ok(sw.includes('async function filterVocabularyResponse'));
assert.ok(sw.includes("if(r.mode==='navigate')"));
assert.match(sw,/const CACHE='kanji5-shell-v129'/);

assert.ok(runtime.includes('loading.classList.add("v13-real-error")'));
assert.ok(reviewRuntime.includes('./vendor/ts-fsrs-5.4.1.mjs'));
assert.ok(core.includes('educationSchedulerSignal')&&core.includes('chooseDistractors'));
assert.ok(ui.includes('CORE.chooseDistractors')&&ui.includes('CORE.selectEducationItem'));
assert.ok(supabase.includes('MAX_SYNC_ATTEMPTS'));
assert.ok(fsrsSync.includes('isPreEventSnapshot')&&fsrsSync.includes('legacyRoots'));
assert.ok(!migration.includes("import('./v1.5-education-ui.js')"));
assert.ok(boundary.includes('async function ensureEducationRuntime'));
assert.ok(boundary.includes('ensureEducationRuntime'));
const documentMock={readyState:'complete',addEventListener(){},getElementById(){return null},querySelector(){return null}};
class Store{constructor(values={}){this.values={...values}}getItem(k){return Object.hasOwn(this.values,k)?this.values[k]:null}setItem(k,v){this.values[k]=String(v)}}
const mc={window:{},document:documentMock,localStorage:new Store(),Date,JSON,setTimeout,clearTimeout};vm.createContext(mc);vm.runInContext(migration,mc);assert.equal(mc.window.__KANJI5_EDU_MIGRATION_API__.version,2);
console.log('Kanji 5 startup/legacy P0 contract passed.');
