(()=>{
'use strict';
if(window.__KANJI5_V19_LEARNER_MODEL__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
const KEY='v19LearnerModel',SCHEMA=1;
let apiPromise=null;
const api=()=>apiPromise||(apiPromise=import('./v1.9-learner-model-core.js'));
async function update(){try{const core=await api(),history=state.readSessionHistory?.()||[],knowledge=state.readKnowledge?.()||{},model=core.buildLearnerModel(history,{now:Date.now()});const components=state.readComponents?.()||{};const next={...model,schemaVersion:SCHEMA,updatedAt:new Date().toISOString(),kanji:{}};const characters=Object.keys(knowledge);for(const character of characters)next.kanji[character]=core.projectKanjiAttributes(knowledge,character);state.writeComponents?.({...components,[KEY]:next});window.__KANJI5_V19_LEARNER_MODEL__=Object.freeze({read:()=>state.readComponents?.()?.[KEY]||next,project:character=>core.projectKanjiAttributes(state.readKnowledge?.()||{},character),rank:character=>core.rankAttributes(core.projectKanjiAttributes(state.readKnowledge?.()||{},character))});return true}catch(_){return false}}
window.__KANJI5_V19_LEARNER_MODEL__=Object.freeze({update,read:()=>state.readComponents?.()?.[KEY]||null,project:character=>null,rank:character=>[]});
void update();
document.addEventListener('kanji5:v1.6-session-finished',()=>setTimeout(update,0));
document.addEventListener('kanji5:v1.6-education-result',()=>setTimeout(update,0));
})();
