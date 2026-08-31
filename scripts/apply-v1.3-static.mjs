import fs from 'node:fs';

const indexPath = 'index.html';
const swPath = 'sw.js';

const index = fs.readFileSync(indexPath, 'utf8');
const required = [
  './v1.3-p0.js',
  './v1.3-perf.js',
  './v1.3-storage-bridge.js',
  './v1.3-settings.js',
  './v1.3-p1.js'
];

let out = index;
out = out.replace(/\s*<script src="\.\/v1\.3-(?:dont-know|production-ui|education-v2)\.js"><\/script>/g, '');
for (const src of required) {
  const tag = `<script src="${src}"></script>`;
  out = out.replaceAll(tag, '');
}
const anchor = '<script type="module">';
if (!out.includes(anchor)) throw new Error('Could not find main module anchor in index.html');
out = out.replace(anchor, required.map(src => `<script src="${src}"></script>`).join('\n') + '\n' + anchor);
fs.writeFileSync(indexPath, out);

const shell = [
  './','./index.html','./manifest.webmanifest','./icon.svg',
  './v1.3-p0.js','./v1.3-perf.js','./v1.3-storage-bridge.js','./v1.3-settings.js','./v1.3-p1.js',
  './vendor/ts-fsrs-5.4.1.mjs','./v1.2-enhancements.js','./v1.2-runtime-fixes.js',
  './supabase-config.js','./supabase-sync.js'
];
const sw = `const CACHE='kanji5-shell-v30';
const DATA_CACHE='kanji5-data-v17';
const API_CACHE='kanji5-api-v8';
const SHELL=${JSON.stringify(shell)};
const DATA_URL=new URL('./kanji-data.json',self.location.href).href;
const API_ORIGIN='https://kanjiapi.dev';
self.addEventListener('install',e=>e.waitUntil(Promise.all([
  caches.open(CACHE).then(c=>c.addAll(SHELL)),
  caches.open(DATA_CACHE).then(c=>c.add('./kanji-data.json')),
  caches.open(API_CACHE)
]).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(k=>k.startsWith('kanji5-')&&!['${'${CACHE}'},'${'${DATA_CACHE}'},'${'${API_CACHE}'}'].includes(k)).map(k=>caches.delete(k))
)).then(()=>self.clients.claim()))));
async function cacheFirst(req,name,fallback=req){const c=await caches.open(name),hit=await c.match(fallback);if(hit)return hit;try{const r=await fetch(req);if(r.ok)await c.put(req,r.clone());return r}catch(_){return(await c.match(fallback))||Response.error()}}
async function networkFirst(req,name,fallback=req){const c=await caches.open(name);try{const r=await fetch(req);if(r.ok)await c.put(req,r.clone());return r}catch(_){return(await c.match(fallback))||Response.error()}}
async function apiCacheFirst(req){const c=await caches.open(API_CACHE),hit=await c.match(req);if(hit)return hit;try{const r=await fetch(req);if(r.ok||r.type==='opaque')await c.put(req,r.clone());return r}catch(_){return(await c.match(req))||Response.error()}}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
if(r.mode==='navigate'){e.respondWith(networkFirst(r,CACHE,'./index.html'));return}
if(u.origin===API_ORIGIN&&u.pathname.startsWith('/v1/words/')){e.respondWith(apiCacheFirst(r));return}
if(u.origin!==self.location.origin)return;
if(u.href===DATA_URL){e.respondWith(cacheFirst(r,DATA_CACHE,'./kanji-data.json'));return}
e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(r,res.clone()));return res})))
});
`;
fs.writeFileSync(swPath, sw);
console.log('Applied static v1.3 wiring and rebuilt service worker.');
