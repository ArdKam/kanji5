import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(p,'utf8');
const assert = (condition,message) => { if(!condition) throw new Error(message); };

const index = read('index.html');
const sw = read('sw.js');
const migration = read('v1.4-education-migration.js');
const workflow = read('.github/workflows/build-v1.5.yml');
const core = read('v1.4-education-core.js');
const ui = read('v1.4-education-ui.js');
const p0 = read('v1.5-p0.js');

const required = ['./v1.3-p0.js','./v1.3-perf.js','./v1.3-storage-bridge.js','./v1.3-settings.js','./v1.4-education-migration.js','./v1.4-education-core.js','./v1.4-education-ui.js'];
for (const src of required) assert((index.match(new RegExp(`<script src=\\"${src.replaceAll('.','\\.')}\\"></script>`, 'g'))||[]).length===1,`${src} must be wired exactly once`);
assert((index.match(/<script src="\.\/v1\.5-p0\.js"><\/script>/g)||[]).length===1,'v1.5 P0 runtime must be wired exactly once');
for (const legacy of ['./v1.3-p1.js','./v1.3-education-runtime-fix.js','./v1.3-production-ui.js','./v1.3-education-v2.js','./v1.3-dont-know.js','./v1.3-smart-distractors.js']) assert(!index.includes(legacy),`Legacy runtime remains: ${legacy}`);
assert(!index.includes('id="v1.2-mobile-fix"'),'Mobile CSS was not consolidated');
assert(!index.includes('id="v1.3-education"')&&!index.includes('id="v1.3-p1"'),'Legacy education CSS remains');
assert((index.match(/v1\.2-dataset-2136/g)||[]).length===1,'Duplicate dataset bootstrap remains');

class Store {
  constructor(values={}) { this.values = {...values}; }
  getItem(k){ return Object.prototype.hasOwnProperty.call(this.values,k) ? this.values[k] : null; }
  setItem(k,v){ this.values[k]=String(v); }
}
function runMigration(initial){
  const store = new Store(initial);
  const ctx = { window:{}, localStorage:store, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(migration,ctx);
  assert(ctx.window.__KANJI5_EDU_MIGRATION_API__,'Migration API missing');
  return {store,api:ctx.window.__KANJI5_EDU_MIGRATION_API__};
}
const fresh = runMigration({});
assert(fresh.api.version===1,'Fresh install migration version mismatch');
assert(JSON.parse(fresh.store.getItem('kanji5-v1.2-knowledge')||'{}')?.constructor===Object,'Fresh install store should remain valid JSON object');
assert(fresh.store.getItem('kanji5-v1.4-education-meta'),'Fresh install metadata missing');

const legacyKnowledge = {
  '学': { meaning:{attempts:4,correct:3,lastAt:'2026-08-20T00:00:00.000Z'}, reading:{attempts:2,correct:1,lastAt:'2026-08-21T00:00:00.000Z'}, distractors:{'校':2} },
  '校': {meaning:{attempts:0,correct:0}}
};
const upgraded = runMigration({'kanji5-v1.2-knowledge':JSON.stringify(legacyKnowledge)});
const migrated = JSON.parse(upgraded.store.getItem('kanji5-v1.2-knowledge'));
assert(migrated['学'].schemaVersion===1,'Upgrade did not stamp education schema');
assert(migrated['学'].exposedAt,'Upgrade did not infer exposedAt from prior attempts');
assert(migrated['学'].meaning.correct===3 && migrated['学'].meaning.attempts===4,'Upgrade changed historical meaning stats');
assert(migrated['学'].reading.correct===1 && migrated['学'].reading.attempts===2,'Upgrade changed historical reading stats');
assert(migrated['学'].distractors['校']===2,'Upgrade dropped distractor history');

assert(sw.includes("const API_ORIGIN='https://kanjiapi.dev'"),'kanjiapi origin missing from service worker');
assert(sw.includes("const TATOEBA_ORIGIN='https://api.tatoeba.org'"),'Tatoeba origin missing from service worker');
assert(sw.includes("u.origin===API_ORIGIN&&u.pathname.startsWith('/v1/words/')"),'Vocabulary API cache route missing');
assert(sw.includes("u.origin===TATOEBA_ORIGIN&&u.pathname.startsWith('/v1/sentences')"),'Context API cache route missing');
assert(sw.includes('kanji5-shell-v39')&&sw.includes('kanji5-api-v14'),'Cache versions were not bumped');
assert(sw.includes('const clone=r.clone();caches.open(CACHE).then(c=>c.put(req,clone))'),'Dynamic same-origin response is cloned before asynchronous caching');
assert(!sw.includes("fetch(r).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(r,res.clone()));return res})"),'Unsafe post-return response.clone caching pattern remains');

assert(p0.includes("const V15_P0_VERSION='1.3'"),'Canonical v1.5 P0 runtime version mismatch');
assert(p0.includes('function enhanceProduction()'),'Canonical production MCQ enhancer missing');
assert(p0.includes("submit=wrap.querySelector('#v14EduSubmit')")&&p0.includes("submit.style.display='none'"),'Production submit control remains visible');

assert(!fs.existsSync('package.json'),'Unexpected package.json dependency surface introduced');
for(const forbidden of ['npm install ','https://unpkg.com/','https://cdn.jsdelivr.net/']) assert(!index.includes(forbidden)&&!ui.includes(forbidden),`Unexpected runtime dependency: ${forbidden}`);
assert(index.includes('./vendor/ts-fsrs-5.4.1.mjs'),'Pinned local FSRS vendor missing');

assert(core.includes('educationSchedulerSignal')&&core.includes('chooseDistractors'),'Updated education core is not present');
assert(ui.includes('CORE.chooseDistractors'),'UI is not using canonical distractor selection');
assert(ui.includes('CORE.selectEducationItem'),'UI is not using adaptive Kanji selection');
assert(ui.includes('safe(edu.sentence.english||\'\')'),'Context translation escaping is not wired');
assert(workflow.includes('scripts/test-v1.5-p0.mjs')&&workflow.includes('scripts/test-v1.4-p1.mjs')&&workflow.includes('scripts/test-v1.4-education.mjs'),'Education CI gates are missing');
assert(index.includes('function educationQueuePriority'),'Education/FSRS queue bridge is missing');
assert(index.includes('educationQueuePriority(k')||index.includes('educationQueuePriority(item'),'Queue does not use education priority');
assert(index.includes('dueItems')&&index.includes('dueItems.sort'),'FSRS due cards are not being ranked with education evidence');
assert(!index.includes('scheduler.next(rec.card,now,education'),'FSRS rating path was not replaced by education heuristic');

console.log('Kanji 5 v1.5 P0 stabilization smoke suite passed.');
