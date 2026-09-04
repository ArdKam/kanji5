import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(path, 'utf8');
const index = read('index.html');
const p0 = read('v1.5-p0.js');
const recallCore = read('v1.5-recall-core.js');
const state = read('v1.5-state.js');
const sw = read('sw.js');
const workflow = read('.github/workflows/build-v1.5.yml');
const core = read('v1.4-education-core.js');
const ui = read('v1.5-education-ui.js');
const runtime = read('v1.2-runtime-fixes.js');
const supabase = read('supabase-sync.js');
const fsrsSync = read('v1.5-fsrs-sync-core.js');

const count = (text, needle) => text.split(needle).length - 1;

const requiredScripts = [
  './v1.3-p0.js', './v1.3-perf.js', './v1.3-storage-bridge.js', './v1.3-settings.js',
  './v1.4-education-migration.js', './v1.4-education-core.js', './v1.4-education-ui.js', './v1.5-p0.js'
];
for (const src of requiredScripts) assert.equal(count(index, `<script src="${src}"></script>`), 1, `${src} must be wired exactly once`);
assert.equal(count(index, 'id="v1.2-dataset-bootstrap"'), 1, 'dataset bootstrap must remain singular');
for (const legacy of [
  './v1.3-p1.js', './v1.3-education-runtime-fix.js', './v1.3-production-ui.js',
  './v1.3-education-v2.js', './v1.3-dont-know.js', './v1.3-smart-distractors.js',
  'v1.5-education-choice-enforcer.js'
]) assert.ok(!index.includes(legacy), `legacy runtime remains wired: ${legacy}`);

assert.ok(p0.includes("await import('./v1.5-recall-core.js')"), 'P0 must load the dedicated recall core');
assert.ok(p0.includes('window.__KANJI5_V15_P0__'), 'P0 marker missing');
assert.ok(p0.includes('function enhanceRecall()'), 'Active Recall enhancer missing');
assert.ok(p0.includes('function addDontKnowRecall()'), 'Active Recall don’t-know enhancer missing');
assert.ok(p0.includes('v15DontKnowRecall'), 'Active Recall don’t-know control missing');
assert.ok(p0.includes("recordFocusedRecall(character,mode,focus,'unknown')"), 'unknown recall must be recorded separately');
assert.ok(!p0.includes('v15DontKnowReview'), 'don’t-know must not become a review-rating control');
assert.ok(!p0.includes('.rate.again'), 'don’t-know must not directly trigger Again');
assert.ok(!p0.includes('function enhanceProduction'), 'production renderer must remain outside P0');
assert.ok(!p0.includes('getProductionTarget'), 'production target inference must remain outside P0');
assert.ok(!p0.includes('data-v15Production'), 'production state must remain outside P0');
assert.ok(!p0.includes('observer.observe(document.body'), 'P0 must not observe document.body');
assert.ok(!p0.includes('||document.body'), 'P0 observer must not fall back to document.body');
assert.ok(p0.includes('function startTargetedObservers()') && p0.includes('studyRoot'), 'P0 must use a targeted observer');
assert.ok(p0.includes('gate.dataset.v15Focus=focus.raw'), 'recall focus must remain internal');
assert.ok(!p0.includes('معنی هدف:') && !p0.includes('خوانش هدف:'), 'recall focus must not leak into the prompt');
assert.ok(!p0.includes('localStorage'), 'P0 must use the persistence boundary');
assert.ok(!p0.includes('window.fetch='), 'P0 must not monkey-patch fetch');
assert.ok(p0.includes('state.readDeck()') && p0.includes('state.readKnowledge()') && p0.includes('state.writeKnowledge('), 'P0 must use state knowledge/deck APIs');
assert.ok(p0.includes('state.readComponents()') && p0.includes('state.writeComponents('), 'P0 must use state component APIs');
assert.ok(p0.includes('state.writeLastAttempt('), 'P0 must use state last-attempt API');
assert.ok(p0.includes('function installAccessibilityEnhancements()') && p0.includes('button:focus-visible,input:focus-visible'), 'keyboard focus support missing');
assert.ok(p0.includes('@media(prefers-reduced-motion:reduce)'), 'reduced-motion support missing');
assert.ok(p0.includes('function guardBusyEducationClicks(event)'), 'busy-click guard missing');

assert.match(recallCore, /export const RECALL_MODES/);
assert.match(recallCore, /export function normalize/);
assert.match(recallCore, /export function componentAccuracy/);
assert.match(recallCore, /export function componentSignal/);
assert.match(recallCore, /export function selectFocus/);
assert.match(recallCore, /export function applyRecallOutcome/);
assert.ok(!p0.includes('function normalize('), 'normalize must not be duplicated in P0');
assert.ok(!p0.includes('function componentAccuracy('), 'componentAccuracy must not be duplicated in P0');
assert.ok(!p0.includes('function componentSignal('), 'componentSignal must not be duplicated in P0');
assert.ok(!p0.includes('function selectFocus('), 'selectFocus must not be duplicated in P0');
assert.ok(!p0.includes('function applyRecallOutcome('), 'applyRecallOutcome must not be duplicated in P0');

assert.ok(sw.includes('"./v1.5-state.js"'), 'state dependency missing from offline shell');
assert.ok(sw.includes('"./v1.5-recall-core.js"'), 'recall core missing from offline shell');
assert.ok(sw.includes('"./v1.5-p0.js"'), 'P0 missing from offline shell');
assert.ok(sw.includes('"./v1.5-education-sync-core.js"'), 'education sync dependency missing from offline shell');
assert.ok(sw.includes('"./v1.5-fsrs-sync-core.js"'), 'FSRS sync dependency missing from offline shell');
assert.ok(sw.includes("const API_ORIGIN='https://kanjiapi.dev'"));
assert.ok(sw.includes("const TATOEBA_ORIGIN='https://api.tatoeba.org'"));
assert.ok(sw.includes('const API_INFLIGHT=new Map()'), 'API request coalescer missing');
assert.ok(sw.includes('API_INFLIGHT.get(key)'), 'API request coalescer lookup missing');
assert.ok(sw.includes('async function filterVocabularyResponse'), 'vocabulary response filter moved to network boundary');
assert.ok(sw.includes('async function staleWhileRevalidate'));
assert.ok(sw.includes("if(r.mode==='navigate')"));
assert.ok(!sw.includes("fetch(r).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(r,res.clone()));return res})"));

assert.ok(runtime.includes('loading.classList.add("v13-real-error")'), 'startup error panel contract missing');
assert.ok(index.includes('./vendor/ts-fsrs-5.4.1.mjs'), 'pinned local FSRS vendor missing');
assert.ok(core.includes('educationSchedulerSignal') && core.includes('chooseDistractors'), 'canonical education core missing');
assert.ok(ui.includes('CORE.chooseDistractors') && ui.includes('CORE.selectEducationItem'), 'active education UI is not using canonical adaptive helpers');
assert.ok(ui.includes('safe(edu.sentence.english||\'\')'), 'context translation escaping missing');

const ciSelfPushPattern=/^\s*git\s+push\s+origin\b/m;
const ciRoadmapPattern=/^\s*(?:node\s+)?scripts\/v1\.5-roadmap-finalize\.mjs\b/m;
assert.ok(!ciSelfPushPattern.test(workflow), 'CI must not self-push');
assert.ok(workflow.includes('git diff --check'), 'CI must verify the checked-out build instead of mutating and pushing it');
assert.ok(!ciRoadmapPattern.test(workflow), 'CI must not invoke the roadmap mutator');
assert.ok(supabase.includes('function withSyncLock') && supabase.includes('MAX_SYNC_ATTEMPTS'), 'sync retry/lock hardening missing');
assert.ok(fsrsSync.includes('isPreEventSnapshot') && fsrsSync.includes('legacyRoots'), 'FSRS replay safety guards missing');

class Store {
  constructor(values = {}) { this.values = { ...values }; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.values, key) ? this.values[key] : null; }
  setItem(key, value) { this.values[key] = String(value); }
}

const documentMock = {
  readyState: 'complete',
  addEventListener() {},
  getElementById() { return null; },
  querySelector() { return null; }
};
const migration = read('v1.4-education-migration.js');
const migrationContext = { window: {}, document: documentMock, localStorage: new Store(), Date, JSON, setTimeout, clearTimeout };
vm.createContext(migrationContext);
vm.runInContext(migration, migrationContext);
assert.ok(migrationContext.window.__KANJI5_EDU_MIGRATION_API__, 'education migration API missing');
assert.equal(migrationContext.window.__KANJI5_EDU_MIGRATION_API__.version, 2);

const stateContext = { window: {}, document: documentMock, localStorage: new Store(), crypto: { randomUUID: () => 'test-id' }, Date, JSON, structuredClone, Intl };
vm.createContext(stateContext);
vm.runInContext(state, stateContext);
const stateApi = stateContext.window.__KANJI5_STATE__;
assert.ok(stateApi, 'state API missing');
for (const name of ['readDeck','readKnowledge','writeKnowledge','readComponents','writeComponents','writeLastAttempt','clearRuntimeKnowledge']) assert.equal(typeof stateApi[name], 'function', `${name} state boundary API missing`);
const normalized = stateApi.normalizeReviewEvent({ eventId: 'legacy', id: '学', at: '2026-09-02T10:00:00.000Z', rating: 'Good', baseRecord: { reviews: 1 } });
assert.equal(normalized.eventSchemaVersion, 1);
assert.equal(normalized.resultRecord.reviews, 1);

console.log('Kanji 5 v1.5 P0 stabilization smoke suite passed.');