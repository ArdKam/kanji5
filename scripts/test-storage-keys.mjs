import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry=fs.readFileSync('storage-keys.js','utf8');
assert.match(registry,/window\\.__KANJI5_STORAGE_KEYS__/);
for (const pair of [
  ['state','kanji5-v1'],
  ['cards','kanji5-v1-cards'],
  ['reviews','kanji5-v1-reviews'],
  ['knowledge','kanji5-v1.2-knowledge'],
  ['components','kanji5-v1.5-components'],
  ['sessionHistory','kanji5-v1.6-session-history'],
  ['deck','kanji5-deck'],
  ['deckVersion','kanji5-deck-version']
]) {
  assert.ok(registry.includes(pair[0]+":'"+pair[1]+"'"), 'Registry missing '+pair[0]);
}

for (const path of ['v1.5-state.js','review-runtime.js','supabase-sync.js','app-bootstrap.js','v1.3-p0.js']) {
  const source=fs.readFileSync(path,'utf8');
  assert.match(source,/window\\.__KANJI5_STORAGE_KEYS__/,path+' must consume the centralized storage key registry');
}

for (const literal of ['kanji5-v1','kanji5-v1-cards','kanji5-v1-reviews','kanji5-deck','kanji5-deck-version']) {
  for (const path of ['v1.5-state.js','review-runtime.js','supabase-sync.js','app-bootstrap.js','v1.3-p0.js']) {
    const source=fs.readFileSync(path,'utf8');
    assert.equal(source.includes("'"+literal+"'"),false,path+' must not redeclare '+literal);
    assert.equal(source.includes('"'+literal+'"'),false,path+' must not redeclare '+literal);
  }
}

const state=fs.readFileSync('v1.5-state.js','utf8');
assert.match(state,/function save/);
console.log('Storage key single-source contract: PASS');
