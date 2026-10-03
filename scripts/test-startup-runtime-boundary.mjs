import assert from 'node:assert/strict';
const legacyLoader = read('legacy-loader.js');
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
  assert.ok(legacyLoader.includes(`"./${file}"`)||legacyLoader.includes(`'./${file}'`)||index.includes(`"./${file}"`)||index.includes(`'./${file}'`), `legacy dependency lost ${file}`);
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
assert.match(engine, /\(await waitForEngine\(\)\)\.startLearningSession/);
assert.doesNotMatch(engine, /__KANJI5_(?:EDU_BRIDGE|V16_SESSION_API|V19_LEARNER_MODEL)__/, 'React engine adapter must not access runtime globals directly');
for (const api of ['startLearningSession','startLearningExperience','startPracticeExperience','startExercise','submitExercise','dontKnowExercise','selfReportProduction','retryExercise','nextExercise','getHandwritingSkill','recordHandwritingGrade'])
  assert.match(boundary, new RegExp(api), 'boundary must own '+api+' bridge');

assert.doesNotMatch(migration, /import\('\.\/v1\.5-education-ui\.js'\)/);
assert.doesNotMatch(session, /v1\.8-learning-ux\.js/);
assert.match(p0, /const hasCachedDeck=\(\)=>/);
assert.match(p0, /kanji5-deck-version/);
assert.match(p0, /if\(!hasCachedDeck\(\)&&!window\.__KANJI5_P0_DATA_PROMISE\)/);
assert.match(p0, /__KANJI5_P0_FSRS_PROMISE/);
assert.match(bootstrap,/const registerServiceWorker=\(\)=>/);
assert.match(bootstrap,/serviceWorker\.register/);
assert.match(bootstrap,/requestIdleCallback\(registerServiceWorker/);
assert.match(entry,/react-dist\/kanji5-react\.js/);

for (const file of ['app-bootstrap-v115.js','tmp.md','v1.3-settings.js','v1.3-perf.js','v1.8-learning-ux.js','v1.9-recovery-ui.js','v1.5-education-ui.css','learning-card-flip-runtime.js','learning-card-flip-runtime.css'])
  assert.equal(fs.existsSync(file), false, `retired file still exists: ${file}`);

for (const file of ['v1.4-education-migration.js','v1.4-education-core.js','v1.5-education-ui.js','v1.9-recovery.js'])
  assert.ok(sw.includes(`"./${file}"`), `lazy exercise dependency missing from precache: ${file}`);
for (const file of ['./v1.8-learning-ux.js','./v1.9-recovery-ui.js'])
  assert.equal(sw.includes(`"${file}"`), false, `retired file remains in precache: ${file}`);
for (const file of ['v1.5-p0.js','v1.5-recall-core.js','v1.2-enhancements.js','v1.2-runtime-fixes.js'])
  assert.ok(sw.includes(`"./${file}"`), `legacy compatibility dependency missing from offline cache: ${file}`);

assert.match(sw, /const BUILD_ID='__KANJI5_BUILD_ID__';/);assert.match(sw, /const CACHE='kanji5-shell-v'\+BUILD_ID/);
console.log('Kanji 5 startup runtime boundary contract passed.');
