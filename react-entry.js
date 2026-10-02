(()=>{
'use strict';
document.documentElement.classList.add('kanji5-react-default');
const buildId=(document.querySelector('meta[name="kanji5-build-id"]')?.getAttribute('content')||'dev').trim()||'dev';
const assetVersion='?v='+encodeURIComponent(buildId);
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
  reactStylesheet.href='./react-dist/kanji5-react.css'+assetVersion;
  reactStylesheet.dataset.kanji5React='true';
  document.head.appendChild(reactStylesheet);
}
function showReactBootFailure(error){
  if(!startupRoot)return;
  startupRoot.classList.remove('is-ready');
  startupRoot.classList.add('is-error');
  startupRoot.removeAttribute('aria-hidden');
  startupRoot.replaceChildren();
  const card=document.createElement('div');
  card.className='kanji5-startup-card';
  const mark=document.createElement('span');
  mark.className='kanji5-startup-mark';
  mark.lang='ja';
  mark.textContent='迷';
  const title=document.createElement('h1');
  title.className='kanji5-startup-error-title';
  const copy=document.createElement('p');
  copy.className='kanji5-startup-error-copy';
  const action=document.createElement('button');
  action.className='kanji5-startup-error-action';
  action.type='button';
  const isFa=document.documentElement.lang==='fa';
  title.textContent=isFa?'RINEMI باز نشد':'RINEMI could not start';
  copy.textContent=isFa?'یک فایل برنامه با نسخهٔ فعلی بارگذاری نشد. صفحه را دوباره بارگذاری کنید.':'A required application file could not be loaded for this release. Reload the page and try again.';
  action.textContent=isFa?'بارگذاری دوباره':'Reload';
  action.addEventListener('click',()=>window.location.reload());
  card.append(mark,title,copy,action);
  startupRoot.appendChild(card);
  console.error('Kanji 5 React presentation failed to boot.',{buildId,error});
}
import('./react-dist/kanji5-react.js'+assetVersion)
  .catch(error=>showReactBootFailure(error));

function scheduleAccountFallback(){
  const load=()=>{
    if(document.querySelector('#root .account-button:not([data-kanji5-account-fallback])'))return;
    void import('./account-fallback.js'+assetVersion).catch(error=>console.error('Kanji 5 account fallback failed to boot.',error));
  };
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
