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
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=105').catch(()=>{});
import('./v1.6-session.js').catch(()=>{});
})();
