(()=>{
'use strict';
if(window.__KANJI5_BOOTSTRAP__)return;
window.__KANJI5_BOOTSTRAP__=true;
const DATA_VERSION='v1.2-dataset-2136';
const K=window.__KANJI5_STORAGE_KEYS__;
const storage=window.__KANJI5_STORAGE__||localStorage;
if(!K)throw new Error('KANJI5_STORAGE_KEYS_NOT_LOADED');
const DECK_KEY=K.deck;
const VERSION_KEY=K.deckVersion;
try{
  if(storage.getItem(VERSION_KEY)!==DATA_VERSION){
    // Never delete learner data merely because the content dataset version changed.
    // review-runtime.js will reject the stale deck cache, load the current dataset,
    // and atomically stamp the new deck version after successful validation.
    window.__KANJI5_DECK_REFRESH_NEEDED__=Object.freeze({
      from:storage.getItem(VERSION_KEY),
      to:DATA_VERSION
    });
  }
}catch(_){window.__KANJI5_BOOTSTRAP_STORAGE_DEGRADED__=true;}
const buildId=(document.querySelector('meta[name="kanji5-build-id"]')?.getAttribute('content')||'dev').trim()||'dev';
const registerServiceWorker=()=>{
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.register('./sw.js?v='+encodeURIComponent(buildId)).then(registration=>{
    const worker=registration.installing||registration.waiting||registration.active;
    worker?.addEventListener('statechange',()=>{
      if(worker.state==='redundant')window.__KANJI5_OBSERVABILITY__?.capture?.('service-worker-install-failure',new Error('Service worker became redundant before activation'),{scope:registration.scope,dataAffected:'unknown'});
    });
  }).catch(error=>{
    window.__KANJI5_SW_REGISTRATION_FAILED__=String(error?.message||error||'unknown');
    window.__KANJI5_OBSERVABILITY__?.capture?.('service-worker-registration-failure',error,{dataAffected:'unknown'});
  });
};
if('requestIdleCallback' in window){
  requestIdleCallback(registerServiceWorker,{timeout:2000});
}else{
  window.setTimeout(registerServiceWorker,1500);
}
import('./v1.6-session.js').catch(error=>{
  window.__KANJI5_V16_SESSION_LOAD_FAILED__=String(error?.message||error||'unknown');
  window.__KANJI5_OBSERVABILITY__?.capture?.('dynamic-import-failure',error,{module:'v1.6-session.js',dataAffected:'unknown'});
  window.__KANJI5_OBSERVABILITY__?.capture?.('session-runtime-load-failure',error,{module:'v1.6-session.js',dataAffected:'unknown'});
});
})();
