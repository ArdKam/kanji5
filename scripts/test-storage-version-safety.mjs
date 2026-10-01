import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bootstrap=await readFile(new URL('../app-bootstrap.js',import.meta.url),'utf8');
assert.match(bootstrap,/const DECK_KEY='kanji5-deck'/);
assert.match(bootstrap,/localStorage\.setItem\(VERSION_KEY,DATA_VERSION\)/);
assert.doesNotMatch(bootstrap,/localStorage\.removeItem\(DECK_KEY\)/);

console.log('Dataset-version storage safety contract: PASS');
