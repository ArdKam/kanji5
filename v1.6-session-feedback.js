(()=>{
'use strict';
if(window.__KANJI5_V16_SESSION_FEEDBACK__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
window.__KANJI5_V16_SESSION_FEEDBACK__=true;
const KEY_SCHEMA=2,ACTIVE='active';
const MODES=['meaning','reading','production','vocabulary','context'];
const LABELS={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
const faNumber=v=>Number(v||0).toLocaleString('fa-IR');
const read=()=>state.readSessionHistory?.()||[];
const active=()=>[...read()].reverse().find(x=>x?.status===ACTIVE&&Number(x.schemaVersion)>=2)||null;
const completed=()=>[...read()].reverse().find(x=>!x?.status&&x?.modeResults)||null;
const clone=v=>JSON.parse(JSON.stringify(v));
function normalizeResults(value){const out={};for(const mode of MODES){const s=value?.[mode]||{};const attempts=Math.max(0,Number(s.attempts)||0);out[mode]={attempts,correct:Math.min(attempts,Math.max(0,Number(s.correct)||0)),lastAt:typeof s.lastAt==='string'?s.lastAt:''}}return out}
function writeActive(next){const current=active();if(!current||next?.sessionId!==current.sessionId)return false;const history=read().filter(x=>x?.status!==ACTIVE);history.push(next);return Boolean(state.writeSessionHistory?.(history))}
function record(mode,correct){if(!MODES.includes(mode))return false;const current=active();if(!current)return false;const next=clone(current);next.modeResults=normalizeResults(current.modeResults);next.modeResults[mode].attempts+=1;if(correct)next.modeResults[mode].correct+=1;next.modeResults[mode].lastAt=new Date().toISOString();next.modeResultsSchemaVersion=KEY_SCHEMA;return writeActive(next)}
async function rebalance(){const current=active();if(!current?.plan)return false;const core=await import('./v1.6-session-core.js');const latest=active();if(!latest||latest.sessionId!==current.sessionId)return false;const result=core.rebalanceSessionPlan(latest.plan,latest.remainingModes,latest.modeResults,{now:Date.now()});const next=clone(latest);next.plan=result.plan;next.remainingModes=result.remaining;next.rebalanceCount=(Number(latest.rebalanceCount)||0)+1;next.planRevision=(Number(latest.planRevision)||0)+1;return writeActive(next)}
function authoritativeNextMode(available){const current=active();if(!current?.plan)return null;const allowed=new Set(Array.isArray(available)&&available.length?available:MODES);const priority=Array.isArray(current.plan.priority)?current.plan.priority:current.plan.modes?.map(x=>x.mode)||[];return priority.find(mode=>allowed.has(mode)&&Number(current.remainingModes?.[mode]||0)>0)||null}
function authoritativeConsumeMode(mode){if(!MODES.includes(mode))return false;const current=active();if(!current||Number(current.remainingModes?.[mode]||0)<=0)return false;const next=clone(current);next.remainingModes={...(current.remainingModes||{}),[mode]:Math.max(0,Number(current.remainingModes?.[mode]||0)-1)};next.planRevision=Number(current.planRevision)||0;return writeActive(next)}
function exposeAuthoritativeApi(){if(window.__KANJI5_V16_SESSION_AUTH__)return true;window.__KANJI5_V16_SESSION_AUTH__=Object.freeze({nextMode:authoritativeNextMode,consumeMode:authoritativeConsumeMode});return true}
function migrateCompletedModeResults(sessionId,results){if(!sessionId||!results)return false;const h=read();let idx=[...h].map((x,i)=>({x,i})).reverse().find(({x})=>!x?.status&&x.sessionId===sessionId);if(!idx)idx=[...h].map((x,i)=>({x,i})).reverse().find(({x})=>!x?.status);if(!idx)return false;const next=clone(idx.x);next.modeResults=normalizeResults(results);next.modeResultsSchemaVersion=KEY_SCHEMA;const copy=h.slice();copy[idx.i]=next;return Boolean(state.writeSessionHistory?.(copy))}
function migrateAfterFinish(){const a=active();if(a){lastResults=normalizeResults(a.modeResults);lastSessionId=a.sessionId}if(lastSessionId&&lastResults)migrateCompletedModeResults(lastSessionId,lastResults);}
function render(){const host=document.getElementById('v16Session');if(!host)return;let box=document.getElementById('v16SessionModeStats');if(!box){box=document.createElement('div');box.id='v16SessionModeStats';box.style.cssText='margin-top:12px;padding:11px 12px;border:1px solid var(--line,#e5e7eb);border-radius:13px;background:#f9fafb;font-size:12px';const modes=document.getElementById('v16Modes');(modes?.parentElement||host).appendChild(box)}const a=active(),c=completed(),r=normalizeResults(a?.modeResults||c?.modeResults);box.innerHTML=`<strong style="display:block;margin-bottom:6px">عملکرد همین جلسه</strong><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px">${MODES.map(m=>{const s=r[m],p=s.attempts?Math.round(s.correct/s.attempts*100):0;return`<span>${LABELS[m]}: ${s.attempts?`${faNumber(s.correct)}/${faNumber(s.attempts)} · ${faNumber(p)}٪`:'—'}</span>`}).join('')}</div>`}
let lastResults=null,lastSessionId=null,lastRebalanceToken='';
function onResult(e){const d=e?.detail||{};const mode=String(d.mode||'');const correct=Boolean(d.correct);const before=active()?.modeResults||{};const r=normalizeResults(before);if(!MODES.includes(mode))return;r[mode].attempts+=1;if(correct)r[mode].correct+=1;r[mode].lastAt=new Date().toISOString();lastResults=r;lastSessionId=active()?.sessionId||null;record(mode,correct);const token=`${lastSessionId||''}:${mode}:${r[mode].attempts}:${r[mode].correct}`;if(token!==lastRebalanceToken){lastRebalanceToken=token;void rebalance()}render()}
document.addEventListener('kanji5:v1.6-education-result',onResult);
document.addEventListener('click',e=>{const button=e.target.closest?.('#v16Finish');if(!button)return;const a=active();if(a){lastSessionId=a.sessionId;lastResults=normalizeResults(a.modeResults)}setTimeout(()=>{if(lastSessionId&&lastResults)migrateCompletedModeResults(lastSessionId,lastResults);render()},0)},true);
setInterval(()=>{exposeAuthoritativeApi();const a=active();if(a){lastResults=normalizeResults(a.modeResults);lastSessionId=a.sessionId;render();return}if(lastResults&&lastSessionId){if(migrateCompletedModeResults(lastSessionId,lastResults))lastResults=null}render()},250);
exposeAuthoritativeApi();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{exposeAuthoritativeApi();render()},{once:true});else render();
void import('./v1.6-session-analytics.js').catch(()=>{});
})();