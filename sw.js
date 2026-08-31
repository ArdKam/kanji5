const CACHE='kanji5-shell-v38';
const DATA_CACHE='kanji5-data-v24';
const API_CACHE='kanji5-api-v14';
const SHELL=["./","./index.html","./manifest.webmanifest","./icon.svg","./v1.3-p0.js","./v1.3-perf.js","./v1.3-storage-bridge.js","./v1.3-settings.js","./v1.4-education-migration.js","./v1.4-education-core.js","./v1.4-education-ui.js","./vendor/ts-fsrs-5.4.1.mjs","./v1.2-enhancements.js","./v1.2-runtime-fixes.js","./supabase-config.js","./supabase-sync.js"];
const DATA_URL=new URL('./kanji-data.json',self.location.href).href;
const API_ORIGIN='https://kanjiapi.dev';
const TATOEBA_ORIGIN='https://api.tatoeba.org';
self.addEventListener('install',e=>e.waitUntil(Promise.all([
  caches.open(CACHE).then(c=>c.addAll(SHELL)),
  caches.open(DATA_CACHE).then(c=>c.add('./kanji-data.json')),
  caches.open(API_CACHE)
]).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(k=>k.startsWith('kanji5-')&&!([CACHE,DATA_CACHE,API_CACHE].includes(k))).map(k=>caches.delete(k))
)).then(()=>self.clients.claim())));
async function cacheFirst(req,name,fallback=req){
  const c=await caches.open(name),hit=await c.match(fallback);
  if(hit)return hit;
  try{
    const r=await fetch(req);
    if(r.ok)await c.put(req,r.clone());
    return r;
  }catch(_){return(await c.match(fallback))||Response.error()}
}
async function networkFirst(req,name,fallback=req){
  const c=await caches.open(name);
  try{
    const r=await fetch(req);
    if(r.ok)await c.put(req,r.clone());
    return r;
  }catch(_){return(await c.match(fallback))||Response.error()}
}
async function apiCacheFirst(req){
  const c=await caches.open(API_CACHE),hit=await c.match(req);
  if(hit)return hit;
  try{
    const r=await fetch(req);
    if(r.ok||r.type==='opaque')await c.put(req,r.clone());
    return r;
  }catch(_){return(await c.match(req))||Response.error()}
}
async function dynamicSameOrigin(req){
  const hit=await caches.match(req);
  if(hit)return hit;
  try{
    const r=await fetch(req);
    if(r.ok){const clone=r.clone();caches.open(CACHE).then(c=>c.put(req,clone)).catch(()=>{});} 
    return r;
  }catch(_){return Response.error()}
}
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(r.mode==='navigate'){e.respondWith(networkFirst(r,CACHE,'./index.html'));return}
  if(u.origin===API_ORIGIN&&u.pathname.startsWith('/v1/words/')){e.respondWith(apiCacheFirst(r));return}
  if(u.origin===TATOEBA_ORIGIN&&u.pathname.startsWith('/v1/sentences')){e.respondWith(apiCacheFirst(r));return}
  if(u.origin!==self.location.origin)return;
  if(u.href===DATA_URL){e.respondWith(cacheFirst(r,DATA_CACHE,'./kanji-data.json'));return}
  e.respondWith(dynamicSameOrigin(r));
});
