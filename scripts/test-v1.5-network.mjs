import assert from 'node:assert/strict';
import fs from 'node:fs';

const network=fs.readFileSync(new URL('../v1.5-network.js',import.meta.url),'utf8');
const state=fs.readFileSync(new URL('../v1.5-state.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../v1.4-education-ui.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

assert.match(network,/^export async function fetchWords/m);
assert.match(network,/^export async function fetchContextSentences/m);
assert.match(network,/https:\/\/kanjiapi\.dev/);
assert.match(network,/https:\/\/api\.tatoeba\.org/);
assert.doesNotMatch(network,/localStorage|sessionStorage/);
assert.match(state,/function readSettings\(/);
assert.match(state,/function readAppState\(/);
assert.match(state,/readSettings,readAppState/);
assert.match(sw,/"\.\/v1\.5-network\.js"/);
assert.match(sw,/const CACHE='kanji5-shell-v47'/);

// Until the UI migration is wired, keep this contract explicit so the next
// architecture step cannot accidentally leave the old direct network paths in place.
assert.match(ui,/https:\/\/kanjiapi\.dev|https:\/\/api\.tatoeba\.org/);

console.log('Kanji 5 v1.5 network boundary checks passed.');
