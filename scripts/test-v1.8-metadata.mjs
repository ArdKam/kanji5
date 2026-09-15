import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
assert.equal(pkg.version,'1.8.0');
assert.ok(fs.existsSync('scripts/test-v1.8-release.mjs'));
assert.ok(fs.existsSync('scripts/test-v1.8-p0-c.mjs'));
console.log('Kanji 5 v1.8 metadata contract passed.');
