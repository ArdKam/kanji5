(()=>{
'use strict';
if(window.__KANJI5_V19_EVALUATION__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
let corePromise=null;const load=()=>corePromise||(corePromise=import('./v1.9-learning-evaluation-core.js'));
async function evaluate(options={}){const core=await load();return core.evaluateSessions(state.readSessionHistory?.()||[],options)}
async function compare(records,options={}){const core=await load();return core.comparePolicies(records,options)}
async function baseline(options={}){const core=await load();return core.buildBaselinePlan(options)}
window.__KANJI5_V19_EVALUATION__=Object.freeze({evaluate,compare,baseline});
})();
