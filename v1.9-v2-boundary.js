(()=>{
'use strict';
if(window.__KANJI5_V19_V2_BOUNDARY__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
let corePromise=null;const load=()=>corePromise||(corePromise=import('./v1.9-v2-contract-core.js'));
let learning=null,exercise=null,feedback=null,adaptiveReason=null;
let educationRuntimePromise=null;
let networkPromise=null;
function loadNetwork(){
  return networkPromise||(networkPromise=import('./v1.5-network.js')).catch(error=>{networkPromise=null;throw error});
}
let componentDataPromise=null;
let radicalDataPromise=null;
async function ensureEducationRuntime(){
  if(window.__KANJI5_EDU_BRIDGE__?.start)return true;
  if(educationRuntimePromise)return educationRuntimePromise;
  educationRuntimePromise=(async()=>{
    await import('./v1.4-education-migration.js');
    await import('./v1.4-education-core.js');
    await import('./v1.9-recovery.js');
    await import('./v1.5-education-ui.js');
    return Boolean(window.__KANJI5_EDU_BRIDGE__?.start);
  })().catch(error=>{
    educationRuntimePromise=null;
    console.error('Kanji 5 education runtime failed to load.',error);
    return false;
  });
  return educationRuntimePromise;
}
let publishRevision=0;
function runtimePresentationData(now=Date.now()){
  const app=state.readAppState?.()||{},deck=state.readDeck?.()||[],cards=app.cards&&typeof app.cards==='object'?app.cards:{};
  const settings={...(state.DEFAULTS||{}),...(app.settings||{}),...(state.readSettings?.()||{})};
  const reviews=state.readReviews?.()||[];
  const dueCount=deck.filter(item=>{const due=cards[item.id]?.card?.due;const t=due?Date.parse(due):NaN;return Number.isFinite(t)&&t<=now}).length;
  const newCount=Math.min(Math.max(0,Number(app.todayNew)||0),Math.max(1,Number(settings.dailyNew)||5));
  const masteredCount=deck.filter(item=>{const card=cards[item.id]?.card;return Boolean(card&&card.state===2&&(Number(card.scheduled_days)||0)>=21)}).length;
  const upcoming=deck.map(item=>{const due=cards[item.id]?.card?.due;const t=due?Date.parse(due):NaN;return Number.isFinite(t)&&t>now?{character:item.character,dueAt:new Date(t).toISOString()}:null}).filter(Boolean).sort((a,b)=>Date.parse(a.dueAt)-Date.parse(b.dueAt)).slice(0,6);
  const totalReviews=reviews.length;
  const nonAgainReviews=reviews.filter(item=>String(item.rating||'')!=='Again').length;
  const days=[];
  for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const key=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(d);days.push({label:new Intl.DateTimeFormat('fa-IR',{weekday:'short'}).format(d),count:reviews.filter(item=>String(item.at||'').slice(0,10)===key).length})}
  return {dailySummary:{dueCount,newCount,masteredCount,streak:Number(app.streak?.current)||0},dailyGoal:{completed:Number(app.todayReviewCount)||0,target:Math.max(1,Number(settings.dailyGoal)||20),celebrated:Boolean(app.goalCelebrated)},upcomingReviews:upcoming,settings,stats:{totalReviews,nonAgainRate:totalReviews?nonAgainReviews/totalReviews:0,studiedCount:Object.keys(cards).length,deckSize:deck.length,longestStreak:Number(app.streak?.longest)||0,currentStreak:Number(app.streak?.current)||0,leechCount:Object.values(cards).filter(item=>item?.leech).length,last7:days}};
}

function activeSession(){const current=window.__KANJI5_V16_SESSION_API__?.getSession?.();if(current?.started&&!current?.finished)return current;const rows=state.readSessionHistory?.()||[];return[...rows].reverse().find(x=>x?.status==='active')||null}
function completedSession(){const rows=state.readSessionHistory?.()||[];return[...rows].reverse().find(x=>!x?.status&&x?.modeResults)||null}
function learner(){return window.__KANJI5_V19_LEARNER_MODEL__?.read?.()||null}
function loadComponentData(){
  if(componentDataPromise)return componentDataPromise;
  componentDataPromise=fetch('./kanji-components.json',{cache:'no-store'}).then(response=>{
    if(!response.ok)throw new Error('KANJI5_COMPONENT_DATA_UNAVAILABLE');
    return response.json();
  }).catch(()=>null);
  return componentDataPromise;
}
function loadRadicalData(){
  if(radicalDataPromise)return radicalDataPromise;
  radicalDataPromise=fetch('./kanji-radicals.json',{cache:'no-store'}).then(response=>{
    if(!response.ok)throw new Error('KANJI5_RADICAL_DATA_UNAVAILABLE');
    return response.json();
  }).catch(()=>null);
  return radicalDataPromise;
}
function normalizeDictionaryQuery(value){
  return String(value||'').trim().replace(/[ァ-ヺ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0x60)).toLowerCase();
}
function dictionaryResult(item){
  return {
    character:String(item?.character||item?.id||'').trim().slice(0,4),
    meanings:Array.isArray(item?.meaning)?item.meaning.map(v=>String(v||'').trim()).filter(Boolean).slice(0,8):[],
    on:Array.isArray(item?.on)?item.on.map(v=>String(v||'').trim()).filter(Boolean).slice(0,8):[],
    kun:Array.isArray(item?.kun)?item.kun.map(v=>String(v||'').trim()).filter(Boolean).slice(0,8):[],
    strokes:Number.isFinite(Number(item?.strokes))?Math.max(0,Number(item.strokes)):undefined,
    grade:Number.isFinite(Number(item?.grade))?Math.max(0,Number(item.grade)):undefined,
    jlpt:item?.jlpt?String(item.jlpt).trim().slice(0,8):null,
    frequency:Number.isFinite(Number(item?.frequency))?Math.max(0,Number(item.frequency)):undefined,
    order:Number.isFinite(Number(item?.order))?Math.max(0,Number(item.order)):undefined
  };
}
async function searchKanji(query,limit=24){
  const raw=String(query||'').trim().slice(0,80);
  const q=normalizeDictionaryQuery(raw);
  const deck=state.readDeck?.()||[];
  if(!q)return {contractVersion:'1.9.0-v2-boundary-contract',kind:'dictionary-search',query:'',results:[]};
  const ranked=[];
  for(const item of deck){
    const character=String(item?.character||item?.id||'').trim();
    if(!character)continue;
    const fields=[
      ...[item?.id,item?.character].map(v=>normalizeDictionaryQuery(v)),
      ...(Array.isArray(item?.on)?item.on:[]).map(normalizeDictionaryQuery),
      ...(Array.isArray(item?.kun)?item.kun:[]).map(normalizeDictionaryQuery),
      ...(Array.isArray(item?.meaning)?item.meaning:[]).map(normalizeDictionaryQuery)
    ].filter(Boolean);
    let score=-1;
    if(normalizeDictionaryQuery(character)===q)score=1000;
    else if(fields.some(v=>v===q))score=900;
    else if(fields.some(v=>v.startsWith(q)))score=700;
    else if(fields.some(v=>v.includes(q)))score=500;
    if(score>=0)ranked.push({score,frequency:Number(item?.frequency)||999999,result:dictionaryResult(item)});
  }
  ranked.sort((a,b)=>b.score-a.score||a.frequency-b.frequency);
  return {
    contractVersion:'1.9.0-v2-boundary-contract',
    kind:'dictionary-search',
    query:raw,
    results:ranked.slice(0,Math.max(1,Math.min(40,Number(limit)||24))).map(row=>row.result)
  };
}
function lookupRadical(data, radicalId){
  if(!Number.isInteger(Number(radicalId))) return null;
  return Array.isArray(data?.radicals) ? data.radicals.find(item=>Number(item?.id)===Number(radicalId)) || null : null;
}
function kanjiResultsByCharacters(characters, deck, limit=80){
  const wanted=new Set((Array.isArray(characters)?characters:[]).map(value=>String(value||'').trim()).filter(Boolean));
  const ranked=[];
  for(const item of deck){
    const character=String(item?.character||item?.id||'').trim();
    if(!wanted.has(character)) continue;
    ranked.push({order:Number(item?.order)||999999,result:dictionaryResult(item)});
  }
  ranked.sort((a,b)=>a.order-b.order||a.result.character.localeCompare(b.result.character));
  return ranked.slice(0,Math.max(1,Math.min(120,Number(limit)||80))).map(x=>x.result);
}
async function listRadicals(){
  const data=await loadRadicalData();
  const deck=state.readDeck?.()||[];
  if(!data)return {contractVersion:'1.9.0-v2-boundary-contract',kind:'radical-catalog',results:[]};
  const counts={};
  for(const item of deck){const id=Number(item?.radical?.classical);if(Number.isInteger(id))counts[id]=(counts[id]||0)+1;}
  const results=(Array.isArray(data.radicals)?data.radicals:[]).map(radical=>({...radical,kanjiCount:counts[Number(radical?.id)]||0}));
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'radical-catalog',results};
}
async function getKanjiByRadical(radicalId,limit=80){
  const id=Number(radicalId),data=await loadRadicalData(),deck=state.readDeck?.()||[];
  if(!data||!Number.isInteger(id)||id<1||id>214)return {contractVersion:'1.9.0-v2-boundary-contract',kind:'radical-kanji',radicalId:id,results:[]};
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'radical-kanji',radicalId:id,results:kanjiResultsByCharacters(deck.filter(item=>Number(item?.radical?.classical)===id).map(item=>item.character),deck,limit)};
}
async function getKanjiByComponent(glyph,recursive=true,limit=80){
  const normalized=String(glyph||'').trim(),data=await loadComponentData(),deck=state.readDeck?.()||[];
  if(!data||!normalized)return {contractVersion:'1.9.0-v2-boundary-contract',kind:'component-kanji',glyph:normalized,recursive:Boolean(recursive),results:[]};
  const index=(recursive?data.reverseIndex?.recursive:data.reverseIndex?.direct)||{};
  const characters=Array.isArray(index?.[normalized])?index[normalized]:[];
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'component-kanji',glyph:normalized,recursive:Boolean(recursive),results:kanjiResultsByCharacters(characters,deck,limit)};
}
async function getKanjiByComponents(glyphs,recursive=true,limit=80){
  const normalized=[...new Set((Array.isArray(glyphs)?glyphs:[]).map(value=>String(value||'').trim()).filter(Boolean))];
  if(!normalized.length)return {contractVersion:'1.9.0-v2-boundary-contract',kind:'component-intersection',glyphs:[],recursive:Boolean(recursive),results:[]};
  const data=await loadComponentData(),deck=state.readDeck?.()||[],index=(recursive?data?.reverseIndex?.recursive:data?.reverseIndex?.direct)||{};
  if(!data)return {contractVersion:'1.9.0-v2-boundary-contract',kind:'component-intersection',glyphs:normalized,recursive:Boolean(recursive),results:[]};
  let shared=null;
  for(const glyph of normalized){
    const set=new Set(Array.isArray(index?.[glyph])?index[glyph]:[]);
    shared=shared===null?set:new Set([...shared].filter(character=>set.has(character)));
  }
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'component-intersection',glyphs:normalized,recursive:Boolean(recursive),results:kanjiResultsByCharacters([...shared],deck,limit)};
}
function normalizeMnemonicCharacter(value){return Array.from(String(value||'').trim()).slice(0,1).join('');}
async function getMnemonic(character){
  const key=normalizeMnemonicCharacter(character);
  if(!key)return {contractVersion:'1.9.0-v2-boundary-contract',kind:'personal-mnemonic',character:'',text:''};
  const mnemonics=state.readMnemonics?.()||{};
  const value=typeof mnemonics[key]==='string'?mnemonics[key].trim().slice(0,600):'';
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'personal-mnemonic',character:key,text:value};
}
async function saveMnemonic(character,value){
  const key=normalizeMnemonicCharacter(character);
  if(!key)throw new Error('KANJI5_MNEMONIC_CHARACTER_REQUIRED');
  const textValue=String(value??'').trim().slice(0,600);
  const current=state.readMnemonics?.()||{};
  const next={...current};
  if(textValue)next[key]=textValue;else delete next[key];
  const ok=Boolean(state.writeMnemonics?.(next));
  if(!ok)throw new Error('KANJI5_MNEMONIC_SAVE_FAILED');
  document.dispatchEvent(new CustomEvent('kanji5:v2-mnemonic-changed',{detail:{character:key}}));
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'personal-mnemonic',character:key,text:textValue};
}
function kanjiMastery(character,knowledge,model){
  const attributes=model?.kanji?.[character]?.attributes||{};
  const modes=['meaning','reading','production','vocabulary','context'];
  let total=0;
  for(const mode of modes){
    const projected=attributes[mode]||{};
    const raw=knowledge?.[character]?.[mode]||{};
    const attempts=Number(projected.attempts??raw.attempts)||0;
    const mastery=Number(projected.mastery);
    const fallback=Math.max(0,Math.min(1,(Number(projected.correct??raw.correct)||0)+1)/(attempts+2));
    if(attempts>0)total+=Number.isFinite(mastery)?Math.max(0,Math.min(1,mastery)):fallback;
  }
  return total/modes.length;
}
async function listKanji(){
  const deck=state.readDeck?.()||[];
  const knowledge=state.readKnowledge?.()||{};
  const model=learner()||{};
  const results=deck.map(item=>{
    const result=dictionaryResult(item);
    const character=result.character;
    const attrs=model?.kanji?.[character]?.attributes||{};
    const states=Object.values(attrs).map(v=>String(v?.state||'')).filter(Boolean);
    const state=states.includes('mastered')?'mastered':states.includes('stable')?'stable':states.includes('recovering')?'recovering':states.includes('weak')?'weak':states.includes('learning')?'learning':states.includes('introduced')?'introduced':'unseen';
    return {...result,mastery:kanjiMastery(character,knowledge,model),state};
  });
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'kanji-catalog',results};
}
async function getVocabulary(character){
  const normalized=String(character||'').trim();
  if(!normalized)return {contractVersion:'1.9.0-v2-boundary-contract',kind:'kanji-vocabulary',character:'',items:[]};
  try{
    const network=await loadNetwork();
    const items=await network.fetchWords(normalized);
    return {contractVersion:'1.9.0-v2-boundary-contract',kind:'kanji-vocabulary',character:normalized,items:Array.isArray(items)?items.slice(0,8):[]};
  }catch{
    return {contractVersion:'1.9.0-v2-boundary-contract',kind:'kanji-vocabulary',character:normalized,items:[]};
  }
}
async function getComponentInfo(character){
  const normalized=String(character||'').trim();
  const data=await loadComponentData();
  if(!data||!normalized)return {character:normalized,available:false,components:[],sourceGap:false,coverage:data?.coverage||null};
  const hasOwn=Object.prototype.hasOwnProperty.call(data.components||{},normalized);
  return {
    character:normalized,
    available:hasOwn,
    components:hasOwn&&Array.isArray(data.components[normalized])?[...data.components[normalized]]:[],
    recursive:hasOwn&&data.recursive?.[normalized]?JSON.parse(JSON.stringify(data.recursive[normalized])):[],
    sourceGap:Array.isArray(data.missing)&&data.missing.includes(normalized),
    coverage:data.coverage||null,
    source:data.source||null
  };
}
async function getRadicalInfo(character){
  const normalized=String(character||'').trim();
  const data=await loadRadicalData();
  if(!data||!normalized)return {character:normalized,available:false};
  const mapping=data.kanjiToRadical?.[normalized];
  if(!mapping||!Number.isInteger(Number(mapping.radicalId)))return {character:normalized,available:false};
  const radical=Array.isArray(data.radicals)?data.radicals.find(item=>Number(item?.id)===Number(mapping.radicalId)):null;
  if(!radical)return {character:normalized,available:false,radicalId:Number(mapping.radicalId)};
  return {
    character:normalized,
    available:true,
    radicalId:Number(mapping.radicalId),
    radical,
    source:data.radicalSource||null,
    mappingSource:data.mappingSource||null
  };
}
function recentOutcomes(){const components=state.readComponents?.()||{},all=components.v19LearnerEvidence||{},rows=[];for(const [character,evidence] of Object.entries(all)){for(const item of(Array.isArray(evidence)?evidence:[])){rows.push({...item,character})}}rows.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));return rows.slice(0,8)}
async function snapshot(){const core=await load(),session=activeSession()||completedSession(),runtime=runtimePresentationData();return core.buildBoundarySnapshot({session,learning,exercise,feedback,learner:learner(),recentOutcomes:recentOutcomes(),adaptiveReason,...runtime})}
async function refreshLearning(){const core=await load(),bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;if(!bridge?.snapshot){return learning}learning=core.buildLearningCardViewModel(await bridge.snapshot());await publish();return learning}
async function revealLearning(direct=false){const bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;const ok=Boolean(bridge?.reveal?.(Boolean(direct)));if(ok)setTimeout(()=>{void refreshLearning()},0);return ok}
async function rateLearning(rating){const bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;const ok=Boolean(bridge?.rate?.(rating));if(ok)setTimeout(()=>{void refreshLearning()},0);return ok}

async function publish(){const revision=++publishRevision;const viewModel=await snapshot();if(revision!==publishRevision)return null;window.__KANJI5_V19_V2_LAST_SNAPSHOT__=viewModel;document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-view-models',{detail:viewModel}));return viewModel}
async function setExercise(input){const core=await load();feedback=null;exercise=core.buildExerciseViewModel(input);await publish();return exercise}
async function setFeedback(input){const core=await load();feedback=core.buildFeedbackViewModel(input);await publish();return feedback}
async function setAdaptiveReason(input){const core=await load();adaptiveReason=core.buildAdaptiveReasonViewModel(input);await publish();return adaptiveReason}
async function clearTransient(){exercise=null;feedback=null;adaptiveReason=null;await publish();return true}
async function setCustomStudyFilter(filter={}){
  const bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;
  if(!bridge?.setCustomStudyFilter)throw new Error('KANJI5_CUSTOM_STUDY_UNAVAILABLE');
  const available=Number(await bridge.setCustomStudyFilter(filter));
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'custom-study-filter',available:Math.max(0,available)};
}
function clearCustomStudyFilter(){
  const bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;
  if(!bridge?.clearCustomStudyFilter)return false;
  return Boolean(bridge.clearCustomStudyFilter());
}
async function startCustomStudy(filter={}){
  const result=await setCustomStudyFilter(filter);
  if(!result.available){
    clearCustomStudyFilter();
    return {...result,started:false};
  }
  const session=window.__KANJI5_V16_SESSION_API__;
  if(session?.startExperience)await session.startExperience('review');
  else if(session?.startReady)await session.startReady();
  else if(session?.start)await session.start();
  return {...result,started:true};
}
async function updateSettings(nextValue={}){
  const requested=nextValue&&typeof nextValue==='object'?nextValue:{};
  const current=runtimePresentationData().settings;
  const requestedRetention=Number(requested.retention);
  const retention=Number.isFinite(requestedRetention)?Math.min(.98,Math.max(.8,requestedRetention)):Math.min(.98,Math.max(.8,Number(current.retention)||.9));
  const next={...current,...requested,retention,production:Boolean(requested.production??current.production),vocabulary:Boolean(requested.vocabulary??current.vocabulary),context:Boolean(requested.context??current.context)};
  const runtime=window.__KANJI5_REVIEW_RUNTIME__;
  if(runtime?.updateSettings)runtime.updateSettings({dailyNew:next.dailyNew,retention:next.retention,dailyGoal:next.dailyGoal,leechThreshold:next.leechThreshold});
  else state.transaction?.(draft=>{draft.settings={...draft.settings,retention:Math.min(.98,Math.max(.8,Number(next.retention)||.9)), dailyNew:Math.min(30,Math.max(1,Number(next.dailyNew)||5)),dailyGoal:Math.min(500,Math.max(1,Number(next.dailyGoal)||20)),leechThreshold:Math.min(30,Math.max(2,Number(next.leechThreshold)||8))}});
  state.writeSettings?.({production:next.production,vocabulary:next.vocabulary,context:next.context});
  document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-settings-changed'));
  await publish();
  return snapshot();
}
async function resetProgress(){const runtime=window.__KANJI5_REVIEW_RUNTIME__;const ok=runtime?.reset?runtime.reset():Boolean(state.reset?.(state.DEFAULTS||{dailyNew:5,retention:.9,maxInterval:36500,dailyGoal:20,leechThreshold:8},state.readDeck?.()||[]));try{sessionStorage.removeItem('v19RecoveryState')}catch(_){}await clearTransient();document.dispatchEvent(new CustomEvent('kanji5:v1.9-progress-reset'));return Boolean(ok)}
window.__KANJI5_V19_V2_BOUNDARY__=Object.freeze({getVocabulary, snapshot,refreshLearning,revealLearning,rateLearning,setExercise,setFeedback,setAdaptiveReason,clearTransient,updateSettings,resetProgress,getComponentInfo,getRadicalInfo,listRadicals,getKanjiByRadical,getKanjiByComponent,getKanjiByComponents,searchKanji,listKanji,getMnemonic,saveMnemonic,setCustomStudyFilter,clearCustomStudyFilter,startCustomStudy,ensureEducationRuntime});
window.__KANJI5_V19_V2_LAST_SNAPSHOT__=null;
document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-boundary-ready'));
setTimeout(()=>{void refreshLearning()},0);
setTimeout(()=>{void refreshLearning()},100);
setTimeout(()=>{void refreshLearning()},500);
document.addEventListener('kanji5:v1.9-learning-changed',()=>{void refreshLearning()});
document.addEventListener('kanji5:v1.6-education-result',e=>{void setFeedback(e?.detail||{})});
document.addEventListener('kanji5:v1.9-feedback',e=>{void setFeedback(e?.detail||{})});
document.addEventListener('kanji5:v1.9-review-revealed',()=>{void refreshLearning()});
document.addEventListener('kanji5:v1.6-session-finished',()=>{setTimeout(()=>{clearTransient()},0)});
})();
