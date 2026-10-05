const IS_LEGACY = new URLSearchParams(location.search).get('legacy') === '1';
(()=>{
'use strict';
if(window.__KANJI5_V16_SESSION__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
window.__KANJI5_V16_SESSION__=true;
let planPromise=null;const loadPlanApi=()=>planPromise||(planPromise=import('./v1.6-session-core.js'));
const ACTIVE_SCHEMA=2,ACTIVE_STATUS='active';
const SESSION_DOMAIN='kanji',SESSION_DOMAIN_SCHEMA_VERSION=1;
const $=(s,r=document)=>r?.querySelector?.(s)||null;
const faNumber=v=>Number(v||0).toLocaleString('fa-IR');
const pct=v=>`${Math.round(Math.max(0,Math.min(100,Number(v)||0)))}%`;
function readActive(experience){const h=state.readSessionHistory?.()||[];return[...h].reverse().find(x=>x?.status===ACTIVE_STATUS&&Number(x.schemaVersion)>=ACTIVE_SCHEMA&&String(x.experience||'review')===String(experience))||null}
const activeRows=(state.readSessionHistory?.()||[]).filter(x=>x?.status===ACTIVE_STATUS&&Number(x.schemaVersion)>=ACTIVE_SCHEMA);
const latestActive=[...activeRows].sort((a,b)=>(Date.parse(b?.startedAt)||0)-(Date.parse(a?.startedAt)||0))[0]||null;
let currentExperience=String(latestActive?.experience||'review')==='practice'?'practice':'review';
const persisted=readActive(currentExperience);
const session={sessionId:persisted?.sessionId||state.eventId(),domain:String(persisted?.domain||SESSION_DOMAIN),domainSchemaVersion:Number(persisted?.domainSchemaVersion)||SESSION_DOMAIN_SCHEMA_VERSION,startedAt:persisted?(Date.parse(persisted.startedAt)||Date.now()):0,reviews:Number(persisted?.reviews)||0,recall:Number(persisted?.recallAttempts)||0,unknown:Number(persisted?.unknownAttempts)||0,ratings:{Again:0,Hard:0,Good:0,Easy:0,...(persisted?.ratings||{})},started:Boolean(persisted),finished:false,resumed:Boolean(persisted),experience:currentExperience};
let planApi=null,plan=persisted?.plan||null,remainingModes={...(persisted?.remainingModes||{})},planInitialized=Boolean(persisted?.plan),persistTimer=null,timerId=null;
const modePairs=[['meaning','معنی'],['reading','خوانش'],['production','تولید'],['vocabulary','واژگان'],['context','بافت']];
function uiNode(tag,className='',textValue=null){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(textValue!==null)el.textContent=String(textValue);
  return el
}
function uiButton(className,textValue,type='button'){
  const el=uiNode('button',className,textValue);el.type=type;return el
}

function injectStyle(){if(!IS_LEGACY)return;if($('#v16-session-style'))return;const s=document.createElement('style');s.id='v16-session-style';s.textContent='#v16Session{margin:0 0 16px;padding:20px;background:var(--panel,#fff);border:1px solid var(--line,#e5e7eb);border-radius:22px;box-shadow:var(--shadow,0 12px 35px rgba(0,0,0,.08))}.v16-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}.v16-title{margin:0;font-size:19px;font-weight:850}.v16-sub{margin:5px 0 0;color:var(--muted,#6b7280);font-size:12px}.v16-live{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:#f3f4f6;color:#4b5563;font-size:11px;font-weight:800}.v16-dot{width:7px;height:7px;border-radius:50%;background:#16a34a}.v16-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.v16-card{background:#f9fafb;border:1px solid var(--line,#e5e7eb);border-radius:15px;padding:12px}.v16-card .n{font-size:22px;font-weight:850}.v16-card .l{font-size:11px;color:var(--muted,#6b7280);margin-top:3px}.v16-progress{height:9px;background:#eef0f2;border-radius:99px;overflow:hidden;margin:15px 0 7px}.v16-progress>div{height:100%;background:var(--accent,#111827);border-radius:99px;transition:width .25s}.v16-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:var(--muted,#6b7280)}.v16-section{margin-top:17px}.v16-section h3{font-size:13px;margin:0 0 10px}.v16-modes{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.v16-mode{padding:9px;background:#fff;border:1px solid var(--line,#e5e7eb);border-radius:12px}.v16-mode-top{display:flex;justify-content:space-between;gap:5px;font-size:11px}.v16-mode-label{color:var(--muted,#6b7280)}.v16-mode-value{font-weight:800}.v16-meter{height:6px;background:#eef0f2;border-radius:99px;overflow:hidden;margin-top:7px}.v16-meter>div{height:100%;background:#4b5563;border-radius:99px}.v16-attn{margin-top:12px;padding:11px 12px;border-radius:13px;background:#fff7ed;border:1px solid #fed7aa;font-size:12px}.v16-attn strong{display:block;margin-bottom:3px}.v16-summary{margin-top:12px;padding:13px;border:1px solid #dbeafe;background:#eff6ff;border-radius:14px}.v16-summary-title{font-weight:850;margin-bottom:4px}.v16-summary-meta{font-size:12px;color:#4b5563;line-height:1.8}.v16-history{margin-top:12px;display:grid;gap:7px}.v16-history-item{display:flex;justify-content:space-between;gap:10px;padding:9px 11px;border:1px solid var(--line,#e5e7eb);border-radius:11px;background:#fff;font-size:11px}.v16-history-item strong{font-size:12px}.v16-muted{color:var(--muted,#6b7280)}.v16-plan{display:grid;gap:8px}.v16-plan-row{display:grid;grid-template-columns:72px 1fr 42px;align-items:center;gap:8px;font-size:11px}.v16-plan-label{color:#4b5563}.v16-plan-meter{height:8px;background:#eef0f2;border-radius:99px;overflow:hidden}.v16-plan-meter>div{height:100%;background:#111827;border-radius:99px}.v16-plan-count{font-weight:850;text-align:left}.v16-plan-note{margin-top:9px;font-size:12px;color:#4b5563;padding:9px 11px;background:#f9fafb;border-radius:11px;border:1px solid var(--line,#e5e7eb)}@media(max-width:700px){#v16Session{padding:16px}.v16-grid{grid-template-columns:repeat(2,1fr)}.v16-modes{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
function modeStats(){const k=state.readKnowledge()||{};return modePairs.map(([key,label])=>{let attempts=0,correct=0;for(const e of Object.values(k)){const s=e?.[key];if(!s||typeof s!=='object')continue;attempts+=Number(s.attempts)||0;correct+=Number(s.correct)||0}return{key,label,attempts,accuracy:attempts?correct/attempts*100:0}})}
function ensurePlan(){if(!planApi)return null;if(planInitialized&&plan)return plan;plan=planApi.buildSessionPlan(state.readKnowledge()||{},{count:10});remainingModes=Object.fromEntries(plan.modes.map(x=>[x.mode,x.plannedCount]));planInitialized=true;if(session.started)persistActiveSession();return plan}
function persistActiveSession(){if(!session.started||session.finished)return false;const h=(state.readSessionHistory?.()||[]).filter(x=>!(x?.status===ACTIVE_STATUS&&String(x.experience||'review')===session.experience));h.push({status:ACTIVE_STATUS,schemaVersion:ACTIVE_SCHEMA,sessionId:session.sessionId,domain:session.domain||SESSION_DOMAIN,domainSchemaVersion:session.domainSchemaVersion||SESSION_DOMAIN_SCHEMA_VERSION,startedAt:new Date(session.startedAt).toISOString(),reviews:session.reviews,recallAttempts:session.recall,unknownAttempts:session.unknown,ratings:{...session.ratings},plan:plan?structuredClone(plan):null,remainingModes:{...remainingModes},experience:session.experience});return state.writeSessionHistory?.(h)??false}
function schedulePersist(){if(!session.started||session.finished)return;if(persistTimer)clearTimeout(persistTimer);persistTimer=setTimeout(()=>{persistTimer=null;persistActiveSession()},25)}
function consumePlannedMode(mode){if(!session.started||!mode||remainingModes[mode]==null||remainingModes[mode]<=0)return false;remainingModes[mode]-=1;schedulePersist();return true}
function nextMode(available){if(!session.started||!planApi)return null;ensurePlan();return planApi.nextPlannedMode(plan,remainingModes,available)}
function renderPlan(){
  const host=$('#v16Plan');if(!host||!planApi)return;const p=ensurePlan();host.replaceChildren();
  const wrap=uiNode('div','v16-plan');
  (p?.modes||[]).forEach(x=>{
    const row=uiNode('div','v16-plan-row');
    const label=uiNode('span','v16-plan-label',x.label);
    const meter=uiNode('div','v16-plan-meter');
    const fill=uiNode('div');fill.style.width=pct(x.share*100);meter.append(fill);
    const count=uiNode('span','v16-plan-count',faNumber(x.plannedCount));row.append(label,meter,count);wrap.append(row)
  });
  const note=uiNode('div','v16-plan-note','سیستم تمرین‌ها را بر اساس ضعف، سابقه و تازگی تنظیم می‌کند. '+(session.resumed?'این جلسه پس از بارگذاری مجدد ادامه یافته است. ':'')+'اولویت: '+(p?.priority||[]).map(m=>p.modes.find(x=>x.mode===m)?.label||m).join(' ← ')+'.');
  wrap.append(note);host.append(wrap)
}
function duration(ms){const n=Math.floor(Math.max(0,ms)/1000),m=Math.floor(n/60),s=n%60;return`${faNumber(m)}:${faNumber(s).padStart(2,'۰')}`}
function latestSummary(){return(state.readSessionHistory?.()||[]).filter(x=>x?.status!==ACTIVE_STATUS).at(-1)||null}
function summaryFromCurrent(){const m=modeStats(),w=m.filter(x=>x.attempts).sort((a,b)=>a.accuracy-b.accuracy)[0]||null;return{experience:session.experience,sessionId:session.sessionId,domain:session.domain||SESSION_DOMAIN,domainSchemaVersion:session.domainSchemaVersion||SESSION_DOMAIN_SCHEMA_VERSION,startedAt:new Date(session.startedAt||Date.now()).toISOString(),endedAt:new Date().toISOString(),durationMs:session.startedAt?Math.max(0,Date.now()-session.startedAt):0,reviews:session.reviews,recallAttempts:session.recall,unknownAttempts:session.unknown,ratings:{...session.ratings},weakestMode:w?.key||null,weakestModeLabel:w?.label||null,weakestModeAccuracy:w?Math.round(w.accuracy):null,schemaVersion:1}}
function loadExperience(next){const persistedNext=readActive(next);currentExperience=next;session.sessionId=persistedNext?.sessionId||state.eventId();session.domain=String(persistedNext?.domain||SESSION_DOMAIN);session.domainSchemaVersion=Number(persistedNext?.domainSchemaVersion)||SESSION_DOMAIN_SCHEMA_VERSION;session.startedAt=persistedNext?(Date.parse(persistedNext.startedAt)||Date.now()):0;session.reviews=Number(persistedNext?.reviews)||0;session.recall=Number(persistedNext?.recallAttempts)||0;session.unknown=Number(persistedNext?.unknownAttempts)||0;session.ratings={Again:0,Hard:0,Good:0,Easy:0,...(persistedNext?.ratings||{})};session.started=Boolean(persistedNext);session.finished=false;session.resumed=Boolean(persistedNext);session.experience=next;plan=persistedNext?.plan||null;remainingModes={...(persistedNext?.remainingModes||{})};planInitialized=Boolean(persistedNext?.plan);if(timerId){clearInterval(timerId);timerId=null}return persistedNext}
function startExperience(experience='review'){const next=experience==='practice'?'practice':'review';if(session.experience===next&&session.started&&!session.finished)return false;loadExperience(next);return startSession()}
function startSession(){if(session.started||session.finished)return false;session.started=true;session.startedAt=Date.now();session.resumed=false;persistActiveSession();ensureTimer();update();return true}
async function startSessionReady(){if(session.started||session.finished)return false;await window.__KANJI5_V19_LEARNER_MODEL__?.update?.().catch?.(()=>false);try{await import('./v1.9-adaptive-planner.js')}catch(_){}if(!planApi)planApi=await loadPlanApi();ensurePlan();return startSession()}
function ensureTimer(){if(timerId||!session.started||session.finished)return;timerId=setInterval(()=>{if(!session.started||session.finished)return;const durationNode=$('#v16Duration');if(durationNode){const next=duration(Date.now()-session.startedAt);if(durationNode.textContent!==next)durationNode.textContent=next;const mini=$('#v16DashboardMini'),reviews=$('#v16Reviews')?.textContent||'۰';if(mini)mini.textContent=`جلسه: ${reviews} مرور · ${durationNode.textContent}`}},1000)}
function finishSession(){if(!session.started)return null;if(session.finished)return latestSummary();const summary=summaryFromCurrent();const h=(state.readSessionHistory?.()||[]).filter(x=>!(x?.status===ACTIVE_STATUS&&String(x.experience||'review')===session.experience));h.push(summary);if(!(state.writeSessionHistory?.(h)))return null;session.finished=true;session.resumed=false;if(timerId){clearInterval(timerId);timerId=null}renderSummary(summary);update();document.dispatchEvent(new CustomEvent('kanji5:v1.6-session-finished',{detail:{sessionId:summary.sessionId,summary:structuredClone(summary)}}));return summary}
function renderSummary(x){
  const n=$('#v16CurrentSummary');if(!n||!x)return;
  const a=x.reviews?Math.round((x.ratings.Good+x.ratings.Easy+x.ratings.Hard)/x.reviews*100):0;
  n.replaceChildren();
  n.append(
    uiNode('div','v16-summary-title','خلاصهٔ آخرین جلسه'),
    uiNode('div','v16-summary-meta',faNumber(x.reviews)+' مرور FSRS · '+faNumber(x.recallAttempts)+' تلاش Active Recall · '+faNumber(x.unknownAttempts)+' بار «نمی‌دانم» · زمان '+duration(x.durationMs)+' · دقت امتیازدهی '+a+'٪'+(x.weakestModeLabel?' · ضعیف‌ترین مهارت: '+x.weakestModeLabel:''))
  )
}
function renderHistory(){
  const n=$('#v16History');if(!n)return;
  const h=(state.readSessionHistory?.()||[]).filter(x=>x?.status!==ACTIVE_STATUS).slice(-3).reverse();
  n.replaceChildren();
  if(!h.length){n.append(uiNode('div','v16-muted','هنوز جلسه‌ای ذخیره نشده است.'));return}
  h.forEach((x,i)=>{
    const d=new Date(x.endedAt),item=uiNode('div','v16-history-item');
    item.append(uiNode('strong','', 'جلسه '+faNumber(h.length-i)),uiNode('span','',d.toLocaleDateString('fa-IR')+' · '+faNumber(x.reviews)+' مرور · '+duration(x.durationMs)));
    n.append(item)
  })
}
function ensurePanel(){
  if(!IS_LEGACY)return null;
  const app=$('#app');if(!app||$('#v16Session'))return $('#v16Session');
  const p=document.createElement('section');p.id='v16Session';p.setAttribute('aria-labelledby','v16SessionTitle');
  const head=uiNode('div','v16-head');
  const copy=uiNode('div');copy.append(uiNode('h2','v16-title','جلسهٔ امروز')).lastChild.id='v16SessionTitle';
  copy.append(uiNode('p','v16-sub','وضعیت مرور، جلسهٔ جاری و نقاط ضعف یادگیری'));
  const live=uiNode('span','v16-live');const dot=uiNode('span','v16-dot');dot.setAttribute('aria-hidden','true');live.append(dot,document.createTextNode('زنده'));head.append(copy,live);p.append(head);

  const topGrid=uiNode('div','v16-grid');
  [['v16Due','0','مرور باقی‌مانده'],['v16New','0','کانجی جدید'],['v16Mastered','0','یادگرفته‌شده'],['v16Streak','0','روز پیاپی']].forEach(([id,value,label])=>{
    const card=uiNode('div','v16-card');const n=uiNode('div','n',value);n.id=id;card.append(n,uiNode('div','l',label));topGrid.append(card)
  });
  p.append(topGrid);

  const progress=uiNode('div','v16-progress');progress.setAttribute('aria-label','پیشرفت هدف روزانه');const progressFill=uiNode('div');progressFill.id='v16GoalBar';progressFill.style.width='0%';progress.append(progressFill);p.append(progress);
  const row=uiNode('div','v16-row');const goalText=uiNode('span','', 'هدف روزانه: ۰/۰');goalText.id='v16GoalText';const sessionText=uiNode('span','', 'این جلسه: ۰ مرور');sessionText.id='v16SessionText';row.append(goalText,sessionText);p.append(row);

  const countsGrid=uiNode('div','v16-grid');countsGrid.style.marginTop='10px';
  [['v16Reviews','0','مرورهای این جلسه'],['v16Recall','0','تلاش Active Recall'],['v16Unknown','0','نمی‌دانم'],['v16Duration','۰:۰۰','زمان جلسه']].forEach(([id,value,label])=>{
    const card=uiNode('div','v16-card');const n=uiNode('div','n',value);n.id=id;card.append(n,uiNode('div','l',label));countsGrid.append(card)
  });
  p.append(countsGrid);

  const planSection=uiNode('div','v16-section');planSection.append(uiNode('h3','','پیشنهاد تمرین امروز'));const planHost=uiNode('div');planHost.id='v16Plan';planSection.append(planHost);p.append(planSection);
  const modesSection=uiNode('div','v16-section');modesSection.append(uiNode('h3','','وضعیت مهارت‌ها'));const modesHost=uiNode('div','v16-modes');modesHost.id='v16Modes';const attention=uiNode('div');attention.id='v16Attention';modesSection.append(modesHost,attention);p.append(modesSection);
  const summary=uiNode('div');summary.id='v16CurrentSummary';p.append(summary);
  const historySection=uiNode('div','v16-section');historySection.append(uiNode('h3','','جلسه‌های اخیر'));const history=uiNode('div','v16-history');history.id='v16History';historySection.append(history);p.append(historySection);

  const study=$('#studyPanel');if(study)app.insertBefore(p,study);else app.insertBefore(p,app.firstElementChild);return p
}
function update(){
  const p=ensurePanel();if(!p)return;
  const text=s=>String($(s)?.textContent||'0');
  const read=s=>text(s).replace(/[^0-9۰-۹]/g,'');
  $('#v16Due').textContent=read('#dueCount')||'۰';
  $('#v16New').textContent=read('#newCount')||'۰';
  $('#v16Mastered').textContent=read('#masteredCount')||'۰';
  $('#v16Streak').textContent=text('#streakCount');
  const g=text('#goalLabel').match(/([0-9۰-۹]+)s*/s*([0-9۰-۹]+)/);
  let done=0,total=0;
  if(g){const cv=x=>Number(String(x).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));done=cv(g[1]);total=cv(g[2])}
  $('#v16GoalText').textContent=g?'هدف روزانه: '+g[1]+'/'+g[2]:'هدف روزانه';
  $('#v16GoalBar').style.width=pct(total?done/total*100:0);
  $('#v16Reviews').textContent=faNumber(session.reviews);
  $('#v16Recall').textContent=faNumber(session.recall);
  $('#v16Unknown').textContent=faNumber(session.unknown);
  $('#v16Duration').textContent=session.started?duration(Date.now()-session.startedAt):'۰:۰۰';
  $('#v16SessionText').textContent='این جلسه: '+faNumber(session.reviews)+' مرور';

  const modeHost=$('#v16Modes');modeHost.replaceChildren();
  for(const x of modeStats()){
    const item=uiNode('div','v16-mode'),top=uiNode('div','v16-mode-top'),label=uiNode('span','v16-mode-label',x.label),value=uiNode('span','v16-mode-value',x.attempts?Math.round(x.accuracy):'—');
    top.append(label,value);
    const meter=uiNode('div','v16-meter'),fill=uiNode('div');fill.style.width=pct(x.accuracy);meter.append(fill);
    item.append(top,meter);modeHost.append(item)
  }
  const attention=$('#v16Attention');attention.replaceChildren();
  const modes=modeStats(),w=modes.filter(x=>x.attempts).sort((a,b)=>a.accuracy-b.accuracy)[0];
  const attentionBox=uiNode('div','v16-attn');
  if(w){attentionBox.append(uiNode('strong','', 'نیازمند توجه'),uiNode('span','',w.label+' با دقت '+Math.round(w.accuracy)+'٪ پایین‌ترین عملکرد ثبت‌شده را دارد.'))}
  else attentionBox.append(uiNode('strong','', 'هنوز دادهٔ کافی نداریم'),uiNode('span','', 'با چند تمرین آموزشی، سیستم می‌تواند نقاط ضعف شما را دقیق‌تر مشخص کند.'));
  attention.append(attentionBox);
  if(planApi&&session.started)renderPlan();
  const latest=latestSummary();if(latest)renderSummary(latest);
  renderHistory()
}
function bind(){document.addEventListener('click',e=>{if(!session.started&&!e.target?.closest?.('#v16Start'))return;const t=e.target?.closest?.('.rate[data-r]');if(t&&session.started){const r=t.getAttribute('data-r');session.reviews++;if(session.ratings[r]!==undefined)session.ratings[r]++;schedulePersist()}if(e.target?.closest?.('#v12SubmitRecall')&&session.started){session.recall++;schedulePersist()}if(e.target?.closest?.('#v15DontKnowRecall')&&session.started){session.recall++;session.unknown++;schedulePersist()}update()},true)}
function start(){if(!IS_LEGACY)return;injectStyle();const ready=()=>{ensurePanel();void import('./v1.6-session-ui.js');void import('./v1.6-session-feedback.js').catch(error=>console.error('KANJI5_V16_SESSION_FEEDBACK_LOAD_FAILED',error));void import('./v1.6-session-analytics.js').catch(()=>{});void import('./v1.6-skill-profile.js').catch(()=>{});bind();update();if(session.started)ensureTimer();void loadPlanApi().then(api=>{planApi=api;if(session.started&&!planInitialized)ensurePlan();else if(session.started)update()}).catch(err=>console.error('KANJI5_V16_SESSION_PLAN_LOAD_FAILED',err))};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready()}
/* 'v16Finish' is retained only as a legacy contract marker; the real control lives outside the dashboard as #v16FinishExternal. */
window.__KANJI5_V16_SESSION_API__=Object.freeze({refresh:update,getSession:()=>({...session,ratings:{...session.ratings},experience:session.experience}),start:startSession,startExperience,startReady:startSessionReady,finish:finishSession,getPlan:()=>{ensurePlan();return plan},nextMode:nextMode,consumeMode:consumePlannedMode});
start();
})();