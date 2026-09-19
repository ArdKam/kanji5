import assert from 'node:assert/strict';
import fs from 'node:fs';

const ux=fs.readFileSync('v1.8-learning-ux.js','utf8');
const feedback=fs.readFileSync('v1.6-session-feedback.js','utf8');
const session=fs.readFileSync('v1.6-session.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.match(ux,/v18AdaptiveReason/);
assert.match(ux,/v18EnterHint/);
assert.match(ux,/نمی‌دانم/);
assert.doesNotMatch(feedback,/v1\.8-learning-ux\.js/);
assert.match(session,/import\('\.\/v1\.8-learning-ux\.js'\)/);
assert.match(sw,/v1\.8-learning-ux\.js/);
assert.match(sw,/kanji5-shell-v\d+/);
console.log('Kanji 5 v1.8 Learning UX runtime contract passed.');