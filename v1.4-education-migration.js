(()=>{
'use strict';
if(window.__KANJI5_EDU_MIGRATION__)return;
window.__KANJI5_EDU_MIGRATION__=true;
const KEY='kanji5-v1.2-knowledge',META='kanji5-v1.4-education-meta',VERSION=1;
const MODES=['meaning','reading','production','vocabulary','context'];
const safe=v=>v&&typeof v==='object'?v:{};
function migrate(){
  let knowledge={};
  try{knowledge=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){knowledge={}}
  const out={};
  const now=new Date().toISOString();
  for(const [ch,raw] of Object.entries(safe(knowledge))){
    const e={...safe(raw)};
    for(const mode of MODES){if(e[mode]){const s=safe(e[mode]);e[mode]={attempts:Math.max(0,Number(s.attempts)||0),correct:Math.min(Math.max(0,Number(s.correct)||0),Math.max(0,Number(s.attempts)||0)),lastAt:typeof s.lastAt==='string'?s.lastAt:''}}}
    e.distractors={...safe(e.distractors)};
    if(!e.createdAt)e.createdAt=e.exposedAt||now;
    if(!e.exposedAt&&MODES.some(m=>(e[m]?.attempts||0)>0))e.exposedAt=e.createdAt;
    e.schemaVersion=1;
    out[ch]=e;
  }
  try{localStorage.setItem(KEY,JSON.stringify(out));localStorage.setItem(META,JSON.stringify({version:VERSION,migratedAt:now}))}catch(_){}
  return out;
}
migrate();
window.__KANJI5_EDU_MIGRATION_API__=Object.freeze({version:VERSION,migrate});
})();
