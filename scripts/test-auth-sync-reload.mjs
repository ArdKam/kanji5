import assert from 'node:assert/strict';
import fs from 'node:fs';

const sync=fs.readFileSync('supabase-sync.js','utf8');

assert.doesNotMatch(sync,/location\.reload\s*\(/,'Supabase sync must never force a full-page reload');
assert.match(sync,/async function refreshPresentationAfterSync\(\)/,'Sync presentation refresh helper is missing');
assert.match(sync,/await boundary\.snapshot\(\)/,'Sync refresh must rebuild the v1.9/v2 snapshot');
assert.match(sync,/new CustomEvent\('kanji5:v1\.9-v2-view-models'/,'Sync refresh must notify the React presentation layer');
assert.match(sync,/await refreshPresentationAfterSync\(\)/,'Remote/local reconciliation must refresh the UI without reloading');

console.log('Kanji 5 auth/sync reload-loop contract passed.');
