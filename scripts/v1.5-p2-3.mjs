import fs from 'node:fs';
// P2-3: extract state lifecycle without touching shared dataset/FSRS initialization.
const path='index.html';let s=fs.readFileSync(path,'utf8');const assert=(x,m)=>{if(!x)throw new Error(m)};
const stateMarker='let state={settings:{...DEFAULTS},deck:[],cards:{},reviews:[],today:"",todayNew:0,todayReviewCount:0,goalCelebrated:false,queue:[],current:null,revealed:false,examples:{},streak:{current:0,longest:0,lastActiveDate:null}};let scheduler;';
assert(s.includes(stateMarker),'inline state declaration marker missing');
s=s.replace(stateMarker,'let state=window.__KANJI5_STATE__.createInitial({settings:DEFAULTS});let scheduler;');
const todayLine='const $=id=>document.getElementById(id);const todayKey=()=>new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());';
assert(s.includes(todayLine),'inline state helper header missing');
s=s.replace(todayLine,'const $=id=>document.getElementById(id);const {todayKey,deviceId,eventId,save,loadSaved,reviveCard,hydrateCards}=window.__KANJI5_STATE__;');
const deviceLine='const DEVICE_KEY="kanji5-device-id";\nfunction deviceId(){try{let id=localStorage.getItem(DEVICE_KEY);if(!id){id=(crypto.randomUUID?.()||`device-${Date.now()}-${Math.random().toString(36).slice(2)}`);localStorage.setItem(DEVICE_KEY,id)}return id}catch(_){return "legacy"}}\nfunction eventId(){return crypto.randomUUID?.()||`review-${Date.now()}-${Math.random().toString(36).slice(2)}`}\n';
if(s.includes(deviceLine))s=s.replace(deviceLine,'');
for(const [name,regex] of [
  ['save',/function save\(\)\{[\s\S]*?\n\}/],
  ['loadSaved',/function loadSaved\(\)\{[\s\S]*?\n\}/],
  ['reviveCard',/function reviveCard\(card\)\{[\s\S]*?\n\}/],
  ['hydrateCards',/function hydrateCards\(\)\{[\s\S]*?\n\}/]
]){if(regex.test(s))s=s.replace(regex,'')}
if(!s.includes('<script src="./v1.5-state.js"></script>')){
  assert(s.includes('<body>'),'body tag missing');
  s=s.replace('<body>','<body>\n<script src="./v1.5-state.js"></script>');
}
const resetRe=/function resetAll\(\)\{[\s\S]*?\n\}/;assert(resetRe.test(s),'resetAll marker missing');s=s.replace(resetRe,'function resetAll(){if(!confirm("تمام پیشرفت‌ها پاک شود؟"))return;localStorage.removeItem(STORAGE);localStorage.removeItem(CARDS_STORAGE);localStorage.removeItem(REVIEWS_STORAGE);state=window.__KANJI5_STATE__.reset(DEFAULTS,state.deck);initScheduler();buildQueue();next();updateStats();toast("پیشرفت پاک شد.")}');
fs.writeFileSync(path,s);
const out=fs.readFileSync(path,'utf8');
assert(out.includes('<script src="./v1.5-state.js"></script>'),'state module loader missing');
assert(out.includes('let state=window.__KANJI5_STATE__.createInitial({settings:DEFAULTS});'),'inline state object was not replaced');
assert(!out.includes('function save(){const metadata='),'inline save implementation remains');
assert(!out.includes('function loadSaved(){try{const raw=localStorage.getItem(STORAGE)'),'inline loadSaved implementation remains');
assert(!out.includes('function hydrateCards(){for(const id of Object.keys(state.cards))state.cards[id].card=reviveCard(state.cards[id].card)}'),'inline hydrate implementation remains');
assert(out.includes('const shared=window.__KANJI5_P0_FSRS_PROMISE'),'shared FSRS consumption was lost during state extraction');
assert(out.includes('const prefetched=window.__KANJI5_P0_DATA_PROMISE'),'shared dataset consumption was lost during state extraction');
console.log('P2-3 state lifecycle extraction patch passed.');
