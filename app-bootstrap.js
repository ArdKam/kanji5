(()=>{
'use strict';
if(window.__KANJI5_BOOTSTRAP__)return;
window.__KANJI5_BOOTSTRAP__=true;
const DATA_VERSION='v1.2-dataset-2136';
const DECK_KEY='kanji5-deck';
const VERSION_KEY='kanji5-deck-version';
try{
  if(localStorage.getItem(VERSION_KEY)!==DATA_VERSION){
    localStorage.removeItem(DECK_KEY);
    localStorage.setItem(VERSION_KEY,DATA_VERSION);
  }
}catch(_){}
const buildId=(document.querySelector('meta[name="kanji5-build-id"]')?.getAttribute('content')||'dev').trim()||'dev';
const registerServiceWorker=()=>{
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.register('./sw.js?v='+encodeURIComponent(buildId)).catch(()=>{});
};
if('requestIdleCallback' in window){
  requestIdleCallback(registerServiceWorker,{timeout:2000});
}else{
  window.setTimeout(registerServiceWorker,1500);
}
if(new URLSearchParams(location.search).get('legacy')==='1')import('./v1.6-session.js').catch(()=>{});
})();
