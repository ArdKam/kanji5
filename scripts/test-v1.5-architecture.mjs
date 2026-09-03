import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const index = read('index.html');
const state = read('v1.5-state.js');
const recallCore = read('v1.5-recall-core.js');
const p0 = read('v1.5-p0.js');
const syncCore = read('v1.5-sync-core.js');
const sync = read('supabase-sync.js');
const sw = read('sw.js');
const pkg = JSON.parse(read('package.json'));

assert.equal(pkg.type, 'module', 'package must declare the ESM boundary');
assert.match(recallCore, /^export /m, 'recall core must be an explicit ESM module');
assert.doesNotMatch(recallCore, /\b(?:window|document|localStorage)\b/, 'recall core must remain browser-side-effect free');
assert.match(p0, /await import\(['"]\.\/v1\.5-recall-core\.js['"]\)/, 'P0 must consume recall behavior through the dedicated core boundary');
assert.match(syncCore, /^import /m, 'sync core must remain an explicit ESM module');
assert.match(sync, /from ['"]\.\/v1\.5-sync-core\.js['"]/, 'Supabase sync must consume the sync core through its module boundary');

assert.match(state, /window\.__KANJI5_STATE__/, 'state module must expose one public browser API');
assert.match(p0, /window\.__KANJI5_V15_RECALL_API__/, 'P0 must expose one explicit recall API');
assert.doesNotMatch(p0, /function\s+normalize\(/, 'pure recall normalization must live in the recall core');
assert.doesNotMatch(p0, /function\s+componentAccuracy\(/, 'component accuracy must live in the recall core');
assert.doesNotMatch(p0, /function\s+componentSignal\(/, 'component signal aggregation must live in the recall core');
assert.doesNotMatch(p0, /function\s+selectFocus\(/, 'focus selection must live in the recall core');
assert.doesNotMatch(p0, /function\s+applyRecallOutcome\(/, 'recall outcome mutation must live in the recall core');
assert.doesNotMatch(p0, /observer\.observe\(document\.body/, 'P0 must not observe the global document body');
assert.doesNotMatch(p0, /\|\|document\.body/, 'P0 must not fall back to the global document body');
assert.doesNotMatch(p0, /function\s+enhanceProduction\(/, 'Production UI logic must stay in the education UI module');
assert.doesNotMatch(p0, /function\s+getProductionTarget\(/, 'Production target inference must stay out of the P0 overlay');
assert.doesNotMatch(p0, /v15Production/, 'P0 must not own production-choice state');

assert.match(index, /<script src="\.\/v1\.5-state\.js"><\/script>/, 'state boundary must be loaded before the application runtime');
assert.match(index, /<script src="\.\/v1\.5-p0\.js"><\/script>/, 'P0 must be explicitly wired once by the active shell');
assert.equal((index.match(/<script src="\.\/v1\.5-p0\.js"><\/script>/g) || []).length, 1, 'P0 must be loaded exactly once');

assert.match(sw, /"\.\/v1\.5-state\.js"/, 'state module must be offline-precached');
assert.match(sw, /"\.\/v1\.5-recall-core\.js"/, 'recall core must be offline-precached');
assert.match(sw, /"\.\/v1\.5-p0\.js"/, 'P0 must be offline-precached');
assert.match(sw, /"\.\/v1\.5-sync-core\.js"/, 'sync core must be offline-precached for sync-enabled startup paths');

assert.doesNotMatch(sync, /sameDayLocal\s*=|sameDayRemote\s*=/, 'date-aware merge implementation must not be duplicated in Supabase sync');
assert.doesNotMatch(sync, /function\s+mergeKnowledge\(/, 'education merge logic must not be duplicated in Supabase sync');
assert.doesNotMatch(sync, /function\s+mergeReviewEvents\(/, 'FSRS merge logic must not be duplicated in Supabase sync');

const deprecatedRuntimeFiles = [
  'v1.3-p1.js',
  'v1.3-education-runtime-fix.js',
  'v1.3-production-ui.js',
  'v1.3-education-v2.js',
  'v1.3-dont-know.js',
  'v1.3-smart-distractors.js',
  'v1.5-education-choice-enforcer.js'
];
for (const file of deprecatedRuntimeFiles) {
  assert.doesNotMatch(index, new RegExp(file.replaceAll('.', '\\.'), 'g'), `Deprecated runtime must not be wired: ${file}`);
  assert.doesNotMatch(sw, new RegExp(file.replaceAll('.', '\\.'), 'g'), `Deprecated runtime must not be precached: ${file}`);
}

console.log('Kanji 5 v1.5 architecture boundary checks passed.');
