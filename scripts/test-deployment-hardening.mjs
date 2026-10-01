import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow=await readFile(new URL('../.github/workflows/pages-deploy.yml',import.meta.url),'utf8');
const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');

assert.match(workflow,/contents:\s*read/);
assert.doesNotMatch(workflow,/git\s+push\s+origin/);
assert.doesNotMatch(workflow,/Sync generated React artifact into repository/);
assert.match(workflow,/Stamp service-worker cache with build hash/);
assert.match(workflow,/sha256sum react-dist\/kanji5-react\.js react-dist\/kanji5-react\.css index\.html/);
assert.match(workflow,/__KANJI5_BUILD_HASH__/);
assert.match(sw,/kanji5-shell-__KANJI5_BUILD_HASH__/);
assert.match(sw,/ignoreSearch:\s*true/);

console.log('Deployment hardening contract: PASS');
