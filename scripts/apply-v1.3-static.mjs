import fs from 'node:fs';
const indexPath='index.html',swPath='sw.js';
const index=fs.readFileSync(indexPath,'utf8');
const required=['./v1.3-p0.js','./v1.3-perf.js','./v1.3-storage-bridge.js','./v1.3-settings.js','./v1.4-education-migration.js','./v1.4-education-core.js','./v1.4-education-ui.js'];
let out=index;
out=out.replace(/\s*<script src="\.\/v1\.3-(?:dont-know|production-ui|education-v2|smart-distractors|education-runtime-fix|p1)\.js"><\/script>/g,'');
out=out.replace(/\s*<script src="\.\/v1\.4-education-(?:migration|core|ui)\.js"><\/script>/g,'');
out=out.replace(/\s*<style id="v1\.3-(?:education|p1)">[\s\S]*?<\/style>/g,'');
for(const src of required)out=out.replaceAll(`<script src="${src}"></script>`,'');
const anchor='<script type="module">';
if(!out.includes(anchor))throw new Error('Could not find main module anchor in index.html');
out=out.replace(anchor,required.map(src=>`<script src="${src}"></script>`).join('\n')+'\n'+anchor);
const oldBootstrap=/<script(?: id="[^"]*")?[^>]*>[\s\S]*?DATA_VERSION\s*=\s*"v1\.2-dataset-2136";[\s\S]*?<\/script>/g;
out=out.replace(oldBootstrap,'');
const canonical='<script id="v1.2-dataset-bootstrap">(()=>{const DATA_VERSION="v1.2-dataset-2136";const DECK_KEY="kanji5-deck";const VERSION_KEY="kanji5-deck-version";try{if(localStorage.getItem(VERSION_KEY)!==DATA_VERSION){localStorage.removeItem(DECK_KEY);localStorage.setItem(VERSION_KEY,DATA_VERSION)}}catch(_){}})();</script>';
const startupAnchor='<script id="v1.2-startup-guard">';
if(!out.includes(startupAnchor))throw new Error('Startup guard anchor missing');
out=out.replace(startupAnchor,canonical+startupAnchor);
function injectFsrsEducationQueue(html){
  const old="function buildQueue(){const due=state.deck.filter(k=>state.cards[k.id]?.card&&dueNow(state.cards[k.id].card)).map(k=>k.id);for(let i=due.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[due[i],due[j]]=[due[j],due[i]]}const newCards=[];if(state.todayNew<state.settings.dailyNew)for(const item of state.deck)if(!state.cards[item.id]){newCards.push(item.id);if(newCards.length>=state.settings.dailyNew-state.todayNew)break}state.queue=[...due,...newCards];return state.queue}";
  const next="function educationQueuePriority(item,knowledge,now=Date.now()){const core=window.__KANJI5_EDU_CORE__;if(!core||!item)return 0;const entry=knowledge?.[item.character]||{};const signal=core.educationSchedulerSignal?core.educationSchedulerSignal(entry):null;if(!signal)return 0;const latest=[entry.meaning,entry.reading,entry.production,entry.vocabulary,entry.context].map(s=>s?.lastAt).filter(Boolean).sort().pop()||'';const ageDays=latest?Math.max(0,now-Date.parse(latest))/86400000:0;return signal.weakness*.7+(1-signal.weakestSkillMastery)*.3+Math.min(1,ageDays/14)*.15}\nfunction buildQueue(){let knowledge={};try{knowledge=JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')}catch(_){}const now=Date.now();const dueItems=state.deck.filter(k=>state.cards[k.id]?.card&&dueNow(state.cards[k.id].card)).map(item=>({item,card:reviveCard(state.cards[item.id].card)}));dueItems.sort((a,b)=>{const aLate=Math.max(0,(now-new Date(a.card.due).getTime())/86400000),bLate=Math.max(0,(now-new Date(b.card.due).getTime())/86400000);const aScore=aLate*.6+educationQueuePriority(a.item,knowledge,now)*.4;const bScore=bLate*.6+educationQueuePriority(b.item,knowledge,now)*.4;return bScore-aScore||new Date(a.card.due)-new Date(b.card.due)});const due=dueItems.map(x=>x.item.id);const newCards=[];if(state.todayNew<state.settings.dailyNew)for(const item of state.deck)if(!state.cards[item.id]){newCards.push(item.id);if(newCards.length>=state.settings.dailyNew-state.todayNew)break}state.queue=[...due,...newCards];return state.queue}";
  if(html.includes(old))return html.replace(old,next);
  if(html.includes('function buildQueue(){')&&html.includes('state.queue=[...due,...newCards]'))throw new Error('buildQueue format changed; refusing unsafe FSRS bridge patch');
  throw new Error('buildQueue function not found for FSRS education bridge');
}
out=injectFsrsEducationQueue(out);
fs.writeFileSync(indexPath,out);

const eduPath='v1.4-education-ui.js';
let eduUi=fs.readFileSync(eduPath,'utf8');
const legacyChoices="function chooseChoices(target){const history=readKnowledge()[target.character]?.distractors||{};const pool=getDeck().filter(x=>x?.character&&x.character!==target.character);return [target,...CORE.chooseDistractors(target,pool,history,3)].sort(()=>Math.random()-.5)}";
const indexedChoices="function chooseChoices(target){const history=readKnowledge()[target.character]?.distractors||{};const pool=getDeck();return [target,...CORE.chooseDistractors(target,pool,history,3)].sort(()=>Math.random()-.5)}";
if(eduUi.includes(legacyChoices))eduUi=eduUi.replace(legacyChoices,indexedChoices);
if(!eduUi.includes(indexedChoices))throw new Error('Canonical indexed distractor wiring is missing');
if(!eduUi.includes('function escapeHTML'))eduUi=eduUi.replace('const safe=v=>',"function escapeHTML(value){return safe(value)}\nconst safe=v=>");
fs.writeFileSync(eduPath,eduUi);

const shell=['./','./index.html','./manifest.webmanifest','./icon.svg',...required,'./vendor/ts-fsrs-5.4.1.mjs','./v1.2-enhancements.js','./v1.2-runtime-fixes.js','./supabase-config.js','./supabase-sync.js'];
const sw=`const CACHE='kanji5-shell-v38';\nconst DATA_CACHE='kanji5-data-v24';\nconst API_CACHE='kanji5-api-v14';\nconst SHELL=${JSON.stringify(shell)};\nconst DATA_URL=new URL('./kanji-data.json',self.location.href).href;\nconst API_ORIGIN='https://kanjiapi.dev';\nconst TATOEBA_ORIGIN='https://api.tatoeba.org';\nself.addEventListener('install',e=>e.waitUntil(Promise.all([\n  caches.open(CACHE).then(c=>c.addAll(SHELL)),\n  caches.open(DATA_CACHE).then(c=>c.add('./kanji-data.json')),\n  caches.open(API_CACHE)\n]).then(()=>self.skipWaiting())));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(\n  keys.filter(k=>k.startsWith('kanji5-')&&!([CACHE,DATA_CACHE,API_CACHE].includes(k))).map(k=>caches.delete(k))\n)).then(()=>self.clients.claim())));\nasync function cacheFirst(req,name,fallback=req){\n  const c=await caches.open(name),hit=await c.match(fallback);\n  if(hit)return hit;\n  try{\n    const r=await fetch(req);\n    if(r.ok)await c.put(req,r.clone());\n    return r;\n  }catch(_){return(await c.match(fallback))||Response.error()}\n}\nasync function networkFirst(req,name,fallback=req){\n  const c=await caches.open(name);\n  try{\n    const r=await fetch(req);\n    if(r.ok)await c.put(req,r.clone());\n    return r;\n  }catch(_){return(await c.match(fallback))||Response.error()}\n}\nasync function apiCacheFirst(req){\n  const c=await caches.open(API_CACHE),hit=await c.match(req);\n  if(hit)return hit;\n  try{\n    const r=await fetch(req);\n    if(r.ok||r.type==='opaque')await c.put(req,r.clone());\n    return r;\n  }catch(_){return(await c.match(req))||Response.error()}\n}\nasync function dynamicSameOrigin(req){\n  const hit=await caches.match(req);\n  if(hit)return hit;\n  try{\n    const r=await fetch(req);\n    if(r.ok){const clone=r.clone();caches.open(CACHE).then(c=>c.put(req,clone)).catch(()=>{});} \n    return r;\n  }catch(_){return Response.error()}\n}\nself.addEventListener('fetch',e=>{\n  const r=e.request;\n  if(r.method!=='GET')return;\n  const u=new URL(r.url);\n  if(r.mode==='navigate'){e.respondWith(networkFirst(r,CACHE,'./index.html'));return}\n  if(u.origin===API_ORIGIN&&u.pathname.startsWith('/v1/words/')){e.respondWith(apiCacheFirst(r));return}\n  if(u.origin===TATOEBA_ORIGIN&&u.pathname.startsWith('/v1/sentences')){e.respondWith(apiCacheFirst(r));return}\n  if(u.origin!==self.location.origin)return;\n  if(u.href===DATA_URL){e.respondWith(cacheFirst(r,DATA_CACHE,'./kanji-data.json'));return}\n  e.respondWith(dynamicSameOrigin(r));\n});\n`;
fs.writeFileSync(swPath,sw);
console.log('Applied canonical v1.4 wiring, legacy cleanup, indexed distractors, education/FSRS queue bridge, API caching, and safe response cloning.');
