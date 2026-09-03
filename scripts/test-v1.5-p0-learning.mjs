import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(p, 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };
const has = (source, pattern) => pattern instanceof RegExp ? pattern.test(source) : source.includes(pattern);

const index = read('index.html');
const runtime = read('v1.2-runtime-fixes.js');
const v12 = read('v1.2-enhancements.js');
const p0 = read('v1.5-p0.js');
const recallCore = read('v1.5-recall-core.js');
const ui = read('v1.4-education-ui.js');
const sw = read('sw.js');
const coreSource = read('v1.4-education-core.js');

assert(index.includes('./v1.2-runtime-fixes.js'), 'Active shell runtime is missing');
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
assert(p0.includes('const COMPONENT_KEY=\'kanji5-v1.5-components\''), 'Component-level knowledge store missing');
assert(p0.includes('getFocusComponent') && p0.includes('recordFocusedRecall'), 'Component-level focus/recording logic missing');
assert(has(p0,/button\.id\s*=\s*["']v15DontKnowRecall["']/), 'Active Recall “don’t know” control is missing');
assert(p0.includes("recordFocusedRecall(character,mode,focus,'unknown')"), 'Active Recall “don’t know” must record an educational unknown outcome');
assert(p0.includes("await import('./v1.5-recall-core.js')"), 'P0 must delegate pure recall behavior to the dedicated core');
assert(has(recallCore,/score\s*=\s*Number\(stats\.score\)\s*\+\s*0\.25/), 'Unknown recall must carry a smaller educational weight than a correct recall');
assert(!has(p0,/v15DontKnowReview/), 'Review “don’t know” must not be added');
assert(!has(p0,/\.rate\.again/), 'Active Recall “don’t know” must not directly trigger FSRS Again');
assert(ui.includes("else if(edu.mode==='production'){prompt='برای معنی زیر، کانجی مناسب را انتخاب کن.';"), 'Production must use a selection prompt');
assert(ui.includes('${renderChoices(chooseChoices(item))}'), 'Production must render canonical four-choice options');
assert(ui.includes("edu.mode==='vocabulary'||edu.mode==='context'||edu.mode==='production"), 'Production must not render a text-submit control');
assert(!ui.includes('v14EduProductionInput'), 'Direct Kanji typing input must be removed from the canonical education UI');
assert(!p0.includes('function getProductionTarget'), 'Production target inference should not live in the P0 overlay');
assert(!p0.includes('function enhanceProduction'), 'Production rendering should not live in the P0 overlay');
assert(!p0.includes('data-v15Production'), 'Production choice handling should use the canonical education UI');
assert(!p0.includes('برای معنی زیر، کانجی مناسب را انتخاب کن.'), 'P0 must not duplicate the Production renderer');
assert(!p0.includes('observer.observe(document.body'), 'P0 must not observe the entire document body');
assert(!p0.includes('||document.body'), 'P0 observer must not fall back to the document body');
assert(p0.includes('function startTargetedObservers()')&&p0.includes('studyRoot'),'P0 must use a targeted study observer');
assert(p0.includes("const mode=String(gate.textContent||'').includes('خوانش')?'reading':'meaning',focus=getFocusComponent(character,mode);if(!focus)return;gate.dataset.v15Ready=character;"), 'Recall enhancement must remain retryable until a focus component is available');
assert(runtime.includes('loading.classList.add("v13-real-error")'), 'Startup errors must opt into the visible error-panel CSS override');

assert(v12.includes('gradeMeaningCanonical'), 'Legacy active-recall layer is not delegated to the canonical grader');
assert(!v12.includes('answer.includes(canonical)'), 'Substring meaning grading is still present in v1.2-enhancements.js');
assert(!v12.includes('canonical.includes(answer)'), 'Reverse substring meaning grading is still present in v1.2-enhancements.js');

const sandbox = { window: {}, console, structuredClone };
vm.runInNewContext(coreSource, sandbox, { filename: 'v1.4-education-core.js' });
const core = sandbox.window.__KANJI5_EDU_CORE__;
assert(core, 'Education core did not initialize');

let result = core.gradeMeaning('tree', ['tree']);
assert(result.correct && result.quality === 'exact', 'Exact meaning must be correct');
result = core.gradeMeaning('a', ['tree']);
assert(!result.correct, 'Single-letter substring must not be accepted as a meaning');
result = core.gradeMeaning('', ['tree']);
assert(!result.correct && result.quality === 'empty', 'Empty meaning must be incorrect');
result = core.gradeMeaning('large tree', ['large tree']);
assert(result.correct, 'Multi-token exact meaning must be correct');

result = core.gradeReading('shi', ['し']);
assert(result.correct, 'Romaji reading must match kana');
result = core.gradeReading('し', ['shi']);
assert(result.correct, 'Kana reading must match romaji');
result = core.gradeReading('si', ['し']);
assert(result.correct, 'Hepburn/kunrei romaji variant must match');
result = core.gradeReading('ti', ['ち']);
assert(result.correct, 'Kunrei romaji variant must match');
result = core.gradeReading('tu', ['つ']);
assert(result.correct, 'Kunrei romaji variant must match');
result = core.gradeReading('hu', ['ふ']);
assert(result.correct, 'Kunrei romaji variant must match');
result = core.gradeReading('a', ['し']);
assert(!result.correct, 'Unrelated short reading must be incorrect');

const target = { character: '学', meaning: ['study'], on: ['がく'], kun: ['まなぶ'], strokes: 8, grade: 2 };
const pool = [
  target,
  { character: '校', meaning: ['school'], on: ['こう'], kun: [], strokes: 10, grade: 2 },
  { character: '生', meaning: ['life'], on: ['せい'], kun: ['いきる'], strokes: 5, grade: 2 },
  { character: '習', meaning: ['learn'], on: ['しゅう'], kun: ['ならう'], strokes: 11, grade: 3 },
  { character: '先', meaning: ['previous'], on: ['せん'], kun: ['さき'], strokes: 6, grade: 1 },
  { character: '大', meaning: ['big'], on: ['だい'], kun: ['おおきい'], strokes: 3, grade: 1 }
];
const distractors = core.chooseDistractors(target, pool, {}, 3);
assert(distractors.length === 3, 'chooseDistractors must return the requested number');
assert(new Set(distractors.map(x => x.character)).size === 3, 'Distractors must be unique');
assert(!distractors.some(x => x.character === target.character), 'Target cannot be a distractor');

console.log('Kanji 5 v1.5 learning + P0 structural checks passed.');
