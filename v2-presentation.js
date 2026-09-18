(()=>{
'use strict';

const params=new URLSearchParams(location.search);
if(params.get('legacy')==='1')return;

const oldApp=document.getElementById('app');
const loading=document.getElementById('loading');
if(oldApp)oldApp.hidden=true;
if(loading)loading.hidden=true;

const root=document.createElement('main');
root.id='v2App';
root.className='v2-shell';
root.setAttribute('aria-labelledby','v2Title');

const stylesheet=document.createElement('link');
stylesheet.rel='stylesheet';
stylesheet.href='./v2-presentation.css';
document.head.appendChild(stylesheet);

const skip=document.createElement('a');
skip.className='v2-skip-link';
skip.href='#v2Exercise';
skip.textContent='پرش به تمرین';
skip.addEventListener('click',event=>{
  const target=document.getElementById('v2Exercise');
  if(!target)return;
  event.preventDefault();
  requestAnimationFrame(()=>{
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'start'});
  });
});
root.appendChild(skip);

const header=document.createElement('header');
header.className='v2-header';
const brand=document.createElement('div');
brand.className='v2-brand';
const title=document.createElement('h1');
title.id='v2Title';
title.className='v2-title';
title.textContent='Kanji 5';
const subtitle=document.createElement('p');
subtitle.className='v2-subtitle';
subtitle.textContent='تمرین هوشمند پنج مهارت کانجی';
brand.append(title,subtitle);

const headerStatus=document.createElement('div');
headerStatus.className='v2-header-status';
const statusPill=document.createElement('span');
statusPill.id='v2StatusPill';
statusPill.className='v2-status-pill';
headerStatus.appendChild(statusPill);
header.append(brand,headerStatus);
root.appendChild(header);

const sessionBar=document.createElement('section');
sessionBar.className='v2-session-bar';
sessionBar.setAttribute('aria-labelledby','v2SessionProgressTitle');
const progressCopy=document.createElement('div');
progressCopy.className='v2-session-progress-copy';
const progressTitle=document.createElement('strong');
progressTitle.id='v2SessionProgressTitle';
progressTitle.textContent='پیشرفت جلسه';
const progressCount=document.createElement('span');
progressCount.id='v2ProgressCount';
progressCount.className='v2-progress-count';
progressCopy.append(progressTitle,progressCount);
const progress=document.createElement('div');
progress.id='v2Progress';
progress.className='v2-progress';
progress.setAttribute('role','progressbar');
progress.setAttribute('aria-label','پیشرفت جلسه');
progress.setAttribute('aria-valuemin','0');
progress.setAttribute('aria-valuemax','100');
const fill=document.createElement('div');
fill.id='v2ProgressFill';
fill.className='v2-progress-fill';
progress.appendChild(fill);
const progressMeta=document.createElement('div');
progressMeta.id='v2ProgressMeta';
progressMeta.className='v2-progress-meta';
sessionBar.append(progressCopy,progress,progressMeta);
root.appendChild(sessionBar);

const grid=document.createElement('div');
grid.id='v2Grid';
grid.className='v2-grid';
root.appendChild(grid);
document.body.appendChild(root);

const labels={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
const stateLabels={unseen:'جدید',introduced:'معرفی‌شده',learning:'در حال یادگیری',weak:'نیازمند تمرین',recovering:'در حال بازیابی',stable:'پایدار',mastered:'مسلط'};
const outcomeLabels={correct:'درست',wrong:'نادرست',unknown:'نمی‌دانستم',near_miss:'نزدیک بود',empty:'خالی',invalid:'نامعتبر'};
const behaviorLabels={repair:'ترمیم',reinforce:'تقویت',recover:'بازیابی',maintain:'مرور',explore:'اکتشاف'};

function text(value,fallback){
  const s=String(value??'').trim();
  return s||fallback||'—';
}
function modeLabel(mode){return labels[mode]||text(mode,'تمرین');}
function stateLabel(state){return stateLabels[state]||text(state,'نامشخص');}
function outcomeLabel(outcome){return outcomeLabels[outcome]||text(outcome,'نتیجه');}
function pct(value){return Math.round(Math.max(0,Math.min(1,Number(value)||0))*100);}
function makeCard(titleText,className){
  const section=document.createElement('section');
  section.className='v2-card'+(className?' '+className:'');
  if(titleText){
    const heading=document.createElement('h2');
    heading.className='v2-card-title';
    heading.textContent=titleText;
    section.appendChild(heading);
  }
  return section;
}
function setRow(container,label,value,className){
  const row=document.createElement('div');
  row.className='v2-row'+(className?' '+className:'');
  const a=document.createElement('span');
  a.className='v2-row-label';
  a.textContent=label;
  const b=document.createElement('strong');
  b.className='v2-row-value';
  b.textContent=text(value);
  row.append(a,b);
  container.appendChild(row);
}

function render(snapshot){
  grid.textContent='';
  const session=snapshot?.session||{};
  const ex=snapshot?.exercise||{};
  const feedback=snapshot?.feedback||{};
  const learner=snapshot?.learner||{};
  const reason=snapshot?.adaptiveReason||{};
  const summary=snapshot?.sessionSummary||{};

  const fraction=Math.max(0,Math.min(1,Number(session.completionFraction)||0));
  fill.style.width=Math.round(fraction*100)+'%';
  progress.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
  const planned=Math.max(0,Number(session.plannedTotal)||0);
  const remaining=Math.max(0,Number(session.remainingTotal)||0);
  const done=Math.max(0,planned-remaining);
  progressCount.textContent=planned?done+' از '+planned:'شروع جلسه';
  progressMeta.textContent=planned
    ? remaining+' تمرین باقی مانده'+(session.resumed?' · جلسه ادامه پیدا کرده است':'')
    : (session.resumed?'جلسهٔ قبلی ادامه پیدا کرده است':'آمادهٔ شروع');
  statusPill.textContent=session.status==='active'
    ? (session.resumed?'ادامهٔ جلسه':'جلسهٔ فعال')
    : 'جلسهٔ کامل‌شده';
  statusPill.dataset.state=session.status==='active'?'active':'complete';

  const exercise=makeCard('', 'v2-exercise-card');
  exercise.id='v2Exercise';
  exercise.tabIndex=-1;
  exercise.setAttribute('aria-labelledby','v2ExerciseHeading');

  const exHead=document.createElement('div');
  exHead.className='v2-exercise-head';
  const modePill=document.createElement('span');
  modePill.id='v2ModePill';
  modePill.className='v2-mode-pill';
  modePill.textContent=ex.mode?modeLabel(ex.mode):'آماده‌سازی';
  const exHeading=document.createElement('h2');
  exHeading.id='v2ExerciseHeading';
  exHeading.className='v2-exercise-heading';
  exHeading.textContent=ex.mode?'تمرین این لحظه':'آمادهٔ تمرین';
  exHead.append(modePill,exHeading);
  exercise.appendChild(exHead);

  if(ex?.mode){
    const prompt=document.createElement('p');
    prompt.id='v2Prompt';
    prompt.className='v2-prompt';
    prompt.textContent=text(ex.prompt,'به یاد بیاور و پاسخ بده.');
    exercise.appendChild(prompt);

    const stimulus=document.createElement('div');
    stimulus.id='v2Stimulus';
    stimulus.className='v2-stimulus '+(['meaning','reading'].includes(ex.mode)?'v2-stimulus-kanji':'v2-stimulus-text');
    stimulus.setAttribute('dir','auto');
    stimulus.textContent=text(ex.stimulus,ex.character);
    exercise.appendChild(stimulus);

    if(ex.stimulusDetail){
      const detail=document.createElement('div');
      detail.id='v2StimulusDetail';
      detail.className='v2-stimulus-detail';
      detail.setAttribute('dir','auto');
      detail.textContent=ex.stimulusDetail;
      exercise.appendChild(detail);
    }

    if(ex.answerHint){
      const hint=document.createElement('div');
      hint.className='v2-answer-hint';
      hint.textContent=ex.answerHint;
      exercise.appendChild(hint);
    }

    const field=document.createElement('div');
    field.className='v2-answer-field';
    const inputLabel=document.createElement('label');
    inputLabel.className='v2-field-label';
    inputLabel.htmlFor='v2AnswerInput';
    inputLabel.textContent='پاسخ خود را بنویسید';
    field.appendChild(inputLabel);
    const input=document.createElement('input');
    input.id='v2AnswerInput';
    input.className='v2-input';
    input.type='text';
    input.autocomplete='off';
    input.spellcheck=false;
    input.setAttribute('aria-describedby','v2Prompt');
    input.placeholder=ex.mode==='production'||ex.mode==='context'?'کانجی را وارد کنید':'پاسخ را وارد کنید';
    field.appendChild(input);
    exercise.appendChild(field);

    const actions=document.createElement('div');
    actions.className='v2-actions v2-exercise-actions';
    const submit=document.createElement('button');
    submit.type='button';
    submit.id='v2Submit';
    submit.className='v2-btn v2-btn-primary';
    submit.textContent='بررسی پاسخ';
    const unknown=document.createElement('button');
    unknown.type='button';
    unknown.id='v2DontKnow';
    unknown.className='v2-btn v2-btn-secondary';
    unknown.textContent='نمی‌دانم';
    submit.addEventListener('click',async()=>{
      const bridge=window.__KANJI5_EDU_BRIDGE__;
      if(!bridge)return;
      submit.disabled=true;
      unknown.disabled=true;
      await bridge.submitValue(input.value);
    });
    unknown.addEventListener('click',async()=>{
      const bridge=window.__KANJI5_EDU_BRIDGE__;
      if(!bridge)return;
      submit.disabled=true;
      unknown.disabled=true;
      await bridge.dontKnow();
    });
    input.addEventListener('keydown',event=>{
      if(event.key==='Enter'){event.preventDefault();submit.click();}
    });
    actions.append(submit,unknown);
    exercise.appendChild(actions);

    const micro=document.createElement('div');
    micro.className='v2-exercise-micro';
    micro.textContent='Enter برای ارسال · پاسخ‌ها به‌صورت محلی ثبت می‌شوند';
    exercise.appendChild(micro);
  }else{
    const empty=document.createElement('div');
    empty.className='v2-empty-exercise';
    const icon=document.createElement('div');
    icon.className='v2-empty-icon';
    icon.textContent='学';
    const p=document.createElement('p');
    p.textContent='هنوز تمرینی در دسترس نیست.';
    const start=document.createElement('button');
    start.type='button';
    start.id='v2StartExercise';
    start.className='v2-btn v2-btn-primary';
    start.textContent='شروع تمرین';
    start.addEventListener('click',async()=>{await window.__KANJI5_EDU_BRIDGE__?.start?.();});
    empty.append(icon,p,start);
    exercise.appendChild(empty);
  }
  grid.appendChild(exercise);

  if(feedback?.outcome){
    const feedbackCard=makeCard('بازخورد','v2-feedback v2-feedback-filled');
    feedbackCard.id='v2Feedback';
    feedbackCard.setAttribute('role','status');
    feedbackCard.setAttribute('aria-live','polite');
    feedbackCard.setAttribute('aria-atomic','true');
    feedbackCard.tabIndex=-1;
    feedbackCard.dataset.outcome=feedback.outcome;

    const stateBox=document.createElement('div');
    stateBox.className='v2-feedback-state';
    const icon=document.createElement('div');
    icon.className='v2-feedback-icon';
    icon.textContent=feedback.outcome==='correct'?'✓':feedback.outcome==='unknown'?'?':feedback.outcome==='near_miss'?'~':'×';

    const copy=document.createElement('div');
    const headline=document.createElement('strong');
    headline.className='v2-feedback-headline';
    headline.textContent=feedback.outcome==='correct'
      ? 'آفرین؛ پاسخ درست بود'
      : feedback.outcome==='unknown'
        ? 'اشکالی ندارد؛ این مورد را دوباره می‌بینیم'
        : feedback.outcome==='near_miss'
          ? 'نزدیک بود؛ یک بار دیگر تلاش می‌کنیم'
          : 'این پاسخ درست نبود';
    const meta=document.createElement('span');
    meta.className='v2-feedback-meta';
    meta.textContent=feedback.mode?modeLabel(feedback.mode)+' · '+outcomeLabel(feedback.outcome):outcomeLabel(feedback.outcome);
    copy.append(headline,meta);
    stateBox.append(icon,copy);
    feedbackCard.appendChild(stateBox);

    const detail=document.createElement('div');
    detail.className='v2-feedback-detail';
    if(feedback.recovered){
      const chip=document.createElement('span');
      chip.className='v2-status-chip is-positive';
      chip.textContent='بازیابی موفق';
      detail.appendChild(chip);
    }
    if(Number(feedback.retryCount)>0){
      const chip=document.createElement('span');
      chip.className='v2-status-chip';
      chip.textContent='تلاش بازیابی '+feedback.retryCount;
      detail.appendChild(chip);
    }
    feedbackCard.appendChild(detail);

    const actions=document.createElement('div');
    actions.className='v2-actions';
    if(feedback.state==='pending_retry'){
      const retry=document.createElement('button');
      retry.type='button';
      retry.id='v2Retry';
      retry.className='v2-btn v2-btn-secondary';
      retry.textContent='تلاش دوباره همین مهارت';
      retry.addEventListener('click',async()=>{
        const bridge=window.__KANJI5_EDU_BRIDGE__;
        if(!bridge?.retry)return;
        retry.disabled=true;
        await bridge.retry();
      });
      actions.appendChild(retry);
    }
    const next=document.createElement('button');
    next.type='button';
    next.id='v2Next';
    next.className='v2-btn v2-btn-primary';
    next.textContent='تمرین بعدی';
    next.addEventListener('click',async()=>{await window.__KANJI5_EDU_BRIDGE__?.next?.();});
    actions.appendChild(next);
    const back=document.createElement('button');
    back.type='button';
    back.id='v2BackToReview';
    back.className='v2-btn v2-btn-tertiary';
    back.textContent='بازگشت به مرور کانجی';
    back.addEventListener('click',()=>window.__KANJI5_EDU_BRIDGE__?.backToReview?.());
    actions.appendChild(back);
    feedbackCard.appendChild(actions);
    grid.appendChild(feedbackCard);
    queueMicrotask(()=>{if(document.contains(feedbackCard))feedbackCard.focus({preventScroll:true});});
  }

  const side=document.createElement('div');
  side.className='v2-side-grid';

  const summaryCard=makeCard('خلاصهٔ جلسه','v2-summary-card');
  setRow(summaryCard,'پاسخ‌ها',Number(summary.attempts)||0);
  setRow(summaryCard,'درست',Number(summary.correct)||0);
  setRow(summaryCard,'دقت',(Math.round((Number(summary.accuracy)||0)*100))+'٪');
  side.appendChild(summaryCard);

  const learnerCard=makeCard('پروفایل مهارت','v2-skills-card');
  const skillGrid=document.createElement('div');
  skillGrid.className='v2-skill-grid';
  for(const mode of Object.keys(labels)){
    const item=learner?.attributes?.[mode]||{};
    const skill=document.createElement('div');
    skill.className='v2-skill-item';
    skill.dataset.state=item.state||'unseen';
    const top=document.createElement('div');
    top.className='v2-skill-top';
    const name=document.createElement('span');
    name.textContent=modeLabel(mode);
    const value=document.createElement('strong');
    value.textContent=pct(item.recentAccuracy)+'٪';
    top.append(name,value);
    const meter=document.createElement('div');
    meter.className='v2-skill-meter';
    const meterFill=document.createElement('div');
    meterFill.style.width=pct(item.recentAccuracy)+'%';
    meter.appendChild(meterFill);
    const state=document.createElement('span');
    state.className='v2-skill-state';
    state.textContent=stateLabel(item.state);
    skill.append(top,meter,state);
    skillGrid.appendChild(skill);
  }
  learnerCard.appendChild(skillGrid);
  side.appendChild(learnerCard);

  const reasonCard=makeCard('چرا این تمرین؟','v2-reason-card');
  if(reason.mode){
    const selected=document.createElement('div');
    selected.className='v2-reason-selected';
    const label=document.createElement('span');
    label.textContent='تمرکز فعلی';
    const strong=document.createElement('strong');
    strong.textContent=modeLabel(reason.mode);
    selected.append(label,strong);
    reasonCard.appendChild(selected);
    if(reason.action){
      const chip=document.createElement('span');
      chip.className='v2-action-chip';
      chip.textContent=behaviorLabels[reason.action]||text(reason.action);
      reasonCard.appendChild(chip);
    }
    if(Array.isArray(reason.reasons)&&reason.reasons.length){
      const list=document.createElement('ul');
      list.className='v2-reason-list';
      for(const value of reason.reasons.slice(0,3)){
        const li=document.createElement('li');
        li.textContent=value;
        list.appendChild(li);
      }
      reasonCard.appendChild(list);
    }
  }else{
    const empty=document.createElement('p');
    empty.className='v2-muted-copy';
    empty.textContent='پس از ثبت چند پاسخ، دلیل انتخاب تمرین دقیق‌تر می‌شود.';
    reasonCard.appendChild(empty);
  }
  side.appendChild(reasonCard);

  const recentCard=makeCard('پاسخ‌های اخیر','v2-recent-card');
  const outcomes=Array.isArray(snapshot?.recentOutcomes)?snapshot.recentOutcomes.slice(0,5):[];
  if(!outcomes.length){
    const empty=document.createElement('p');
    empty.className='v2-muted-copy';
    empty.textContent='هنوز پاسخی ثبت نشده است.';
    recentCard.appendChild(empty);
  }else{
    const list=document.createElement('div');
    list.className='v2-recent-list';
    for(const item of outcomes){
      const row=document.createElement('div');
      row.className='v2-recent-item';
      const kanji=document.createElement('strong');
      kanji.className='v2-recent-kanji';
      kanji.textContent=text(item.character,'·');
      const detail=document.createElement('span');
      detail.className='v2-recent-detail';
      detail.textContent=modeLabel(item.mode)+' · '+text(item.quality,item.outcome==='correct'?'دقیق':outcomeLabel(item.outcome));
      const result=document.createElement('span');
      result.className='v2-recent-result '+(item.correct?'is-positive':'is-negative');
      result.textContent=item.correct?'✓':'×';
      result.setAttribute('aria-label',item.correct?'درست':'نادرست');
      row.append(kanji,detail,result);
      list.appendChild(row);
    }
    recentCard.appendChild(list);
  }
  side.appendChild(recentCard);
  grid.appendChild(side);

  if(ex?.mode){
    queueMicrotask(()=>{
      const input=document.getElementById('v2AnswerInput');
      if(input&&!feedback?.outcome)input.focus();
    });
  }
}

let subscribed=false;
let bootstrapped=false;
async function init(){
  const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
  if(!boundary)return;
  try{
    if(!subscribed){
      if(typeof boundary.subscribe==='function'){
        await boundary.subscribe(snapshot=>render(snapshot));
      }else{
        document.addEventListener('kanji5:v1.9-v2-view-models',event=>render(event?.detail||{}));
        render(await boundary.snapshot());
      }
      subscribed=true;
    }
    const bridge=window.__KANJI5_EDU_BRIDGE__;
    if(!bridge){
      setTimeout(init,50);
      return;
    }
    if(!bootstrapped){
      bootstrapped=true;
      const snapshot=await boundary.snapshot();
      if(!snapshot.exercise?.mode)await bridge.start();
      render(await boundary.snapshot());
    }
  }catch(error){
    render({});
    console.error(error);
  }
}
document.addEventListener('kanji5:v1.9-v2-boundary-ready',()=>{void init();},{once:true});
void init();
})();