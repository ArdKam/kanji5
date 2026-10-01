import assert from 'node:assert/strict';
import fs from 'node:fs';

const registry=fs.readFileSync('v1.5-state.js','utf8');
const index=fs.readFileSync('index.html','utf8');
assert.match(registry,/window\.__KANJI5_STORAGE_KEYS__/);
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
  assert.match(source,/window\.__KANJI5_STORAGE_KEYS__/,path+' must consume the centralized storage key registry');
}

const declarationPatterns=[
  /const STORAGE(?:_KEY)?\s*=\s*['"]kanji5-v1['"]/,
  /const CARDS_STORAGE(?:_KEY)?\s*=\s*['"]kanji5-v1-cards['"]/,
  /const REVIEWS_STORAGE(?:_KEY)?\s*=\s*['"]kanji5-v1-reviews['"]/,
  /const DECK_KEY\s*=\s*['"]kanji5-deck['"]/,
  /const VERSION_KEY\s*=\s*['"]kanji5-deck-version['"]/
];
for (const path of ['review-runtime.js','supabase-sync.js','app-bootstrap.js','v1.3-p0.js']) {
  const source=fs.readFileSync(path,'utf8');
  for (const pattern of declarationPatterns) {
    assert.doesNotMatch(source,pattern,path+' must not redeclare a centralized storage key');
  }
}

const state=fs.readFileSync('v1.5-state.js','utf8');
assert.match(state,/function save/);
const stateScript=index.indexOf('<script src="./v1.5-state.js"></script>');
for(const consumer of ['<script type="module" src="./review-runtime.js"></script>','<script src="./app-bootstrap.js"></script>','<script src="./supabase-config.js"></script>']){
  assert.ok(stateScript >= 0 && stateScript < index.indexOf(consumer), 'State storage registry must load before '+consumer);
}
console.log('Storage key single-source contract: PASS');
