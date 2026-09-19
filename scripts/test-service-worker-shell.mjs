import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw=fs.readFileSync('sw.js','utf8');
const match=sw.match(/const SHELL=(\[[\s\S]*?\]);/);
assert.ok(match,'Service worker SHELL manifest not found.');
const shell=JSON.parse(match[1]);
assert.ok(Array.isArray(shell)&&shell.length>0,'Service worker SHELL must be non-empty.');
const duplicates=shell.filter((item,index)=>shell.indexOf(item)!==index);
assert.deepEqual(duplicates,[],'Service worker SHELL contains duplicate entries.');

const missing=shell.filter(item=>{
  const relative=String(item).replace(/^\.\//,'');
  const target=relative?relative:'.';
  return !fs.existsSync(target);
});
assert.deepEqual(missing,[],'Every service worker SHELL entry must resolve to a repository file.');
console.log(`Kanji 5 service-worker shell manifest passed (${shell.length} assets).`);
