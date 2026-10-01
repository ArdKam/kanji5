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
let componentDataPromise=null;let radicalDataPromise=null;
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
  let dueCount=0,masteredCount=0;
  const upcoming=[];
  for(const item of deck){
    const card=cards[item.id]?.card;
    const due=card?.due;
    const t=due?Date.parse(due):NaN;
    if(Number.isFinite(t)){
      if(t<=now)dueCount++;
      else upcoming.push({character:item.character,dueAt:new Date(t).toISOString()});
    }
    if(card&&card.state===2&&(Number(card.scheduled_days)||0)>=21)masteredCount++;
  }
  upcoming.sort((a,b)=>Date.parse(a.dueAt)-Date.parse(b.dueAt));
  const totalReviews=reviews.length;
  let nonAgainReviews=0;
  const days=[];
  const keyFormatter=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'});
  const labelFormatter=new Intl.DateTimeFormat('fa-IR',{weekday:'short'});
  const dayBuckets=new Map();
  for(let i=6;i>=0;i--){
    const d=new Date(now);d.setDate(d.getDate()-i);
    const key=keyFormatter.format(d);
    days.push({label:labelFormatter.format(d),count:0,key});
    dayBuckets.set(key,days.length-1);
  }
  for(const item of reviews){
    if(String(item.rating||'')!=='Again')nonAgainReviews++;
    const dayIndex=dayBuckets.get(String(item.at||'').slice(0,10));
    if(dayIndex!==undefined)days[dayIndex].count++;
  }
  const trimmedDays=days.map(({label,count})=>({label,count}));
  let leechCount=0;
  for(const item of Object.values(cards))if(item?.leech)leechCount++;
  const masteryDistribution={unseen:0,learning:0,attention:0,stable:0,mastered:0,average:0,total:deck.length};
  let studiedMasteryTotal=0,studiedMasteryCount=0;
  const model=learner()||{};
  const knowledge=state.readKnowledge?.()||{};
  for(const item of deck){
    const character=String(item?.character||item?.id||'').trim();
    const attrs=model?.kanji?.[character]?.attributes||{};
    const states=Object.values(attrs).map(v=>String(v?.state||'')).filter(Boolean);
    const stateName=states.includes('mastered')?'mastered':states.includes('stable')?'stable':states.includes('recovering')?'attention':states.includes('weak')?'attention':states.includes('learning')?'learning':states.includes('introduced')?'learning':'unseen';
    masteryDistribution[stateName]++;
    if(stateName!=='unseen'){
      studiedMasteryTotal+=kanjiMastery(character,knowledge,model);
      studiedMasteryCount++;
    }
  }
  masteryDistribution.average=studiedMasteryCount?studiedMasteryTotal/studiedMasteryCount:0;
  const newCount=Math.min(Math.max(0,Number(app.todayNew)||0),Math.max(1,Number(settings.dailyNew)||5));
  return {dailySummary:{dueCount,newCount,masteredCount,streak:Number(app.streak?.current)||0},dailyGoal:{completed:Number(app.todayReviewCount)||0,target:Math.max(1,Number(settings.dailyGoal)||20),celebrated:Boolean(app.goalCelebrated)},upcomingReviews:upcoming.slice(0,6),settings,stats:{totalReviews,nonAgainRate:totalReviews?nonAgainReviews/totalReviews:0,studiedCount:Object.keys(cards).length,deckSize:deck.length,longestStreak:Number(app.streak?.longest)||0,currentStreak:Number(app.streak?.current)||0,leechCount,last7:trimmedDays,masteryDistribution}};
}

function startupPresentationData(){
  const app=state.readAppState?.()||{},deck=state.readDeck?.()||[],cards=app.cards&&typeof app.cards==='object'?app.cards:{};
  const settings={...(state.DEFAULTS||{}),...(app.settings||{}),...(state.readSettings?.()||{})};
  const stats={totalReviews:0,nonAgainRate:0,studiedCount:Object.keys(cards).length,deckSize:deck.length,longestStreak:Number(app.streak?.longest)||0,currentStreak:Number(app.streak?.current)||0,leechCount:0,last7:[],masteryDistribution:{unseen:deck.length,learning:0,attention:0,stable:0,mastered:0,average:0,total:deck.length}};
  return {
    dailySummary:{dueCount:0,newCount:Math.min(Math.max(0,Number(app.todayNew)||0),Math.max(1,Number(settings.dailyNew)||5)),masteredCount:0,streak:Number(app.streak?.current)||0},
    dailyGoal:{completed:Number(app.todayReviewCount)||0,target:Math.max(1,Number(settings.dailyGoal)||20),celebrated:Boolean(app.goalCelebrated)},
    upcomingReviews:[],
    settings,
    stats
  };
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
function loadRadicalData(){if(radicalDataPromise)return radicalDataPromise;radicalDataPromise=Promise.all([fetch('./kanji-radicals.json',{cache:'no-store'}),fetch('./kanji-radical-map.json',{cache:'no-store'})]).then(async([catalogResponse,mapResponse])=>{if(!catalogResponse.ok||!mapResponse.ok)throw new Error('KANJI5_RADICAL_DATA_UNAVAILABLE');return {catalog:await catalogResponse.json(),map:await mapResponse.json()}}).catch(()=>null);return radicalDataPromise;}
async function getRadicalInfo(character){const normalized=Array.from(String(character||'').trim()).slice(0,1).join('');const data=await loadRadicalData();if(!data||!normalized)return {character:normalized,available:false,radicalId:null,radical:null,coverage:data?.map?.coverage||null,source:data?.catalog?.source||null};const id=Number(data.map?.kanji?.[normalized]);const radical=Number.isInteger(id)?data.catalog?.radicals?.find(item=>Number(item.id)===id)||null:null;return {character:normalized,available:Boolean(radical&&Number.isInteger(id)),radicalId:Number.isInteger(id)?id:null,radical,coverage:data.map?.coverage||null,source:data.catalog?.source||null};}
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
function normalizeMnemonicCharacter(value){return Array.from(String(value||'').trim()).slice(0,1).join('');}
async function getMnemonic(character){
  const key=normalizeMnemonicCharacter(character);
  if(!key)return {contractVersion:'1.9.0-v2-boundary-contract',kind:'personal-mnemonic',character:'',text:''};
  const mnemonics=state.readMnemonics?.()||{};
  const value=typeof mnemonics[key]==='string'?mnemonics[key].trim().slice(0,600):'';
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'personal-mnemonic',character:key,text:value};
}
async function listPersonalMnemonics(){
  const source=state.readMnemonics?.()||{};
  const mnemonics={};
  for(const [character,value] of Object.entries(source)){
    const text=String(value??'').trim().slice(0,600);
    if(character&&text)mnemonics[character]=text;
  }
  return {contractVersion:'1.9.0-v2-boundary-contract',kind:'personal-mnemonics',mnemonics};
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
async function waitForKanjiDeck(timeoutMs=8000){
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    const deck=state.readDeck?.();
    if(Array.isArray(deck)&&deck.length)return deck;
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  const deck=state.readDeck?.();
  if(Array.isArray(deck)&&deck.length)return deck;
  throw new Error('KANJI5_KANJI_CATALOG_UNAVAILABLE');
}
async function listKanji(){
  const deck=await waitForKanjiDeck();
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
    sourceGap:Array.isArray(data.missing)&&data.missing.includes(normalized),
    coverage:data.coverage||null,
    source:data.source||null
  };
}
function recentOutcomes(){const components=state.readComponents?.()||{},all=components.v19LearnerEvidence||{},rows=[];for(const [character,evidence] of Object.entries(all)){for(const item of(Array.isArray(evidence)?evidence:[])){rows.push({...item,character})}}rows.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));return rows.slice(0,8)}
let startupSnapshotInFlight=null;
async function startupSnapshot(){
  if(startupSnapshotInFlight)return startupSnapshotInFlight;
  startupSnapshotInFlight=(async()=>{
    const core=await load();
    if(!window.__KANJI5_V19_REVIEW_BRIDGE__){
      await new Promise(resolve=>{
        let done=false;
        const finish=()=>{if(done)return;done=true;clearTimeout(timer);document.removeEventListener('kanji5:v1.9-review-ready',finish);resolve()};
        const timer=window.setTimeout(finish,12000);
        document.addEventListener('kanji5:v1.9-review-ready',finish,{once:true});
      });
    }
    const bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;
    if(bridge?.snapshot)learning=core.buildLearningCardViewModel(await bridge.snapshot());
    const session=activeSession()||completedSession();
    const runtime=startupPresentationData();
    return core.buildBoundarySnapshot({session,learning,exercise,feedback,learner:learner(),recentOutcomes:[],adaptiveReason,...runtime});
  })();
  try{return await startupSnapshotInFlight}finally{startupSnapshotInFlight=null}
}
let snapshotInFlight=null;async function snapshot(){if(snapshotInFlight)return snapshotInFlight;snapshotInFlight=(async()=>{const core=await load(),session=activeSession()||completedSession(),runtime=runtimePresentationData();return core.buildBoundarySnapshot({session,learning,exercise,feedback,learner:learner(),recentOutcomes:recentOutcomes(),adaptiveReason,...runtime})})();try{return await snapshotInFlight}finally{snapshotInFlight=null}}
async function publishStartupSnapshot(){const viewModel=await startupSnapshot();document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-startup-view-model',{detail:viewModel}));return viewModel}
async function refreshLearning(){const core=await load(),bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;if(!bridge?.snapshot){return learning}learning=core.buildLearningCardViewModel(await bridge.snapshot());await publish();return learning}
async function revealLearning(direct=false){const bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;const ok=Boolean(bridge?.reveal?.(Boolean(direct)));if(ok)setTimeout(()=>{void refreshLearning()},0);return ok}
async function rateLearning(rating){const bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;const ok=Boolean(await bridge?.rate?.(rating));if(ok)setTimeout(()=>{void refreshLearning()},0);return ok}

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

async function startReviewSession(experience='review'){
  const session=window.__KANJI5_V16_SESSION_API__;
  if(session?.startExperience)await session.startExperience(experience);
  else if(session?.startReady)await session.startReady();
  else if(session?.start)await session.start();
}
async function startLearningSession(){await startReviewSession('review')}
async function startLearningExperience(){await clearCustomStudyFilter();await startReviewSession('review')}
async function startPracticeExperience(){await startReviewSession('practice')}
async function startExercise(){
  await clearCustomStudyFilter();
  const educationReady=await ensureEducationRuntime();
  if(!educationReady)throw new Error('KANJI5_EDUCATION_RUNTIME_UNAVAILABLE');
  const bridge=window.__KANJI5_EDU_BRIDGE__;
  if(!bridge?.start)throw new Error('KANJI5_EDU_BRIDGE_UNAVAILABLE');
  const session=window.__KANJI5_V16_SESSION_API__;
  if(session?.startExperience)await session.startExperience('practice');
  else{
    const current=session?.getSession?.();
    if(session?.startReady&&!current?.started&&!current?.finished)await session.startReady();
    else if(session?.start&&!current?.started&&!current?.finished)await session.start();
  }
  const startResult=await bridge.start();
  if(startResult&&typeof startResult==='object'&&'started'in startResult&&startResult.started===false)throw new Error('KANJI5_NO_EXERCISE_AVAILABLE');
  const started=performance.now();
  while(performance.now()-started<15000){
    const current=await snapshot();
    if(current.exercise?.mode&&current.exercise?.prompt&&current.exercise?.stimulus)return;
    await new Promise(resolve=>window.setTimeout(resolve,50));
  }
  throw new Error('KANJI5_EXERCISE_READY_TIMEOUT');
}
async function awaitExerciseOutcome(result){
  if(result&&typeof result==='object')return result;
  const started=performance.now();
  while(performance.now()-started<2500){
    const current=await snapshot();
    if(current.feedback?.outcome&&typeof current.feedback.correct==='boolean')return current.feedback;
    await new Promise(resolve=>window.setTimeout(resolve,40));
  }
  return result;
}
async function submitExercise(value){
  const fn=window.__KANJI5_EDU_BRIDGE__?.submitValue;
  if(!fn)throw new Error('KANJI5_EDU_SUBMIT_UNAVAILABLE');
  return awaitExerciseOutcome(await fn(String(value??'')));
}
async function dontKnowExercise(){
  const fn=window.__KANJI5_EDU_BRIDGE__?.dontKnow;
  if(!fn)throw new Error('KANJI5_EDU_DONT_KNOW_UNAVAILABLE');
  return awaitExerciseOutcome(await fn());
}
async function selfReportProduction(knewIt){
  const fn=window.__KANJI5_EDU_BRIDGE__?.selfReportProduction;
  if(!fn)throw new Error('KANJI5_EDU_SELF_REPORT_UNAVAILABLE');
  return awaitExerciseOutcome(await fn(Boolean(knewIt)));
}
async function retryExercise(){
  const fn=window.__KANJI5_EDU_BRIDGE__?.retry;
  if(!fn)throw new Error('KANJI5_EDU_RETRY_UNAVAILABLE');
  return await fn();
}
async function nextExercise(){
  const fn=window.__KANJI5_EDU_BRIDGE__?.next;
  if(!fn)throw new Error('KANJI5_EDU_NEXT_UNAVAILABLE');
  await fn();
}
async function getHandwritingSkill(character){
  const key=String(character||'').trim();
  if(!key)return null;
  const started=performance.now();
  while(performance.now()-started<6000){
    const api=window.__KANJI5_V19_LEARNER_MODEL__;
    if(api?.project){
      try{return (await api.project(key))?.skills?.handwriting??null}
      catch(error){console.debug('Kanji 5 handwriting learner-model read failed.',error);return null}
    }
    await new Promise(resolve=>window.setTimeout(resolve,50));
  }
  return null;
}
async function recordHandwritingGrade(character,grade){
  const key=String(character||'').trim(),fn=window.__KANJI5_V19_LEARNER_MODEL__?.recordOutcome;
  if(!key||!fn)return false;
  const score=Math.max(0,Math.min(1,Number(grade?.overallSimilarity||0)/100)),evidence={};
  const weak=Array.isArray(grade?.perStroke)?grade.perStroke.find(row=>Number(row.strokeNumber)===Number(grade?.feedbackStroke)):null;
  if(weak)for(const metric of ['shape','endpoints','length','direction','curvature','placement']){
    const value=Number(weak[metric]);
    if(Number.isFinite(value))evidence[metric]=Math.max(0,Math.min(1,value));
  }
  if(typeof grade?.feedbackCode==='string')evidence.feedbackCode=grade.feedbackCode;
  if(Number.isFinite(Number(grade?.feedbackStroke)))evidence.feedbackStroke=Number(grade.feedbackStroke);
  const outcome=grade?.feedbackCode==='good'||score>=.88?'correct':'wrong';
  return Boolean(await fn({character:key,mode:'handwriting',outcome,correct:outcome==='correct',quality:outcome==='correct'?'good':'needs-work',score,graderVersion:'handwriting-vector-v2',schemaVersion:1,evidence}));
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
async function resetProgress(){const runtime=window.__KANJI5_REVIEW_RUNTIME__;const ok=runtime?.reset?runtime.reset():Boolean(state.reset?.(state.DEFAULTS||{dailyNew:5,retention:.9,maxInterval:36500,dailyGoal:20,leechThreshold:8},state.readDeck?.()||[]));try{sessionStorage.removeItem('v19RecoveryState')}catch(_){window.__KANJI5_V19_SESSION_STORAGE_DEGRADED__=true;}await clearTransient();document.dispatchEvent(new CustomEvent('kanji5:v1.9-progress-reset'));return Boolean(ok)}
window.__KANJI5_V19_V2_BOUNDARY__=Object.freeze({getVocabulary,snapshot,startupSnapshot,refreshLearning,revealLearning,rateLearning,setExercise,setFeedback,setAdaptiveReason,clearTransient,updateSettings,resetProgress,getComponentInfo,getRadicalInfo,searchKanji,listKanji,listPersonalMnemonics,getMnemonic,saveMnemonic,createBackup:()=>state.portableBackup?.(),restoreBackup:backup=>state.restorePortableBackup?.(backup),setCustomStudyFilter,clearCustomStudyFilter,startCustomStudy,ensureEducationRuntime,startLearningSession,startLearningExperience,startPracticeExperience,startExercise,submitExercise,dontKnowExercise,selfReportProduction,retryExercise,nextExercise,getHandwritingSkill,recordHandwritingGrade});
window.__KANJI5_V19_V2_LAST_SNAPSHOT__=null;
document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-boundary-ready'));
if(window.__KANJI5_V19_REVIEW_BRIDGE__)void publishStartupSnapshot();else document.addEventListener('kanji5:v1.9-review-ready',()=>{void publishStartupSnapshot()},{once:true});
document.addEventListener('kanji5:v1.9-learning-changed',()=>{void refreshLearning()});
document.addEventListener('kanji5:v1.6-education-result',e=>{void setFeedback(e?.detail||{})});
document.addEventListener('kanji5:v1.9-feedback',e=>{void setFeedback(e?.detail||{})});
document.addEventListener('kanji5:v1.9-review-revealed',()=>{void refreshLearning()});
document.addEventListener('kanji5:v1.6-session-finished',()=>{setTimeout(()=>{clearTransient()},0)});
})();
