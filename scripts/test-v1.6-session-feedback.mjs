import assert from 'node:assert/strict';
import fs from 'node:fs';

const feedback=fs.readFileSync('v1.6-session-feedback.js','utf8');
const education=fs.readFileSync('v1.5-education-ui.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

assert.match(feedback,/window\.__KANJI5_V16_SESSION_FEEDBACK__/,'session feedback runtime marker missing');
assert.match(feedback,/state\.readSessionHistory\?\./,'feedback must read session history through the state boundary');
assert.match(feedback,/state\.writeSessionHistory\?\./,'feedback must write session history through the state boundary');
assert.match(feedback,/modeResults/,'session-scoped mode results missing');
assert.match(feedback,/modeResultsSchemaVersion/,'mode result schema version missing');
assert.match(feedback,/kanji5:v1\.6-education-result/,'education result event listener missing');
assert.match(feedback,/migrateCompletedModeResults/,'completed-session mode results migration missing');
assert.match(feedback,/v16SessionModeStats/,'session mode analytics UI missing');
assert.match(education,/import\('\.\/v1\.6-session-feedback\.js'\)/,'education UI must load session feedback boundary');
assert.match(education,/kanji5:v1\.6-education-result/,'education UI must emit canonical session feedback events');
assert.match(sw,/"\.\/v1\.6-session-feedback\.js"/,'feedback runtime must be offline-precached');
console.log('Kanji 5 v1.6 session feedback contract checks passed.');