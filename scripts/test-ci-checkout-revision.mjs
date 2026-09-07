import assert from 'node:assert/strict';

const source=await (await fetch(new URL('../.github/workflows/build-v1.6.yml',import.meta.url))).text();
assert.match(source,/uses:\s*actions\/checkout@v4/);
assert.doesNotMatch(source,/with:\s*\n\s*ref:\s*feature\/v1\.6/);
assert.match(source,/branches:\s*\[main, feature\/v1\.6\]/);

console.log('CI checkout revision contract: PASS');
