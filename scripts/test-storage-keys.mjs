import assert from 'node:assert/strict';
import fs from 'node:fs';
const state=fs.readFileSync('v1.5-state.js','utf8');
assert.match(state,/STORAGE='kanji5-v1'/);
assert.match(state,/DECK_KEY='kanji5-deck'/);
assert.match(state,/function save/);
console.log('Storage key single-source contract: PASS');