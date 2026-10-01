import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../app-bootstrap.js',import.meta.url),'utf8');
assert.match(source,/get\('legacy'\)\s*===\s*'1'/);
assert.match(source,/if\(new URLSearchParams\(location\.search\)\.get\('legacy'\)==='1'\)import\('\.\/v1\.6-session\.js'\)/);
assert.doesNotMatch(source,/^\s*import\('\.\/v1\.6-session\.js'\)/m);

console.log('Startup legacy-session isolation contract: PASS');