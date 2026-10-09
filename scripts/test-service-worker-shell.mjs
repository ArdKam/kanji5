import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw=fs.readFileSync('sw.js','utf8');
assert.match(sw,/react-dist\/\.vite\/manifest\.json/,'Service worker must know the Vite React manifest');
assert.match(sw,/dynamicImports/,'Service worker must traverse dynamically imported React chunks');
assert.match(sw,/async function precacheReactManifest/,'Service worker must precache the React asset graph from the manifest');

const match=sw.match(/const SHELL=(\[[\s\S]*?\]);/);
assert.ok(match,'Service worker SHELL manifest not found.');
const shell=JSON.parse(match[1]);
assert.ok(Array.isArray(shell)&&shell.length>0,'Service worker SHELL must be non-empty.');
for(const required of ['./v2-domain-core.js','./v2-evidence-core.js','./v2-relationship-core.js','./v2-scheduling-core.js','./v2-observability.js','./rinemi-logo.svg','./rinemi-logo-dark.svg','./rinemi-logo-mono.svg','./rinemi-mark.svg']){
  assert.ok(shell.includes(required),`Service worker SHELL must precache ${required}`);
}
const duplicates=shell.filter((item,index)=>shell.indexOf(item)!==index);
assert.deepEqual(duplicates,[],'Service worker SHELL contains duplicate entries.');

const missing=shell.filter(item=>{
  const relative=String(item).replace(/^\.\//,'');
  const target=relative?relative:'.';
  return !fs.existsSync(target);
});
assert.deepEqual(missing,[],'Every service worker SHELL entry must resolve to a repository file.');
console.log(`Rinemi service-worker shell manifest passed (${shell.length} assets).`);
