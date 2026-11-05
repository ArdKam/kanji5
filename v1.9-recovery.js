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
async function handleResult(detail){
  if(detail?.attemptType==='revealed_self_report'&&detail?.recovery!==true)return null;
  const core=await loadCore(),feedback=core.classifyRecoveryOutcome(detail,{mode:detail.mode,taskId:detail.taskId,character:detail.character,contentId:detail.contentId,answerEvidence:detail.answerEvidence}),current=active();
  const sameRetry=current?.state==='retrying'&&current.taskId===feedback.taskId&&current.mode===feedback.mode
    &&(!current.character||!feedback.character||current.character===feedback.character)
    &&(!current.contentId||!feedback.contentId||current.contentId===feedback.contentId);
  if(current?.state==='retrying'&&!sameRetry){
    document.dispatchEvent(new CustomEvent('kanji5:v1.9-feedback',{detail:{...feedback,recovered:false,retryCount:current.retryCount,state:current.state,recoveryMismatch:true}}));
    return current;
  }
  const base=sameRetry?{...current,updatedAt:new Date().toISOString()}:core.createRecoveryState(feedback.mode,{taskId:feedback.taskId,character:feedback.character,contentId:feedback.contentId,startedAt:new Date().toISOString()});
  const next=core.applyRecoveryOutcome(base,feedback);
  write(next);
  document.dispatchEvent(new CustomEvent('kanji5:v1.9-feedback',{detail:{...feedback,recovered:next.state==='recovered',retryCount:next.retryCount,state:next.state}}));
  return next
 }function clear(){try{sessionStorage.removeItem(KEY);return true}catch(_){return false}}
function failUnavailable(target,reason){
 const current=active();
 if(!current||!target?.taskId||current.taskId!==String(target.taskId))return false;
 const next={...current,state:'failed',lastOutcome:'invalid',lastReason:String(reason||'recovery-target-unavailable'),recoveryEligible:false,updatedAt:new Date().toISOString()};
 write(next);
 document.dispatchEvent(new CustomEvent('kanji5:v1.9-feedback',{detail:{outcome:'invalid',correct:false,recovered:false,state:next.state,retryCount:next.retryCount,reason:'recovery-target-unavailable',cause:next.lastReason,taskId:next.taskId}}));
 return true
}
async function retry(){const current=active();if(!current)return false;const core=await loadCore();if(!core.canRetry(current))return false;return write(core.consumeRetry(current,new Date().toISOString()));}
window.__KANJI5_V19_RECOVERY__=Object.freeze({read,clear,retry,handleResult,failUnavailable});
document.addEventListener('kanji5:v1.6-education-result',e=>{void handleResult(e?.detail||{})});
})();
