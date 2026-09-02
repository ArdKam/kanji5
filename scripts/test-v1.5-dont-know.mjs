import fs from 'node:fs';

const p0 = fs.readFileSync('v1.5-p0.js', 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };
const has = (text, re) => re.test(text);

assert(p0.includes('v15DontKnowRecall'), 'Active Recall “don’t know” control is missing');
assert(p0.includes('.v12-recall-gate'), 'Active Recall gate integration is missing');
assert(p0.includes('function revealAfterUnknown(gate)'), 'Unknown recall reveal helper is missing');
assert(has(p0,/answer\.classList\.add\(\s*["']show["']\s*\)/), 'Unknown recall must reveal the answer');
assert(has(p0,/answerBox\.classList\.add\(\s*["']show["']\s*\)/), 'Unknown recall must reveal the answer box');
assert(has(p0,/ratings\.classList\.add\(\s*["']show["']\s*\)/), 'Unknown recall must return to the normal review-rating state');
assert(p0.includes("recordFocusedRecall(character,mode,focus,'unknown')"), 'Unknown recall must record an educational outcome');
assert(has(p0,/stats\.score\+=\s*(?:\.25|0\.25)/), 'Unknown recall must have a weaker educational weight than a correct recall');
assert(!p0.includes('v15DontKnowReview'), '“Don’t know” must not be a review-rating control');
assert(!p0.includes('.rate.again'), 'Active Recall “don’t know” must not directly trigger FSRS Again');

const recordRecallMatch=p0.match(/function recordRecall\(event\)\{([\s\S]*?)\}\nfunction revealAfterUnknown/);
assert(recordRecallMatch,'Normal Active Recall submission handler is missing');
const recordRecallBody=recordRecallMatch[1];
assert(recordRecallBody.includes("const correct=gradeFocusedRecall(mode,answer,{raw:focus})"),'Normal recall must grade the submitted answer');
assert(recordRecallBody.includes("recordFocusedRecall(character,mode,focus,correct?'correct':'wrong')"),'Normal recall outcome must be recorded');
assert(recordRecallBody.includes("result.className=correct?'v12-recall-result good':'v12-recall-result bad'"),'Normal recall must show a visible correct/incorrect result');
assert(recordRecallBody.includes('revealAfterUnknown(gate)'), 'Normal recall submission must reveal the underlying Kanji answer and rating controls');

const enhanceRecallMatch=p0.match(/function enhanceRecall\(\)\{([\s\S]*?)\}\nfunction recordRecall/);
assert(enhanceRecallMatch,'Active Recall focus enhancer is missing');
const enhanceRecallBody=enhanceRecallMatch[1];
assert(enhanceRecallBody.includes('gate.dataset.v15Focus=focus.raw'),'Focused component must remain available internally for grading');
assert(!enhanceRecallBody.includes('معنی هدف:'),'Active Recall prompt must not expose the target meaning');
assert(!enhanceRecallBody.includes('خوانش هدف:'),'Active Recall prompt must not expose the target reading');
assert(enhanceRecallBody.includes('معنی این کانجی را از حافظه به یاد بیاور'),'Meaning recall prompt must require genuine retrieval');
assert(enhanceRecallBody.includes('حداقل یک خوانش این کانجی را از حافظه به یاد بیاور'),'Reading recall prompt must require genuine retrieval');

assert(p0.includes('function installTatoebaFetchDeduper()'),'Example request deduper is missing');
assert(p0.includes('window.__KANJI5_V15_TATOEBA_DEDUP__'),'Example request deduper must be installed at most once');
assert(p0.includes("url.startsWith('https://api.tatoeba.org/v1/sentences')"),'Deduper must be scoped to the Tatoeba sentence endpoint');
assert(p0.includes('const pending=inflight.get(url)'),'Duplicate concurrent requests must reuse the same in-flight promise');
assert(p0.includes('response.clone()'),'Each consumer must receive its own readable Response body');

assert(p0.includes('function installAccessibilityEnhancements()'),'Accessibility enhancement installer is missing');
assert(p0.includes('button:focus-visible,input:focus-visible'),'Keyboard focus visibility is missing');
assert(p0.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion support is missing');
assert(p0.includes('function syncEducationBusyState()'),'Education busy-state helper is missing');
assert(p0.includes("setAttribute('aria-busy',busy?'true':'false')"),'Education panel must expose async busy state');
assert(p0.includes("empty.setAttribute('role','status')"),'Education loading message must be announced as status');
assert(p0.includes('function guardBusyEducationClicks(event)'),'Education busy-click guard is missing');
assert(p0.includes("root.getAttribute('aria-busy')!=='true'"),'Busy-click guard must only block controls while the education panel is loading');
assert(p0.includes("event.stopImmediatePropagation()"),'Busy-click guard must prevent duplicate handlers from running');
assert(p0.includes("document.addEventListener('click',guardBusyEducationClicks,true)"),'Busy-click guard must run during event capture');

const revealIndex=p0.indexOf('function revealAfterUnknown(gate)');
const revealBody=p0.slice(revealIndex,p0.indexOf('function addDontKnowRecall',revealIndex));
assert(revealBody.includes("answer.classList.add('show')"),'Reveal helper must show the answer content');
assert(revealBody.includes("answerBox.classList.add('show')"),'Reveal helper must show the complete answer box');
assert(revealBody.includes("ratings.style.display='grid'"),'Reveal helper must restore rating controls');
assert(revealBody.includes("ratings.classList.add('show')"),'Reveal helper must restore rating visibility');
assert(revealBody.includes("ratings.querySelector('button')?.focus()"),'Reveal must return keyboard focus to the rating controls');
assert(revealBody.includes('gate.remove()'),'Reveal helper must remove the recall gate');

console.log('Kanji 5 v1.5 Active Recall + anti-leak + request dedupe + accessibility + busy-state checks passed.');
