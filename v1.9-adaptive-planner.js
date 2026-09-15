(()=>{
'use strict';
if(window.__KANJI5_V19_ADAPTIVE_PLANNER__)return;
window.__KANJI5_V19_ADAPTIVE_PLANNER__=true;
let corePromise=null;
const loadCore=()=>corePromise||(corePromise=import('./v1.9-adaptive-planner-core.js'));
function activeSession(){const history=window.__KANJI5_STATE__?.readSessionHistory?.()||[];return[...history].reverse().find(x=>x?.status==='active')||null}
function recentModes(){const active=activeSession();const rows=Object.entries(active?.modeResults||{}).map(([mode,s])=>({mode,at:s?.lastAt||''})).filter(x=>x.at).sort((a,b)=>a.at.localeCompare(b.at));return rows.map(x=>x.mode)}
function remainingModes(available){const active=activeSession();const remaining=active?.remainingModes||{};const list=Array.isArray(available)&&available.length?available:['meaning','reading','production','vocabulary','context'];return list.filter(mode=>remaining[mode]==null||Number(remaining[mode])>0)}
async function adaptiveNext(available){const old=window.__KANJI5_V19_ADAPTIVE_PLANNER_OLD__?.nextMode?.(available)||null;try{const core=await loadCore(),model=window.__KANJI5_V19_LEARNER_MODEL__?.read?.(),attrs=model?.attributes||{};const modes=remainingModes(available);const task=core.nextTask({attributes:attrs,availableModes:modes,recentModes:recentModes(),remaining:1});return task?.mode||old||modes[0]||null}catch(_){return old}}
function install(){const auth=window.__KANJI5_V16_SESSION_AUTH__;if(!auth){setTimeout(install,0);return}if(window.__KANJI5_V19_ADAPTIVE_PLANNER_INSTALLED__)return;window.__KANJI5_V19_ADAPTIVE_PLANNER_OLD__=auth;window.__KANJI5_V16_SESSION_AUTH__=Object.freeze({nextMode:adaptiveNext,consumeMode:auth.consumeMode});window.__KANJI5_V19_ADAPTIVE_PLANNER_INSTALLED__=true}
install();
})();
