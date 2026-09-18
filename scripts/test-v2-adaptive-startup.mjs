import assert from 'node:assert/strict';
import fs from 'node:fs';

const session=fs.readFileSync('v1.6-session.js','utf8');
assert.match(session,/async function startSessionReady()/);
assert.match(session,/import('\.\/v1\.9-adaptive-planner\.js'\)/);
assert.match(session,/startReady:startSessionReady/);

console.log('Adaptive session startup contract passed.');
