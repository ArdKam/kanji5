(()=>{
'use strict';
if(window.__KANJI5_EDU_UI_V1_5__)return;
window.__KANJI5_EDU_UI_V1_5__=true;
const state=window.__KANJI5_STATE__;
const CORE=window.__KANJI5_EDU_CORE__;
const isV2=()=>new URLSearchParams(location.search).get('legacy')!=='1';
if(!state||!CORE)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const safe=v=>String(v??'').replace(/[&<>\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));
const DEFAULTS=state.EDUCATION_DEFAULTS||{production:true,vocabulary:true,context:true};
let edu={item:null,mode:null,word:null,sentence:null,answered:false,taskId:null,contentId:null,startedAt:null,revealed:false};
let networkPromise=null;
const network=()=>networkPromise||(networkPromise=import('./v1.5-network.js'));
const sessionFeedback=import('./v1.6-session-feedback.js');
const outcomeCore=import('./v1.9-outcome-core.js');
const contentEvidencePromise=import('./v1.9-content-evidence.js');
async function sessionApi(){try{await sessionFeedback}catch(_){}return window.__KANJI5_V16_SESSION_AUTH__||window.__KANJI5_V16_SESSION_API__}
async function normalizeOutcome(mode,result,meta={}){const api=await outcomeCore;return api.normalizeOutcome(mode,result,meta)}
function pane(){return $('#v14EducationPane')}
function deck(){return state.readDeck()}
function seenItems(){const ids=new Set(Object.keys(state.readAppState().cards||{}));return deck().filter(x=>x?.id&&ids.has(x.id))}
function knowledge(){return state.readKnowledge()}
function stageLabel(stage){return({new:'جدید',exposed:'آشنا شده',learning:'در حال یادگیری',reinforcing:'در حال تثبیت',mastered:'مسلط'})[stage]||stage}
function chooseChoices(target){const history=knowledge()[target.character]?.distractors||{};return[target,...CORE.chooseDistractors(target,deck(),history,3)].sort((a,b)=>String(a?.character||'').localeCompare(String(b?.character||'')))}
function answerText(){if(edu.mode==='meaning')return safe((edu.item.meaning||[]).join(' · ')||'—');if(edu.mode==='reading')return safe([...(edu.item.on||[]),...(edu.item.kun||[])].join(' · ')||'—');if(edu.mode==='production')return safe(edu.item.character);if(edu.mode==='vocabulary'&&edu.word)return`${safe(edu.word.word)} · ${safe(edu.word.reading)}`;if(edu.mode==='context'&&edu.sentence)return safe(edu.item.character);return safe(edu.item.character)}
function exercisePrompt(){return ({meaning:'معنی این کانجی را به انگلیسی بنویس.',reading:'یک خوانش رایج این کانجی را بنویس؛ Hiragana یا Romaji.',production:'با دیدن این معنی، کانجی را خودت تولید کن.',vocabulary:'واژهٔ کامل را به ژاپنی بنویس.',context:'کانجیِ حذف‌شده را در جمله وارد کن.'})[edu.mode]||'تمرین آموزشی'}
async function publishV2Exercise(){if(!isV2()||!edu.item||!edu.mode)return;const boundary=window.__KANJI5_V19_V2_BOUNDARY__;if(!boundary)return;let contentId=edu.item.id||edu.item.character,provenance='local',stimulus={kind:'kanji',primary:edu.item.character,inputPlaceholder:'Type your answer'},answerHint=answerText(),choices=[],prompt=exercisePrompt();if(edu.mode==='meaning'){stimulus={kind:'kanji',primary:edu.item.character,inputPlaceholder:'e.g. school'}}else if(edu.mode==='reading'){stimulus={kind:'kanji',primary:edu.item.character,inputPlaceholder:'e.g. gaku or がく'}}else if(edu.mode==='production'){stimulus={kind:'meaning',primary:(edu.item.meaning||[]).join(' · ')||'—',inputPlaceholder:'Select the matching Kanji'};choices=chooseChoices(edu.item).map(item=>item.character)}else if(edu.mode==='vocabulary'&&edu.word){contentId=edu.contentId||edu.word.contentId||`${edu.item.character}:${edu.word.word}`;provenance='kanjiapi';if(edu.contentStage==='introduction'){stimulus={kind:'vocabulary-intro',primary:edu.word.word,secondary:edu.word.reading||'',translation:edu.word.meaning||''};prompt='review-new-content'}else{stimulus={kind:'masked-vocabulary',primary:edu.word.word.replaceAll(edu.item.character,'＿'),secondary:edu.word.reading||'',translation:edu.word.meaning||'',inputPlaceholder:'Select the missing Kanji'};choices=chooseChoices(edu.item).map(item=>item.character);prompt='کدام کانجی جای خالی را کامل می‌کند؟'}answerHint=`${edu.word.word} · ${edu.word.reading||''}`}else if(edu.mode==='context'&&edu.sentence){contentId=edu.contentId||edu.sentence.contentId||`${edu.item.character}:${edu.sentence.text}`;provenance='tatoeba';if(edu.contentStage==='introduction'){stimulus={kind:'context-intro',primary:edu.sentence.text,translation:edu.sentence.english||''};prompt='review-new-content'}else{stimulus={kind:'masked-context',primary:edu.sentence.text.replaceAll(edu.item.character,'＿'),translation:edu.sentence.english||'',inputPlaceholder:'Select the missing Kanji'};choices=chooseChoices(edu.item).map(item=>item.character);prompt='کدام کانجی جمله را کامل می‌کند؟'}answerHint=edu.item.character}edu.contentId=contentId;edu.taskId=`${edu.item.character}:${edu.mode}:${contentId}`;await boundary.setExercise({mode:edu.mode,prompt,character:edu.item.character,stimulus,choices,answerHint,contentId,contentVersion:'1',provenance,contentStage:edu.contentStage||'retrieval',contentState:edu.contentState||''})}function uiNode(tag,className='',textValue=null){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(textValue!==null)el.textContent=String(textValue);
  return el
}
function uiButton(className,textValue,type='button'){
  const el=uiNode('button',className,textValue);el.type=type;return el
}
function appendChoices(parent,items){
  const grid=uiNode('div','v14-edu-grid');
  items.forEach(item=>{
    const b=uiButton('secondary v14-edu-choice',item.character);
    b.dataset.choice=String(item.character??'');
    grid.append(b)
  });
  parent.append(grid)
}
function renderResult(result){
  if(isV2())return;
  const p=pane();if(!p)return;
  const q=result.outcome==='unknown'?'نمی‌دانستم':result.quality==='partial'?'نسبی':result.quality==='exact'?'دقیق':result.outcome==='invalid'?'نامعتبر':'نادرست';
  p.replaceChildren();
  const wrap=uiNode('div','v14-edu-wrap');
  wrap.append(uiNode('div','v14-edu-title',result.outcome==='unknown'?'🟡 پاسخ را نمی‌دانستم':result.correct?'✅ پاسخ درست بود':'❌ پاسخ نادرست بود'));
  wrap.append(uiNode('div','v14-edu-meta',q+' · '+stageLabel(result.stage||CORE.getStage(knowledge()[edu.item.character]))));
  const answer=uiNode('div','v14-edu-answer','پاسخ صحیح: ');
  answer.append(uiNode('strong','',answerText()));
  const actions=uiNode('div','v14-edu-actions');
  actions.append(uiButton('primary','تمرین بعدی'),uiButton('secondary','بازگشت به مرور'));
  actions.children[0].id='v14EduNext';
  actions.children[1].id='v14EduReview';
  wrap.append(answer,actions);
  p.append(wrap)
}
function render(){
  if(isV2())return;
  const p=pane(),item=edu.item;if(!p||!item)return;
  let prompt='',body=null;
  if(edu.mode==='meaning'||edu.mode==='reading'){
    prompt=edu.mode==='meaning'?'معنی این کانجی را به انگلیسی بنویس.':'یک خوانش رایج این کانجی را بنویس؛ Hiragana یا Romaji.';
    body=uiNode('div');
    body.append(uiNode('div','v14-edu-kanji',item.character));
    const input=document.createElement('input');input.id='v14EduInput';input.className='v14-edu-input';input.autocomplete='off';input.spellcheck=false;input.placeholder=edu.mode==='meaning'?'مثلاً: school':'مثلاً: gaku یا がく';
    body.append(input)
  }else if(edu.mode==='production'){
    prompt='برای معنی زیر، کانجی مناسب را انتخاب کن.';
    body=uiNode('div');
    const meaning=uiNode('div','',((item.meaning||[]).join(' · ')||'—'));meaning.style.cssText='text-align:center;font-size:26px;font-weight:800;line-height:1.6';
    body.append(meaning);appendChoices(body,chooseChoices(item))
  }else if(edu.mode==='vocabulary'&&edu.word){
    prompt='واژهٔ کامل را به ژاپنی بنویس.';
    body=uiNode('div');
    const word=uiNode('div','v14-edu-word',edu.word.word.replaceAll(item.character,'＿'));word.style.cssText='font-size:30px;letter-spacing:0';
    const reading=uiNode('div','v14-edu-reading',edu.word.reading);
    const meaning=uiNode('div','v14-edu-meaning',edu.word.meaning||'—');
    const input=document.createElement('input');input.id='v14EduVocabularyInput';input.className='v14-edu-input';input.autocomplete='off';input.autocapitalize='none';input.spellcheck=false;input.placeholder='واژه را وارد کن';
    body.append(word,reading,meaning,input)
  }else if(edu.mode==='context'&&edu.sentence){
    prompt='کانجیِ حذف‌شده را در جمله وارد کن.';
    body=uiNode('div');
    const sentence=uiNode('div','v14-edu-word',edu.sentence.text.replaceAll(item.character,'＿'));sentence.style.cssText='font-size:24px;line-height:1.8;letter-spacing:0';
    const meaning=uiNode('div','v14-edu-meaning',edu.sentence.english||'—');
    const input=document.createElement('input');input.id='v14EduContextInput';input.className='v14-edu-input';input.autocomplete='off';input.autocapitalize='none';input.spellcheck=false;input.placeholder='کانجی را وارد کن';
    body.append(sentence,meaning,input)
  }else{
    renderResult({correct:false,outcome:'invalid',quality:'unavailable',stage:CORE.getStage(knowledge()[item.character])});return
  }
  p.replaceChildren();
  const wrap=uiNode('div','v14-edu-wrap');
  wrap.append(uiNode('div','v14-edu-title','🧠 تمرین آموزشی'));
  wrap.append(uiNode('div','v14-edu-meta',stageLabel(CORE.getStage(knowledge()[item.character]))+' · '+edu.mode));
  wrap.append(uiNode('div','v14-edu-prompt',prompt));
  wrap.append(body);
  const actions=uiNode('div','v14-edu-actions');
  if(edu.mode==='meaning'||edu.mode==='reading'){
    const submit=uiButton('primary','بررسی پاسخ');submit.id='v14EduSubmit';actions.append(submit)
  }
  const dontKnow=uiButton('secondary','نمی‌دانم');dontKnow.id='v14EduDontKnow';actions.append(dontKnow);
  wrap.append(actions);p.append(wrap);
  if(edu.mode==='meaning'||edu.mode==='reading'||edu.mode==='production'||edu.mode==='vocabulary'||edu.mode==='context'){
    setTimeout(()=>{const input=edu.mode==='production'?$('#v14EduProductionInput'):edu.mode==='vocabulary'?$('#v14EduVocabularyInput'):edu.mode==='context'?$('#v14EduContextInput'):$('#v14EduInput');input?.focus()},0)
  }
}
async function start(recoveryOverride=null){
 const p=pane(),v2=isV2();if(!p&&!v2)return;
 const seen=seenItems();
 if(!seen.length){edu={item:null,mode:null,word:null,sentence:null,answered:false,taskId:null,contentId:null,startedAt:null,revealed:false,contentStage:'retrieval',contentState:''};if(p){p.replaceChildren();const empty=uiNode('div','v14-edu-empty');const icon=uiNode('div','', '🧠');icon.style.fontSize='48px';empty.append(icon,uiNode('strong','', 'فعلاً کانجی‌ای برای تمرین آموزشی نداری.'),uiNode('div','', 'ابتدا چند کانجی را در مرور ببین.'));p.append(empty)}if(v2)await window.__KANJI5_V19_V2_BOUNDARY__?.clearTransient?.();return {started:false,reason:'no-seen-items'}}
 if(p){p.replaceChildren();const empty=uiNode('div','v14-edu-empty');const icon=uiNode('div','', '⏳');icon.style.fontSize='42px';empty.append(icon,uiNode('strong','', 'در حال آماده‌سازی تمرین…'));p.append(empty)}
 const settings=state.readSettings(),modes=CORE.getAvailableModes({...DEFAULTS,...settings},true),k=knowledge();
 const recoveryTarget=recoveryOverride&&typeof recoveryOverride==='object'?recoveryOverride:(window.__KANJI5_V19_RECOVERY_TARGET__&&typeof window.__KANJI5_V19_RECOVERY_TARGET__==='object'?window.__KANJI5_V19_RECOVERY_TARGET__:null);
 const adaptiveApi=await sessionApi();
 const plannedMode=recoveryTarget?.mode||adaptiveApi?.nextMode?.(modes)||null;
 const preferredModes=plannedMode&&modes.includes(plannedMode)?[plannedMode]:modes;
 const selected=recoveryTarget?.character
   ? CORE.selectEducationItem(seen,k,modes,{now:Date.now(),excludeCharacters:edu.item?.character?[edu.item.character]:[]})
   : CORE.selectEducationItem(seen,k,preferredModes,{now:Date.now(),excludeCharacters:edu.item?.character?[edu.item.character]:[]})
     || CORE.selectEducationItem(seen,k,modes,{now:Date.now(),excludeCharacters:edu.item?.character?[edu.item.character]:[]})
     || seen[0];
 const item=recoveryTarget?.character?seen.find(x=>x.character===recoveryTarget.character)||selected:selected;
 const stats=k[item.character]||{};
 let mode=recoveryTarget?.mode||plannedMode||CORE.chooseBestExercise(item,stats,modes,{now:Date.now()});
 const freshItem=!modes.some(candidate=>Number(stats?.[candidate]?.attempts)||0);
 if(!recoveryTarget&&freshItem&&mode!=='meaning'&&mode!=='reading')mode=adaptiveApi?.nextMode?.(['meaning','reading'])||CORE.chooseBestExercise(item,stats,['meaning','reading'],{now:Date.now()});
 let word=null,sentence=null,networkSatisfied=true,contentId=item.id||item.character,contentStage='retrieval',contentState='',contentProvenance='local';
 const contentModule=await contentEvidencePromise;
 const contentStore=contentModule.createContentEvidenceStore({readComponents:state.readComponents,writeComponents:state.writeComponents});
 try{
   const api=await network();
   if(mode==='vocabulary'){
     const words=await api.fetchWords(item.character);
     word=recoveryTarget?.contentId?words.find(x=>`${item.character}:${x.word}`===recoveryTarget.contentId)||null:null;
     if(!word&&words.length)word=contentStore.selectContent(words,'vocabulary',{idOf:x=>`${item.character}:${x.word}`})||api.selectWord?.(words,{adaptive:true,target:item.character,attempts:Number(stats?.[mode]?.attempts)||0,accuracy:(Number(stats?.[mode]?.correct)||0)/Math.max(1,Number(stats?.[mode]?.attempts)||0)})||words[0];
     if(!word){networkSatisfied=false;mode=CORE.chooseBestExercise(item,stats,modes.filter(x=>x!=='vocabulary'),{now:Date.now()})}
     else{contentId=word.contentId||`${item.character}:${word.word}`;contentProvenance='kanjiapi';const readiness=contentStore.readiness('vocabulary',contentId);if(readiness==='unseen'){contentStore.recordExposure({mode:'vocabulary',contentId,character:item.character,contentKind:'vocabulary',provenance:contentProvenance});contentState='introduced';contentStage='introduction'}else{contentState=readiness;contentStage=readiness==='introduced'?'guided':'retrieval'}}
   }else if(mode==='context'){
     const rows=(await api.fetchContextSentences(item.character)).filter(row=>{const text=String(row?.text||'');const english=String(row?.english||'').trim();if(!text||!english||!text.includes(item.character))return false;const otherKanji=[...text].filter(ch=>/[\\u3400-\\u9fff]/.test(ch)&&ch!==item.character).length;return text.length<=48&&otherKanji<=2;});
     sentence=recoveryTarget?.contentId?rows.find(x=>`${item.character}:${x.text}`===recoveryTarget.contentId)||null:null;
     if(!sentence&&rows.length)sentence=contentStore.selectContent(rows,'context',{idOf:x=>`${item.character}:${x.text}`})||api.selectContextSentence?.(rows,{adaptive:true,target:item.character,attempts:Number(stats?.[mode]?.attempts)||0,accuracy:(Number(stats?.[mode]?.correct)||0)/Math.max(1,Number(stats?.[mode]?.attempts)||0)})||rows[0];
     if(!sentence){networkSatisfied=false;mode=CORE.chooseBestExercise(item,stats,modes.filter(x=>x!=='context'),{now:Date.now()})}
     else{contentId=sentence.contentId||`${item.character}:${sentence.text}`;contentProvenance='tatoeba';const readiness=contentStore.readiness('context',contentId);if(readiness==='unseen'){contentStore.recordExposure({mode:'context',contentId,character:item.character,contentKind:'context',provenance:contentProvenance});contentState='introduced';contentStage='introduction'}else{contentState=readiness;contentStage=readiness==='introduced'?'guided':'retrieval'}}
   }
 }catch(_){networkSatisfied=false;mode=CORE.chooseBestExercise(item,stats,modes.filter(x=>x==='meaning'||x==='reading'||x==='production'),{now:Date.now()})}
 if(networkSatisfied&&!recoveryTarget&&!((mode==='vocabulary'||mode==='context')&&contentStage==='introduction'))adaptiveApi?.consumeMode?.(mode);
 state.writeKnowledge(CORE.ensureEntry(knowledge(),item.character,true));
 delete window.__KANJI5_V19_RECOVERY_TARGET__;
 edu={item,mode,word,sentence,answered:false,taskId:`${item.character}:${mode}:${contentId}`,contentId,startedAt:new Date().toISOString(),revealed:false,contentStage,contentState};
 if(v2)await publishV2Exercise();else render();
 return {started:true,character:item.character,mode,contentStage,contentState};
}function persistOutcome(next,character,outcome){const entry=next?.[character];if(!entry)return next;entry.educationEvidence=entry.educationEvidence&&typeof entry.educationEvidence==='object'?entry.educationEvidence:{};entry.educationEvidence.lastMode=outcome.mode;entry.educationEvidence.lastCorrect=outcome.correct;entry.educationEvidence.lastOutcome=outcome.outcome;entry.educationEvidence.lastQuality=outcome.quality;entry.educationEvidence.lastScore=outcome.score;entry.educationEvidence.outcomeSchemaVersion=outcome.schemaVersion;entry.educationEvidence.graderVersion=outcome.graderVersion;entry.educationEvidence.updatedAt=new Date().toISOString();return next}
async function recordOutcome(correct,wrong='',outcome=null){const normalized=outcome||(correct&&typeof correct==='object'?correct:null)||await normalizeOutcome(edu.mode,{correct:Boolean(correct),quality:correct?'exact':'wrong',score:correct?1:0});const selectedAnswer=String(wrong||'').trim();const recoveryState=window.__KANJI5_V19_RECOVERY__?.read?.()||null;const isRecoveryAttempt=recoveryState?.state==='retrying'&&recoveryState?.taskId===edu.taskId;const productionSelfReport=edu.mode==='production'&&edu.revealed===true&&normalized.quality==='self_report';const independent=!isRecoveryAttempt&&!productionSelfReport;const attemptType=isRecoveryAttempt?'guided_recovery':productionSelfReport?'revealed_self_report':edu.mode==='meaning'||edu.mode==='reading'?'free_recall':'cued_recognition';const modality=productionSelfReport?'revealed_self_report':edu.mode==='meaning'||edu.mode==='reading'?'free_recall':'cued_recognition';const startedMs=edu.startedAt?Date.parse(edu.startedAt):NaN;const responseTimeMs=Number.isFinite(startedMs)?Math.max(0,Date.now()-startedMs):null;const enriched={...normalized,evidence:{...(normalized.evidence||{}),...(selectedAnswer?{selectedAnswer}:{}),modality,attemptType,independent,revealed:Boolean(edu.revealed),...(responseTimeMs!=null?{responseTimeMs}:{}),...(isRecoveryAttempt?{recovery:true}:{})}};const next=independent?CORE.recordKnowledge(knowledge(),edu.item.character,edu.mode,enriched.correct,wrong,state.deviceId()):CORE.ensureEntry(knowledge(),edu.item.character,true);persistOutcome(next,edu.item.character,enriched);state.writeKnowledge(next);if(edu.mode==='vocabulary'||edu.mode==='context'){try{const contentModule=await contentEvidencePromise;const contentStore=contentModule.createContentEvidenceStore({readComponents:state.readComponents,writeComponents:state.writeComponents});contentStore.recordOutcome({mode:edu.mode,contentId:edu.contentId,character:edu.item.character,provenance:edu.mode==='vocabulary'?'kanjiapi':'tatoeba',outcome:enriched.outcome,selectedAnswer:enriched.evidence?.selectedAnswer,independent,recovery:isRecoveryAttempt,attemptType});}catch(_){}}const sessionEligible=independent&&!isRecoveryAttempt;document.dispatchEvent(new CustomEvent('kanji5:v1.6-education-result',{detail:{mode:enriched.mode,domain:enriched.domain,skill:enriched.skill,exercise:enriched.exercise,correct:enriched.correct,outcome:enriched.outcome,quality:enriched.quality,score:enriched.score,schemaVersion:enriched.schemaVersion,graderVersion:enriched.graderVersion,character:edu.item.character,taskId:edu.taskId,contentId:edu.contentId,recovery:isRecoveryAttempt,retryOf:isRecoveryAttempt?edu.taskId:null,recoveryAttempt:isRecoveryAttempt?Number(recoveryState.retryCount||1):0,attemptType,modality,independent,sessionEligible,revealed:Boolean(edu.revealed),responseTimeMs:responseTimeMs??undefined,evidence:enriched.evidence||{}}}));return next[edu.item.character]}function record(correct,wrong=''){return recordOutcome(correct,wrong,correct&&typeof correct==='object'?correct:null)}
async function finish(result,wrong=''){if(edu.answered)return null;const outcome=await normalizeOutcome(edu.mode,result,{contentId:edu.contentId});if(outcome.outcome==='empty'||outcome.outcome==='invalid')return null;edu.answered=true;const entry=await record(outcome,wrong);renderResult({...outcome,stage:entry.stage});return outcome}
async function submit(valueOverride=null){if(!edu.item||edu.answered)return;let result,wrong='';if(edu.mode==='meaning'){const value=valueOverride??($('#v14EduInput')?.value||'');result=CORE.gradeMeaning(value,edu.item.meaning||[]);if(result.quality==='empty'){$('#v14EduInput')?.focus();return}}else if(edu.mode==='reading'){const value=valueOverride??($('#v14EduInput')?.value||'');if(!CORE.normalize(value)){$('#v14EduInput')?.focus();return}result=CORE.gradeReading(value,[...(edu.item.on||[]),...(edu.item.kun||[])]);}else if(edu.mode==='production'){const value=valueOverride??($('#v14EduProductionInput')?.value||'');return import('./v1.8-production-core.js').then(()=>{const api=globalThis.__KANJI5_V18_PRODUCTION__;result=api.gradeProduction(value,edu.item.character);if(result.quality==='empty'){$('#v14EduProductionInput')?.focus();return}return finish(result,value===edu.item.character?'':value)}).catch(()=>null);return}else if(edu.mode==='vocabulary'){const value=String(valueOverride??($('#v14EduVocabularyInput')?.value||''));const selected=value.trim();const submittedWord=selected.length===1?edu.word?.word?.replaceAll(edu.item.character,selected):selected;wrong=selected.length===1&&selected!==edu.item.character?selected:'';return import('./v1.8-vocabulary-core.js').then(mod=>{result=mod.gradeVocabulary(submittedWord||'',edu.word?.word||'');if(result.quality==='empty')return;return finish(result,wrong)}).catch(()=>null);return}else if(edu.mode==='context'){const value=String(valueOverride??($('#v14EduContextInput')?.value||''));const selected=value.trim();wrong=selected.length===1&&selected!==edu.item.character?selected:'';const answer=selected.length===1?selected:value;return import('./v1.8-context-core.js').then(mod=>{result=mod.gradeContext(answer,edu.item.character);if(result.quality==='empty')return;return finish(result,wrong)}).catch(()=>null);return}return finish(result,wrong)}
function choose(character){if(!edu.item||edu.answered)return;const correct=character===edu.item.character;void finish({correct,outcome:correct?'correct':'wrong',quality:correct?'exact':'wrong',score:correct?1:0},correct?'':character)}
function dontKnow(){if(!edu.item||edu.answered)return;return finish({correct:false,outcome:'unknown',quality:'unknown',score:0})}
function selfReportProduction(knewIt){if(!edu.item||edu.answered||edu.mode!=='production')return null;edu.revealed=true;return finish({correct:Boolean(knewIt),outcome:knewIt?'correct':'unknown',quality:'self_report',score:0,evidence:{selfReport:true,revealed:true}})}
async function submitValue(value){return submit(String(value??''))}
async function retry(){const api=window.__KANJI5_V19_RECOVERY__;if(!(await api?.retry?.()))return false;const target=api.read?.();const recoveryTarget=target?.taskId?{taskId:target.taskId,character:target.character,mode:target.mode,contentId:target.contentId}:null;await start(recoveryTarget);return true}
window.__KANJI5_EDU_BRIDGE__=Object.freeze({start,submitValue,dontKnow,selfReportProduction,retry,next:start,backToReview:()=>{location.href=location.pathname}});
function loadStyles(){if(document.querySelector('link[data-kanji5-education-style]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='./v1.5-education-ui.css';link.dataset.kanji5EducationStyle='true';document.head.appendChild(link)}
function build(){const panel=$('#studyPanel'),study=$('#study');if(!panel||!study||$('#v14EduTabs'))return false;loadStyles();const reviewPane=document.createElement('div');reviewPane.id='v13ReviewPane';study.parentNode.insertBefore(reviewPane,study);reviewPane.appendChild(study);const tabs=document.createElement('div');tabs.id='v14EduTabs';const reviewTab=uiButton('v14-tab active','مرور کانجی');reviewTab.dataset.tab='review';const educationTab=uiButton('v14-tab','تمرین آموزشی');educationTab.dataset.tab='education';tabs.append(reviewTab,educationTab);panel.insertBefore(tabs,reviewPane);const educationPane=document.createElement('div');educationPane.id='v14EducationPane';educationPane.hidden=true;panel.appendChild(educationPane);tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;const tab=b.dataset.tab;$('.v14-tab',tabs).forEach(x=>x.classList.toggle('active',x===b));reviewPane.hidden=tab!=='review';educationPane.hidden=tab!=='education';if(tab==='education')start()});document.addEventListener('click',e=>{const t=e.target.closest?.('button');if(!t)return;if(t.id==='v14EduSubmit'){e.preventDefault();void submit()}else if(t.id==='v14EduDontKnow'){e.preventDefault();void finish({correct:false,outcome:'unknown',quality:'unknown',score:0})}else if(t.id==='v14EduNext'){e.preventDefault();start()}else if(t.id==='v14EduReview'){e.preventDefault();$('.v14-tab[data-tab="review"]')?.click()}else if(t.dataset.choice){e.preventDefault();choose(t.dataset.choice)}},true);document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.code==='NumpadEnter')&&pane()&&!edu.answered&&(edu.mode==='meaning'||edu.mode==='reading'||edu.mode==='production'||edu.mode==='vocabulary'||edu.mode==='context')){e.preventDefault();void submit()}},true);return true}
function boot(){if(isV2())return;if(build())return;const observer=new MutationObserver(()=>{if(build())observer.disconnect()});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
