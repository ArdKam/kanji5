(()=>{
'use strict';
if(window.__KANJI5_V19_LEARNER_MODEL__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
const KEY='v19LearnerModel',EVIDENCE_KEY='v19LearnerEvidence',SCHEMA=1,EVIDENCE_LIMIT=32;
let apiPromise=null;
const api=()=>apiPromise||(apiPromise=import('./v1.9-learner-model-core.js'));
function readEvidence(){const components=state.readComponents?.()||{},value=components[EVIDENCE_KEY];return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
function writeEvidence(character,detail){if(!character||!detail?.mode)return false;const components=state.readComponents?.()||{},all=readEvidence(),byChar=Array.isArray(all[character])?all[character].slice():[];byChar.push({at:new Date().toISOString(),mode:String(detail.mode),outcome:String(detail.outcome||'wrong')});all[character]=byChar.slice(-EVIDENCE_LIMIT);return Boolean(state.writeComponents?.({...components,[EVIDENCE_KEY]:all}))}
function evidenceByModeFor(character){const evidence=readEvidence()[character]||[],out={};for(const item of evidence){const mode=String(item.mode||'');if(mode){if(!out[mode])out[mode]=[];out[mode].push(item)}}return out}
async function updateCore(){const core=await api(),history=state.readSessionHistory?.()||[],knowledge=state.readKnowledge?.()||{},model=core.buildLearnerModel(history,{now:Date.now()}),components=state.readComponents?.()||{},next={...model,schemaVersion:SCHEMA,updatedAt:new Date().toISOString(),kanji:{},evidenceSchemaVersion:1};const characters=Object.keys(knowledge);for(const character of characters)next.kanji[character]=core.projectKanjiAttributes(knowledge,character,{now:Date.now(),evidenceByMode:evidenceByModeFor(character)});state.writeComponents?.({...components,[KEY]:next});return next}
async function project(character){const core=await api();return core.projectKanjiAttributes(state.readKnowledge?.()||{},character,{now:Date.now(),evidenceByMode:evidenceByModeFor(character)})}
async function rank(character){const core=await api();return core.rankAttributes(await project(character))}
const stableApi={update:updateCore,read:()=>state.readComponents?.()?.[KEY]||null,project,rank,recordOutcome:detail=>{const character=String(detail?.character||'');if(writeEvidence(character,detail)){return updateCore()}return Promise.resolve(false)}};
window.__KANJI5_V19_LEARNER_MODEL__=Object.freeze(stableApi);
void updateCore();
document.addEventListener('kanji5:v1.6-session-finished',()=>setTimeout(()=>{void updateCore()},0));
document.addEventListener('kanji5:v1.6-education-result',e=>{const d=e?.detail||{};writeEvidence(String(d.character||''),{mode:d.mode,outcome:d.outcome||(d.correct?'correct':'wrong')});setTimeout(()=>{void updateCore()},0)});
void import('./v1.9-adaptive-planner.js').catch(()=>{});
})();
