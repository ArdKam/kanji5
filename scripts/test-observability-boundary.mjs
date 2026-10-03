import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('v1.9-v2-boundary.js','utf8');
for (const event of [
  'network-runtime-load-failure',
  'education-runtime-load-failure',
  'component-data-load-failure',
  'radical-data-load-failure',
]) {
  assert.ok(source.includes(`capture?.('${event}'`), `Missing observability capture: ${event}`);
}
console.log('Kanji 5 controlled-failure observability contract passed.');
