import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(p, 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };
const has = (source, pattern) => pattern instanceof RegExp ? pattern.test(source) : source.includes(pattern);

const index = read('index.html');
const runtime = read('v1.2-runtime-fixes.js');
const v12 = read('v1.2-enhancements.js');
const p0 = read('v1.5-p0.js');
const sw = read('sw.js');
const coreSource = read('v1.4-education-core.js');

assert(index.includes('./v1.2-runtime-fixes.js'), 'Active shell runtime is missing');
assert(runtime.includes('script.src = "./v1.5-p0.js"'), 'Active runtime bridge must load v1.5 P0');
assert(runtime.includes('data-kanji5-v15-p0="1"'), 'P0 loader marker is missing');
assert(!runtime.includes('observer.observe(document.body'), 'Runtime example enrichment must not observe the entire document body');
assert(!runtime.includes('|| document.body'), 'Runtime observer must not fall back to the document body');
assert(sw.includes('"./v1.5-p0.js"'), 'v1.5 P0 runtime is not precached by the service worker');
assert(sw.includes('kanji5-shell-v42'), 'Runtime cache version was not bumped');
assert(p0.includes('const COMPONENT_KEY = "kanji5-v1.5-components"'), 'Component-level knowledge store missing');
assert(p0.includes('getFocusComponent') && p0.includes('recordFocusedRecall'), 'Component-level focus/recording logic missing');
assert(has(p0,/button\.id\s*=\s*["']v15DontKnowRecall["']/), 'Active Recall “don’t know” control is missing');
assert(p0.includes("recordFocusedRecall(character,mode,focus,'unknown')"), 'Active Recall “don’t know” must record an educational unknown outcome');
assert(p0.includes('stats.score+=.25'), 'Unknown recall must carry a smaller educational weight than a correct recall');
assert(!has(p0,/v15DontKnowReview/), 'Review “don’t know” must not be added');
assert(!has(p0,/\.rate\.again/), 'Active Recall “don’t know” must not directly trigger FSRS Again');
assert(p0.includes('function getProductionTarget(input)'), 'Production target resolver is missing');
assert(p0.includes('function getProductionChoices(target)'), 'Production MCQ choice generation is missing');
assert(p0.includes('function enhanceProduction()'), 'Production MCQ enhancer is missing');
assert(p0.includes('برای معنی زیر، کانجی مناسب را انتخاب کن.'), 'Production prompt was not changed to selection');
assert(p0.includes('input.type="hidden"'), 'Production input is not hidden');
assert(p0.includes('v15-production-grid') && p0.includes('v15-production-choice'), 'Production choices are not rendered as dedicated MCQ buttons');
assert(has(p0,/dataset\.v15Production=choice\.character/), 'Production choice data binding is missing');
assert(has(p0,/input\.value=button\.dataset\.v15Production/), 'Production choice selection is not submitted to the backing field');
assert(has(p0,/input\.style\.display='none'/), 'Production input remains visibly editable');
assert(has(p0,/submit\.style\.display='none'/), 'Production text-submit control remains visible after MCQ conversion');
assert(p0.includes('const core=window.__KANJI5_EDU_CORE__'), 'Production MCQ must resolve the education core lazily');
assert(!p0.includes('کانجی را بنوی'), 'Canonical P0 runtime still contains a typing prompt');
assert(!p0.includes('observer.observe(document.body'), 'P0 must not observe the entire document body');
assert(!p0.includes('||document.body'), 'P0 observer must not fall back to the document body');

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
