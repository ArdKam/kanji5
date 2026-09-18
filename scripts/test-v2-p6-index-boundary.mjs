import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=fs.readFileSync('index.html','utf8');
const bootstrap=fs.readFileSync('app-bootstrap.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

const inlineScripts=[...index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>m[2].trim());
const inlineStyles=[...index.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)];
assert.equal(inlineScripts.length,0,'index.html must not contain inline JavaScript');
assert.equal(inlineStyles.length,0,'index.html must not contain inline CSS');
assert.match(index,/\.\/app-bootstrap\.js/);
assert.match(bootstrap,/legacy/);
assert.match(bootstrap,/kanji5-v2-default/);
assert.match(bootstrap,/serviceWorker\.register/);
assert.match(bootstrap,/kanji5-deck-version/);
assert.match(sw,/const CACHE='kanji5-shell-v[0-9]+'/);
assert.match(sw,/"\.\/app-bootstrap\.js"/);
console.log('Kanji 5 index decomposition contract passed.');
