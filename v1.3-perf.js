(()=>{
  'use strict';
  const now=()=>performance.now();
  window.__KANJI5_PERF={startedAt:now(),marks:{}};
  const mark=(name)=>{try{performance.mark(`kanji5:${name}`);window.__KANJI5_PERF.marks[name]=now();}catch(_){} };
  mark('perf-module');
  function bootV16Session(){
    if(window.__KANJI5_V16_SESSION__||document.querySelector('script[data-kanji5-v16-session]'))return;
    const script=document.createElement('script');
    script.src='./v1.6-session.js';
    script.dataset.kanji5V16Session='true';
    script.async=false;
    document.head.appendChild(script);
  }
  const onReady=()=>{mark('dom-ready');bootV16Session()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReady,{once:true});else onReady();
  const observer=new MutationObserver(()=>{
    const app=document.getElementById('app');
    const kanji=document.querySelector('.kanji');
    if(app&&!app.hidden&&!window.__KANJI5_PERF.marks['app-ready'])mark('app-ready');
    if(kanji&&!window.__KANJI5_PERF.marks['first-card'])mark('first-card');
    if(window.__KANJI5_PERF.marks['first-card'])observer.disconnect();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
})();
