import assert from 'node:assert/strict';
import fs from 'node:fs';

const session=fs.readFileSync('v1.6-session.js','utf8');
assert.ok(session.includes('async function startSessionReady()'));
assert.ok(session.includes("import('./v1.9-adaptive-planner.js')"));
assert.ok(session.includes('startReady:startSessionReady'));

console.log('Adaptive session startup contract passed.');
