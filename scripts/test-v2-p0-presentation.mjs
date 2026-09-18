import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const presentation=read('v2-presentation.js');
const index=read('index.html');
const sw=read('sw.js');
const roadmap=read('V2-ROADMAP.md');
const workflow=read('.github/workflows/build-v1.8.yml');

assert.match(presentation,/URLSearchParams/);
assert.match(presentation,/params\.get\('v2'\) !== '1'/);
assert.match(presentation,/__KANJI5_V19_V2_BOUNDARY__/);
assert.match(presentation,/kanji5:v1\.9-v2-view-models/);
assert.doesNotMatch(presentation,/localStorage|sessionStorage|v1\.9-adaptive-planner|v1\.9-learner-model/);
assert.match(presentation,/textContent/);
assert.match(index,/v2-presentation\.js/);
assert.match(sw,/v2-presentation\.js/);
assert.match(sw,/const CACHE='kanji5-shell-v73'/);
assert.match(roadmap,/### P0 — Presentation Shell & Contract Consumer ✅/);
assert.match(workflow,/v2-presentation\.js/);
assert.match(workflow,/test-v2-p0-presentation\.mjs/);
assert.match(workflow,/e2e\/v2-p0-presentation\.spec\.mjs/);
console.log('Kanji 5 v2 P0 presentation contract passed.');
