(()=>{
'use strict';
if(window.__KANJI5_V19_LEARNER_MODEL__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
const KEY='v19LearnerModel',EVIDENCE_KEY='v19LearnerEvidence',SCHEMA=1,EVIDENCE_LIMIT=32;
let apiPromise=null;
const api=()=>apiPromise||(apiPromise=import('./v1.9-learner-model-core.js'));
function readEvidence(){const components=state.readComponents?.()||{};const value=components[EVIDENCE_KEY];return value&&typeof value==='object'&&!Array.isArray(value)?value:{} }
function writeEvidence(character,detail){if(!character||!detail?.mode)return false;const components=state.readComponents?.()||{},all=readEvidence(),byChar=Array.isArray(all[character])?all[character].slice():[];byChar.push({at:new Date().toISOString(),mode:String(detail.mode),outcome:String(detail.outcome||'wrong')});all[character]=byChar.slice(-EVIDENCE_LIMIT);return Boolean(state.writeComponents?.({...components,[EVIDENCE_KEY]:all}))}
async function update(){try{const core=await api(),history=state.readSessionHistory?.()||[],knowledge=state.readKnowledge?.()||{},evidence=readEvidence(),model=core.buildLearnerModel(history,{now:Date.now()}),components=state.readComponents?.()||{},next={...model,schemaVersion:SCHEMA,updatedAt:new Date().toISOString(),kanji:{},evidenceSchemaVersion:1};const characters=Object.keys(knowledge);for(const character of characters){const charEvidence=evidence[character]||[];const evidenceByMode={};for(const item of charEvidence){const mode=String(item.mode||'');if(!evidenceByMode[mode])evidenceByMode[mode]=[];evidenceByMode[mode].push(item)}next.kanji[character]=core.projectKanjiAttributes(knowledge,character,{now:Date.now(),evidenceByMode})}state.writeComponents?.({...components,[KEY]:next});window.__KANJI5_V19_LEARNER_MODEL__=Object.freeze({read:()=>state.readComponents?.()?.[KEY]||next,project:character=>core.projectKanjiAttributes(state.readKnowledge?.()||{},character,{now:Date.now(),evidenceByMode:Object.fromEntries((readEvidence()[character]||[]).reduce((a,x)=>{const m=String(x.mode||'');(a[m]??=[]).push(x);return a},{ }))}),rank:character=>core.rankAttributes(core.projectKanjiAttributes(state.readKnowledge?.()||{},character,{now:Date.now()})),recordOutcome:detail=>{const character=String(detail?.character||'');if(writeEvidence(character,detail)){void update();return true}return false}});return true}catch(_){return false}}
window.__KANJI5_V19_LEARNER_MODEL__=Object.freeze({update,read:()=>state.readComponents?.()?.[KEY]||null,project:character=>null,rank:character=>[],recordOutcome:()=>false});
void update();
document.addEventListener('kanji5:v1.6-session-finished',()=>setTimeout(update,0));
document.addEventListener('kanji5:v1.6-education-result',e=>{const d=e?.detail||{};writeEvidence(String(d.character||''),{mode:d.mode,outcome:d.outcome|| (d.correct?'correct':'wrong')});setTimeout(update,0)});
})();
