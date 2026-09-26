import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const index = read('index.html');
const boundary = read('v1.9-v2-boundary.js');
const engine = read('frontend/src/app/engine.ts');
const migration = read('v1.4-education-migration.js');
const p0 = read('v1.3-p0.js');
const session = read('v1.6-session.js');
const bootstrap = read('app-bootstrap.js');
const entry = read('react-entry.js');
const sw = read('sw.js');

const legacyFiles = [
  'v1.4-education-migration.js','v1.4-education-core.js','v1.5-p0.js',
  'v1.2-enhancements.js','v1.2-runtime-fixes.js','v1.9-recovery.js','v1.5-education-ui.js'
];

for (const file of legacyFiles) {
  assert.ok(index.includes(`"./${file}"`)||index.includes(`'./${file}'`), `legacy dependency lost ${file}`);
  assert.doesNotMatch(index, new RegExp(`<script[^>]+src="./${file.replaceAll('.', '\\\.')}"[^>]*><\\/script>`),
    `legacy file is directly wired into the default shell: ${file}`);
}
assert.match(index, /<script src="\.\/v1\.5-state\.js"><\/script>/);
assert.match(index, /<script src="\.\/v1\.3-p0\.js"><\/script>/);
assert.doesNotMatch(index, /v1\.3-(?:perf|settings)\.js/);

assert.match(boundary, /async function ensureEducationRuntime\(\)/);
assert.match(boundary, /await import\('\.\/v1\.4-education-migration\.js'\)/);
assert.match(boundary, /await import\('\.\/v1\.4-education-core\.js'\)/);
assert.match(boundary, /await import\('\.\/v1\.9-recovery\.js'\)/);
assert.match(boundary, /await import\('\.\/v1\.5-education-ui\.js'\)/);
assert.match(engine, /ensureEducationRuntime/);
assert.doesNotMatch(migration, /import\('\.\/v1\.5-education-ui\.js'\)/);
assert.doesNotMatch(session, /v1\.8-learning-ux\.js/);
assert.match(p0, /__KANJI5_P0_DATA_PROMISE/);
assert.match(p0, /__KANJI5_P0_FSRS_PROMISE/);
assert.match(bootstrap,/serviceWorker\.register/);
assert.match(entry,/react-dist\/kanji5-react\.js/);

for (const file of ['app-bootstrap-v115.js','tmp.md','v1.3-settings.js','v1.3-perf.js','v1.8-learning-ux.js','v1.9-recovery-ui.js'])
  assert.equal(fs.existsSync(file), false, `retired file still exists: ${file}`);

for (const file of ['v1.4-education-migration.js','v1.4-education-core.js','v1.5-education-ui.js','v1.9-recovery.js'])
  assert.match(sw, new RegExp(`"${file.replaceAll('.', '\\\.')}"`), `lazy exercise dependency missing from precache: ${file}`);
for (const file of ['./v1.8-learning-ux.js','./v1.9-recovery-ui.js'])
  assert.equal(sw.includes(`"${file}"`), false, `retired file remains in precache: ${file}`);
for (const file of ['v1.5-p0.js','v1.5-recall-core.js','v1.2-enhancements.js','v1.2-runtime-fixes.js'])
  assert.match(sw, new RegExp(`"${file.replaceAll('.', '\\\.')}"`), `legacy compatibility dependency missing from offline cache: ${file}`);

assert.match(sw, /const CACHE='kanji5-shell-v[0-9A-Za-z._-]+'/);
console.log('Kanji 5 startup runtime boundary contract passed.');
