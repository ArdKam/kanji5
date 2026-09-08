import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../.github/workflows/build-v1.6.yml',import.meta.url),'utf8');
assert.match(source,/uses:\s*actions\/checkout@v4/);
assert.doesNotMatch(source,/with:\s*\n\s*ref:\s*feature\/v1\.6/);
assert.match(source,/branches:\s*\[main\]/);
console.log('v1.6 CI checkout contract: PASS');
