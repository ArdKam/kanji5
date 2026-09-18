(()=> {
'use strict';

const params = new URLSearchParams(location.search);
if (params.get('legacy') === '1') return;

document.getElementById('app')?.setAttribute('hidden','');
document.getElementById('loading')?.setAttribute('hidden','');

const root = document.createElement('main');
root.id = 'v2App';
root.className = 'v2-shell';
root.setAttribute('aria-labelledby','v2Title');

const skip = document.createElement('a');
skip.className = 'v2-skip-link';
skip.href = '#v2Exercise';
skip.textContent = 'پرش به تمرین فعلی';
skip.addEventListener('click', function(event){
  const target = document.getElementById('v2Exercise');
  if (!target) return;
  event.preventDefault();
  requestAnimationFrame(function(){
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'start'});
  });
});
root.appendChild(skip);

const header = document.createElement('header');
header.className = 'v2-header';
const title = document.createElement('h1');
title.id = 'v2Title';
title.className = 'v2-title';
title.textContent = 'Kanji 5';
const subtitle = document.createElement('p');
subtitle.className = 'v2-subtitle';
subtitle.textContent = 'تمرین کوتاه و تطبیقی برای یادگیری پنج مهارت کانجی';
header.append(title,subtitle);
root.appendChild(header);

const sessionBar = document.createElement('section');
sessionBar.className = 'v2-session-bar';
sessionBar.setAttribute('aria-label','وضعیت جلسه');
root.appendChild(sessionBar);

const grid = document.createElement('div');
grid.id = 'v2Grid';
grid.className = 'v2-grid';
root.appendChild(grid);
document.body.appendChild(root);

const labels = {meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
const actions = {repair:'رفع ضعف اخیر',recover:'بازیابی بعد از خطا',reinforce:'تقویت مهارت',maintain:'مرور نگهدارنده',explore:'گسترش مهارت',weak:'عملکرد ضعیف‌تر',recovering:'در حال بازیابی',learning:'در حال یادگیری',introduced:'تازه معرفی‌شده',stable:'پایدار',mastered:'مسلط'};
const icons = {meaning:'M',reading:'R',production:'P',vocabulary:'V',context:'C'};

function text(value,fallback){
  const v = String(value == null ? '' : value).trim();
  return v || (fallback || '—');
}
function num(value){
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
function fa(value){ return Number(value || 0).toLocaleString('fa-IR'); }
function pct(value){ return Math.round(Math.max(0,Math.min(1,num(value)))*100) + '٪'; }

function section(titleText,className){
  const node = document.createElement('section');
  node.className = 'v2-card ' + (className || '');
  const heading = document.createElement('h2');
  heading.className = 'v2-card-title';
  heading.textContent = titleText;
  node.appendChild(heading);
  return node;
}

function modeBadge(mode){
  const badge = document.createElement('span');
  badge.className = 'v2-mode-badge';
  badge.textContent = (icons[mode] || '•') + '  ' + (labels[mode] || mode || 'تمرین');
  return badge;
}

function renderProgress(snapshot){
  sessionBar.textContent = '';
  const s = snapshot?.session || {};
  const planned = Math.max(0,num(s.plannedTotal));
  const remaining = Math.max(0,num(s.remainingTotal));
  const completed = Math.max(0,planned-remaining);
  const fraction = planned ? Math.max(0,Math.min(1,completed/planned)) : 0;

  const left = document.createElement('div');
  left.className = 'v2-session-progress';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'v2-eyebrow';
  eyebrow.textContent = s.completed ? 'جلسه کامل شد' : 'جلسه امروز';
  const count = document.createElement('strong');
  count.className = 'v2-session-count';
  count.textContent = planned ? fa(completed) + ' از ' + fa(planned) : 'آماده‌سازی';
  left.append(eyebrow,count);

  const progress = document.createElement('div');
  progress.className = 'v2-progress';
  progress.setAttribute('role','progressbar');
  progress.setAttribute('aria-label','پیشرفت جلسه');
  progress.setAttribute('aria-valuemin','0');
  progress.setAttribute('aria-valuemax','100');
  progress.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
  const fill = document.createElement('div');
  fill.className = 'v2-progress-fill';
  fill.style.width = Math.round(fraction*100) + '%';
  progress.appendChild(fill);

  const remainingNode = document.createElement('span');
  remainingNode.className = 'v2-remaining';
  remainingNode.textContent = remaining ? fa(remaining) + ' تمرین باقی مانده' : 'تمرینی باقی نمانده';
  sessionBar.append(left,progress,remainingNode);
}

function renderExercise(exercise,feedback){
  const node = section('تمرین فعلی','v2-exercise-card');
  node.id = 'v2Exercise';
  node.tabIndex = -1;

  if (!exercise?.mode){
    const empty = document.createElement('div');
    empty.className = 'v2-empty-state';
    const icon = document.createElement('div');
    icon.className = 'v2-empty-icon';
    icon.textContent = '学';
    const h = document.createElement('h3');
    h.textContent = 'تمرینی برای نمایش آماده نیست';
    const p = document.createElement('p');
    p.textContent = 'با شروع جلسه، تمرین مناسب بر اساس سابقهٔ یادگیری انتخاب می‌شود.';
    const button = document.createElement('button');
    button.type='button';
    button.id='v2StartExercise';
    button.className='v2-btn v2-btn-primary';
    button.textContent='شروع تمرین';
    button.addEventListener('click',function(){ void window.__KANJI5_EDU_BRIDGE__?.start?.(); });
    empty.append(icon,h,p,button);
    node.appendChild(empty);
    return node;
  }

  const top = document.createElement('div');
  top.className='v2-exercise-top';
  top.appendChild(modeBadge(exercise.mode));
  const prompt = document.createElement('p');
  prompt.id='v2Prompt';
  prompt.className='v2-prompt';
  prompt.textContent=text(exercise.prompt,'پاسخ خودت را وارد کن');
  top.appendChild(prompt);
  node.appendChild(top);

  const stimulus = exercise.stimulus || {};
  const box = document.createElement('div');
  box.className='v2-stimulus';
  const kind = text(stimulus.kind,'');
  if (kind === 'kanji'){
    const el=document.createElement('div');
    el.className='v2-kanji';
    el.lang='ja'; el.dir='ltr';
    el.textContent=text(stimulus.primary,exercise.character);
    box.appendChild(el);
  } else if (kind === 'meaning'){
    const el=document.createElement('div');
    el.className='v2-meaning-stimulus';
    el.lang='en'; el.dir='ltr';
    el.textContent=text(stimulus.primary);
    box.appendChild(el);
  } else if (kind === 'masked-vocabulary'){
    const word=document.createElement('div');
    word.className='v2-japanese-text';
    word.lang='ja'; word.dir='ltr';
    word.textContent=text(stimulus.primary);
    box.appendChild(word);
    if (stimulus.secondary){
      const reading=document.createElement('div');
      reading.className='v2-supporting-line';
      reading.lang='ja'; reading.dir='ltr';
      reading.textContent=stimulus.secondary;
      box.appendChild(reading);
    }
    if (stimulus.translation){
      const tr=document.createElement('div');
      tr.className='v2-translation';
      tr.lang='en'; tr.dir='ltr';
      tr.textContent=stimulus.translation;
      box.appendChild(tr);
    }
  } else if (kind === 'masked-context'){
    const sentence=document.createElement('div');
    sentence.className='v2-context-text';
    sentence.lang='ja'; sentence.dir='ltr';
    sentence.textContent=text(stimulus.primary);
    box.appendChild(sentence);
    if (stimulus.translation){
      const tr=document.createElement('div');
      tr.className='v2-translation';
      tr.lang='en'; tr.dir='ltr';
      tr.textContent=stimulus.translation;
      box.appendChild(tr);
    }
  } else {
    const el=document.createElement('div');
    el.className='v2-fallback-stimulus';
    el.textContent=text(stimulus.primary,exercise.character);
    box.appendChild(el);
  }
  node.appendChild(box);

  const form=document.createElement('div');
  form.className='v2-answer-area';
  const label=document.createElement('label');
  label.className='v2-field-label';
  label.htmlFor='v2AnswerInput';
  label.textContent='پاسخ شما';

  const input=document.createElement('input');
  input.id='v2AnswerInput';
  input.className='v2-input';
  input.type='text';
  input.autocomplete='off';
  input.spellcheck=false;
  input.dir='ltr';
  input.setAttribute('aria-describedby','v2Prompt');
  input.placeholder=text(stimulus.inputPlaceholder,'پاسخ را وارد کنید');

  const actionsRow=document.createElement('div');
  actionsRow.className='v2-actions';

  const submit=document.createElement('button');
  submit.type='button';
  submit.id='v2Submit';
  submit.className='v2-btn v2-btn-primary';
  submit.textContent='بررسی پاسخ';

  const unknown=document.createElement('button');
  unknown.type='button';
  unknown.id='v2DontKnow';
  unknown.className='v2-btn v2-btn-secondary';
  unknown.textContent='نمی‌دانستم';

  const answered=Boolean(feedback?.outcome);
  input.disabled=answered;
  submit.disabled=answered;
  unknown.disabled=answered;

  submit.addEventListener('click',async function(){
    const bridge=window.__KANJI5_EDU_BRIDGE__;
    if(!bridge || submit.disabled)return;
    submit.disabled=true; unknown.disabled=true; input.disabled=true;
    await bridge.submitValue(input.value);
  });
  unknown.addEventListener('click',async function(){
    const bridge=window.__KANJI5_EDU_BRIDGE__;
    if(!bridge || unknown.disabled)return;
    unknown.disabled=true; submit.disabled=true; input.disabled=true;
    await bridge.dontKnow();
  });
  input.addEventListener('keydown',function(event){
    if(event.key==='Enter' && !answered){
      event.preventDefault();
      submit.click();
    }
  });

  actionsRow.append(submit,unknown);
  form.append(label,input,actionsRow);
  node.appendChild(form);
  return node;
}

function renderFeedback(feedback,exercise){
  const node=section('بازخورد','v2-feedback');
  node.setAttribute('role','status');
  node.setAttribute('aria-live','polite');
  node.setAttribute('aria-atomic','true');
  node.tabIndex=-1;

  if(!feedback?.outcome){
    const p=document.createElement('p');
    p.className='v2-muted-copy';
    p.textContent='پس از پاسخ دادن، نتیجه و مرحلهٔ بعدی اینجا نمایش داده می‌شود.';
    node.appendChild(p);
    return node;
  }

  const map={
    correct:{icon:'✓',title:'درست بود',className:'correct',detail:'بازیابی موفق بود؛ آمادهٔ تمرین بعدی هستی.'},
    wrong:{icon:'×',title:'پاسخ درست نبود',className:'wrong',detail:'این مهارت دوباره در برنامهٔ تمرین قرار می‌گیرد.'},
    unknown:{icon:'?',title:'این مورد را نمی‌دانستی',className:'unknown',detail:'دفعهٔ بعد دوباره این مهارت را می‌بینیم.'},
    near_miss:{icon:'≈',title:'تقریباً درست',className:'near-miss',detail:'یک بار دیگر تلاش کن و جزئیات پاسخ را تثبیت کن.'},
    empty:{icon:'!',title:'پاسخی وارد نشد',className:'wrong',detail:'پاسخ را دوباره وارد کن.'},
    invalid:{icon:'!',title:'پاسخ معتبر نبود',className:'wrong',detail:'فرمت پاسخ را بررسی کن.'}
  };
  const tone=map[feedback.outcome] || map.wrong;
  const result=document.createElement('div');
  result.className='v2-feedback-result '+tone.className;
  const icon=document.createElement('div');
  icon.className='v2-feedback-icon';
  icon.textContent=tone.icon;
  const content=document.createElement('div');
  const h=document.createElement('h3');
  h.textContent=tone.title;
  const p=document.createElement('p');
  p.textContent=tone.detail;
  content.append(h,p);
  result.append(icon,content);
  node.appendChild(result);

  if(feedback.outcome!=='correct' && exercise?.answerHint){
    const answer=document.createElement('div');
    answer.className='v2-answer-reveal';
    const label=document.createElement('span');
    label.textContent='پاسخ درست';
    const value=document.createElement('strong');
    value.lang=exercise.mode==='meaning'?'en':'ja';
    value.dir='ltr';
    value.textContent=text(exercise.answerHint);
    answer.append(label,value);
    node.appendChild(answer);
  }

  const row=document.createElement('div');
  row.className='v2-actions v2-feedback-actions';
  if(feedback.state==='pending_retry'){
    const retry=document.createElement('button');
    retry.type='button'; retry.id='v2Retry';
    retry.className='v2-btn v2-btn-secondary';
    retry.textContent='یک بار دیگر همین مهارت';
    retry.addEventListener('click',async function(){
      retry.disabled=true;
      await window.__KANJI5_EDU_BRIDGE__?.retry?.();
    });
    row.appendChild(retry);
  }
  const next=document.createElement('button');
  next.type='button'; next.id='v2Next';
  next.className='v2-btn v2-btn-primary';
  next.textContent='تمرین بعدی';
  next.addEventListener('click',async function(){
    next.disabled=true;
    await window.__KANJI5_EDU_BRIDGE__?.next?.();
  });
  row.appendChild(next);
  node.appendChild(row);
  return node;
}

function renderReason(reason){
  const node=section('چرا این تمرین؟','v2-reason-card');
  const body=document.createElement('div');
  body.className='v2-reason-body';
  body.appendChild(modeBadge(reason?.mode));
  const title=document.createElement('strong');
  title.textContent=actions[reason?.action] || 'انتخاب تطبیقی';
  body.appendChild(title);
  const chips=document.createElement('div');
  chips.className='v2-reason-chips';
  const list=Array.isArray(reason?.reasons)?reason.reasons:[];
  list.slice(0,3).forEach(function(value){
    const chip=document.createElement('span');
    chip.className='v2-reason-chip';
    const key=String(value).trim();
    chip.textContent=actions[key] || key.replaceAll('_',' ');
    chips.appendChild(chip);
  });
  if(chips.childElementCount)body.appendChild(chips);
  node.appendChild(body);
  return node;
}

function renderSummary(summary){
  const node=section('خلاصهٔ جلسه','v2-summary-card');
  const stats=document.createElement('div');
  stats.className='v2-summary-stats';
  [['پاسخ‌ها',fa(summary?.attempts)],['درست',fa(summary?.correct)],['دقت',pct(summary?.accuracy)]].forEach(function(item){
    const el=document.createElement('div');
    el.className='v2-summary-stat';
    const value=document.createElement('strong');
    value.textContent=item[1];
    const label=document.createElement('span');
    label.textContent=item[0];
    el.append(value,label);
    stats.appendChild(el);
  });
  node.appendChild(stats);
  return node;
}

function renderSkills(learner){
  const node=section('وضعیت مهارت‌ها','v2-skills-card');
  const list=document.createElement('div');
  list.className='v2-skill-list';
  Object.keys(labels).forEach(function(mode){
    const item=learner?.attributes?.[mode] || {};
    const row=document.createElement('div');
    row.className='v2-skill-row';
    const top=document.createElement('div');
    top.className='v2-skill-top';
    const label=document.createElement('span');
    label.textContent=labels[mode];
    const value=document.createElement('strong');
    value.textContent=item.recentAccuracy != null ? pct(item.recentAccuracy) : '—';
    top.append(label,value);
    const progress=document.createElement('div');
    progress.className='v2-mini-progress';
    const fill=document.createElement('div');
    fill.style.width=Math.round(Math.max(0,Math.min(1,num(item.recentAccuracy)))*100)+'%';
    progress.appendChild(fill);
    const state=document.createElement('span');
    state.className='v2-skill-state';
    state.textContent=actions[item.state] || 'در حال یادگیری';
    row.append(top,progress,state);
    list.appendChild(row);
  });
  node.appendChild(list);
  return node;
}

function renderRecent(outcomes){
  const node=section('آخرین تمرین‌ها','v2-recent-card');
  const list=document.createElement('div');
  list.className='v2-outcome-list';
  const rows=Array.isArray(outcomes)?outcomes.slice(0,6):[];
  if(!rows.length){
    const p=document.createElement('p');
    p.className='v2-muted-copy';
    p.textContent='هنوز سابقه‌ای برای نمایش وجود ندارد.';
    node.appendChild(p);
    return node;
  }
  rows.forEach(function(item){
    const row=document.createElement('div');
    row.className='v2-outcome-row';
    const ch=document.createElement('strong');
    ch.className='v2-outcome-kanji';
    ch.lang='ja'; ch.dir='ltr';
    ch.textContent=text(item.character);
    const mode=document.createElement('span');
    mode.className='v2-outcome-detail';
    mode.textContent=labels[item.mode] || 'تمرین';
    const result=document.createElement('span');
    result.className='v2-outcome-result '+(item.correct?'is-correct':'is-wrong');
    result.textContent=item.correct?'درست':(actions[item.outcome] || 'خطا');
    row.append(ch,mode,result);
    list.appendChild(row);
  });
  node.appendChild(list);
  return node;
}

let lastFocusKey='';
function render(snapshot){
  grid.textContent='';
  renderProgress(snapshot);
  const exercise=snapshot?.exercise || {};
  const feedback=snapshot?.feedback || {};
  grid.appendChild(renderExercise(exercise,feedback));
  grid.appendChild(renderFeedback(feedback,exercise));
  const side=document.createElement('div');
  side.className='v2-side-column';
  side.append(renderReason(snapshot?.adaptiveReason),renderSummary(snapshot?.sessionSummary),renderSkills(snapshot?.learner),renderRecent(snapshot?.recentOutcomes));
  grid.appendChild(side);

  const focusKey=[feedback?.outcome,feedback?.retryCount,feedback?.reason].join('|');
  if(feedback?.outcome && focusKey!==lastFocusKey){
    lastFocusKey=focusKey;
    queueMicrotask(function(){ grid.querySelector('.v2-feedback')?.focus({preventScroll:true}); });
  } else if(!feedback?.outcome && exercise?.mode) {
    queueMicrotask(function(){ document.getElementById('v2AnswerInput')?.focus({preventScroll:true}); });
  }
}

let subscribed=false;
let bootstrapped=false;
async function init(){
  const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
  if(!boundary)return;
  try{
    if(!subscribed){
      if(typeof boundary.subscribe==='function') await boundary.subscribe(function(snapshot){render(snapshot);});
      else {
        document.addEventListener('kanji5:v1.9-v2-view-models',function(event){render(event?.detail || {});});
        render(await boundary.snapshot());
      }
      subscribed=true;
    }
    const bridge=window.__KANJI5_EDU_BRIDGE__;
    if(!bridge){setTimeout(init,50);return;}
    if(!bootstrapped){
      bootstrapped=true;
      const snapshot=await boundary.snapshot();
      if(!snapshot.exercise?.mode) await bridge.start();
      render(await boundary.snapshot());
    }
  }catch(error){
    render({});
    console.error(error);
  }
}
document.addEventListener('kanji5:v1.9-v2-boundary-ready',function(){void init();},{once:true});
void init();
})();