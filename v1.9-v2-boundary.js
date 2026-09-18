(()=>{
'use strict';
if(window.__KANJI5_V19_V2_BOUNDARY__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
let corePromise=null;const load=()=>corePromise||(corePromise=import('./v1.9-v2-contract-core.js'));
let learning=null,exercise=null,feedback=null,adaptiveReason=null;
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

function activeSession(){const rows=state.readSessionHistory?.()||[];return[...rows].reverse().find(x=>x?.status==='active')||null}
function completedSession(){const rows=state.readSessionHistory?.()||[];return[...rows].reverse().find(x=>!x?.status&&x?.modeResults)||null}
function learner(){return window.__KANJI5_V19_LEARNER_MODEL__?.read?.()||null}
function recentOutcomes(){const components=state.readComponents?.()||{},all=components.v19LearnerEvidence||{},rows=[];for(const [character,evidence] of Object.entries(all)){for(const item of(Array.isArray(evidence)?evidence:[])){rows.push({...item,character})}}rows.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));return rows.slice(0,8)}
async function snapshot(){const core=await load(),session=activeSession()||completedSession(),runtime=runtimePresentationData();return core.buildBoundarySnapshot({session,learning,exercise,feedback,learner:learner(),recentOutcomes:recentOutcomes(),adaptiveReason,...runtime})}
async function refreshLearning(){const core=await load(),bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;if(!bridge?.snapshot){return learning}learning=core.buildLearningCardViewModel(await bridge.snapshot());await publish();return learning}
async function revealLearning(direct=false){const bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;const ok=Boolean(bridge?.reveal?.(Boolean(direct)));if(ok)setTimeout(()=>{void refreshLearning()},0);return ok}
async function rateLearning(rating){const bridge=window.__KANJI5_V19_REVIEW_BRIDGE__;const ok=Boolean(bridge?.rate?.(rating));if(ok)setTimeout(()=>{void refreshLearning()},0);return ok}

async function publish(){const revision=++publishRevision;const viewModel=await snapshot();if(revision!==publishRevision)return null;window.__KANJI5_V19_V2_LAST_SNAPSHOT__=viewModel;document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-view-models',{detail:viewModel}));return viewModel}
async function setExercise(input){const core=await load();exercise=core.buildExerciseViewModel(input);await publish();return exercise}
async function setFeedback(input){const core=await load();feedback=core.buildFeedbackViewModel(input);await publish();return feedback}
async function setAdaptiveReason(input){const core=await load();adaptiveReason=core.buildAdaptiveReasonViewModel(input);await publish();return adaptiveReason}
async function clearTransient(){exercise=null;feedback=null;adaptiveReason=null;await publish();return true}
async function updateSettings(nextValue={}){
  const requested=nextValue&&typeof nextValue==='object'?nextValue:{};
  const current=runtimePresentationData().settings;
  const next={...current,...requested,production:Boolean(requested.production??current.production),vocabulary:Boolean(requested.vocabulary??current.vocabulary),context:Boolean(requested.context??current.context)};
  const runtime=window.__KANJI5_REVIEW_RUNTIME__;
  if(runtime?.updateSettings)runtime.updateSettings({dailyNew:next.dailyNew,dailyGoal:next.dailyGoal,leechThreshold:next.leechThreshold});
  else state.transaction?.(draft=>{draft.settings={...draft.settings, dailyNew:Math.min(30,Math.max(1,Number(next.dailyNew)||5)),dailyGoal:Math.min(500,Math.max(1,Number(next.dailyGoal)||20)),leechThreshold:Math.min(30,Math.max(2,Number(next.leechThreshold)||8))}});
  state.writeSettings?.({production:next.production,vocabulary:next.vocabulary,context:next.context});
  document.dispatchEvent(new CustomEvent('kanji5:v1.9-v2-settings-changed'));
  await publish();
  return snapshot();
}
function resetProgress(){state.reset?.(state.DEFAULTS||{dailyNew:5,retention:.9,maxInterval:36500,dailyGoal:20,leechThreshold:8},state.readDeck?.()||[]);try{sessionStorage.removeItem('v19RecoveryState')}catch(_){};location.reload();return true}
window.__KANJI5_V19_V2_BOUNDARY__=Object.freeze({snapshot,refreshLearning,revealLearning,rateLearning,setExercise,setFeedback,setAdaptiveReason,clearTransient,updateSettings,resetProgress});
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
