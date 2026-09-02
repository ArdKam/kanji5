import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const runtime=read('v1.2-runtime-fixes.js');
const perf=read('v1.3-perf.js');
const bridge=read('v1.3-storage-bridge.js');
const sw=read('sw.js');
const sync=read('supabase-sync.js');
const core=read('v1.4-education-core.js');
const ui=read('v1.4-education-ui.js');
const enforcer=read('v1.5-education-choice-enforcer.js');
const build=read('scripts/build-kanji-data.mjs');

assert(runtime.includes('script.src = "./v1.5-p0.js"'),'v1.5 P0 loader missing');
assert(runtime.includes('v1.5-education-choice-enforcer.js'),'Production choice enforcer is not loaded by the active runtime');
assert(perf.includes("performance.mark(`kanji5:${name}`)"),'Performance instrumentation missing');
assert(!perf.includes('marks.app-ready'),'Invalid app-ready property access remains');
assert(bridge.includes('serializedSource')&&bridge.includes('JSON.stringify(data)'),'Serialized deck cache regression');
assert(sw.includes("const CACHE='kanji5-shell-v44'"),'Shell cache was not invalidated after the v1.5 fix');
assert(sw.includes('async function staleWhileRevalidate'),'Navigation is not stale-while-revalidate');
assert(sw.includes("if(r.mode==='navigate'){e.respondWith(staleWhileRevalidate"),'Navigation still bypasses stale-while-revalidate');
assert(sw.includes('v1.5-education-choice-enforcer.js'),'Choice enforcer is not in the offline shell');
assert(sync.includes('const localToday = String(local.today || ""), remoteToday = String(remote.today || "");'),'Daily sync merge still favors local state blindly');
assert(sync.includes('for (const mode of EDUCATION_MODES) out[mode] = mergeModeStats(l[mode], r[mode]);'),'All education modes are merged during sync');
assert(core.includes('function chooseDistractors'),'Canonical distractor selector missing');
assert(ui.includes("prompt='برای معنی زیر، کانجی مناسب را خودت بنویس.'"),'v1.4 Production source contract missing for the enforcer');
assert(enforcer.includes("#v14EduProductionInput")&&enforcer.includes('input.type=\'hidden\''),'Production enforcer does not hide the raw Kanji input');
assert(enforcer.includes('v15-production-choice'),'Production choices are missing');
assert(!enforcer.includes('input.type=\'text\''),'Choice-only enforcer must not create text inputs');
assert(fs.existsSync('scripts/build-kanji-data.mjs'),'v1.5 source dataset build script disappeared unexpectedly');
assert(build.includes('kanji-joyo.json')&&build.includes('kanji-data.json'),'v1.5 dataset build path is invalid');
for(const file of ['v1.3-production-ui.js','v1.3-education-v2.js','v1.3-dont-know.js','v1.3-smart-distractors.js','scripts/apply-smart-distractors.mjs'])assert(!fs.existsSync(file),`Dead legacy v1.3 file remains: ${file}`);
for(const source of [runtime,perf,bridge,sw,sync,core,ui,enforcer]){try{new vm.Script(source)}catch(e){throw new Error(`Syntax error: ${e.message}`)}}
console.log('Kanji 5 v1.5/v1.3 parity test passed.');
