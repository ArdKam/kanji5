const CACHE='kanji5-shell-v49';
const DATA_CACHE='kanji5-data-v24';
const API_CACHE='kanji5-api-v14';
const SHELL=["./","./index.html","./manifest.webmanifest","./icon.svg","./v1.3-p0.js","./v1.3-perf.js","./v1.3-storage-bridge.js","./v1.3-settings.js","./v1.4-education-migration.js","./v1.4-education-core.js","./v1.4-education-ui.js","./v1.5-state.js","./v1.5-recall-core.js","./v1.5-p0.js","./v1.5-network.js","./v1.5-education-ui.js","./v1.5-education-ui.css","./v1.5-education-sync-core.js","./v1.5-fsrs-sync-core.js","./v1.5-sync-core.js","./vendor/ts-fsrs-5.4.1.mjs","./v1.2-enhancements.js","./v1.2-runtime-fixes.js","./supabase-config.js","./supabase-sync.js"];
const DATA_URL=new URL('./kanji-data.json',self.location.href).href;
const API_ORIGIN='https://kanjiapi.dev';
const TATOEBA_ORIGIN='https://api.tatoeba.org';
const API_TTL_MS=7*24*60*60*1000;
const API_MAX_ENTRIES=250;
const API_INFLIGHT=new Map();
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
async function staleWhileRevalidate(req,name,fallback=req){
  const c=await caches.open(name),hit=await c.match(fallback||req);
  const update=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone()).catch(()=>{});return r}).catch(()=>null);
  if(hit){void update;return hit}
  const fresh=await update;
  return fresh||Response.error();
}
async function cacheApiResponse(cache,req,response){if(!response||response.type==='opaque'||!response.ok)return;try{const body=await response.clone().blob();const headers=new Headers(response.headers);headers.set('X-Kanji5-Cache-Time',String(Date.now()));await cache.put(req,new Response(body,{status:response.status,statusText:response.statusText,headers}))}catch(_){} }
async function evictApiCache(cache){const keys=await cache.keys(),now=Date.now();for(const key of keys){const hit=await cache.match(key);const stamp=Number(hit?.headers.get('X-Kanji5-Cache-Time')||0);if(stamp&&now-stamp>API_TTL_MS)await cache.delete(key)}const fresh=await cache.keys();if(fresh.length<=API_MAX_ENTRIES)return;const ranked=[];for(const key of fresh){const hit=await cache.match(key);ranked.push({key,stamp:Number(hit?.headers.get('X-Kanji5-Cache-Time')||0)})}ranked.sort((a,b)=>a.stamp-b.stamp);for(const item of ranked.slice(0,Math.max(0,ranked.length-API_MAX_ENTRIES)))await cache.delete(item.key)}
function isLowValueVocabularyExample(word){const value=String(word||'').trim();if(!value)return true;const chars=[...value];if(chars.length<2)return true;const numerals='一二三四五六七八九十百千万';const numeralCounters='人個本枚台冊匹杯歳回日月年時分円階';return chars.length>=2&&chars.slice(0,-1).every(ch=>numerals.includes(ch))&&numeralCounters.includes(chars[chars.length-1])}
async function filterVocabularyResponse(req,response){if(req.url.startsWith(`${API_ORIGIN}/v1/words/`)===false||!response?.ok)return response;try{const payload=await response.clone().json();if(!Array.isArray(payload))return response;let changed=false;const filtered=payload.map(entry=>{const variants=Array.isArray(entry?.variants)?entry.variants.filter(variant=>!isLowValueVocabularyExample(variant?.written)):[];if(variants.length!==(entry?.variants||[]).length)changed=true;return {...entry,variants}}).filter(entry=>entry.variants.length);if(!changed)return response;return new Response(JSON.stringify(filtered),{status:response.status,statusText:response.statusText,headers:response.headers})}catch(_){return response}}
async function apiCacheFirst(req){const c=await caches.open(API_CACHE);const hit=await c.match(req);if(hit){const stamp=Number(hit.headers.get('X-Kanji5-Cache-Time')||0);if(stamp&&Date.now()-stamp<=API_TTL_MS){void evictApiCache(c);return hit}if(stamp)await c.delete(req)}const key=req.url;const pending=API_INFLIGHT.get(key);if(pending)return(await pending).clone();const request=(async()=>{try{const raw=await fetch(req);const response=await filterVocabularyResponse(req,raw);await cacheApiResponse(c,req,response);void evictApiCache(c);return response}catch(_){const fallback=await c.match(req);return fallback||Response.error()}})();API_INFLIGHT.set(key,request);try{return(await request).clone()}finally{if(API_INFLIGHT.get(key)===request)API_INFLIGHT.delete(key)}}
async function dynamicSameOrigin(req){try{return await fetch(req)}catch(_){return Response.error()}}
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(r.mode==='navigate'){e.respondWith(staleWhileRevalidate(r,CACHE,'./index.html'));return}
  if(u.origin===API_ORIGIN&&u.pathname.startsWith('/v1/words/')){e.respondWith(apiCacheFirst(r));return}
  if(u.origin===TATOEBA_ORIGIN&&u.pathname.startsWith('/v1/sentences')){e.respondWith(apiCacheFirst(r));return}
  if(u.origin!==self.location.origin)return;
  if(u.href===DATA_URL){e.respondWith(cacheFirst(r,DATA_CACHE,'./kanji-data.json'));return}
  e.respondWith(dynamicSameOrigin(r));
});