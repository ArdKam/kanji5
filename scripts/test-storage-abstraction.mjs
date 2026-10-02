import assert from 'node:assert/strict';
import fs from 'node:fs';

const adapter=fs.readFileSync('v2-storage-core.js','utf8');
const state=fs.readFileSync('v1.5-state.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sync=fs.readFileSync('supabase-sync.js','utf8');

assert.match(adapter,/__KANJI5_STORAGE__/);
assert.match(adapter,/getItem\(key\)/);
assert.match(adapter,/setItem\(key,value\)/);
assert.match(adapter,/removeItem\(key\)/);
assert.ok(state.includes('const storage=window.__KANJI5_STORAGE__||localStorage'));
assert.doesNotMatch(state,/\blocalStorage\.(getItem|setItem|removeItem|clear|key)\(/);
assert.ok(index.indexOf('v2-storage-core.js') < index.indexOf('v1.5-state.js'));
assert.ok(sync.includes('const storage=window.__KANJI5_STORAGE__||localStorage;'));
assert.doesNotMatch(sync,/\blocalStorage\.(getItem|setItem|removeItem|clear|key)\(/);
console.log('Kanji 5 domain-neutral storage abstraction contract passed.');
