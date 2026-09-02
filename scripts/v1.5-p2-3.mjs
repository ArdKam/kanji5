import fs from 'node:fs';
// P2-3: extract state lifecycle without regressing shared dataset/FSRS initialization.
const path='index.html';let s=fs.readFileSync(path,'utf8');const assert=(x,m)=>{if(!x)throw new Error(m)};
const stateMarker='let state={settings:{...DEFAULTS},deck:[],cards:{},reviews:[],today:"",todayNew:0,todayReviewCount:0,goalCelebrated:false,queue:[],current:null,revealed:false,examples:{},streak:{current:0,longest:0,lastActiveDate:null}};let scheduler;';
assert(s.includes(stateMarker),'inline state declaration marker missing');
s=s.replace(stateMarker,'let state=window.__KANJI5_STATE__.createInitial({settings:DEFAULTS});let scheduler;');
const todayLine='const $=id=>document.getElementById(id);const todayKey=()=>new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());';
assert(s.includes(todayLine),'inline state helper header missing');
s=s.replace(todayLine,'const $=id=>document.getElementById(id);const {todayKey,deviceId,eventId,save,loadSaved,reviveCard,hydrateCards}=window.__KANJI5_STATE__;');
const deviceLine='const DEVICE_KEY="kanji5-device-id";\nfunction deviceId(){try{let id=localStorage.getItem(DEVICE_KEY);if(!id){id=(crypto.randomUUID?.()||`device-${Date.now()}-${Math.random().toString(36).slice(2)}`);localStorage.setItem(DEVICE_KEY,id)}return id}catch(_){return "legacy"}}\nfunction eventId(){return crypto.randomUUID?.()||`review-${Date.now()}-${Math.random().toString(36).slice(2)}`}\n';
if(s.includes(deviceLine))s=s.replace(deviceLine,'');
for(const regex of [
  /function save\(\)\{[\s\S]*?\n\}/,
  /function loadSaved\(\)\{[\s\S]*?\n\}/,
  /function reviveCard\(card\)\{[\s\S]*?\n\}/,
  /function hydrateCards\(\)\{[\s\S]*?\n\}/
]){if(regex.test(s))s=s.replace(regex,'')}
if(!s.includes('<script src="./v1.5-state.js"></script>')){assert(s.includes('<body>'),'body tag missing');s=s.replace('<body>','<body>\n<script src="./v1.5-state.js"></script>')}
const resetRe=/function resetAll\(\)\{[\s\S]*?\n\}/;assert(resetRe.test(s),'resetAll marker missing');s=s.replace(resetRe,'function resetAll(){if(!confirm("تمام پیشرفت‌ها پاک شود؟"))return;localStorage.removeItem(STORAGE);localStorage.removeItem(CARDS_STORAGE);localStorage.removeItem(REVIEWS_STORAGE);state=window.__KANJI5_STATE__.reset(DEFAULTS,state.deck);initScheduler();buildQueue();next();updateStats();toast("پیشرفت پاک شد.")}');
// Keep the P0-4 shared initialization paths present even when an older tree lost them.
if(!s.includes('const prefetched=window.__KANJI5_P0_DATA_PROMISE')){
  const oldFetch='  const res=await fetch(DATA_URL,{cache:"force-cache"});';
  assert(s.includes(oldFetch),'dataset fallback fetch marker missing');
  const sharedData='  const prefetched=window.__KANJI5_P0_DATA_PROMISE;\n  if(prefetched){\n    const all=await prefetched;\n    if(Array.isArray(all)&&all.length===2136){state.deck=all;localStorage.setItem("kanji5-deck",JSON.stringify(state.deck));return}\n  }\n'+oldFetch;
  s=s.replace(oldFetch,sharedData);
}
if(!s.includes('const shared=window.__KANJI5_P0_FSRS_PROMISE')){
  const oldFsrs='const mod=await Promise.race([import(FSRS_URL),new Promise((_,reject)=>setTimeout(()=>reject(new Error("FSRS_LOAD_TIMEOUT")),10000))]);';
  assert(s.includes(oldFsrs),'FSRS direct initialization marker missing');
  const sharedFsrs='const shared=window.__KANJI5_P0_FSRS_PROMISE;const loadPromise=shared?shared.then(mod=>{if(!mod)throw new Error("FSRS_PREFETCH_FAILED");return mod}):import(FSRS_URL);const mod=await Promise.race([loadPromise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("FSRS_LOAD_TIMEOUT")),10000))]);';
  s=s.replace(oldFsrs,sharedFsrs);
}
// Adapt call sites to the extracted module's explicit state API.
s=s.replace(/loadSaved\(\);/g,'state=loadSaved(state,DEFAULTS);');
s=s.replace(/hydrateCards\(\);/g,'state=hydrateCards(state);');
fs.writeFileSync(path,s);
const out=fs.readFileSync(path,'utf8');
assert(out.includes('<script src="./v1.5-state.js"></script>'),'state module loader missing');
assert(out.includes('let state=window.__KANJI5_STATE__.createInitial({settings:DEFAULTS});'),'inline state object was not replaced');
assert(!out.includes('function save(){const metadata='),'inline save implementation remains');
assert(!out.includes('function loadSaved(){try{const raw=localStorage.getItem(STORAGE)'),'inline loadSaved implementation remains');
assert(!out.includes('function hydrateCards(){for(const id of Object.keys(state.cards))state.cards[id].card=reviveCard(state.cards[id].card)}'),'inline hydrate implementation remains');
assert(out.includes('state=loadSaved(state,DEFAULTS);'),'loadSaved call site was not adapted to extracted API');
assert(out.includes('state=hydrateCards(state);'),'hydrateCards call site was not adapted to extracted API');
assert(out.includes('const shared=window.__KANJI5_P0_FSRS_PROMISE'),'shared FSRS consumption was lost during state extraction');
assert(out.includes('const prefetched=window.__KANJI5_P0_DATA_PROMISE'),'shared dataset consumption was lost during state extraction');
console.log('P2-3 state lifecycle extraction patch passed.');
