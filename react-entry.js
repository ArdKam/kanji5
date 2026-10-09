(()=>{
'use strict';
document.documentElement.classList.add('kanji5-react-default');
const buildId=(document.querySelector('meta[name="kanji5-build-id"]')?.getAttribute('content')||'dev').trim()||'dev';
const observability=()=>window.__KANJI5_OBSERVABILITY__;
const assetVersion='?v='+encodeURIComponent(buildId);
const startupRoot=document.getElementById('kanji5-startup-shell');
function downloadBackup(){
  const createBackup=window.__KANJI5_V19_V2_BOUNDARY__?.createBackup;
  if(typeof createBackup!=='function')throw new Error('KANJI5_BACKUP_UNAVAILABLE');
  return Promise.resolve(createBackup()).then(backup=>{
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=`rinemi-startup-backup-${new Date().toISOString().slice(0,10)}.json`;anchor.click();URL.revokeObjectURL(url);
  });
}
async function copyDiagnostics(error){
  const capture=observability()?.capture;
  const entry=typeof capture==='function'?capture('react-startup-report-requested',error,{module:'react-dist/kanji5-react.js',dataAffected:'unknown'}):null;
  const report={release:buildId,path:location.pathname,error:{name:String(error?.name||'Error'),message:String(error?.message||error||'')},recent:observability()?.list?.().slice(-8)||[],entry};
  await navigator.clipboard.writeText(JSON.stringify(report,null,2));
}
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
  observability()?.capture?.('react-startup-failure',error,{module:'react-dist/kanji5-react.js',dataAffected:'unknown'});
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
  const actions=document.createElement('div');
  actions.className='kanji5-startup-error-actions';
  const makeAction=(label,onClick,primary=false)=>{const button=document.createElement('button');button.className=primary?'kanji5-startup-error-action':'kanji5-startup-error-secondary';button.type='button';button.textContent=label;button.addEventListener('click',onClick);actions.appendChild(button);return button};
  const isFa=document.documentElement.lang==='fa';
  title.textContent=isFa?'کانجی‌یار باز نشد':'Rinemi could not start';
  copy.textContent=isFa?'یک فایل برنامه با نسخهٔ فعلی بارگذاری نشد. صفحه را دوباره بارگذاری کنید.':'A required application file could not be loaded for this release. Reload the page and try again.';
  makeAction(isFa?'بارگذاری دوباره':'Reload',()=>window.location.reload(),true);
  makeAction(isFa?'پشتیبان‌گیری':'Export backup',button=>{const target=button.currentTarget;target.disabled=true;void downloadBackup().then(()=>{target.disabled=false}).catch(err=>{target.disabled=false;observability()?.capture?.('startup-backup-failure',err,{dataAffected:'unknown'})})});
  makeAction(isFa?'گزارش خطا':'Copy diagnostics',button=>{const target=button.currentTarget;target.disabled=true;void copyDiagnostics(error).then(()=>{target.textContent=isFa?'کپی شد':'Copied'}).catch(err=>{observability()?.capture?.('startup-report-copy-failure',err,{dataAffected:'unknown'});target.disabled=false})});
  card.append(mark,title,copy,actions);
  startupRoot.appendChild(card);
  console.error('Rinemi presentation failed to boot.',{buildId,error});
}
import('./react-dist/kanji5-react.js'+assetVersion)
  .catch(error=>{
    observability()?.capture?.('dynamic-import-failure',error,{module:'react-dist/kanji5-react.js',dataAffected:'unknown'});
    showReactBootFailure(error);
  });

function scheduleAccountFallback(){
  const load=()=>{
    if(document.querySelector('#root .account-button:not([data-kanji5-account-fallback])'))return;
    void import('./account-fallback.js'+assetVersion).catch(error=>{
      observability()?.capture?.('dynamic-import-failure',error,{module:'account-fallback.js',dataAffected:'unknown'});
      console.error('Rinemi account fallback failed to boot.',error);
    });
  };
  window.setTimeout(load,1000);
}
scheduleAccountFallback();

function scheduleAccountSync(){
  const load=()=>import('./supabase-sync.js').catch(error=>{
    observability()?.capture?.('dynamic-import-failure',error,{module:'supabase-sync.js',dataAffected:'unknown'});
    console.error('Kanji 5 account sync failed to boot.',error);
  });
  if('requestIdleCallback' in window){
    window.requestIdleCallback(load,{timeout:1500});
  }else{
    window.setTimeout(load,0);
  }
}
scheduleAccountSync();

})();
