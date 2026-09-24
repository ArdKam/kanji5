import fs from 'node:fs';
import assert from 'node:assert/strict';

const sync = fs.readFileSync(new URL('../supabase-sync.js', import.meta.url), 'utf8');

assert.match(sync, /function startSyncLifecycle\(\)/, 'Sync lifecycle start helper is missing');
assert.match(sync, /function stopSyncLifecycle\(\)/, 'Sync lifecycle stop helper is missing');
assert.match(sync, /window\.removeEventListener\('online', scheduleSync\)/, 'Online listener must be removable');
assert.match(sync, /window\.addEventListener\('online', scheduleSync\)/, 'Online listener is not centralized');
assert.match(sync, /window\.removeEventListener\('storage', onStorage\)/, 'Storage listener must be removable');
assert.match(sync, /window\.addEventListener\('storage', onStorage\)/, 'Storage listener is not centralized');
assert.match(sync, /document\.removeEventListener\('visibilitychange', onVisibilityChange\)/, 'Visibility listener must be removable');
assert.match(sync, /document\.addEventListener\('visibilitychange', onVisibilityChange\)/, 'Visibility listener is not centralized');

const bootBody = sync.slice(sync.indexOf('async function boot()'), sync.indexOf('\n  if (document.readyState'));
assert.doesNotMatch(bootBody, /addEventListener\("online"/, 'Boot must not install repeated online listeners');
assert.doesNotMatch(bootBody, /addEventListener\("storage"/, 'Boot must not install repeated storage listeners');
assert.doesNotMatch(bootBody, /addEventListener\("visibilitychange"/, 'Boot must not install repeated visibility listeners');
assert.match(bootBody, /startSyncLifecycle\(\)/, 'Authenticated boot must start the sync lifecycle');
assert.match(bootBody, /stopSyncLifecycle\(\)/, 'Sign-out/error path must stop the sync lifecycle');

console.log('Kanji 5 v1.5 sync lifecycle checks passed.');
