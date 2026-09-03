import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const p0 = read('v1.5-p0.js');
const sw = read('sw.js');
const recallCore = read('v1.5-recall-core.js');
const has = (text, regex) => regex.test(text);
const assert = (x, m) => { if (!x) throw new Error(m); };

const enhanceRecallMatch=p0.match(/function enhanceRecall\(\)\{([\s\S]*?)\n\}/);
assert(enhanceRecallMatch,'Active Recall focus enhancer is missing');
const enhanceRecallBody=enhanceRecallMatch[1];
assert(enhanceRecallBody.includes('gate.dataset.v15Focus=focus.raw'),'Focused component must remain available internally for grading');
assert(!enhanceRecallBody.includes('معنی هدف:'),'Active Recall focus must not expose the target meaning');
assert(!enhanceRecallBody.includes('خوانش هدف:'),'Active Recall focus must not expose the target reading');
assert(p0.includes('function setRecallPrompt(gate,mode)'), 'Recall prompt setter is missing');
assert(p0.includes('حداقل یک خوانش این کانجی را از حافظه به یاد بیاور') || p0.includes('معنی این کانجی را از حافظه به یاد بیاور') || p0.includes('پاسخ خودت را وارد کن'), 'Recall prompt must require active retrieval/input');
assert(p0.includes('v15Focus'),'Active Recall must retain an internal target for grading');

assert(!p0.includes('installTatoebaFetchDeduper'), 'P0 must not own global Tatoeba request deduplication');
assert(!p0.includes('installVocabularyExampleFilter'), 'P0 must not own global vocabulary response filtering');
assert(sw.includes('const API_INFLIGHT=new Map()'),'Service worker must own example request coalescing');
assert(sw.includes('API_INFLIGHT.get(key)'),'Duplicate concurrent requests must reuse the same in-flight promise');
assert(sw.includes('async function filterVocabularyResponse'),'Vocabulary response filtering must stay in the network boundary');
assert(sw.includes('response.clone()') || sw.includes('await request).clone()'),'Each consumer must receive its own readable Response body');

assert(p0.includes('function installAccessibilityEnhancements()'),'Accessibility enhancement installer is missing');
assert(p0.includes('button:focus-visible,input:focus-visible'),'Keyboard focus visibility is missing');
assert(has(recallCore,/stats\.score\s*=\s*Number\(stats\.score\s*\|\|\s*0\)\s*\+\s*0\.25/),'Unknown recall must carry a smaller educational weight');

console.log('Kanji 5 v1.5 Active Recall + network-boundary + accessibility checks passed.');
