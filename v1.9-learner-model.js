(()=>{
'use strict';
if(window.__KANJI5_V19_LEARNER_MODEL__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
const KEY='v19LearnerModel',EVIDENCE_KEY='v19LearnerEvidence',SCHEMA=1,EVIDENCE_LIMIT=32;
let apiPromise=null,integrityPromise=null;
const api=()=>apiPromise||(apiPromise=import('./v1.9-learner-model-core.js'));
const integrity=()=>integrityPromise||(integrityPromise=import('./v1.9-data-integrity-core.js'));
function readEvidence(){const components=state.readComponents?.()||{},value=components[EVIDENCE_KEY];return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
function sanitizeEvidence(value){if(!value||typeof value!=='object'||Array.isArray(value))return{};const out={};for(const [key,item] of Object.entries(value)){if(!/^[a-zA-Z0-9_]{1,40}$/.test(key))continue;if(key==='feedbackStroke'&&Number.isFinite(Number(item)))out[key]=Math.max(1,Math.min(64,Math.round(Number(item))));else if(typeof item==='number'&&Number.isFinite(item))out[key]=Math.max(0,Math.min(1,item));else if(typeof item==='string')out[key]=item.slice(0,80);else if(typeof item==='boolean')out[key]=item}return out}
function writeEvidence(character,detail){if(!character||!detail?.mode)return false;const components=state.readComponents?.()||{},all=readEvidence(),byChar=Array.isArray(all[character])?all[character].slice():[];byChar.push({at:new Date().toISOString(),mode:String(detail.mode),modality:['free_recall','cued_recall','cued_recognition','recognition','production','handwriting'].includes(String(detail.modality||detail.evidence?.modality||''))?String(detail.modality||detail.evidence?.modality):'unknown',outcome:String(detail.outcome||'wrong'),correct:detail.correct===true,quality:String(detail.quality||detail.outcome||'wrong'),score:Number.isFinite(Number(detail.score))?Number(detail.score):detail.correct?1:0,graderVersion:String(detail.graderVersion||'legacy-unversioned'),schemaVersion:Number(detail.schemaVersion)||1,evidence:sanitizeEvidence(detail.evidence)});all[character]=byChar.slice(-EVIDENCE_LIMIT);return Boolean(state.writeComponents?.({...components,[EVIDENCE_KEY]:all}))}
function evidenceByModeFor(character){const evidence=readEvidence()[character]||[],out={};for(const item of evidence){const mode=String(item.mode||'');if(mode){if(!out[mode])out[mode]=[];out[mode].push(item)}}return out}
async function migratePersistedData(){try{const core=await integrity(),components=state.readComponents?.()||{},history=state.readSessionHistory?.()||[],migratedComponents=core.migrateComponents(components),migratedHistory=core.migrateSessionHistory(history);if(migratedComponents.changed)state.writeComponents?.(migratedComponents.value);if(migratedHistory.changed)state.writeSessionHistory?.(migratedHistory.value);return true}catch(_){return false}}
async function updateCore(){await migratePersistedData();const core=await api(),history=state.readSessionHistory?.()||[],knowledge=state.readKnowledge?.()||{},next={...core.buildLearnerModel(history,{now:Date.now()}),schemaVersion:SCHEMA,updatedAt:new Date().toISOString(),kanji:{},evidenceSchemaVersion:1};const characters=Object.keys(knowledge);for(const character of characters)next.kanji[character]=core.projectKanjiAttributes(knowledge,character,{now:Date.now(),evidenceByMode:evidenceByModeFor(character)});const aggregate=core.buildLearnerModelFromKanji(next.kanji,{now:Date.now()});next.attributes=aggregate.attributes;next.sessions=history.filter(x=>x&&x.status!=='active').length;const latestComponents=state.readComponents?.()||{};state.writeComponents?.({...latestComponents,[KEY]:next});document.dispatchEvent(new CustomEvent('kanji5:v1.9-learning-changed',{detail:{version:next.version,attributes:next.attributes}}));return next}
async function project(character){const core=await api();return core.projectKanjiAttributes(state.readKnowledge?.()||{},character,{now:Date.now(),evidenceByMode:evidenceByModeFor(character)})}
async function rank(character){const core=await api();return core.rankAttributes(await project(character))}
const stableApi={update:updateCore,read:()=>state.readComponents?.()?.[KEY]||null,project,rank,recordOutcome:detail=>{const character=String(detail?.character||'');if(writeEvidence(character,detail)){return updateCore()}return Promise.resolve(false)}};
window.__KANJI5_V19_LEARNER_MODEL__=Object.freeze(stableApi);
void migratePersistedData();
void updateCore();
document.addEventListener('kanji5:v1.6-session-finished',()=>setTimeout(()=>{void updateCore()},0));
document.addEventListener('kanji5:v1.6-education-result',e=>{const d=e?.detail||{};writeEvidence(String(d.character||''),d);setTimeout(()=>{void updateCore()},0)});
void import('./v1.9-adaptive-planner.js').catch(()=>{});
void import('./v1.9-recovery.js').catch(()=>{});
void import('./v1.9-learning-evaluation.js').catch(()=>{});
void import('./v1.9-v2-boundary.js').catch(()=>{});
})();
