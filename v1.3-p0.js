(()=>{
'use strict';
const DATA_URL='./kanji-data.json';
const FSRS_URL='https://esm.sh/ts-fsrs@5.4.1?bundle';
const ensureStatus=()=>{let loading=document.getElementById('loading');if(!loading)return;let status=document.getElementById('loadStatus');if(!status){status=document.createElement('div');status.id='loadStatus';status.style.cssText='display:none';loading.querySelector(':scope > div')?.appendChild(status)}};
if(!window.__KANJI5_P0_DATA_PROMISE){window.__KANJI5_P0_DATA_PROMISE=fetch(DATA_URL,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('KANJI_DATA_PREFETCH_FAILED');return r}).catch(()=>null)}
if(!window.__KANJI5_P0_FSRS_PROMISE){window.__KANJI5_P0_FSRS_PROMISE=import(FSRS_URL).catch(()=>null)}
const style=document.createElement('style');style.id='v13-p0-loading';style.textContent='#loading{min-height:28px!important;height:28px!important;padding:3px 10px!important;margin:0!important;border-radius:10px!important;box-shadow:none!important}#loading>div{width:100%;max-width:none;display:flex;align-items:center;justify-content:center;gap:6px}#loading .spinner{width:14px!important;height:14px!important;border-width:2px!important;margin:0!important}#loading>div>div:nth-child(2){font-size:11px!important;font-weight:650!important;white-space:nowrap}#loadStatus{display:none!important}';document.head.appendChild(style);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureStatus,{once:true});else ensureStatus();
})();