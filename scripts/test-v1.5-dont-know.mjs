import fs from 'node:fs';

const p0 = fs.readFileSync('v1.5-p0.js', 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };

assert(p0.includes('v15DontKnowRecall'), 'Active Recall “don’t know” control is missing');
assert(p0.includes('.v12-recall-gate'), 'Active Recall gate integration is missing');
assert(p0.includes('reveal'), 'Don’t know must reveal the answer');
assert(!p0.includes('v15DontKnowReview'), '“Don’t know” must not be a review-rating control');
assert(!p0.includes('.rate.again'), 'Active Recall “don’t know” must not directly trigger FSRS Again');

console.log('Kanji 5 v1.5 Active Recall “don’t know” checks passed.');
