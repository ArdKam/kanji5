import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const packageJson = JSON.parse(read('package.json'));
const readme = read('README.md');
const architecture = read('ARCHITECTURE.md');
const workflow = read('.github/workflows/build-v1.6.yml');
const sw = read('sw.js');
const hotfix = read('v1.6-ui-hotfix-safe.js');
const feedback = read('v1.6-session-feedback.js');
const analytics = read('v1.6-session-analytics.js');
const profile = read('v1.6-skill-profile.js');
const sync = read('v1.6-sync-core.js');
const session = read('v1.6-session.js');

assert.equal(packageJson.version, '1.6.0', 'package version must be 1.6.0 for the v1.6 release');
assert.match(packageJson.scripts?.['test:v1.6:release'] ?? '', /test-v1\.6-release\.mjs/, 'package must expose the v1.6 release contract');
assert.match(readme, /^## v1\.6 — Adaptive Session Intelligence$/m, 'README must document v1.6');
assert.match(readme, /## v1\.6 release contract/, 'README must describe the release contract');
assert.match(architecture, /^# Kanji 5 v1\.6 Architecture$/m, 'architecture document must be explicitly versioned as v1.6');
assert.match(architecture, /## Session lifecycle/, 'architecture must document session lifecycle');
assert.match(architecture, /## Long-term skill profile/, 'architecture must document the long-term profile');
assert.match(architecture, /## CI and release gates/, 'architecture must document release gates');
assert.match(workflow, /^name: Build Kanji 5 v1\.6$/m, 'CI workflow must be named for v1.6');
assert.match(workflow, /scripts\/test-v1\.6-release\.mjs/, 'CI must run the explicit v1.6 release contract');
assert.match(sw, /"\.\/v1\.6-ui-hotfix-safe\.js"/, 'service worker must precache the safe UX runtime');
assert.match(sw, /const CACHE='kanji5-shell-v63'/, 'service-worker shell cache must be v63');
assert.equal(hotfix.includes('MutationObserver'), false, 'UI runtime must not install a mutation observer');
assert.equal(hotfix.includes('setInterval('), false, 'UI setup runtime must not own a background timer');
assert.equal(hotfix.includes('observe('), false, 'UI runtime must not observe DOM mutations');
assert.match(hotfix, /kanji5:v1\.6-session-finished/, 'external finish must emit the v1.6 session-finished lifecycle event');
assert.match(feedback, /kanji5:v1\.6-session-finished/, 'feedback must finalize mode results from external finish');
assert.match(analytics, /kanji5:v1\.6-session-finished/, 'analytics must refresh from external finish');
assert.match(profile, /kanji5:v1\.6-session-finished/, 'skill profile must refresh from external finish');
assert.match(sync, /recentAccuracy/, 'v1.6 sync must preserve temporal profile accuracy');
assert.match(sync, /recentCorrect/, 'v1.6 sync must preserve temporal profile correctness');
assert.match(sync, /momentum/, 'v1.6 sync must preserve temporal profile momentum');
assert.match(session, /const durationNode=\$\('#v16Duration'\)/, 'session runtime must own the lightweight timer tick');
assert.match(session, /timerId=setInterval\(\(\)=>/, 'session timer must use a single interval');
assert.match(session, /clearInterval\(timerId\)/, 'session timer must stop explicitly');
assert.equal(fs.existsSync('v1.6-ui-hotfix.js'), false, 'obsolete UI runtime must not remain in the release tree');

for (const path of [
  'v1.6-session.js',
  'v1.6-session-core.js',
  'v1.6-session-feedback.js',
  'v1.6-session-analytics.js',
  'v1.6-skill-profile.js',
  'v1.6-sync-core.js',
  'v1.6-ui-hotfix-safe.js'
]) {
  assert.ok(fs.existsSync(path), `required v1.6 runtime file missing: ${path}`);
}

for (const path of [
  'scripts/test-v1.6-session.mjs',
  'scripts/test-v1.6-session-core.mjs',
  'scripts/test-v1.6-profile-planning.mjs',
  'scripts/test-v1.6-session-feedback.mjs',
  'scripts/test-v1.6-session-analytics.mjs',
  'scripts/test-v1.6-skill-profile.mjs',
  'scripts/test-v1.6-sync.mjs'
]) {
  assert.ok(fs.existsSync(path), `required v1.6 contract missing: ${path}`);
}

console.log('Kanji 5 v1.6 release contract checks passed.');
