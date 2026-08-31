import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(p, 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };

const index = read('index.html');
const runtime = read('v1.2-runtime-fixes.js');
const p0 = read('v1.5-p0.js');
const sw = read('sw.js');
const coreSource = read('v1.4-education-core.js');

assert(index.includes('./v1.2-runtime-fixes.js'), 'Active shell runtime is missing');
assert((index.match(/<script src="\.\/v1\.5-p0\.js"><\/script>/g) || []).length === 1, 'v1.5 P0 runtime must be wired exactly once in index.html');
assert(runtime.includes('const SRC = "./v1.5-p0.js"'), 'Active shell fallback loader does not reference v1.5 P0');
assert(sw.includes('"./v1.5-p0.js"'), 'v1.5 P0 runtime is not precached by the service worker');
assert(sw.includes('kanji5-shell-v41'), 'P0 cache version was not bumped');
assert(index.includes('function jlptRank(item)'), 'JLPT ranking helper is missing from the review queue');
assert(index.includes('N5:0,N4:1,N3:2,N2:3,N1:4'), 'JLPT order must be N5 → N4 → N3 → N2 → N1');
assert(index.includes('jlptRank(a)-jlptRank(b)'), 'New-card queue is not grouped by JLPT level');
assert(index.includes('while(start<unseen.length&&jlptRank(unseen[start])===rank)'), 'New cards are not randomized within JLPT level groups');
assert(p0.includes('const COMPONENT_KEY = "kanji5-v1.5-components"'), 'Component-level knowledge store missing');
assert(p0.includes('getFocusComponent') && p0.includes('recordFocusedRecall'), 'Component-level focus/recording logic missing');
assert(p0.includes('button.id = "v15DontKnowReview"'), 'Review “don’t know” control is missing');
assert(p0.includes('const again = $(".rate.again", ratings)'), 'Review “don’t know” must map to FSRS Again behavior');
assert(p0.includes('function getProductionTarget(input)'), 'Production target resolver is missing');
assert(p0.includes('function getProductionChoices(target)'), 'Production MCQ choice generation is missing');
assert(p0.includes('function enhanceProduction()'), 'Production MCQ enhancer is missing');
assert(p0.includes('برای معنی زیر، کانجی مناسب را انتخاب کن.'), 'Production prompt was not changed to selection');
assert(p0.includes('input.type = "hidden"'), 'Production input is not hidden');
assert(p0.includes('v15-production-grid') && p0.includes('v15-production-choice'), 'Production choices are not rendered as dedicated MCQ buttons');
assert(p0.includes('button.dataset.v15Production = choice.character'), 'Production choice data binding is missing');
assert(p0.includes('input.value = button.dataset.v15Production || ""'), 'Production choice selection is not submitted to the backing field');
assert(p0.includes('input.style.display = "none"'), 'Production input remains visibly editable');
assert(p0.includes('submit.style.display = "none"'), 'Production text-submit control remains visible after MCQ conversion');
assert(p0.includes('const core = window.__KANJI5_EDU_CORE__'), 'Production MCQ must resolve the education core lazily');
assert(!p0.includes('کانجی را بنوی'), 'Canonical P0 runtime still contains a typing prompt');
assert(!p0.includes('observer.observe(document.body'), 'P0 must not observe the entire document body');

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
assert(result.correct, 'Accepted romaji variant must match');
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

console.log('Kanji 5 v1.5 P0 structural + behavioral checks passed.');
