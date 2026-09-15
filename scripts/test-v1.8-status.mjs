import assert from 'node:assert/strict';
import fs from 'node:fs';
const status=fs.readFileSync('V1.8-STATUS.md','utf8');
assert.match(status,/P0-A Production Recall: complete/);
assert.match(status,/P0-B Vocabulary Recall: complete/);
assert.match(status,/P0-C Context Recall: complete/);
assert.match(status,/P1 Adaptive Recall 2\.0: not yet implemented/);
console.log('Kanji 5 v1.8 status contract passed.');
