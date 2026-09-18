(()=>{
'use strict';
if(window.__KANJI5_V19_V2_BOUNDARY__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
let corePromise=null;const load=()=>corePromise||(corePromise=import('./v1.9-v2-contract-core.js'));
let exercise=null,feedback=null,adaptiveReason=null;
let publishRevision=0;
function activeSession(){const rows=state.readSessionHistory?.()||[];return[...rows].reverse().find(x=>x?.status==='active')||null}
function completedSession(){const rows=state.readSessionHistory?.()||[];return[...rows].reverse().find(x=>!x?.status&&x?.modeResults)||null}
function learner(){return window.__KANJI5_V19_LEARNER_MODEL__?.read?.()||null}
async function snapshot(){const core=await load(),session=activeSession()||completedSession();return core.buildBoundarySnapshot({session,exercise,feedback,learner:learner()})}
async function publish(){const revision=++publishRevision;const viewModel=await snapshot();if(revision!==publishRevision)return null;window.__KANJI5_V19_V2_LAST_SNAPSHOT__=viewModel;document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-view-models',{detail:viewModel}));return viewModel}
async function setExercise(input){const core=await load();exercise=core.buildExerciseViewModel(input);await publish();return exercise}
async function setFeedback(input){const core=await load();feedback=core.buildFeedbackViewModel(input);await publish();return feedback}
async function setAdaptiveReason(input){const core=await load();adaptiveReason=core.buildAdaptiveReasonViewModel(input);await publish();return adaptiveReason}
async function clearTransient(){exercise=null;feedback=null;adaptiveReason=null;await publish();return true}
window.__KANJI5_V19_V2_BOUNDARY__=Object.freeze({snapshot,setExercise,setFeedback,setAdaptiveReason,clearTransient});
window.__KANJI5_V19_V2_LAST_SNAPSHOT__=null;
document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-boundary-ready'));
document.addEventListener('kanji5:v1.6-education-result',e=>{void setFeedback(e?.detail||{})});
document.addEventListener('kanji5:v1.9-feedback',e=>{void setFeedback(e?.detail||{})});
document.addEventListener('kanji5:v1.6-session-finished',()=>{setTimeout(()=>{clearTransient()},0)});
})();
