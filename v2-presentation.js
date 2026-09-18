(()=> {
'use strict';

const params = new URLSearchParams(location.search);
if (params.get('v2') !== '1') return;

const oldApp = document.getElementById('app');
const loading = document.getElementById('loading');
if (oldApp) oldApp.hidden = true;
if (loading) loading.hidden = true;

const root = document.createElement('main');
root.id = 'v2App';
root.className = 'v2-shell';
root.setAttribute('aria-labelledby', 'v2Title');
const stylesheet=document.createElement('link');
stylesheet.rel='stylesheet';
stylesheet.href='./v2-presentation.css';
document.head.appendChild(stylesheet);
const skip=document.createElement('a');
skip.className='v2-skip-link';skip.href='#v2Exercise';skip.textContent='Skip to current exercise';skip.addEventListener('click',event=>{const target=document.getElementById('v2Exercise');if(!target)return;event.preventDefault();requestAnimationFrame(()=>{target.focus({preventScroll:true});target.scrollIntoView({block:'start'});});});root.appendChild(skip);
const title = document.createElement('h1');
title.id = 'v2Title';
title.className='v2-title';
title.textContent = 'Kanji 5 · v2 Learning Session';
root.appendChild(title);

const subtitle = document.createElement('p');
subtitle.className='v2-subtitle';
subtitle.textContent = 'Presentation layer consuming the stable v1.9 learning boundary.';
root.appendChild(subtitle);

const grid = document.createElement('div');
grid.id='v2Grid';
grid.className='v2-grid';
root.appendChild(grid);
document.body.appendChild(root);

const text = value => String(value ?? '').trim() || '—';
const labels = {meaning:'Meaning',reading:'Reading',production:'Production',vocabulary:'Vocabulary',context:'Context'};

let sectionCounter=0;
function card(titleText) {
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  heading.id='v2SectionHeading'+(++sectionCounter);
  section.className='v2-card';
  section.setAttribute('aria-labelledby', heading.id);
  heading.className='v2-card-title';
  heading.textContent = titleText;
  section.appendChild(heading);
  return section;
}
function row(parent, label, value) {
  const p = document.createElement('p');
  p.style.cssText = 'display:flex;justify-content:space-between;gap:12px;margin:7px 0;';
  const a = document.createElement('span');
  a.textContent = label;
  const b = document.createElement('strong');
  b.textContent = text(value);
  p.append(a,b);
  parent.appendChild(p);
}

function render(snapshot) {
  grid.textContent = '';
  let postRenderFocus=null;

  const session = card('Session');
  const fraction=Number(snapshot?.session?.completionFraction)||0;
  const progress=document.createElement('div');
  progress.className='v2-progress'; 
  progress.setAttribute('role','progressbar');
  progress.setAttribute('aria-label','Session progress');
  progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
    const fill=document.createElement('div');fill.className='v2-progress-fill';fill.style.width=Math.round(fraction*100)+'%';
  progress.appendChild(fill);session.appendChild(progress);
  const progressMeta=document.createElement('p');progressMeta.className='v2-progress-meta';progressMeta.textContent='Progress '+Math.round(fraction*100)+'% · '+String(snapshot?.session?.remainingTotal??0)+' remaining';session.appendChild(progressMeta);
  row(session,'Status',snapshot?.session?.status);
  row(session,'Session ID',snapshot?.session?.sessionId);
  row(session,'Plan revision',snapshot?.session?.planRevision);
  row(session,'Resumed',snapshot?.session?.resumed ? 'yes' : 'no');
  grid.appendChild(session);

  const exercise = card('Current exercise');
  exercise.id='v2Exercise';exercise.tabIndex=-1;
  const ex = snapshot?.exercise;
  if (ex?.mode) {
    row(exercise,'Skill',labels[ex.mode] || ex.mode);
    const prompt=document.createElement('p');prompt.id='v2Prompt';prompt.className='v2-prompt';prompt.textContent=ex.prompt||'Exercise';exercise.appendChild(prompt);
    if (ex.character) row(exercise,'Kanji',ex.character);
    row(exercise,'Content',ex.contentId);

    const inputLabel=document.createElement('label');
    inputLabel.className='v2-field-label';
    inputLabel.htmlFor='v2AnswerInput';inputLabel.textContent='Your answer';
    exercise.appendChild(inputLabel);
    const input = document.createElement('input');
    input.id = 'v2AnswerInput';
    input.className='v2-input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-describedby','v2Prompt');
    input.placeholder = ex.mode === 'production' || ex.mode === 'context' ? 'Type the Kanji' : 'Type your answer';
    

    const actions = document.createElement('div');
    actions.className='v2-actions';

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.id = 'v2Submit';
    submit.className='v2-btn v2-btn-primary';
    submit.textContent = 'Check answer';

    const unknown = document.createElement('button');
    unknown.type = 'button';
    unknown.id = 'v2DontKnow';
    unknown.className='v2-btn v2-btn-secondary';
    unknown.textContent = "Don't know";

    submit.addEventListener('click',async()=>{
      const bridge=window.__KANJI5_EDU_BRIDGE__;
      if(!bridge)return;
      submit.disabled=true;
      await bridge.submitValue(input.value);
    });
    unknown.addEventListener('click',async()=>{
      const bridge=window.__KANJI5_EDU_BRIDGE__;
      if(!bridge)return;
      unknown.disabled=true;
      await bridge.dontKnow();
    });
    input.addEventListener('keydown',event=>{
      if(event.key==='Enter'){event.preventDefault();submit.click();}
    });
    actions.append(submit,unknown);
    exercise.append(input,actions);
  } else {
    const p=document.createElement('p');
    p.textContent='No exercise is currently exposed by the learning boundary.';
    exercise.appendChild(p);
    const start=document.createElement('button');
    start.type='button';
    start.id='v2StartExercise';
    start.className='v2-btn v2-btn-primary';
    start.textContent='Start exercise';
    start.style.cssText = 'border:0;background:#111827;color:#fff;padding:11px 14px;border-radius:12px;font-weight:800;cursor:pointer;';
    start.addEventListener('click',async()=>{await window.__KANJI5_EDU_BRIDGE__?.start?.();});
    exercise.appendChild(start);
  }
  grid.appendChild(exercise);

  const feedback = card('Feedback');
  feedback.className='v2-card v2-feedback';
  feedback.setAttribute('aria-live','polite');
  feedback.setAttribute('aria-atomic','true');
  feedback.setAttribute('role','status');
  feedback.tabIndex=-1;
  if(snapshot?.feedback?.outcome)postRenderFocus=feedback;
  row(feedback,'Outcome',snapshot?.feedback?.outcome);
  row(feedback,'Score',snapshot?.feedback?.score);
  row(feedback,'Retry count',snapshot?.feedback?.retryCount);
  row(feedback,'Recovered',snapshot?.feedback?.recovered ? 'yes' : 'no');
  if (snapshot?.feedback?.reason) row(feedback,'Reason',snapshot.feedback.reason);
  const feedbackActions=document.createElement('div');
  feedbackActions.className='v2-actions';
  if (snapshot?.feedback?.state==='pending_retry') {
    const retry=document.createElement('button');
    retry.type='button';retry.id='v2Retry';retry.className='v2-btn v2-btn-secondary';retry.textContent='Retry same skill';
    retry.addEventListener('click',async()=>{const bridge=window.__KANJI5_EDU_BRIDGE__;if(!bridge?.retry)return;retry.disabled=true;await bridge.retry()});
    feedbackActions.appendChild(retry);
  }
  if (snapshot?.feedback?.outcome) {
    const next=document.createElement('button');
    next.type='button';next.id='v2Next';next.className='v2-btn v2-btn-primary';next.textContent='Next exercise';
    next.addEventListener('click',async()=>{await window.__KANJI5_EDU_BRIDGE__?.next?.();});
    feedbackActions.appendChild(next);
  }
  const back=document.createElement('button');
  back.type='button';back.id='v2BackToReview';back.className='v2-btn v2-btn-secondary';back.textContent='Back to review';
  back.addEventListener('click',()=>window.__KANJI5_EDU_BRIDGE__?.backToReview?.());
  feedbackActions.appendChild(back);
  feedback.appendChild(feedbackActions);
  grid.appendChild(feedback);

  const summary = card('Session summary');
  row(summary,'Attempts',snapshot?.sessionSummary?.attempts);
  row(summary,'Correct',snapshot?.sessionSummary?.correct);
  row(summary,'Accuracy',Math.round((Number(snapshot?.sessionSummary?.accuracy)||0)*100)+'%');
  row(summary,'Completion',snapshot?.sessionSummary?.completionStatus);
  grid.appendChild(summary);

  const learner = card('Learner skills');
  for (const mode of Object.keys(labels)) {
    const item = snapshot?.learner?.attributes?.[mode] || {};
    row(learner,labels[mode],text(item.state)+' · recent '+Math.round((Number(item.recentAccuracy)||0)*100)+'%');
  }
  grid.appendChild(learner);

  const reason = card('Adaptive focus');
  row(reason,'Skill',labels[snapshot?.adaptiveReason?.mode] || snapshot?.adaptiveReason?.mode);
  row(reason,'Action',snapshot?.adaptiveReason?.action);
  if (Array.isArray(snapshot?.adaptiveReason?.reasons)) row(reason,'Reasons',snapshot.adaptiveReason.reasons.join(' · '));
  grid.appendChild(reason);

  const recent = card('Recent outcomes');
  const outcomes=Array.isArray(snapshot?.recentOutcomes)?snapshot.recentOutcomes:[];
  if(!outcomes.length){
    const empty=document.createElement('p');empty.textContent='No recent outcomes yet.';empty.style.color='#6b7280';recent.appendChild(empty);
  }else{
    for(const item of outcomes){
      const rowNode=document.createElement('div');rowNode.style.cssText='display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #f0f1f3;';
      const kanji=document.createElement('strong');kanji.textContent=item.character||'—';
      const detail=document.createElement('span');detail.textContent=(labels[item.mode]||item.mode||'—')+' · '+(item.quality||item.outcome||'—');detail.style.color='#4b5563';detail.style.fontSize='12px';
      const result=document.createElement('strong');result.textContent=item.correct?'✓':(item.outcome||'—');result.setAttribute('aria-label',item.correct?'Correct':'Incorrect');
      rowNode.append(kanji,detail,result);recent.appendChild(rowNode);
    }
  }
  grid.appendChild(recent);
  if(postRenderFocus)queueMicrotask(()=>{if(document.contains(postRenderFocus))postRenderFocus.focus({preventScroll:true});});
  const feedbackKey=[snapshot?.feedback?.outcome,snapshot?.feedback?.retryCount,snapshot?.feedback?.recovered,snapshot?.feedback?.reason].join('|');
  if(snapshot?.feedback?.outcome && feedbackKey!==lastFeedbackFocusKey){
    lastFeedbackFocusKey=feedbackKey;
    queueMicrotask(()=>feedback.focus({preventScroll:true}));
  }
}

let subscribed=false;
let bootstrapped=false;
let boundaryReadyListener=false;
let lastFeedbackFocusKey='';
async function init() {
  const boundary = window.__KANJI5_V19_V2_BOUNDARY__;
  if (!boundary) return;
  try {
    if (!subscribed) {
      if(typeof boundary.subscribe==='function'){
        await boundary.subscribe(snapshot=>render(snapshot));
      }else{
        document.addEventListener('kanji5:v1.9-v2-view-models', event => render(event?.detail || {}));
        render(await boundary.snapshot());
      }
      subscribed=true;
    }
    const bridge = window.__KANJI5_EDU_BRIDGE__;
    if (!bridge) {
      setTimeout(init, 50);
      return;
    }
    if (!bootstrapped) {
      bootstrapped=true;
      const snapshot = await boundary.snapshot();
      if (!snapshot.exercise?.mode) await bridge.start();
      render(await boundary.snapshot());
    }
  } catch (error) {
    render({});
    console.error(error);
  }
}
if (!boundaryReadyListener) {
  boundaryReadyListener=true;
  document.addEventListener('kanji5:v1.9-v2-boundary-ready', () => { void init(); });
}
void init();
})();