(()=>{
'use strict';
const DATA_URL='./kanji-data.json';
const FSRS_URL='https://esm.sh/ts-fsrs@5.4.1?bundle';
const ensureStatus=()=>{let loading=document.getElementById('loading');if(!loading)return;let status=document.getElementById('loadStatus');if(!status){status=document.createElement('div');status.id='loadStatus';status.style.cssText='display:none';loading.querySelector(':scope > div')?.appendChild(status)}};
if(!window.__KANJI5_P0_DATA_PROMISE){
  window.__KANJI5_P0_DATA_PROMISE=fetch(DATA_URL,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('KANJI_DATA_PREFETCH_FAILED');return r.json()}).then(data=>{
    const items=Array.isArray(data)?data:(data&&Array.isArray(data.kanji)?data.kanji:[]);
    if(items.length!==2136)throw new Error(`Runtime kanji dataset must contain 2136 entries, got ${items.length}`);
    window.__KANJI5_P0_DATA=items;
    return items;
  }).catch(()=>null);
}
if(!window.__KANJI5_P0_FSRS_PROMISE)window.__KANJI5_P0_FSRS_PROMISE=import(FSRS_URL).catch(()=>null);
const style=document.createElement('style');style.id='v13-p0-loading';style.textContent='#loading{min-height:0!important;height:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important}#loading .spinner{display:none!important}';document.head.appendChild(style);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureStatus,{once:true});else ensureStatus();
})();