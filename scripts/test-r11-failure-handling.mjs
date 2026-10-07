import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const boundary=read('v1.9-v2-boundary.js');
const bootstrap=read('app-bootstrap.js');
const entry=read('react-entry.js');
const index=read('index.html');
const migration=read('v1.4-education-migration.js');
const network=read('v1.5-network.js');
const sync=read('supabase-sync.js');

for(const event of [
  'dynamic-import-failure',
  'network-runtime-load-failure',
  'education-runtime-load-failure',
  'component-data-load-failure',
  'radical-data-load-failure',
  'migration-failure',
]) assert.ok(boundary.includes(event), `missing boundary diagnostic: ${event}`);

assert.match(bootstrap,/service-worker-registration-failure/);
assert.match(bootstrap,/service-worker-install-failure/);
assert.match(bootstrap,/dynamic-import-failure/);
assert.match(bootstrap,/session-runtime-load-failure/);
assert.match(entry,/react-startup-failure/);
assert.match(entry,/dynamic-import-failure/);
assert.match(entry,/startup-backup-failure/);
assert.match(entry,/startup-report-copy-failure/);
assert.match(entry,/Export backup/);
assert.match(entry,/Copy diagnostics/);
assert.match(index,/script src="\.\/v2-observability\.js"/);
assert.ok(index.indexOf('v2-observability.js</script>')<index.indexOf('app-bootstrap.js'),'observability must initialize before app bootstrap');
assert.match(migration,/migration-failure/);
assert.match(network,/network-request-failure/);
assert.match(sync,/sync-failure/);
assert.match(sync,/sync-failure/);
console.log('Kanji 5 R11 failure-handling contracts passed.');
