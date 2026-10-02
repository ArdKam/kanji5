(()=>{
'use strict';
if(typeof window==='undefined'||window.__KANJI5_OBSERVABILITY__)return;
const KEY='kanji5-diagnostics-v1',LIMIT=24,SCHEMA=1;
const buildId=()=>String(document.querySelector('meta[name="kanji5-build-id"]')?.getAttribute('content')||'dev').trim()||'dev';
const clean=(value,max=240)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
const read=()=>{try{const raw=localStorage.getItem(KEY),value=raw?JSON.parse(raw):[];return Array.isArray(value)?value.filter(x=>x&&typeof x==='object'):[]}catch(_){return[]}};
const write=value=>{try{localStorage.setItem(KEY,JSON.stringify(value.slice(-LIMIT)));return true}catch(_){return false}};
const context=()=>({schemaVersion:SCHEMA,release:buildId(),path:clean(location.pathname,180),language:clean(document.documentElement.lang||'unknown',16),standalone:Boolean(window.matchMedia?.('(display-mode: standalone)').matches||window.navigator?.standalone),userAgent:clean(navigator.userAgent,300)});
const normalizeError=value=>{const error=value instanceof Error?value:null;return{name:clean(error?.name||'Error',80),message:clean(error?.message||value,240)}};
const capture=(type,error,extra={})=>{const entry={...context(),at:new Date().toISOString(),type:clean(type,64),error:normalizeError(error),extra:extra&&typeof extra==='object'?Object.fromEntries(Object.entries(extra).slice(0,8).map(([k,v])=>[clean(k,48),clean(v,160)])):undefined};const history=read();history.push(entry);write(history);return entry};
const api=Object.freeze({capture,list:()=>read(),clear:()=>{try{localStorage.removeItem(KEY);return true}catch(_){return false}},schemaVersion:SCHEMA});
window.__KANJI5_OBSERVABILITY__=api;
window.addEventListener('error',event=>{if(event?.error||event?.message)capture('uncaught-error',event.error||event.message,{filename:event.filename||'',line:event.lineno||0,column:event.colno||0})});
window.addEventListener('unhandledrejection',event=>{if(event?.reason)capture('unhandled-rejection',event.reason)});
})();