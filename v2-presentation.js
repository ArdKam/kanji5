(()=>{
'use strict';

const params=new URLSearchParams(location.search);
if(params.get('legacy')==='1')return;

const oldApp=document.getElementById('app');
const loading=document.getElementById('loading');
if(oldApp)oldApp.hidden=true;
if(loading)loading.hidden=true;

const stylesheet=document.createElement('link');
stylesheet.rel='stylesheet';
stylesheet.href='./v2-presentation.css';
stylesheet.dataset.kanji5V2Style='true';
document.head.appendChild(stylesheet);

const root=document.createElement('main');
root.id='v2App';
root.className='v2-shell';
root.setAttribute('aria-labelledby','v2Title');

const skip=document.createElement('a');
skip.className='v2-skip-link';
skip.href='#v2Exercise';
skip.textContent='رفتن به تمرین فعلی · پرش به تمرین';
skip.addEventListener('click',event=>{
  const target=document.getElementById('v2Exercise');
  if(!target)return;
  event.preventDefault();
  requestAnimationFrame(()=>{
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
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
title.textContent='کانجی ۵';
const subtitle=document.createElement('p');
subtitle.className='v2-subtitle';
subtitle.textContent='یادآوری فعال و مرور هوشمند پنج مهارت کانجی';
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

const layout=document.createElement('div');
layout.id='v2Grid';
layout.className='v2-layout v2-grid';

const content=document.createElement('div');
content.id='v2Content';
content.className='v2-content';
layout.appendChild(content);

const insights=document.createElement('details');
insights.id='v2Insights';
insights.className='v2-insights v2-side-grid';
insights.open=true;
const summary=document.createElement('summary');
summary.textContent='جزئیات جلسه';
insights.appendChild(summary);
const insightsGrid=document.createElement('div');
insightsGrid.className='v2-insights-grid';
insights.appendChild(insightsGrid);
layout.appendChild(insights);

root.appendChild(layout);
document.body.appendChild(root);

const labels={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
const stateLabels={
  unseen:'دیده نشده',
  introduced:'معرفی‌شده',
  learning:'در حال یادگیری',
  weak:'ضعیف',
  recovering:'در حال بازیابی',
  stable:'پایدار',
  mastered:'مسلط'
};
const outcomeLabels={correct:'درست',wrong:'نادرست',unknown:'نمی‌دانستم',near_miss:'نزدیک بود',empty:'خالی',invalid:'نامعتبر'};
const behaviorLabels={
  repair:'ترمیم',
  reinforce:'تقویت',
  recover:'بازیابی',
  maintain:'حفظ',
  explore:'اکتشاف'
};

function text(value,fallback='—'){
  const s=String(value??'').trim();
  return s||fallback;
}
function modeLabel(mode){return labels[mode]||text(mode,'تمرین');}
function stateLabel(state){return stateLabels[state]||text(state,'نامشخص');}
function outcomeLabel(outcome){return outcomeLabels[outcome]||text(outcome,'نتیجه');}
function pct(value){return Math.round(Math.max(0,Math.min(1,Number(value)||0))*100);}

function makeCard(titleText,className=''){
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

function setRow(container,label,value){
  const row=document.createElement('div');
  row.className='v2-row';
  const a=document.createElement('span');
  a.className='v2-row-label';
  a.textContent=label;
  const b=document.createElement('strong');
  b.className='v2-row-value';
  b.textContent=text(value);
  row.append(a,b);
  container.appendChild(row);
}

function normalizeStimulus(stimulus,mode,character){
  const s=stimulus&&typeof stimulus==='object'?stimulus:{};
  const fallbackKind=mode==='vocabulary'?'masked-vocabulary':mode==='context'?'masked-context':mode==='production'?'meaning':'kanji';
  return {
    kind:s.kind||fallbackKind,
    primary:text(s.primary,s.text||character),
    secondary:text(s.secondary,s.detail||''),
    translation:text(s.translation,''),
    inputPlaceholder:text(s.inputPlaceholder,mode==='production'||mode==='context'?'Type the Kanji':'Type your answer')
  };
}

function renderStimulus(stimulus,mode,character){
  const s=normalizeStimulus(stimulus,mode,character);
  const box=document.createElement('div');
  box.id='v2Stimulus';
  box.className='v2-stimulus';
  box.setAttribute('dir','ltr');

  if(s.kind==='kanji'){
    box.classList.add('v2-stimulus-kanji');
    const kanji=document.createElement('div');
    kanji.className='v2-kanji';
    kanji.textContent=s.primary;
    box.appendChild(kanji);
  }else{
    box.classList.add('v2-stimulus-text');
    box.classList.add(
      s.kind==='masked-context'?'v2-stimulus-context':
      s.kind==='masked-vocabulary'?'v2-stimulus-vocabulary':
      'v2-stimulus-meaning'
    );
    const primary=document.createElement('div');
    primary.className='v2-stimulus-primary';
    primary.textContent=s.primary;
    box.appendChild(primary);

    if(s.secondary){
      const secondary=document.createElement('div');
      secondary.className='v2-stimulus-secondary';
      secondary.textContent=s.secondary;
      box.appendChild(secondary);
    }

    if(s.translation){
      const translation=document.createElement('div');
      translation.className='v2-stimulus-translation';
      translation.textContent=s.translation;
      translation.setAttribute('dir','ltr');
      box.appendChild(translation);
    }
  }
  return box;
}

function render(snapshot){
  const revision=Number(snapshot?.viewRevision)||0;
  if(revision<lastViewRevision)return;
  lastViewRevision=revision;
  content.textContent='';
  insightsGrid.textContent='';

  const session=snapshot?.session||{};
  const ex=snapshot?.exercise||{};
  const feedback=snapshot?.feedback||{};
  const learner=snapshot?.learner||{};
  const reason=snapshot?.adaptiveReason||{};
  const sessionSummary=snapshot?.sessionSummary||{};

  const fraction=Math.max(0,Math.min(1,Number(session.completionFraction)||0));
  fill.style.width=Math.round(fraction*100)+'%';
  progress.setAttribute('aria-valuenow',String(Math.round(fraction*100)));

  const planned=Math.max(0,Number(session.plannedTotal)||0);
  const remaining=Math.max(0,Number(session.remainingTotal)||0);
  const done=Math.max(0,planned-remaining);
  progressCount.textContent=planned?done+' از '+planned:'شروع جلسه';
  progressMeta.textContent=planned
    ? remaining+' تمرین باقی مانده'+(session.resumed?' · جلسه ادامه پیدا کرده است':'')
    : session.resumed?'جلسهٔ قبلی ادامه پیدا کرده است':'آمادهٔ شروع';

  statusPill.textContent=session.status==='active'
    ? (session.resumed?'ادامهٔ جلسه':'جلسهٔ فعال')
    : 'جلسهٔ کامل‌شده';
  statusPill.dataset.state=session.status==='active'?'active':'complete';

  const exercise=makeCard('تمرین فعلی','v2-exercise-card');
  exercise.id='v2Exercise';
  exercise.tabIndex=-1;
  exercise.setAttribute('aria-labelledby','v2ExerciseHeading');

  const step=document.createElement('div');
  step.className='v2-exercise-step';
  step.textContent='یادآوری فعال';
  exercise.appendChild(step);

  const exHead=document.createElement('div');
  exHead.className='v2-exercise-head';

  const modeBadge=document.createElement('span');
  modeBadge.id='v2ModePill';
  modeBadge.className='v2-mode-badge v2-mode-pill';
  modeBadge.textContent=ex.mode?modeLabel(ex.mode):'آماده‌سازی';

  const exHeading=document.createElement('h3');
  exHeading.id='v2ExerciseHeading';
  exHeading.className='v2-exercise-heading';
  exHeading.textContent=ex.mode?'تمرین این لحظه':'آمادهٔ تمرین';
  exHead.append(modeBadge,exHeading);
  exercise.appendChild(exHead);

  if(ex?.mode){
    const prompt=document.createElement('p');
    prompt.id='v2Prompt';
    prompt.className='v2-prompt';
    prompt.textContent=text(ex.prompt,'به یاد بیاور و پاسخ بده.');
    exercise.appendChild(prompt);

    exercise.appendChild(renderStimulus(ex.stimulus,ex.mode,ex.character));

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
    inputLabel.setAttribute('aria-label','پاسخ شما');
    field.appendChild(inputLabel);

    const input=document.createElement('input');
    input.id='v2AnswerInput';
    input.className='v2-input';
    input.type='text';
    input.autocomplete='off';
    input.spellcheck=false;
    input.setAttribute('aria-describedby','v2Prompt');
    const stimulus=normalizeStimulus(ex.stimulus,ex.mode,ex.character);
    input.placeholder=stimulus.inputPlaceholder;
    if(ex.mode==='production'||ex.mode==='context')input.classList.add('v2-input-japanese');
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
    micro.textContent='Enter برای ارسال';
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
  content.appendChild(exercise);

  if(feedback?.outcome){
    const feedbackCard=makeCard('بازخورد','v2-feedback v2-feedback-card v2-feedback-filled');
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
    content.appendChild(feedbackCard);
    queueMicrotask(()=>{if(document.contains(feedbackCard))feedbackCard.focus({preventScroll:true});});
  }

  const summaryCard=makeCard('خلاصه جلسه','v2-summary-card');
  setRow(summaryCard,'پاسخ‌ها',Number(sessionSummary.attempts)||0);
  setRow(summaryCard,'پاسخ درست',Number(sessionSummary.correct)||0);
  setRow(summaryCard,'دقت',(Math.round((Number(sessionSummary.accuracy)||0)*100))+'٪');
  insightsGrid.appendChild(summaryCard);

  const learnerCard=makeCard('مهارت‌های یادگیرنده','v2-skills-card');
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
  insightsGrid.appendChild(learnerCard);

  const reasonCard=makeCard('تمرکز تطبیقی','v2-reason-card');
  reasonCard.dataset.heading='چرا این تمرین؟';
  const reasonHeader=document.createElement('div');
  reasonHeader.className='v2-reason-header';
  const reasonLabel=document.createElement('span');
  reasonLabel.textContent='چرا این تمرین؟';
  reasonHeader.appendChild(reasonLabel);
  if(reason.mode){
    const selected=document.createElement('strong');
    selected.textContent=modeLabel(reason.mode);
    reasonHeader.appendChild(selected);
  }
  reasonCard.appendChild(reasonHeader);

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
  }else{
    const empty=document.createElement('p');
    empty.className='v2-muted-copy';
    empty.textContent='پس از ثبت چند پاسخ، دلیل انتخاب تمرین دقیق‌تر می‌شود.';
    reasonCard.appendChild(empty);
  }
  insightsGrid.appendChild(reasonCard);

  const recentCard=makeCard('نتایج اخیر','v2-recent-card');
  const recentTitle=document.createElement('div');
  recentTitle.className='v2-secondary-title';
  recentTitle.textContent='پاسخ‌های اخیر';
  recentCard.appendChild(recentTitle);

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
  insightsGrid.appendChild(recentCard);

  if(ex?.mode){
    queueMicrotask(()=>{
      const input=document.getElementById('v2AnswerInput');
      if(input&&!feedback?.outcome)input.focus();
    });
  }
}

let subscribed=false;
let bootstrapped=false;
let lastViewRevision=-1;
let externallyPublishedExercise=false;

async function init(){
  const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
  if(!boundary)return;
  try{
    if(!subscribed){
      if(typeof boundary.subscribe==='function'){
        await boundary.subscribe(snapshot=>render(snapshot));
      }else{
        document.addEventListener('kanji5:v1.9-v2-view-models',event=>{
          const snapshot=event?.detail||{};
          if(snapshot?.exercise?.mode)externallyPublishedExercise=true;
          render(snapshot);
        });
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