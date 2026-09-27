import assert from 'node:assert/strict';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8'),bootstrap=fs.readFileSync('app-bootstrap.js','utf8'),sw=fs.readFileSync('sw.js','utf8');
const inlineScripts=[...index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>m[2].trim()),inlineStyles=[...index.matchAll(/<style\b([^>]*)>[\s\S]*?<\/style>/gi)];
assert.equal(inlineScripts.length,1);assert.match(inlineScripts[0][2],/get("legacy")|get\("legacy"\) !== "1"/);assert.match(inlineScripts[0][2],/v1\.9-recovery\.js/);assert.deepEqual(inlineStyles.map(m=>m[1].trim()), ['id="kanji5-account-launcher-style"','id="kanji5-header-layout-fix"','id="kanji5-exercise-density-fix"','id="kanji5-exercise-viewport-fix"']);assert.match(index,/\.\/app-bootstrap(?:-release\d+)?\.js/);assert.doesNotMatch(index,/v2-presentation|v2-components/);
assert.doesNotMatch(bootstrap,/legacy|kanji5-v2-default/);assert.match(bootstrap,/serviceWorker\.register/);assert.match(bootstrap,/kanji5-deck-version/);assert.match(bootstrap,/v1\.6-session\.js/);
assert.match(sw,/const CACHE='kanji5-shell-v\d+'/);assert.match(sw,/react-dist\/kanji5-react(?:-release\d+)?\.js/);assert.match(sw,/react-dist\/kanji5-react(?:-release\d+)?\.css/);
console.log('Kanji 5 React index decomposition contract passed.');