import fs from 'node:fs';
import assert from 'node:assert/strict';

const src=fs.readFileSync('v1.6-session-analytics.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const wf=fs.readFileSync('.github/workflows/build-v1.5.yml','utf8');

assert.match(src,/__KANJI5_V16_SESSION_ANALYTICS__/);
assert.match(src,/readSessionHistory/);
assert.match(src,/slice\(-7\)/);
assert.match(src,/modeResults/);
assert.match(src,/accuracy/);
assert.match(src,/signedPct/);
assert.match(src,/v16SessionAnalytics/);
assert.match(src,/قوی‌ترین/);
assert.match(src,/نیازمند توجه/);
assert.match(sw,/v1\.6-session-analytics\.js/);
assert.match(wf,/test-v1\.6-session-analytics\.mjs/);
assert.match(wf,/v1\.6-session-analytics\.js/);
console.log('v1.6 session analytics contract: OK');