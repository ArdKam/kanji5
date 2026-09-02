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

const revealIndex=p0.indexOf('function revealAfterUnknown(gate)');
const revealBody=p0.slice(revealIndex,p0.indexOf('function addDontKnowRecall',revealIndex));
assert(revealBody.includes("answer.classList.add('show')"),'Reveal helper must show the answer content');
assert(revealBody.includes("answerBox.classList.add('show')"),'Reveal helper must show the complete answer box');
assert(revealBody.includes("ratings.style.display='grid'"),'Reveal helper must restore rating controls');
assert(revealBody.includes("ratings.classList.add('show')"),'Reveal helper must restore rating visibility');
assert(revealBody.includes('gate.remove()'),'Reveal helper must remove the recall gate');

console.log('Kanji 5 v1.5 Active Recall reveal checks passed.');
