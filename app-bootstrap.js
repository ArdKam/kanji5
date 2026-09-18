(()=>{ 
'use strict';

const params=new URLSearchParams(location.search);
const IS_LEGACY=params.get('legacy')==='1';
const DATA_VERSION='v1.2-dataset-2136';
const DECK_KEY='kanji5-deck';
const VERSION_KEY='kanji5-deck-version';
const LEGACY_STYLESHEET='./legacy.css';

if(IS_LEGACY){
  const link=document.getElementById('legacyStylesheet');
  // Keep the compatibility asset path explicit for the legacy-route contract.
  void LEGACY_STYLESHEET;
  if(link)link.media='all';
}else{
  document.documentElement.classList.add('kanji5-v2-default');
}

const style=document.createElement('style');
style.textContent='.kanji5-v2-default .wrap>header{display:none!important}.kanji5-v2-default #app{display:none!important}.kanji5-v2-default #loading{display:none!important}';
document.head.appendChild(style);

try{
  if(localStorage.getItem(VERSION_KEY)!==DATA_VERSION){
    localStorage.removeItem(DECK_KEY);
    localStorage.setItem(VERSION_KEY,DATA_VERSION);
  }
}catch(_){}

let shown=false;
async function clearRuntimeCaches(){
  try{
    if('serviceWorker' in navigator){
      const registrations=await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration=>registration.unregister()));
    }
    if('caches' in window){