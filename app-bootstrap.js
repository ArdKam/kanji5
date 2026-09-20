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
      const keys=await caches.keys();
      await Promise.all(keys.filter(key=>key.startsWith('kanji5-')).map(key=>caches.delete(key)));
    }
  }catch(_){}
}
function showFallback(){
  if(shown)return;
  const loading=document.getElementById('loading');
  const app=document.getElementById('app');
  if(!loading||loading.hidden||!app||!app.hidden)return;
  shown=true;
  loading.innerHTML='<div><div style="font-size:42px">⚠️</div><div style="font-weight:800;margin:10px 0">بارگذاری برنامه ناموفق بود.</div><div style="color:#6b7280;font-size:13px;line-height:1.8">ممکن است نسخهٔ ذخیره‌شدهٔ برنامه یا اتصال اینترنت مشکل داشته باشد.</div><button class="primary" id="v12StartupRetry" style="margin-top:14px">پاک‌سازی و تلاش دوباره</button></div>';
  document.getElementById('v12StartupRetry')?.addEventListener('click',async()=>{
    const button=document.getElementById('v12StartupRetry');
    if(button){button.disabled=true;button.textContent='در حال پاک‌سازی…';}
    await clearRuntimeCaches();
    location.reload();
  },{once:true});
}
const observer=new MutationObserver(()=>{
  const loading=document.getElementById('loading');
  const app=document.getElementById('app');
  if(loading?.hidden||!app?.hidden)observer.disconnect();
});
observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
window.addEventListener('error',()=>setTimeout(showFallback,0),true);
window.addEventListener('unhandledrejection',()=>setTimeout(showFallback,0),true);
setTimeout(showFallback,7000);

if(!IS_LEGACY)import('./v1.6-session.js').catch(()=>{});

if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});

setTimeout(()=>{
  const loading=document.getElementById('loading');
  const app=document.getElementById('app');
  if(loading&&!loading.hidden&&app?.hidden){
    loading.innerHTML='<div><div style="font-size:42px">⚠️</div><div style="font-weight:800;margin:10px 0">بارگذاری برنامه طول کشید.</div><div style="color:#6b7280;font-size:13px;line-height:1.7">اتصال اینترنت یا کتابخانهٔ مرور را بررسی کن و دوباره تلاش کن.</div><button class="primary" id="v12Retry" style="margin-top:14px">تلاش دوباره</button></div>';
    document.getElementById('v12Retry')?.addEventListener('click',()=>location.reload());
  }
},12000);
})();