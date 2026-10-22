import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw=fs.readFileSync('sw.js','utf8');
assert.match(sw,/react-dist\/manifest\.json/,'Service worker must know the public React manifest');
assert.match(sw,/dynamicImports/,'Service worker must traverse dynamically imported React chunks');
assert.match(sw,/async function precacheReactManifest/,'Service worker must precache the React asset graph from the manifest');

assert.doesNotMatch(sw,/self\.skipWaiting\s*\(/,'An update must not replace the active asset graph while older tabs are still open.');
const manifestBlock=sw.slice(sw.indexOf('async function precacheReactManifest'),sw.indexOf("self.addEventListener('install'"));
assert.match(manifestBlock,/if\(!response\.ok\)throw new Error/,'A missing React manifest must fail the candidate worker installation.');
assert.match(manifestBlock,/SW_REACT_ENTRY_MISSING_FROM_MANIFEST/,'The Vite manifest must include the shipped React entry.');
assert.match(manifestBlock,/urls\.add\('\.\/react-dist\/kanji5-react\.css'\)/,'The stable React stylesheet must be explicitly precached even if Vite omits it from the JS entry metadata.');
assert.match(manifestBlock,/await cache\.addAll\(\[\.\.\.urls\]\)/,'The worker must precache every resolved React asset dependency.');
assert.doesNotMatch(manifestBlock,/catch\s*\([^)]*\)\s*\{\s*\}/,'React asset precache failures must not be swallowed.');

// This test runs after Vite builds react-dist. The service worker cannot safely
// install offline support unless the generated manifest and every referenced
// static/dynamic dependency are present in the actual release artifact.
const reactManifestPath='react-dist/manifest.json';
assert.ok(fs.existsSync(reactManifestPath),'Built React manifest must exist before precache verification.');
const reactManifest=JSON.parse(fs.readFileSync(reactManifestPath,'utf8'));
assert.ok(reactManifest&&typeof reactManifest==='object'&&!Array.isArray(reactManifest)&&Object.keys(reactManifest).length,'Built React manifest must be a non-empty object.');
const manifestEntries=Object.values(reactManifest);
const reactEntry=manifestEntries.find(entry=>entry?.file==='kanji5-react.js');
assert.ok(reactEntry,'Built React manifest must describe kanji5-react.js.');
assert.ok(fs.existsSync('react-dist/kanji5-react.css'),'Stable React stylesheet must exist in the built artifact.');
const manifestAssets=new Set();
const manifestVisited=new Set();
function visitManifest(key){
  if(manifestVisited.has(key))return;
  manifestVisited.add(key);
  const entry=reactManifest[key];
  assert.ok(entry,'Built React manifest references a missing dependency entry: '+key);
  for(const value of [entry.file,...(entry.css||[]),...(entry.assets||[])]){
    if(typeof value!=='string'||!value)continue;
    manifestAssets.add(value.replace(/^\.\//,''));
  }
  for(const dependency of [...(entry.imports||[]),...(entry.dynamicImports||[])])visitManifest(dependency);
}
for(const key of Object.keys(reactManifest))visitManifest(key);
assert.ok(manifestAssets.has('kanji5-react.js'),'Built React asset graph must include its entry JS.');
for(const asset of manifestAssets){
  assert.ok(fs.existsSync('react-dist/'+asset),'Every React-manifest asset must exist in the built artifact: '+asset);
}
console.log('React manifest asset graph passed ('+manifestAssets.size+' assets).');

const match=sw.match(/const SHELL=(\[[\s\S]*?\]);/);
assert.ok(match,'Service worker SHELL manifest not found.');
const shell=JSON.parse(match[1]);
assert.ok(Array.isArray(shell)&&shell.length>0,'Service worker SHELL must be non-empty.');
for(const required of ['./v2-domain-core.js','./v2-evidence-core.js','./v2-relationship-core.js','./v2-scheduling-core.js','./v2-observability.js','./rinemi-logo.svg','./rinemi-logo-dark.svg','./rinemi-logo-mono.svg','./rinemi-mark.svg']){
  assert.ok(shell.includes(required),`Service worker SHELL must precache ${required}`);
}
assert.ok(!shell.includes("./kanji-visual-structure.json"),"Large canonical visual data must not be cached twice in the shell and data caches");
assert.ok(sw.includes("c.addAll(['./kanji-data.json','./kanji-components.json','./kanji-visual-structure.json'])"),"Canonical visual structure must be precached in the offline data cache");
assert.ok(sw.includes("u.pathname.endsWith('/kanji-visual-structure.json')"),"Canonical visual structure requests must be served from the data cache");
const offlineFallbackLine=sw.split("\n").find(line=>line.includes("offline-content-unavailable"));
assert.ok(offlineFallbackLine,"Uncached API failure must have an explicit offline fallback response.");
assert.match(offlineFallbackLine,/status:503/,"Offline API failure must not masquerade as HTTP 200 success.");
assert.match(offlineFallbackLine,/X-Kanji5-Offline-Fallback/,"Offline API failure must retain its machine-readable marker.");
assert.doesNotMatch(offlineFallbackLine,/new Response\('\[\]'\s*,\s*\{status:200/,"Offline API failure must not return a successful empty list.");

const duplicates=shell.filter((item,index)=>shell.indexOf(item)!==index);
assert.deepEqual(duplicates,[],'Service worker SHELL contains duplicate entries.');

const missing=shell.filter(item=>{
  const relative=String(item).replace(/^\.\//,'');
  const target=relative?relative:'.';
  return !fs.existsSync(target);
});
assert.deepEqual(missing,[],'Every service worker SHELL entry must resolve to a repository file.');
console.log(`Kanji 5 service-worker shell manifest passed (${shell.length} assets).`);
