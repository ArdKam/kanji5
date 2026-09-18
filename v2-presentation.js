(()=> {
'use strict';

const params = new URLSearchParams(location.search);
if (params.get('legacy') === '1') return;

const oldApp = document.getElementById('app');
const loading = document.getElementById('loading');
if (oldApp) oldApp.hidden = true;
if (loading) loading.hidden = true;

const ui = window.__KANJI5_V2_COMPONENTS__;
if(!ui) throw new Error('Kanji 5 v2 presentation primitives are unavailable.');
const root = document.createElement('main');
root.id = 'v2App';
root.className = 'v2-shell';
root.lang = 'fa';
root.dir = 'rtl';
root.setAttribute('aria-labelledby', 'v2Title');

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = './v2-presentation.css';
document.head.appendChild(stylesheet);

const skip = document.createElement('a');
skip.className = 'v2-skip-link';
skip.setAttribute('href','#v2Exercise');
skip.textContent = 'رفتن به تمرین فعلی';
skip.addEventListener('click', event => {
  const target = document.getElementById('v2Exercise');
  if (!target) return;
  event.preventDefault();
  requestAnimationFrame(() => {
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
title.textContent = 'کانجی ۵';
header.appendChild(title);

const headerMeta = document.createElement('div');
headerMeta.className = 'v2-header-meta';
const sessionProgress = document.createElement('div');
sessionProgress.className = 'v2-session-progress';
const practiceButton = document.createElement('button');
practiceButton.type = 'button';
practiceButton.id = 'v2StartPractice';
practiceButton.className = 'v2-btn v2-btn-secondary v2-header-practice';
practiceButton.textContent = 'تمرین آموزشی';
practiceButton.addEventListener('click', async () => {
  const bridge = window.__KANJI5_EDU_BRIDGE__;
  if (!bridge?.start) return;
  presentationMode = 'exercise';
  await runBusy('در حال آماده‌سازی تمرین…', async () => {
    const sessionApi = window.__KANJI5_V16_SESSION_API__;
    const current = sessionApi?.getSession?.();
    if (sessionApi?.startReady && !current?.started && !current?.finished) await sessionApi.startReady(); else if (sessionApi?.start && !current?.started && !current?.finished) sessionApi.start();
    await bridge.start();
  },'آماده‌سازی تمرین انجام نشد. دوباره تلاش کن.');
});
const statsButton = document.createElement('button');
statsButton.type = 'button';
statsButton.id = 'v2Stats';
statsButton.className = 'v2-btn v2-btn-secondary v2-header-tool';
statsButton.textContent = 'آمار';
statsButton.addEventListener('click', () => { void openV2Stats(); });

const settingsButton = document.createElement('button');
settingsButton.type = 'button';
settingsButton.id = 'v2Settings';
settingsButton.className = 'v2-btn v2-btn-secondary v2-header-tool';
settingsButton.textContent = 'تنظیمات';
settingsButton.addEventListener('click', () => { void openV2Settings(); });

headerMeta.append(sessionProgress,practiceButton,statsButton,settingsButton);
header.appendChild(headerMeta);
root.appendChild(header);

const content = document.createElement('div');
content.className = 'v2-content';
root.appendChild(content);

const operationStatus = document.createElement('div');
operationStatus.id = 'v2OperationStatus';
operationStatus.className = 'v2-operation-status';
operationStatus.setAttribute('role','status');
operationStatus.setAttribute('aria-live','polite');
operationStatus.hidden = true;
root.insertBefore(operationStatus,content);

let busyDepth = 0;
let statusRevision = 0;
function showOperationStatus(message,state='info'){
  statusRevision += 1;
  const revision = statusRevision;
  operationStatus.hidden = false;
  operationStatus.dataset.state = state;
  operationStatus.textContent = message;
  if(state === 'error') setTimeout(() => {
    if(statusRevision === revision){ operationStatus.hidden = true; operationStatus.textContent = ''; }
  },6000);
}
function beginBusy(message){
  busyDepth += 1;
  content.setAttribute('aria-busy','true');
  showOperationStatus(message,'busy');
}
function endBusy(){
  busyDepth = Math.max(0,busyDepth-1);
  if(busyDepth === 0) {
    content.setAttribute('aria-busy','false');
    if(operationStatus.dataset.state === 'busy'){ operationStatus.hidden = true; operationStatus.textContent = ''; }
  }
}
async function runBusy(message,action,errorMessage='عملیات انجام نشد. دوباره تلاش کن.'){
  beginBusy(message);
  try { return await action(); }
  catch(error){ showOperationStatus(errorMessage,'error'); console.error(error); return null; }
  finally { endBusy(); }
}

document.body.appendChild(root);
ensureV2Dialogs();

const toFaDigits = value => String(value).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const text = value => String(value ?? '').trim() || '—';
const localizedReason = value => ({repair:'به دلیل خطاهای اخیر، این مهارت دوباره تمرین می‌شود.',reinforce:'برای تثبیت این مهارت انتخاب شده است.',recover:'برای بررسی بازیابی پس از خطا انتخاب شده است.',maintain:'برای حفظ این مهارت انتخاب شده است.',explore:'برای تکمیل شواهد یادگیری انتخاب شده است.'})[String(value || '')] || 'بر اساس عملکرد اخیر انتخاب شده است.';
const labels = {meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
const outcomes = {correct:'درست',wrong:'نادرست',unknown:'نمی‌دانم',near_miss:'نزدیک بود',empty:'خالی',invalid:'در دسترس نیست'};
const states = {unseen:'دیده نشده',introduced:'معرفی شده',learning:'در حال یادگیری',weak:'ضعیف',recovering:'در حال بازیابی',stable:'پایدار',mastered:'مسلط'};
const actions = {repair:'ترمیم',reinforce:'تقویت',recover:'بازیابی',maintain:'حفظ',explore:'اکتشاف'};
const qualities = {exact:'دقیق',partial:'نسبی',unknown:'نمی‌دانم',wrong:'نادرست',empty:'خالی',invalid:'نامعتبر'};
const localizeState = value => states[String(value || '')] || text(value);
const localizeAction = value => actions[String(value || '')] || text(value);
const localizeOutcome = value => outcomes[String(value || '')] || text(value);
const localizeQuality = value => qualities[String(value || '')] || text(value);

let lastFeedbackFocusKey = '';
let presentationMode = 'auto';

function speechAvailable(){
  return typeof window.speechSynthesis?.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function';
}
function speakJapanese(value,button){
  const textValue=String(value||'').trim();
  if(!textValue)return false;
  if(!speechAvailable()){
    if(button){
      button.disabled=true;
      button.setAttribute('aria-disabled','true');
      button.setAttribute('aria-label','صدا در این مرورگر در دسترس نیست');
    }
    showOperationStatus('پخش صدا در این مرورگر در دسترس نیست.','error');
    return false;
  }
  try{
    const utterance=new SpeechSynthesisUtterance(textValue);
    utterance.lang='ja-JP';
    utterance.rate=.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    return true;
  }catch(error){
    showOperationStatus('پخش صدا ممکن نشد.','error');
    console.error(error);
    return false;
  }
}
function audioButton(value,label){
  const button=document.createElement('button');
  button.type='button';
  button.className='v2-audio-button';
  button.textContent='🔊';
  button.setAttribute('aria-label',label||'پخش تلفظ');
  if(!speechAvailable()){
    button.disabled=true;
    button.setAttribute('aria-disabled','true');
    button.setAttribute('aria-label','صدا در این مرورگر در دسترس نیست');
    button.title='صدا در این مرورگر در دسترس نیست';
  }
  button.addEventListener('click',()=>speakJapanese(value,button));
  return button;
}

function relativeDue(dueAt){
  const ms=Math.max(0,Date.parse(String(dueAt||''))-Date.now()),mins=Math.max(1,Math.round(ms/60000));
  if(mins<60)return toFaDigits(mins)+' دقیقهٔ دیگر';
  if(mins<1440)return toFaDigits(Math.round(mins/60))+' ساعتٔ دیگر';
  return toFaDigits(Math.round(mins/1440))+' روزٔ دیگر';
}
function renderDailyGoal(parent,snapshot){
  const goal=snapshot?.dailyGoal||{};
  const section=document.createElement('section');
  section.className='v2-daily-goal';
  const top=document.createElement('div');
  top.className='v2-daily-goal-top';
  const label=document.createElement('strong');
  label.textContent='هدف روزانه: '+toFaDigits(goal.completed||0)+'/'+toFaDigits(goal.target||0);
  const badge=document.createElement('span');
  badge.textContent=goal.celebrated?'🎉 تکمیل شد':'';
  top.append(label,badge);
  const track=document.createElement('div');
  track.className='v2-daily-goal-track';
  const fill=document.createElement('div');
  fill.className='v2-daily-goal-fill';
  fill.style.width=Math.round((Number(goal.progress)||0)*100)+'%';
  track.appendChild(fill);
  section.append(top,track);
  parent.appendChild(section);
}
function renderUpcomingReviews(parent,snapshot){
  const rows=Array.isArray(snapshot?.upcomingReviews)?snapshot.upcomingReviews:[];
  const section=document.createElement('details');
  section.className='v2-upcoming-reviews';
  const summary=document.createElement('summary');
  summary.textContent='مرورهای پیش‌رو';
  const body=document.createElement('div');
  body.className='v2-upcoming-reviews-body';
  if(!rows.length) body.textContent='فعلاً مرور زمان‌بندی‌شده‌ای در آینده وجود ندارد.';
  else for(const item of rows){
    const row=document.createElement('div');
    row.className='v2-upcoming-row';
    const character=document.createElement('strong');
    character.lang='ja';
    character.textContent=item.character||'—';
    const when=document.createElement('span');
    when.textContent=relativeDue(item.dueAt);
    row.append(character,when);
    body.appendChild(row);
  }
  section.append(summary,body);
  parent.appendChild(section);
}
function renderDailySummary(parent,snapshot){
  const summary=snapshot?.dailySummary||{};
  const section=document.createElement('section');
  section.className='v2-daily-summary';
  section.setAttribute('aria-label','خلاصهٔ امروز');
  const items=[
    ['due','مرورهای امروز',summary.dueCount],
    ['new','کانجی جدید امروز',summary.newCount],
    ['mastered','یادگرفته‌شده',summary.masteredCount],
    ['streak','روز پیاپی',summary.streak]
  ];
  for(const [kind,labelText,value] of items){
    section.appendChild(ui.stat(labelText,toFaDigits(value||0),kind));
  }
  parent.appendChild(section);
}
function openV2Dialog(id){
  const dialog=document.getElementById(id);
  if(!dialog)return null;
  if(!dialog.open)dialog.showModal();
  return dialog;
}
function ensureV2Dialogs(){
  if(document.getElementById('v2StatsDialog'))return;
  const statsDialog=document.createElement('dialog');
  statsDialog.id='v2StatsDialog';
  statsDialog.className='v2-dialog';
  statsDialog.setAttribute('aria-labelledby','v2StatsTitle');
  statsDialog.innerHTML='<div class="v2-dialog-body"></div>';
  const settingsDialog=document.createElement('dialog');
  settingsDialog.id='v2SettingsDialog';
  settingsDialog.className='v2-dialog';
  settingsDialog.setAttribute('aria-labelledby','v2SettingsTitle');
  settingsDialog.innerHTML='<div class="v2-dialog-body"></div>';
  root.append(statsDialog,settingsDialog);
}
async function openV2Stats(){
  const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
  if(!boundary)return;
  const snapshot=await boundary.snapshot(),stats=snapshot?.stats||{};
  const dialog=openV2Dialog('v2StatsDialog'),body=dialog?.querySelector('.v2-dialog-body');
  if(!dialog||!body)return;
  body.textContent='';
  body.appendChild(heading('آمار','v2StatsTitle'));
  const grid=document.createElement('div');
  grid.className='v2-stats-grid';
  for(const [labelText,value] of [['کل مرورها',stats.totalReviews],['مرورهای غیر Again',Math.round((Number(stats.nonAgainRate)||0)*100)+'٪'],['کانجی مطالعه‌شده',(stats.studiedCount||0)+' / '+(stats.deckSize||0)],['رشتهٔ فعلی',(stats.currentStreak||0)+' 🔥'],['طولانی‌ترین رشته',(stats.longestStreak||0)+' 🔥'],['Leech',stats.leechCount]]) row(grid,labelText,value);
  body.appendChild(grid);
  const title=document.createElement('h3');
  title.className='v2-dialog-subtitle';
  title.textContent='مرورهای ۷ روز اخیر';
  body.appendChild(title);
  const bars=document.createElement('div');
  bars.className='v2-dialog-bars';
  const max=Math.max(1,...(stats.last7||[]).map(x=>Number(x.count)||0));
  for(const item of (stats.last7||[])){
    const col=document.createElement('div');
    col.className='v2-dialog-bar-col';
    const fill=document.createElement('div');
    fill.className='v2-dialog-bar-fill';
    fill.style.height=(Math.round((Number(item.count)||0)/max*72)+2)+'px';
    const label=document.createElement('span');
    label.textContent=(item.label||'—')+' · '+toFaDigits(item.count||0);
    col.append(fill,label);
    bars.appendChild(col);
  }
  body.appendChild(bars);
  const close=document.createElement('button');
  close.className='v2-btn v2-btn-secondary';
  close.textContent='بستن';
  close.addEventListener('click',()=>dialog.close());
  body.appendChild(close);
}
async function openV2Settings(){
  const boundary=window.__KANJI5_V19_V2_BOUNDARY__;
  if(!boundary)return;
  const snapshot=await boundary.snapshot(),settings=snapshot?.settings||{};
  const dialog=openV2Dialog('v2SettingsDialog'),body=dialog?.querySelector('.v2-dialog-body');
  if(!dialog||!body)return;
  body.textContent='';
  body.appendChild(heading('تنظیمات','v2SettingsTitle'));
  const form=document.createElement('form');
  form.className='v2-settings-form';
  for(const [id,labelText,value,min,max] of [['v2DailyNew','کانجی جدید در روز',settings.dailyNew,1,30],['v2DailyGoal','هدف تعداد مرور روزانه',settings.dailyGoal,1,500],['v2LeechThreshold','آستانهٔ Leech (تعداد خطا)',settings.leechThreshold,2,30]]){
    const label=document.createElement('label');
    label.className='v2-setting-row';
    label.textContent=labelText;
    const input=document.createElement('input');
    input.id=id;input.type='number';input.min=String(min);input.max=String(max);input.step='1';input.value=String(value??min);
    label.appendChild(input);form.appendChild(label);
  }
  for(const [key,labelText] of [['production','تولید کانجی'],['vocabulary','تکمیل واژه'],['context','یادآوری بافت']]){
    const label=document.createElement('label');
    label.className='v2-setting-row';
    label.textContent=labelText;
    const input=document.createElement('input');
    input.type='checkbox';input.checked=settings[key]!==false;
    input.dataset.educationSetting=key;
    label.appendChild(input);form.appendChild(label);
  }
  const actions=document.createElement('div');
  actions.className='v2-actions';
  const save=document.createElement('button');
  save.type='submit';save.className='v2-btn v2-btn-primary';save.textContent='ذخیره';
  const close=document.createElement('button');
  close.type='button';close.className='v2-btn v2-btn-secondary';close.textContent='بستن';
  const reset=document.createElement('button');
  reset.type='button';reset.className='v2-btn v2-btn-secondary';reset.textContent='پاک کردن تمام پیشرفت';
  close.addEventListener('click',()=>dialog.close());
  reset.addEventListener('click',()=>boundary.resetProgress?.());
  actions.append(save,close,reset);form.appendChild(actions);body.appendChild(form);
  form.addEventListener('submit',async event=>{
    event.preventDefault();save.disabled=true;
    try{
      await boundary.updateSettings({
        dailyNew:Number(form.querySelector('#v2DailyNew').value)||5,
        dailyGoal:Number(form.querySelector('#v2DailyGoal').value)||20,
        leechThreshold:Number(form.querySelector('#v2LeechThreshold').value)||8,
        production:form.querySelector('[data-education-setting="production"]')?.checked!==false,
        vocabulary:form.querySelector('[data-education-setting="vocabulary"]')?.checked!==false,
        context:form.querySelector('[data-education-setting="context"]')?.checked!==false
      });
      dialog.close();
    }finally{save.disabled=false}
  });
}
function heading(textValue, id) {
  const h = document.createElement('h2');
  h.id = id;
  h.className = 'v2-card-title';
  h.textContent = textValue;
  return h;
}

function row(parent, label, value) {
  const p = document.createElement('p');
  p.className = 'v2-row';
  const a = document.createElement('span');
  a.className = 'v2-row-label';
  a.textContent = label;
  const b = document.createElement('strong');
  b.className = 'v2-row-value';
  b.textContent = text(value);
  p.append(a,b);
  parent.appendChild(p);
}

function renderHeader(snapshot) {
  sessionProgress.textContent = '';
  const fraction = Math.max(0, Math.min(1, Number(snapshot?.session?.completionFraction) || 0));
  const total = Number(snapshot?.session?.plannedTotal) || 0;
  const remaining = Number(snapshot?.session?.remainingTotal) || 0;
  const done = total > 0 ? Math.max(0, total - remaining) : 0;

  const progress = ui.progress(fraction * 100, { label: 'پیشرفت جلسه' });

  const meta = document.createElement('div');
  meta.className = 'v2-progress-meta';
  meta.textContent = total > 0 ? 'پیشرفت ' + toFaDigits(Math.min(done,total)) + ' از ' + toFaDigits(total) : 'پیشرفت ۰ از ۰';
  sessionProgress.append(progress,meta);
}

function renderStimulus(parent, ex) {
  const stimulus = ex?.stimulus || {};
  const kind = stimulus.kind || 'kanji';
  const primary = text(stimulus.primary || ex?.character);
  const secondary = text(stimulus.secondary);
  const translation = text(stimulus.translation);

  const wrap = document.createElement('div');
  wrap.className = 'v2-stimulus v2-stimulus-' + kind;