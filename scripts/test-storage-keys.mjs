import assert from 'node:assert/strict';
import fs from 'node:fs';

const state=fs.readFileSync('v1.5-state.js','utf8');
const bridge=fs.readFileSync('v1.3-storage-bridge.js','utf8');

assert.match(state,/STORAGE='kanji5-v1'/,'Canonical app-state storage key is missing');
assert.match(state,/DECK_KEY='kanji5-deck'/,'Canonical deck storage key is missing');
assert.match(bridge,/window\.__KANJI5_STATE__/,'Storage bridge must consume the state module');
assert.match(bridge,/DECK_KEY:deckKey/,'Storage bridge must consume DECK_KEY from state');
assert.match(bridge,/STORAGE:stateKey/,'Storage bridge must consume STORAGE from state');
assert.equal((bridge.match(/kanji5-deck/g)||[]).length,0,'Storage bridge must not duplicate the deck key literal');
assert.equal((bridge.match(/kanji5-v1(?![-.])/g)||[]).length,0,'Storage bridge must not duplicate the app-state key literal');
console.log('Storage key single-source contract: PASS');
