import assert from 'node:assert/strict';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8'),bootstrap=fs.readFileSync('app-bootstrap.js','utf8'),sw=fs.readFileSync('sw.js','utf8');
const inlineScripts=[...index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>m[2].trim()),inlineStyles=[...index.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)];
assert.equal(inlineScripts.length,0);assert.equal(inlineStyles.length,0);assert.match(index,/\.\/app-bootstrap\.js/);assert.doesNotMatch(index,/legacy|v2-presentation|v2-components/);
assert.doesNotMatch(bootstrap,/legacy|kanji5-v2-default/);assert.match(bootstrap,/serviceWorker\.register/);assert.match(bootstrap,/kanji5-deck-version/);assert.match(bootstrap,/v1\.6-session\.js/);
assert.match(sw,/const CACHE='kanji5-shell-v101'/);assert.match(sw,/react-dist\/kanji5-react\.js/);assert.match(sw,/react-dist\/kanji5-react\.css/);
console.log('Kanji 5 React index decomposition contract passed.');