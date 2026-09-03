(()=>{
'use strict';
if(window.__KANJI5_EDU_MIGRATION__)return;
window.__KANJI5_EDU_MIGRATION__=true;
const KEY='kanji5-v1.2-knowledge',META='kanji5-v1.4-education-meta',VERSION=2;
const MODES=['meaning','reading','production','vocabulary','context'];
const safe=v=>v&&typeof v==='object'?v:{};
const safeStats=value=>{const s=safe(value),attempts=Math.max(0,Number(s.attempts)||0);return{attempts,correct:Math.min(Math.max(0,Number(s.correct)||0),attempts),lastAt:typeof s.lastAt==='string'?s.lastAt:''}};
function readMeta(){try{const raw=localStorage.getItem(META);const value=raw?JSON.parse(raw):null;return value&&typeof value==='object'?value:null}catch(_){return null}}
function readKnowledge(){try{const raw=localStorage.getItem(KEY);const value=raw?JSON.parse(raw):{};return safe(value)}catch(_){return{}}}
function migrateV1(entries,now){const out={};for(const [ch,raw] of Object.entries(safe(entries))){const e={...safe(raw)};for(const mode of MODES){if(e[mode])e[mode]=safeStats(e[mode])}e.distractors={...safe(e.distractors)};if(!e.createdAt)e.createdAt=e.exposedAt||now;if(!e.exposedAt&&MODES.some(m=>(e[m]?.attempts||0)>0))e.exposedAt=e.createdAt;e.schemaVersion=1;out[ch]=e}return out}
function migrateV2(entries){const out={};for(const [ch,raw] of Object.entries(safe(entries))){const e={...safe(raw)};for(const mode of MODES){if(!e[mode])continue;const stats=safeStats(e[mode]),existing=e[mode]?.byDevice&&typeof e[mode].byDevice==='object'?e[mode].byDevice:{};if(Object.keys(existing).length){e[mode]={...stats,byDevice:Object.fromEntries(Object.entries(existing).map(([id,v])=>[String(id),safeStats(v)]))}}else if(stats.attempts||stats.correct||stats.lastAt){e[mode]={...stats,byDevice:{legacy:stats}}}}e.schemaVersion=2;out[ch]=e}return out}
const MIGRATIONS=Object.freeze({1:migrateV1,2:migrateV2});
function migrate(){const meta=readMeta(),existing=readKnowledge(),from=Math.max(0,Math.min(VERSION,Number(meta?.version)||0));let out=existing;const now=new Date().toISOString();for(let version=from+1;version<=VERSION;version++)out=version===1?MIGRATIONS[version](out,now):MIGRATIONS[version](out);try{if(from<VERSION||Number(meta?.version)!==VERSION){localStorage.setItem(KEY,JSON.stringify(out));localStorage.setItem(META,JSON.stringify({version:VERSION,migratedAt:now,fromVersion:from}))}}catch(_){}return out}
const migrated=migrate();
window.__KANJI5_EDU_MIGRATION_API__=Object.freeze({version:VERSION,migrate:()=>migrate(),knowledge:migrated,migrations:Object.keys(MIGRATIONS).map(Number)});
// v1.4 remains on the shell for migration compatibility, but its legacy UI is inert.
window.__KANJI5_EDU_UI_V1_4__=true;
const loadV15=()=>import('./v1.5-education-ui.js').catch(()=>{});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadV15,{once:true});else loadV15();
})();
