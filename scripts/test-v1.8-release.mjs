import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const roadmap = fs.readFileSync('V1.8-ROADMAP.md', 'utf8');
const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const workflow = fs.readFileSync('.github/workflows/build-v1.8.yml', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const ui = fs.readFileSync('v1.5-education-ui.js', 'utf8');

assert.match(pkg.version, /^1\.(8|9)\.0$/);
assert.match(changelog, /## \[1\.8\.0\]/);
assert.match(roadmap, /### P0-A — Production Recall ✅/);
assert.match(roadmap, /### P0-B — Vocabulary Recall ✅/);
assert.match(roadmap, /### P0-C — Context Recall ✅/);
for (const file of ['v1.8-production-core.js', 'v1.8-vocabulary-core.js', 'v1.8-context-core.js']) {
  assert.ok(fs.existsSync(file), `${file} must exist`);
  assert.ok(sw.includes(`./${file}`), `${file} must be precached`);
}
for (const spec of ['e2e/v1.8-production.spec.mjs', 'e2e/v1.8-vocabulary.spec.mjs', 'e2e/v1.8-context.spec.mjs']) {
  assert.ok(fs.existsSync(spec), `${spec} must exist`);
}
assert.match(workflow, /npm test/);
assert.match(workflow, /e2e\/v1\.8-production\.spec\.mjs/);
assert.match(workflow, /e2e\/v1\.8-vocabulary\.spec\.mjs/);
assert.match(workflow, /e2e\/v1\.8-context\.spec\.mjs/);
assert.ok(fs.existsSync('v1.5-education-ui.js'));
assert.match(ui,/v1\.8-production-core\.js/);
assert.match(ui,/v1\.8-vocabulary-core\.js/);
assert.match(ui,/v1\.8-context-core\.js/);
console.log('Kanji 5 v1.8 release contract passed.');
