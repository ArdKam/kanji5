import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const index = read('index.html');
const p0 = read('v1.5-p0.js');
const state = read('v1.5-state.js');
const recallCore = read('v1.5-recall-core.js');
const runtime = read('v1.2-runtime-fixes.js');
const sw = read('sw.js');
const ui = read('v1.4-education-ui.js');
const has = (text, regex) => regex.test(text);
const assert = (x, m) => { if (!x) throw new Error(m); };

assert((index.match(/<script src="\.\/v1\.5-p0\.js"><\/script>/g)||[]).length===1, 'Active shell must load v1.5 P0 exactly once');
assert(!runtime.includes('v1.5-p0.js'), 'v1.2 runtime bridge must not duplicate-load v1.5 P0');
assert(!runtime.includes('v1.5-education-choice-enforcer.js'), 'Obsolete Production choice enforcer remains in the active runtime');
assert(!runtime.includes('observer.observe(document.body'), 'Runtime example enrichment must not observe the entire document body');
assert(!runtime.includes('|| document.body'), 'Runtime observer must not fall back to the document body');
assert(sw.includes('"./v1.5-p0.js"'), 'v1.5 P0 runtime is not precached by the service worker');
assert(sw.includes('"./v1.5-recall-core.js"'), 'v1.5 recall core is not precached by the service worker');
assert(!sw.includes('"./v1.5-education-choice-enforcer.js"'), 'Obsolete Production choice enforcer is still precached');
assert(sw.includes('kanji5-shell-v46'), 'Runtime cache version was not bumped');
assert(sw.includes('staleWhileRevalidate'), 'Shell navigation lost stale-while-revalidate');
assert(state.includes("const DEVICE_KEY='kanji5-device-id'"), 'State persistence boundary missing device identity');
assert(state.includes("COMPONENT_KEY='kanji5-v1.5-components'"), 'Component-level knowledge store must belong to the state boundary');
assert(state.includes('function readComponents(') && state.includes('function writeComponents('), 'State boundary must own component-store access');
assert(p0.includes('getFocusComponent') && p0.includes('recordFocusedRecall'), 'Component-level focus/recording logic missing');
assert(has(p0,/button\.id\s*=\s*["']v15DontKnowRecall["']/), 'Active Recall “don’t know” control is missing');
assert(p0.includes("recordFocusedRecall(character,mode,focus,'unknown')"), 'Active Recall “don’t know” must record an educational unknown outcome');
assert(p0.includes("await import('./v1.5-recall-core.js')"), 'P0 must delegate pure recall behavior to the dedicated core');
assert(has(recallCore,/stats\.score\s*=\s*Number\(stats\.score\s*\|\|\s*0\)\s*\+\s*0\.25/), 'Unknown recall must carry a smaller educational weight than a correct recall');
assert(!has(p0,/v15DontKnowReview/), 'Review “don’t know” must not be added');
assert(!has(p0,/\.rate\.again/), 'Active Recall “don’t know” must not directly trigger FSRS Again');
assert(ui.includes("else if(edu.mode==='production'){prompt='برای معنی زیر، کانجی مناسب را انتخاب کن.';"), 'Production must use a selection prompt');
assert(ui.includes('${renderChoices(chooseChoices(item))}'), 'Production must render canonical four-choice options');
assert(ui.includes("edu.mode==='vocabulary'||edu.mode==='context'||edu.mode==='production"), 'Production must not render a text-submit control');

console.log('Kanji 5 v1.5 learning + P0 structural checks passed.');
