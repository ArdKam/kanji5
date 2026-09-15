(()=>{
'use strict';
if(window.__KANJI5_V19_EVALUATION__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
let corePromise=null;const load=()=>corePromise||(corePromise=import('./v1.9-learning-evaluation-core.js'));
function readEvidence(){const components=state.readComponents?.()||{},value=components.v19LearnerEvidence;return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
function snapshotSessions(){const rows=(state.readSessionHistory?.()||[]).map(row=>structuredClone(row));const evidence=readEvidence();const byMode={};for(const character of Object.keys(evidence)){for(const item of(Array.isArray(evidence[character])?evidence[character]:[])){const mode=String(item.mode||'');if(!mode)continue;if(!byMode[mode])byMode[mode]=[];byMode[mode].push({...item,character})}}if(!rows.length&&Object.keys(byMode).length)return[{sessionId:'evidence-only',endedAt:new Date().toISOString(),educationEvents:byMode,modeResults:{}}];const last=rows.at(-1);if(last&&Object.keys(byMode).length)last.educationEvents=byMode;return rows}
async function evaluate(options={}){const core=await load();return core.evaluateSessions(snapshotSessions(),options)}
async function compare(records,options={}){const core=await load();return core.comparePolicies(records,options)}
async function baseline(options={}){const core=await load();return core.buildBaselinePlan(options)}
window.__KANJI5_V19_EVALUATION__=Object.freeze({evaluate,compare,baseline});
})();
