import fs from 'node:fs';
import assert from 'node:assert/strict';

const sync = fs.readFileSync(new URL('../supabase-sync.js', import.meta.url), 'utf8');

assert.match(sync, /function startSyncLifecycle\(\)/, 'Sync lifecycle start helper is missing');
assert.match(sync, /function stopSyncLifecycle\(\)/, 'Sync lifecycle stop helper is missing');
assert.match(sync, /let lifecycleInstalled=false|let lifecycleInstalled = false/, 'Listener lifecycle guard is missing');
assert.match(sync, /lifecycleInstalled\s*=\s*true/, 'Lifecycle guard is never enabled');
assert.match(sync, /window\.addEventListener\("online", pullAndMerge\)/, 'Online listener is not centralized');
assert.match(sync, /window\.addEventListener\("storage", event =>/, 'Storage listener is not centralized');
assert.match(sync, /document\.addEventListener\("visibilitychange", \(\) =>/, 'Visibility listener is not centralized');

const bootBody = sync.slice(sync.indexOf('async function boot()'), sync.indexOf('\n  if (document.readyState'));
assert.doesNotMatch(bootBody, /addEventListener\("online"/, 'Boot must not install repeated online listeners');
assert.doesNotMatch(bootBody, /addEventListener\("storage"/, 'Boot must not install repeated storage listeners');
assert.doesNotMatch(bootBody, /addEventListener\("visibilitychange"/, 'Boot must not install repeated visibility listeners');
assert.match(bootBody, /startSyncLifecycle\(\)/, 'Authenticated boot must start the sync lifecycle');
assert.match(bootBody, /stopSyncLifecycle\(\)/, 'Sign-out/error path must stop the sync lifecycle');

console.log('Kanji 5 v1.5 sync lifecycle checks passed.');
