(()=>{
'use strict';
if(window.__KANJI5_V19_RECOVERY__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
const KEY='v19RecoveryState',CORE_PATH='./v1.9-recovery-core.js';
let corePromise=null;const loadCore=()=>corePromise||(corePromise=import(CORE_PATH));
function read(){try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(_){return null}}
function write(value){try{sessionStorage.setItem(KEY,JSON.stringify(value));return true}catch(_){return false}}
function active(){const v=read();return v&&typeof v==='object'?v:null}
async function handleResult(detail){const core=await loadCore(),feedback=core.classifyRecoveryOutcome(detail,{mode:detail.mode,answerEvidence:detail.answerEvidence});let current=active();
if(feedback.outcome==='correct'&&current?.state==='retrying'&&current.mode===feedback.mode){current=core.applyRecoveryOutcome({...current,updatedAt:new Date().toISOString()},feedback);write(current);document.dispatchEvent(new CustomEvent('kanji5:v1.9-feedback',{detail:{...feedback,recovered:true,retryCount:current.retryCount,state:current.state}}));return current}
const next=core.applyRecoveryOutcome(core.createRecoveryState(feedback.mode,{startedAt:new Date().toISOString()}),feedback);write(next);document.dispatchEvent(new CustomEvent('kanji5:v1.9-feedback',{detail:{...feedback,recovered:false,retryCount:next.retryCount,state:next.state}}));return next}
async function retry(){const current=active();if(!current)return false;const core=await loadCore();if(!core.canRetry(current))return false;const next=core.consumeRetry(current,new Date().toISOString());write(next);window.__KANJI5_V19_RECOVERY_NEXT_MODE__=next.mode;return true}
function clear(){try{sessionStorage.removeItem(KEY);return true}catch(_){return false}}
window.__KANJI5_V19_RECOVERY__=Object.freeze({read,clear,retry,handleResult});
document.addEventListener('kanji5:v1.6-education-result',e=>{void handleResult(e?.detail||{})});
})();
