import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const sw=read('sw.js');
const legacyLoader=read('legacy-loader.js');

const legacyFiles = [
  'v1.4-education-migration.js',
  'v1.4-education-core.js',
  'v1.5-p0.js',
  'v1.2-enhancements.js',
  'v1.2-runtime-fixes.js',
  'v1.9-recovery.js',
  'v1.5-education-ui.js',
];

for (const file of legacyFiles) {
  assert.ok(
    legacyLoader.includes(`"./${file}"`) || legacyLoader.includes(`'./${file}'`) || index.includes(`"./${file}"`) || index.includes(`'./${file}'`),
    `legacy dependency lost ${file}`
  );
  assert.doesNotMatch(index, new RegExp(`<script[^>]+src=["']\\./${file.replace('.','\\.')}["']`), `legacy file is directly wired into the default shell: ${file}`);
  assert.ok(sw.includes(`"./${file}"`), `legacy compatibility dependency missing from offline cache: ${file}`);
}

assert.match(index, /<script src=["']\.\/legacy-loader\.js["']/);
assert.equal((index.match(/document\.write\(/g)||[]).length,0);
assert.equal((legacyLoader.match(/document\.write\(/g)||[]).length,1);
console.log('Kanji 5 startup runtime boundary passed.');
