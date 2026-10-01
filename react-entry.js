(()=>{
'use strict';
document.documentElement.classList.add('kanji5-react-default');
const startupRoot=document.getElementById('kanji5-startup-shell');
const startupObserver=startupRoot?new MutationObserver(()=>{
  if(document.querySelector('#root .app-shell')){
    startupRoot.classList.add('is-ready');
    window.setTimeout(()=>{
      startupRoot.remove();
      startupObserver?.disconnect();
    },180);
  }
}):null;
startupObserver?.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});
const style=document.createElement('style');
style.textContent='#root{display:block;min-height:100vh}';
document.head.appendChild(style);
let reactStylesheet=document.querySelector('link[data-kanji5-react-styles]');
if(!reactStylesheet){
  reactStylesheet=document.createElement('link');
  reactStylesheet.rel='stylesheet';
  reactStylesheet.href='./react-dist/kanji5-react.css?v=20260928-release19';
  reactStylesheet.dataset.kanji5React='true';
  document.head.appendChild(reactStylesheet);
}
import('./react-dist/kanji5-react.js?v=20260928-release19')
  .catch(error=>console.error('Kanji 5 React presentation failed to boot.',error));

function scheduleAccountFallback(){
  const load=()=>import('./account-fallback.js?v=20261001').catch(error=>console.error('Kanji 5 account fallback failed to boot.',error));
  window.setTimeout(load,1000);
}
scheduleAccountFallback();

function scheduleAccountSync(){
  const load=()=>import('./supabase-sync.js').catch(error=>console.error('Kanji 5 account sync failed to boot.',error));
  if('requestIdleCallback' in window){
    window.requestIdleCallback(load,{timeout:1500});
  }else{
    window.setTimeout(load,0);
  }
}
scheduleAccountSync();

})();
