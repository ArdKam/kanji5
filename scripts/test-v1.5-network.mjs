import assert from 'node:assert/strict';
import fs from 'node:fs';

const network=fs.readFileSync(new URL('../v1.5-network.js',import.meta.url),'utf8');
const state=fs.readFileSync(new URL('../v1.5-state.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../v1.5-education-ui.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

assert.match(network,/^export async function fetchWords/m);
assert.match(network,/^export async function fetchContextSentences/m);
assert.match(network,/https:\/\/kanjiapi\.dev/);
assert.match(network,/https:\/\/api\.tatoeba\.org/);
assert.doesNotMatch(network,/localStorage|sessionStorage/);
assert.match(state,/function readSettings\(/);
assert.match(state,/function readAppState\(/);
assert.ok(state.includes('readSettings'),'state module must expose readSettings');
assert.ok(state.includes('readAppState'),'state module must expose readAppState');
assert.doesNotMatch(ui,/\blocalStorage\b|\bsessionStorage\b/);
assert.doesNotMatch(ui,/https:\/\/kanjiapi\.dev|https:\/\/api\.tatoeba\.org/);
assert.match(ui,/import\('\.\/v1\.5-network\.js'\)/);
assert.match(sw,/"\.\/v1\.5-network\.js"/);
const cacheVersion=sw.match(/const CACHE='kanji5-shell-v([^']+)'/)?.[1];
assert.ok(cacheVersion&&(/^[0-9]+$/.test(cacheVersion)?Number(cacheVersion)>=50:cacheVersion==='__KANJI5_BUILD_HASH__'),'Runtime cache version must use build provenance');

console.log('Kanji 5 v1.6 network boundary checks passed.');