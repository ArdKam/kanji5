(()=>{
  'use strict';
  const now=()=>performance.now();
  window.__KANJI5_PERF={startedAt:now(),marks:{}};
  const mark=(name)=>{try{performance.mark(`kanji5:${name}`);window.__KANJI5_PERF.marks[name]=now();}catch(_){} };
  mark('perf-module');
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mark('dom-ready'),{once:true});else mark('dom-ready');
  const observer=new MutationObserver(()=>{
    const app=document.getElementById('app');
    const kanji=document.querySelector('.kanji');
    if(app&&!app.hidden&&!window.__KANJI5_PERF.marks['app-ready'])mark('app-ready');
    if(kanji&&!window.__KANJI5_PERF.marks['first-card'])mark('first-card');
    if(window.__KANJI5_PERF.marks['first-card'])observer.disconnect();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
})();
