(()=>{
'use strict';
if(window.__KANJI5_BOOTSTRAP__)return;
window.__KANJI5_BOOTSTRAP__=true;

const DATA_VERSION='v1.2-dataset-2136';
const DECK_KEY='kanji5-deck';
const VERSION_KEY='kanji5-deck-version';
const LANGUAGE_KEY='kanji5-ui-language';

try{
  if(localStorage.getItem(VERSION_KEY)!==DATA_VERSION){
    localStorage.removeItem(DECK_KEY);
    localStorage.setItem(VERSION_KEY,DATA_VERSION);
  }
}catch(_){}

try{
  const language=localStorage.getItem(LANGUAGE_KEY);
  if(language==='en'||language==='fa'){
    document.documentElement.lang=language;
    document.documentElement.dir=language==='fa'?'rtl':'ltr';
  }
}catch(_){}

const loadSession=()=>import('./v1.6-session.js').catch(()=>{});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadSession,{once:true});
else loadSession();
})();