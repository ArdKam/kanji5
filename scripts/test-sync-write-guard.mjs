import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../supabase-sync.js', import.meta.url), 'utf8');
const writeStart = source.indexOf('function writeLocal(payload, remoteUpdatedAt = null) {');
const writeEnd = source.indexOf('\nfunction mergedPayload(local, remote) {', writeStart);
assert.ok(writeStart >= 0 && writeEnd > writeStart, 'writeLocal implementation must exist');
const writeLocal = source.slice(writeStart, writeEnd);
assert.match(writeLocal, /const freshLocal = localPayload\(\);/, 'Sync write must re-read the latest persisted local state');
assert.match(writeLocal, /const resolvedPayload = mergedPayload\(freshLocal, incomingPayload\);/, 'Sync write must merge its response with latest local data');
assert.match(writeLocal, /const localAdvanced = !payloadsEqual\(resolvedPayload, incomingPayload\);/, 'Concurrent local changes must be detected before overwriting storage');
assert.match(writeLocal, /if \(localAdvanced && user\) syncRerunRequested = true;/, 'Changes made during the upload must queue a follow-up sync');

const lockMarker = source.includes('async function withSyncLock(task, generation) {')
  ? 'async function withSyncLock(task, generation) {'
  : 'async function withSyncLock(task) {';
const lockStart = source.indexOf(lockMarker);
const lockEnd = source.indexOf('\nfunction setSyncStatus', lockStart);
assert.ok(lockStart >= 0 && lockEnd > lockStart, 'Sync lock implementation must exist');
const lock = source.slice(lockStart, lockEnd);
assert.match(lock, /if \(syncRerunRequested\)[\s\S]*?scheduleSync\(\)/, 'A queued follow-up sync must run after the in-flight sync releases its lock');
if (lockMarker.includes('generation')) {
  assert.match(lock, /authGeneration === nextGeneration\)\s*scheduleSync\(\)/, 'Only the still-current account may receive the queued sync');
}

console.log('Sync write guard: concurrent local changes are preserved and re-synced.');
