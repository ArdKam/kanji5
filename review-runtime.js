import { buildSchedulingRequest, scheduleWithAuthority } from './v2-scheduling-core.js';
const IS_LEGACY = new URLSearchParams(location.search).get('legacy') === '1';

let createEmptyCard, fsrs, Rating;
const FSRS_URL="./vendor/ts-fsrs-5.4.1.mjs";
let fsrsPromise=null;
const loadFsrs=()=>{
  if(fsrsPromise)return fsrsPromise;
  const shared=window.__KANJI5_P0_FSRS_PROMISE;
  const loadPromise=shared?shared.then(mod=>{if(!mod)throw new Error("FSRS_PREFETCH_FAILED");return mod}):import(FSRS_URL);
  fsrsPromise=loadPromise.then(mod=>({mod,fsrs:mod.fsrs,createEmptyCard:mod.createEmptyCard,Rating:mod.Rating})).catch(error=>{fsrsPromise=null;throw error;});
  return fsrsPromise;
};
async function ensureFsrs(){if(fsrs&&createEmptyCard&&Rating)return true;const loaded=await loadFsrs();({createEmptyCard,fsrs,Rating}=loaded);if(!scheduler)initScheduler();return true;}
const DATA_URL="./kanji-data.json";
const DATA_VERSION='v1.2-dataset-2136';
const WORDS_URL=ch=>"https://kanjiapi.dev/v1/words/"+encodeURIComponent(ch);
const K=window.__KANJI5_STORAGE_KEYS__;
if(!K)throw new Error("KANJI5_STORAGE_KEYS_NOT_LOADED");
const STORAGE=K.state,CARDS_STORAGE=K.cards,REVIEWS_STORAGE=K.reviews;
const DEFAULTS={dailyNew:5,retention:.90,maxInterval:36500,dailyGoal:20,leechThreshold:8};
const CUSTOM_STUDY_STORAGE='kanji5-v2-custom-study-filter';
let state=window.__KANJI5_STATE__.createInitial({settings:DEFAULTS});let scheduler;let customStudyCore=null;let customStudyFilter=null;let ratingTransitionLocked=false;let modernStartupReady=false;
try{customStudyFilter=JSON.parse(sessionStorage.getItem(CUSTOM_STUDY_STORAGE)||'null')}catch(_){customStudyFilter=null}
const $=id=>document.getElementById(id);const {todayKey,deviceId,eventId,save,loadSaved,reviveCard,hydrateCards}=window.__KANJI5_STATE__;
function dom(tag,className='',textValue=null){const el=document.createElement(tag);if(className)el.className=className;if(textValue!==null)el.textContent=String(textValue);return el}
function button(className,textValue,type='button'){const el=dom('button',className,textValue);el.type=type;return el}
function metaChips(k){const chips=[];if(state.cards[k.id]?.leech)chips.push({t:'🥴 Leech',cls:'leech'});if(k.frequency)chips.push({t:'頻度 #'+k.frequency,cls:''});if(k.grade)chips.push({t:'Jōyō grade '+k.grade,cls:''});if(k.jlpt)chips.push({t:k.jlpt,cls:''});chips.push({t:String(k.strokes)+' strokes',cls:''});return chips}

function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200)}
function speak(text){if(!text)return;if(!("speechSynthesis"in window)){toast("مرورگر شما از خواندن صدا پشتیبانی نمی‌کند.");return}try{const u=new SpeechSynthesisUtterance(text);u.lang="ja-JP";u.rate=.85;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(_){toast("پخش صدا ممکن نشد.")}}
function initScheduler(){scheduler=fsrs({request_retention:state.settings.retention,maximum_interval:state.settings.maxInterval,enable_fuzz:true,enable_short_term:true,learning_steps:["1m","10m"],relearning_steps:["10m"]})}
async function loadDeck(){if(IS_LEGACY&&$("loadStatus"))$("loadStatus").textContent="در حال دریافت فهرست Jōyō...";const prefetched=window.__KANJI5_P0_DATA_PROMISE;if(prefetched){const all=await prefetched;if(Array.isArray(all)&&all.length===2136){state.deck=canonicalizeDeckReadings(all);localStorage.setItem("kanji5-deck",JSON.stringify(state.deck));localStorage.setItem("kanji5-deck-version",DATA_VERSION);return}}const res=await fetch(DATA_URL,{cache:"force-cache"});if(!res.ok)throw new Error("Could not load local kanji dataset");const data=await res.json();const all=Array.isArray(data)?data:(data.kanji||[]);if(all.length!==2136)throw new Error(`Runtime kanji dataset must contain 2136 entries, got ${all.length}`);state.deck=canonicalizeDeckReadings(all);localStorage.setItem("kanji5-deck",JSON.stringify(state.deck));localStorage.setItem("kanji5-deck-version",DATA_VERSION)}
function canonicalizeDeckReadings(deck){const core=window.__KANJI5_EDU_CORE__;if(!core?.canonicalizeItemReadings||!Array.isArray(deck))return deck;return deck.map(item=>core.canonicalizeItemReadings(item))}
function loadDeckFromCache(){try{const cachedVersion=localStorage.getItem("kanji5-deck-version");if(cachedVersion!==DATA_VERSION)return false;const x=JSON.parse(localStorage.getItem("kanji5-deck")||"null");if(Array.isArray(x)&&x.length===2136){state.deck=canonicalizeDeckReadings(x);return true}}catch(_){window.__KANJI5_REVIEW_STORAGE_DEGRADED__=true;}return false}
function ensureCard(item){if(!state.cards[item.id])state.cards[item.id]={card:createEmptyCard(),reviews:0,lapses:0,learnedAt:null};return state.cards[item.id]}
function dueNow(card){return card&&card.due&&new Date(card.due)<=new Date()}
function educationQueuePriority(item,knowledge,now=Date.now()){const core=window.__KANJI5_EDU_CORE__;if(!core||!item)return 0;const entry=knowledge?.[item.character]||{};const signal=core.educationSchedulerSignal?core.educationSchedulerSignal(entry):null;if(!signal)return 0;const latest=[entry.meaning,entry.reading,entry.production,entry.vocabulary,entry.context].map(s=>s?.lastAt).filter(Boolean).sort().pop()||'';const ageDays=latest?Math.max(0,now-Date.parse(latest))/86400000:0;const componentValues=['meaning','reading'].map(mode=>Number(entry.componentEvidence?.[mode]?.weakness)).filter(Number.isFinite);const componentWeakness=componentValues.length?Math.max(...componentValues):0;return signal.weakness*.7+(1-signal.weakestSkillMastery)*.3+Math.min(1,ageDays/14)*.15+componentWeakness*.25}
function jlptRank(item){const rank={N5:0,N4:1,N3:2,N2:3,N1:4};return rank[item?.jlpt]??5}
function newCardPriority(item,knowledge,now=Date.now()){const entry=knowledge?.[item.character]||{};const latest=[entry.meaning,entry.reading,entry.production,entry.vocabulary,entry.context].map(s=>s?.lastAt).filter(Boolean).sort().pop()||'';const ageDays=latest?Math.max(0,now-Date.parse(latest))/86400000:0;return educationQueuePriority(item,knowledge,now)+Math.min(1,ageDays/30)*.1}
function buildDefaultQueue(){
  let knowledge={};
  try{knowledge=JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')}catch(_){window.__KANJI5_REVIEW_STORAGE_DEGRADED__=true;}
  const now=Date.now();
  const dueItems=state.deck.filter(item=>state.cards[item.id]?.card&&dueNow(state.cards[item.id].card)).map(item=>({item,card:reviveCard(state.cards[item.id].card)}));
  dueItems.sort((a,b)=>{
    const aLate=Math.max(0,(now-new Date(a.card.due).getTime())/86400000),bLate=Math.max(0,(now-new Date(b.card.due).getTime())/86400000);
    const aScore=aLate*.6+educationQueuePriority(a.item,knowledge,now)*.4,bScore=bLate*.6+educationQueuePriority(b.item,knowledge,now)*.4;
    return bScore-aScore||new Date(a.card.due)-new Date(b.card.due)
  });
  const due=dueItems.map(x=>x.item.id);
  const remaining=Math.max(0,state.settings.dailyNew-state.todayNew);
  const newCards=state.deck.filter(item=>!state.cards[item.id]).sort((a,b)=>{
    const level=jlptRank(a)-jlptRank(b);if(level)return level;
    const priority=newCardPriority(b,knowledge,now)-newCardPriority(a,knowledge,now);if(Math.abs(priority)>.0001)return priority;
    const af=Number.isFinite(Number(a.frequency))?Number(a.frequency):Infinity,bf=Number.isFinite(Number(b.frequency))?Number(b.frequency):Infinity;
    return af-bf||String(a.character).localeCompare(String(b.character))
  }).slice(0,remaining).map(item=>item.id);
  state.queue=[...due,...newCards];
  return state.queue;
}
function buildQueue(){
  if(customStudyFilter&&customStudyCore?.selectCustomStudyItems){
    const selected=customStudyCore.selectCustomStudyItems({
      deck:state.deck,
      cards:state.cards||{},
      learner:window.__KANJI5_V19_LEARNER_MODEL__?.read?.()||{},
      filter:customStudyFilter,
      dailyNew:state.settings.dailyNew,
      todayNew:state.todayNew,
      now:Date.now()
    });
    state.queue=[...selected.ids];
    return state.queue;
  }
  return buildDefaultQueue();
}
async function setCustomStudyFilter(filter={}){
  if(!customStudyCore)customStudyCore=await import('./v2-custom-study-core.js');
  customStudyFilter=customStudyCore.normalizeCustomStudyFilter(filter);
  try{sessionStorage.setItem(CUSTOM_STUDY_STORAGE,JSON.stringify(customStudyFilter))}catch(_){window.__KANJI5_REVIEW_STORAGE_DEGRADED__=true;}
  buildQueue();
  state.current=null;
  state.revealed=false;
  next();
  return state.queue.length;
}
function clearCustomStudyFilter(){
  if(!customStudyFilter)return true;
  customStudyFilter=null;
  try{sessionStorage.removeItem(CUSTOM_STUDY_STORAGE)}catch(_){window.__KANJI5_REVIEW_STORAGE_DEGRADED__=true;}
  buildQueue();
  state.current=null;
  state.revealed=false;
  next();
  return true;
}

function formatInterval(card){const mins=Math.max(0,Math.round((new Date(card.due)-Date.now())/60000));if(mins<60)return`${Math.max(1,mins)}m`;const h=mins/60;if(h<24)return`${Math.round(h)}h`;return`${Math.round(h/24)}d`}

function exampleComplexity(example,k){const word=String(example?.word||''),reading=String(example?.reading||'');const otherKanji=[...word].filter(ch=>/[\u3400-\u9fff]/.test(ch)&&ch!==k.character).length;return otherKanji*6+Math.max(0,[...word].length-2)*1.5+Math.max(0,[...reading].length-4)*.35}
async function fetchExamples(k){if(state.examples[k.id])return;try{const res=await fetch(WORDS_URL(k.character),{cache:'force-cache'});if(!res.ok)return;const data=await res.json(),seen=new Set(),candidates=[];for(const e of data){for(const v of(e.variants||[])){const term=String(v.written||''),reading=String(v.pronounced||'');const meaning=(e.meanings||[]).flatMap(m=>m?.glosses||[]).slice(0,2).join('; ');if(!term||!reading||!meaning||!term.includes(k.character)||seen.has(term+'|'+reading))continue;seen.add(term+'|'+reading);candidates.push({word:term,reading,meaning})}}candidates.sort((a,b)=>exampleComplexity(a,k)-exampleComplexity(b,k)||a.word.localeCompare(b.word));state.examples[k.id]=candidates.slice(0,4);save()}catch(_){window.__KANJI5_REVIEW_EXAMPLES_DEGRADED__=true;}}
function reviewSnapshot(){const id=state.current;if(!id)return{active:false};const item=state.deck.find(x=>x.id===id);if(!item)return{active:false};const rec=state.cards[item.id];return{active:true,character:item.character,isNew:!rec,revealed:Boolean(state.revealed),meanings:Array.isArray(item.meaning)?item.meaning.slice(0,8):[],on:Array.isArray(item.on)?item.on.slice(0,8):[],kun:Array.isArray(item.kun)?item.kun.slice(0,8):[],examples:state.revealed&&Array.isArray(state.examples[item.id])?state.examples[item.id].slice(0,6).map(x=>({word:x.word,reading:x.reading,meaning:x.meaning})):[],hint:rec?'اول خودت معنی یا خوانش را حدس بزن.':'این اولین آشنایی تو با این کانجی است؛ فعلاً فقط آن را یاد بگیر.',revealLabel:rec?'نمایش پاسخ':'نمایش اطلاعات کانجی',contentId:String(item.id||item.character)};}
function notifyV2Learning(){if(!IS_LEGACY&&!modernStartupReady)return;try{window.__KANJI5_V19_V2_BOUNDARY__?.refreshLearning?.()}catch(_){window.__KANJI5_REVIEW_BOUNDARY_NOTIFY_FAILED__=true;}}
function directReveal(){if(!state.current)return false;state.revealed=true;const item=state.deck.find(x=>x.id===state.current);if(item)void fetchExamples(item).then(()=>notifyV2Learning());notifyV2Learning();return true}
async function directRate(rating){await ensureFsrs();if(!Rating||Rating[rating]===undefined)return false;return review(rating)}
function updateRuntimeSettings(next={}){state.settings={...state.settings,...next,dailyNew:Math.min(30,Math.max(1,Number(next.dailyNew)||state.settings.dailyNew)),dailyGoal:Math.min(500,Math.max(1,Number(next.dailyGoal)||state.settings.dailyGoal)),leechThreshold:Math.min(30,Math.max(2,Number(next.leechThreshold)||state.settings.leechThreshold))};if(fsrs)initScheduler();save();return true}
function renderEmpty(){
  const study=$("study");
  if(!study)return;
  const remaining=state.deck.filter(k=>!state.cards[k.id]).length;
  study.replaceChildren();
  const empty=dom('div','empty');
  empty.append(dom('div','', '✓'),dom('h2','',remaining?'برای امروز تمام شد.':'دورهٔ ۲۱۳۶ کانجی تمام شد!'),dom('p','',remaining?'مرورهای انجام‌شده ذخیره شدند؛ فردا ۵ کانجی جدید اضافه می‌شود.':'می‌توانی مرورهایت را ادامه بدهی یا دوره را از تنظیمات بازنشانی کنی.'));
  const resetButton=!remaining?button('secondary','شروع دوباره'):null;
  if(resetButton){resetButton.id='resetInline';empty.append(resetButton);}
  if(!remaining)empty.querySelector('div').style.fontSize='58px';
  study.append(empty);
  resetButton?.addEventListener('click',resetAll);
}
let upcomingReviewsTimerStarted=false;
function ensureUpcomingReviewsUI(){
  const studyPanel=$("studyPanel");
  if(!studyPanel)return null;
  let panel=$("upcomingReviews");
  if(panel)return panel;
  panel=dom('section','panel');
  panel.id='upcomingReviews';
  panel.style.marginTop='14px';
  const heading=dom('div','', 'مرورهای پیش‌رو');
  heading.style.fontWeight='850';heading.style.fontSize='16px';heading.style.marginBottom='8px';
  const body=dom('div','', '—');
  body.id='upcomingReviewsBody';body.style.color='var(--muted)';body.style.fontSize='13px';
  panel.append(heading,body);
  studyPanel.parentNode.insertBefore(panel,studyPanel.nextSibling);
  return panel;
}
function updateUpcomingReviews(){
  const panel=ensureUpcomingReviewsUI(),body=$("upcomingReviewsBody");
  if(!panel||!body)return;
  const now=Date.now();
  const rows=state.deck.map(item=>{
    const card=state.cards[item.id]?.card;if(!card?.due)return null;
    const due=new Date(card.due).getTime();
    return Number.isFinite(due)&&due>now?{item,due}:null;
  }).filter(Boolean).sort((a,b)=>a.due-b.due).slice(0,6);
  body.replaceChildren();
  if(!rows.length){body.textContent='فعلاً مرور زمان‌بندی‌شده‌ای در آینده وجود ندارد.';return}
  rows.forEach(row=>{
    const mins=Math.max(1,Math.round((row.due-now)/60000));
    let when;if(mins<60)when=String(mins)+' دقیقه دیگر';else if(mins<1440)when=String(Math.round(mins/60))+' ساعت دیگر';else when=String(Math.round(mins/1440))+' روز دیگر';
    const line=dom('div');line.style.cssText='display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line)';
    line.append(dom('strong','',row.item.character),dom('span','',when));body.append(line);
  });
}
function startUpcomingReviews(){if(upcomingReviewsTimerStarted)return;upcomingReviewsTimerStarted=true;updateUpcomingReviews();setInterval(updateUpcomingReviews,15000)}
function renderCard(){
  startUpcomingReviews();
  const id=state.current;
  if(!id){renderEmpty();updateStats();return}
  const item=state.deck.find(x=>x.id===id),rec=state.cards[item.id],card=rec?.card;
  if(card)reviveCard(card);
  const preview=card?scheduler.repeat(card,new Date()):null;
  const getPreview=r=>{try{return formatInterval(preview[r].card)}catch(_){return"—"}};

  const study=$("study");
  study.replaceChildren();

  const row=dom('div','kanjirow');
  const kanji=dom('div','kanji',item.character);
  kanji.dataset.kanjiId=String(item.id);
  row.append(kanji);

  const exposure=dom('div','first-exposure-reading');
  exposure.style.display=!rec?'block':'none';
  const hira=dom('div','hira',[...(rec?[]:[...(item.on||[]),...(item.kun||[])].slice(0,3))].join(' · '));
  exposure.append(hira);

  const audioWrap=dom('div');
  audioWrap.style.cssText='text-align:center;margin:-6px 0 14px';
  const speakButton=button('audiobtn','🔊 تلفظ');
  speakButton.id='speakKanjiBtn';speakButton.setAttribute('aria-label','تلفظ کانجی');
  audioWrap.append(speakButton);

  const hint=dom('div','hint',rec?'اول خودت معنی یا خوانش را حدس بزن.':'این اولین آشنایی تو با این کانجی است؛ فعلاً فقط آن را یاد بگیر.');
  const reveal=button('reveal',rec?'نمایش پاسخ':'نمایش اطلاعات کانجی');
  reveal.id='revealBtn';

  const answer=dom('div','answer');
  answer.id='answerBox';
  answer.classList.toggle('show',Boolean(state.revealed));
  const answerBox=dom('div','answerbox');
  const meaning=dom('div','meaning',item.meaning.join(' · ')||'—');

  const readings=dom('div','readings');
  const buildReadbox=(title,items)=>{
    const box=dom('div','readbox');
    const t=dom('div','t');
    t.append(dom('span','',title));
    if(items.length){
      const speakAll=button('audiobtn','🔊');
      speakAll.dataset.speak=items.join(' ');
      speakAll.setAttribute('aria-label','تلفظ آن‌یومی');
      t.append(speakAll);
    }
    const values=dom('div','v reading-list');
    if(items.length){
      items.forEach(value=>{
        const entry=dom('span','reading-entry');
        entry.append(dom('span','',value));
        const speakOne=button('audiobtn','🔊');
        speakOne.dataset.speak=value;
        speakOne.setAttribute('aria-label','تلفظ خوانش');
        entry.append(speakOne);
        values.append(entry);
      });
    }else values.textContent='—';
    box.append(t,values);
    return box;
  };
  readings.append(buildReadbox("On'yomi",Array.isArray(item.on)?item.on:[]),buildReadbox("Kun'yomi",Array.isArray(item.kun)?item.kun:[]));

  const examples=dom('div','examples');examples.id='examples';
  const meta=dom('div','meta');
  for(const chipData of metaChips(item)){
    const chip=dom('span','chip'+(chipData.cls?' '+chipData.cls:''),chipData.t);
    meta.append(chip);
  }
  answerBox.append(meaning,readings,examples,meta);
  answer.append(answerBox);

  const ratings=dom('div','ratings');
  ratings.id='ratings';ratings.classList.toggle('show',Boolean(state.revealed));
  for(const ratingName of ['Again','Hard','Good','Easy']){
    const rate=button('rate '+ratingName.toLowerCase(),ratingName);
    rate.dataset.r=ratingName;
    rate.append(dom('small','',getPreview(Rating[ratingName])));
    ratings.append(rate);
  }

  study.append(row,exposure,audioWrap,hint,reveal,answer,ratings);

  reveal.addEventListener("click",()=>{
    if(!window.__KANJI5_CANONICAL_REVEAL__&&rec){window.__KANJI5_V12_OPEN_RECALL__?.();return}
    if(window.__KANJI5_CANONICAL_REVEAL__)delete window.__KANJI5_CANONICAL_REVEAL__;
    state.revealed=true;
    renderCard();
    fetchExamples(item).then(renderExamples)
  });
  ratings.querySelectorAll(".rate").forEach(b=>b.addEventListener("click",()=>review(b.dataset.r)));
  speakButton.addEventListener("click",()=>speak(item.character));
  readings.querySelectorAll("[data-speak]").forEach(b=>b.addEventListener("click",()=>speak(b.dataset.speak)));
  renderExamples();
  if(state.revealed)fetchExamples(item).then(renderExamples)
}
function renderExamples(){
  const el=$("examples");
  if(!el||!state.current)return;
  const ex=state.examples[state.current]||[];
  el.replaceChildren();
  if(!ex.length)return;
  el.append(dom('h3','', 'نمونه‌های واژگانی'));
  const words=dom('div','words');
  ex.forEach(x=>{
    const line=dom('div','word');
    const word=dom('span','',String(x.word??''));
    const reading=dom('small','',String(x.reading??''));
    reading.style.cssText='color:#6b7280;direction:ltr;display:inline-block';
    const speech=String(x.reading||x.word||'');
    const play=button('audiobtn','🔊');
    play.dataset.speak=speech;
    play.setAttribute('aria-label','تلفظ واژه');
    line.append(word,document.createTextNode(' '),reading,play);
    words.append(line);
  });
  el.append(words);
  el.querySelectorAll("[data-speak]").forEach(b=>b.addEventListener("click",()=>speak(b.dataset.speak)));
}
function next(){if(state.queue.length===0){state.current=null;state.revealed=false;if(IS_LEGACY){renderEmpty();updateStats();}notifyV2Learning();return}state.current=state.queue[0];state.revealed=false;if(IS_LEGACY){renderCard();updateStats();}notifyV2Learning()}
function learningBridgeSnapshot(){return reviewSnapshot();}

function resetRuntime(){customStudyFilter=null;ratingTransitionLocked=false;try{sessionStorage.removeItem(CUSTOM_STUDY_STORAGE)}catch(_){window.__KANJI5_REVIEW_STORAGE_DEGRADED__=true;}state=window.__KANJI5_STATE__.reset(DEFAULTS,state.deck);if(fsrs)initScheduler();buildQueue();next();if(IS_LEGACY)updateStats();notifyV2Learning();return true}
window.__KANJI5_REVIEW_RUNTIME__=Object.freeze({snapshot:reviewSnapshot,reveal:directReveal,rate:directRate,updateSettings:updateRuntimeSettings,reset:resetRuntime,setCustomStudyFilter,clearCustomStudyFilter});
window.__KANJI5_V19_REVIEW_BRIDGE__=Object.freeze({snapshot:reviewSnapshot,setCustomStudyFilter,clearCustomStudyFilter,reveal:(direct=false)=>{if(!IS_LEGACY||direct)return directReveal();const button=document.getElementById('revealBtn');if(!button)return false;window.__KANJI5_CANONICAL_REVEAL__=true;button.click();setTimeout(()=>{delete window.__KANJI5_CANONICAL_REVEAL__},0);setTimeout(notifyV2Learning,0);return true;},rate:(rating)=>{if(!IS_LEGACY)return directRate(rating);const button=document.querySelector(`.rate[data-r="${String(rating||'')}"]`);if(!button)return false;button.click();setTimeout(notifyV2Learning,0);return true;}});

function updateStreak(){const t=todayKey(),s=state.streak;if(s.lastActiveDate===t)return;const y=new Date();y.setDate(y.getDate()-1);const yesterday=new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit"}).format(y);s.current=s.lastActiveDate===yesterday?(s.current||0)+1:1;s.longest=Math.max(s.longest||0,s.current);s.lastActiveDate=t}
function review(which){if(ratingTransitionLocked)return false;const id=state.current;if(!id)return false;ratingTransitionLocked=true;try{const item=state.deck.find(x=>x.id===id);if(!item)return false;const wasNew=!state.cards[id],rec=ensureCard(item),now=new Date(),rating=Rating[which];const scheduling=buildSchedulingRequest({domain:'kanji',contentId:item.id,skill:'integrated',exercise:'scheduled-review',plannerVersion:'v1.9-adaptive-planner'});Object.assign(rec,scheduling.identity);const result=scheduleWithAuthority({scheduler,card:rec.card,now,rating}),beforeState=rec.card.state;rec.card=result.card;rec.reviews=(rec.reviews||0)+1;if(which==="Again")rec.lapses=(rec.lapses||0)+1;if(beforeState===0&&rec.learnedAt===null)rec.learnedAt=now.toISOString();if(rec.lapses>=state.settings.leechThreshold)rec.leech=true;const previousEvent=[...state.reviews].reverse().find(r=>r.id===id&&r.eventId)?.eventId||null;const reviewEventId=eventId();const reviewDeviceId=deviceId();const baseRecord=structuredClone({...rec,card:reviveCard(structuredClone(rec.card))});state.reviews.push({eventId:reviewEventId,deviceId:reviewDeviceId,parentEventId:previousEvent,baseRecord,id,contentId:scheduling.identity.contentId,cardId:scheduling.identity.cardId,domain:scheduling.identity.domain,skill:scheduling.identity.skill,exercise:scheduling.identity.exercise,schedulingSchemaVersion:scheduling.schemaVersion,at:now.toISOString(),rating:which,due:rec.card.due,scheduledDays:rec.card.scheduled_days||0});if(state.reviews.length>5000)state.reviews.splice(0,state.reviews.length-5000);if(wasNew)state.todayNew++;state.todayReviewCount=(state.todayReviewCount||0)+1;updateStreak();state.queue.shift();save();const hitGoal=!state.goalCelebrated&&state.todayReviewCount>=state.settings.dailyGoal;if(hitGoal){state.goalCelebrated=true;toast("🎉 هدف روزانه تکمیل شد!")}else if(IS_LEGACY) toast(which==="Again"?"برمی‌گردد برای مرور نزدیک.":"ثبت شد.");next();return true}finally{window.setTimeout(()=>{ratingTransitionLocked=false},0)}}
function updateStats(){const due=state.deck.filter(k=>state.cards[k.id]?.card&&dueNow(reviveCard(state.cards[k.id].card))).length,mastered=state.deck.filter(k=>{const c=state.cards[k.id]?.card;return c&&c.state===2&&(c.scheduled_days||0)>=21}).length,studied=state.deck.filter(k=>state.cards[k.id]).length;$("dueCount").textContent=due;$("newCount").textContent=Math.min(state.todayNew,state.settings.dailyNew);$("masteredCount").textContent=mastered;$("bar").style.width=`${state.deck.length?Math.round(studied/state.deck.length*100):0}%`;$("streakCount").textContent=`${state.streak.current||0}🔥`;const goalDone=Math.min(state.todayReviewCount||0,state.settings.dailyGoal);$("goalLabel").textContent=`هدف روزانه: ${state.todayReviewCount||0}/${state.settings.dailyGoal}`;$("goalBar").style.width=`${Math.round(goalDone/state.settings.dailyGoal*100)}%`;$("goalDone").style.display=(state.todayReviewCount||0)>=state.settings.dailyGoal?"inline":"none"}
function resetAll(){if(!confirm("تمام پیشرفت‌ها پاک شود؟"))return;localStorage.removeItem(STORAGE);localStorage.removeItem(CARDS_STORAGE);localStorage.removeItem(REVIEWS_STORAGE);state=window.__KANJI5_STATE__.reset(DEFAULTS,state.deck);initScheduler();buildQueue();next();updateStats();toast("پیشرفت پاک شد.")}
if(IS_LEGACY){
$("settingsBtn").addEventListener("click",()=>{$("dailyNew").value=state.settings.dailyNew;$("dailyGoal").value=state.settings.dailyGoal;$("leechThreshold").value=state.settings.leechThreshold;$("settingsDialog").showModal()});
$("closeSettings").addEventListener("click",()=>$("settingsDialog").close());
$("saveSettings").addEventListener("click",()=>{state.settings.dailyNew=Math.min(30,Math.max(1,Number($("dailyNew").value)||5));state.settings.dailyGoal=Math.min(500,Math.max(1,Number($("dailyGoal").value)||20));state.settings.leechThreshold=Math.min(30,Math.max(2,Number($("leechThreshold").value)||8));initScheduler();save();$("settingsDialog").close();buildQueue();next();updateStats()});
$("resetBtn").addEventListener("click",resetAll);
function renderStats(){
  const total=state.reviews.length;
  const correct=state.reviews.filter(r=>r.rating!=="Again").length;
  const accuracy=total?Math.round(correct/total*100):0;
  const leechCount=Object.values(state.cards).filter(c=>c.leech).length;
  const studied=state.deck.filter(k=>state.cards[k.id]).length;
  const stateNames=["جدید (New)","یادگیری (Learning)","مرور (Review)","بازآموزی (Relearning)"],stateCounts=[0,0,0,0];
  for(const c of Object.values(state.cards)){const st=c.card?.state;if(st!=null&&stateCounts[st]!=null)stateCounts[st]++}
  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const key=new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
    const label=new Intl.DateTimeFormat("fa-IR",{weekday:"short"}).format(d);
    const count=state.reviews.filter(r=>r.at.slice(0,10)===key).length;
    days.push({label,count})
  }
  const maxDay=Math.max(1,...days.map(d=>d.count));
  const body=$("statsBody");
  body.replaceChildren();

  const grid=dom('div','statsgrid');
  const stat=(value,label)=>{
    const box=dom('div','box');box.append(dom('div','n',value),dom('div','l',label));return box;
  };
  grid.append(
    stat(total,'کل مرورها'),
    stat(accuracy+'%','دقت (غیر از Again)'),
    stat(studied+'/'+state.deck.length,'کانجی مطالعه‌شده'),
    stat((state.streak.longest||0)+'🔥','طولانی‌ترین رشته'),
    stat(leechCount,'Leech (کانجی دشوار)'),
    stat(state.streak.current||0,'رشتهٔ فعلی (روز)')
  );

  const historyTitle=dom('h3','', 'مرورهای ۷ روز اخیر');
  historyTitle.style.cssText='font-size:14px;color:var(--muted);margin:14px 0 4px';
  const bars=dom('div','bars');
  days.forEach(d=>{
    const col=dom('div','col'),fill=dom('div','fill'),label=dom('div','lbl');
    fill.style.height=(Math.round(d.count/maxDay*80)+2)+'px';
    label.append(document.createTextNode(String(d.label)),document.createElement('br'),document.createTextNode(String(d.count)));
    col.append(fill,label);bars.append(col);
  });

  const stateTitle=dom('h3','', 'وضعیت کارت‌ها');
  stateTitle.style.cssText='font-size:14px;color:var(--muted);margin:14px 0 4px';
  const states=dom('div','statesrow');
  stateNames.forEach((name,i)=>states.append(dom('span','chip',name+': '+stateCounts[i])));

  body.append(grid,historyTitle,bars,stateTitle,states);
}
$("statsBtn").addEventListener("click",()=>{renderStats();$("statsDialog").showModal()});
$("closeStats").addEventListener("click",()=>$("statsDialog").close());
document.addEventListener("keydown",e=>{if(document.querySelector("dialog[open]")||!state.current)return;if(!state.revealed&&(e.code==="Space"||e.key==="Enter")){e.preventDefault();$("revealBtn")?.click();return}if(state.revealed){const map={"1":"Again","2":"Hard","3":"Good","4":"Easy"};if(map[e.key])document.querySelector(`.rate[data-r="${map[e.key]}"]`)?.click()}});
}
async function start(){
  if(IS_LEGACY){
    try{await ensureFsrs();}
    catch(e){
      console.error(e);
      const loading=$("loading");
      loading.replaceChildren();
      const icon=dom('div','', '⚠️');icon.style.fontSize='42px';
      const title=dom('div','', 'موتور مرور بارگذاری نشد.');title.style.fontWeight='800';title.style.margin='10px 0';
      const copyText=dom('div','', 'اتصال به کتابخانه مرور برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.');copyText.style.cssText='color:#6b7280;font-size:13px;line-height:1.8';
      const retry=button('primary','تلاش دوباره');retry.id='v12FsrsRetry';retry.style.marginTop='14px';retry.addEventListener("click",()=>location.reload());
      loading.append(icon,title,copyText,retry);
      return;
    }
  }
  state=loadSaved(state,DEFAULTS);state=hydrateCards(state);
  customStudyCore=await import('./v2-custom-study-core.js');
  if(customStudyFilter)customStudyFilter=customStudyCore.normalizeCustomStudyFilter(customStudyFilter);
  const cached=loadDeckFromCache();
  try{
    if(!cached)await loadDeck();
    if(IS_LEGACY){if(fsrs)initScheduler();$("loading").hidden=true;$("app").hidden=false;}
    buildQueue();next();modernStartupReady=true;
    document.dispatchEvent(new CustomEvent('kanji5:v1.9-review-ready'));
    if(!IS_LEGACY){
      const warm=()=>{void ensureFsrs().catch(error=>console.warn("Kanji 5 FSRS idle warmup failed.",error))};
      if("requestIdleCallback" in window)window.requestIdleCallback(warm,{timeout:2500});else window.setTimeout(warm,100);
    }
    if(IS_LEGACY)updateStats()
  }catch(e){
    console.error(e);
    if(IS_LEGACY){
      const status=$("loadStatus");
      status.replaceChildren();
      status.append(document.createTextNode('بارگذاری داده ممکن نشد.'),document.createElement('br'),document.createElement('br'));
      const retry=button('primary','تلاش دوباره');retry.id='retry';retry.addEventListener("click",()=>location.reload());
      status.append(retry);
    }
  }
}
start();
