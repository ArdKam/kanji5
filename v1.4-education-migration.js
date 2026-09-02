(()=>{
'use strict';
if(window.__KANJI5_EDU_MIGRATION__)return;
window.__KANJI5_EDU_MIGRATION__=true;
const KEY='kanji5-v1.2-knowledge',META='kanji5-v1.4-education-meta',VERSION=1;
const MODES=['meaning','reading','production','vocabulary','context'];
const safe=v=>v&&typeof v==='object'?v:{};
function readMeta(){try{const raw=localStorage.getItem(META);const value=raw?JSON.parse(raw):null;return value&&typeof value==='object'?value:null}catch(_){return null}}
function readKnowledge(){try{const raw=localStorage.getItem(KEY);const value=raw?JSON.parse(raw):{};return safe(value)}catch(_){return{}}}
function migrate(){
  const meta=readMeta();
  const existing=readKnowledge();
  if(Number(meta?.version)>=VERSION){return existing}
  const now=new Date().toISOString();
  const out={};
  for(const [ch,raw] of Object.entries(existing)){
    const e={...safe(raw)};
    for(const mode of MODES){if(e[mode]){const s=safe(e[mode]);e[mode]={attempts:Math.max(0,Number(s.attempts)||0),correct:Math.min(Math.max(0,Number(s.correct)||0),Math.max(0,Number(s.attempts)||0)),lastAt:typeof s.lastAt==='string'?s.lastAt:''}}}
    e.distractors={...safe(e.distractors)};
    if(!e.createdAt)e.createdAt=e.exposedAt||now;
    if(!e.exposedAt&&MODES.some(m=>(e[m]?.attempts||0)>0))e.exposedAt=e.createdAt;
    e.schemaVersion=VERSION;
    out[ch]=e;
  }
  try{localStorage.setItem(KEY,JSON.stringify(out));localStorage.setItem(META,JSON.stringify({version:VERSION,migratedAt:now}))}catch(_){}
  return out;
}
const migrated=migrate();
window.__KANJI5_EDU_MIGRATION_API__=Object.freeze({version:VERSION,migrate:()=>migrate(),knowledge:migrated});
})();
