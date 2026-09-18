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
root.setAttribute('aria-labelledby', 'v2Title');
root.style.cssText = 'max-width:1040px;margin:0 auto;padding:20px;min-height:100vh;color:#111827;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';
const media=document.createElement('style');
media.textContent='@media(max-width:760px){#v2App{padding:14px}#v2Grid{grid-template-columns:1fr!important}#v2App h1{font-size:24px}#v2App .v2-actions{flex-direction:column}#v2App .v2-actions button{width:100%}}@media(prefers-reduced-motion:reduce){#v2App *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}#v2App button,#v2App input{min-height:44px}#v2App button:focus-visible,#v2App input:focus-visible,#v2App a:focus-visible{outline:3px solid currentColor;outline-offset:2px}.v2-skip-link{position:absolute;left:10px;top:-100px;padding:10px 14px;background:#111827;color:#fff;border-radius:10px;z-index:100}.v2-skip-link:focus{top:10px}';
document.head.appendChild(media);
const skip=document.createElement('a');
skip.className='v2-skip-link';skip.href='#v2Exercise';skip.textContent='Skip to current exercise';skip.addEventListener('click',event=>{const target=document.getElementById('v2Exercise');if(!target)return;event.preventDefault();requestAnimationFrame(()=>{target.focus({preventScroll:true});target.scrollIntoView({block:'start'});});});root.appendChild(skip);
const title = document.createElement('h1');
title.id = 'v2Title';
title.textContent = 'Kanji 5 · v2 Learning Session';
title.style.cssText = 'font-size:30px;margin:0 0 6px;';
root.appendChild(title);

const subtitle = document.createElement('p');
subtitle.textContent = 'Presentation layer consuming the stable v1.9 learning boundary.';
subtitle.style.cssText = 'margin:0 0 18px;color:#6b7280;';
root.appendChild(subtitle);

const grid = document.createElement('div');
grid.id='v2Grid';
grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;';
root.appendChild(grid);
document.body.appendChild(root);

const text = value => String(value ?? '').trim() || '—';
const labels = {meaning:'Meaning',reading:'Reading',production:'Production',vocabulary:'Vocabulary',context:'Context'};

let sectionCounter=0;
function card(titleText) {
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  heading.id='v2SectionHeading'+(++sectionCounter);
  section.setAttribute('aria-labelledby', heading.id);
  section.style.cssText = 'background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:16px;';
  heading.textContent = titleText;
  heading.style.cssText = 'font-size:15px;margin:0 0 10px;';
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
  progress.setAttribute('role','progressbar');
  progress.setAttribute('aria-label','Session progress');
  progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
  progress.style.cssText='height:10px;background:#eef0f2;border-radius:99px;overflow:hidden;margin:10px 0 7px;';
  const fill=document.createElement('div');fill.style.cssText='height:100%;background:#111827;border-radius:99px;width:'+Math.round(fraction*100)+'%;';
  progress.appendChild(fill);session.appendChild(progress);
  const progressMeta=document.createElement('p');progressMeta.textContent='Progress '+Math.round(fraction*100)+'% · '+String(snapshot?.session?.remainingTotal??0)+' remaining';progressMeta.style.cssText='margin:0 0 8px;color:#6b7280;font-size:12px;';session.appendChild(progressMeta);
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
    const prompt=document.createElement('p');prompt.id='v2Prompt';prompt.textContent=ex.prompt||'Exercise';prompt.style.cssText='margin:8px 0;color:#4b5563;';exercise.appendChild(prompt);
    if (ex.character) row(exercise,'Kanji',ex.character);
    row(exercise,'Content',ex.contentId);

    const inputLabel=document.createElement('label');
    inputLabel.htmlFor='v2AnswerInput';inputLabel.textContent='Your answer';inputLabel.style.cssText='display:block;margin-top:10px;font-weight:700;';
    exercise.appendChild(inputLabel);
    const input = document.createElement('input');
    input.id = 'v2AnswerInput';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-describedby','v2Prompt');
    input.placeholder = ex.mode === 'production' || ex.mode === 'context' ? 'Type the Kanji' : 'Type your answer';
    input.style.cssText = 'width:100%;margin-top:12px;padding:12px;border:1px solid #d1d5db;border-radius:12px;font:inherit;direction:ltr;';

    const actions = document.createElement('div');
    actions.className='v2-actions';
    actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;';

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.id = 'v2Submit';
    submit.textContent = 'Check answer';
    submit.style.cssText = 'border:0;background:#111827;color:#fff;padding:11px 14px;border-radius:12px;font-weight:800;cursor:pointer;';

    const unknown = document.createElement('button');
    unknown.type = 'button';
    unknown.id = 'v2DontKnow';
    unknown.textContent = "Don't know";
    unknown.style.cssText = 'border:1px solid #d1d5db;background:#fff;color:#111827;padding:11px 14px;border-radius:12px;font-weight:750;cursor:pointer;';

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
    start.textContent='Start exercise';
    start.style.cssText = 'border:0;background:#111827;color:#fff;padding:11px 14px;border-radius:12px;font-weight:800;cursor:pointer;';
    start.addEventListener('click',async()=>{await window.__KANJI5_EDU_BRIDGE__?.start?.();});
    exercise.appendChild(start);
  }
  grid.appendChild(exercise);

  const feedback = card('Feedback');
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
  feedbackActions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;';
  if (snapshot?.feedback?.state==='pending_retry') {
    const retry=document.createElement('button');
    retry.type='button';retry.id='v2Retry';retry.textContent='Retry same skill';
    retry.style.cssText='border:1px solid #d1d5db;background:#fff;padding:10px 13px;border-radius:12px;font-weight:750;cursor:pointer;';
    retry.addEventListener('click',async()=>{const bridge=window.__KANJI5_EDU_BRIDGE__;if(!bridge?.retry)return;retry.disabled=true;await bridge.retry()});
    feedbackActions.appendChild(retry);
  }
  if (snapshot?.feedback?.outcome) {
    const next=document.createElement('button');
    next.type='button';next.id='v2Next';next.textContent='Next exercise';
    next.style.cssText='border:0;background:#111827;color:#fff;padding:10px 13px;border-radius:12px;font-weight:800;cursor:pointer;';
    next.addEventListener('click',async()=>{await window.__KANJI5_EDU_BRIDGE__?.next?.();});
    feedbackActions.appendChild(next);
  }
  const back=document.createElement('button');
  back.type='button';back.id='v2BackToReview';back.textContent='Back to review';
  back.style.cssText='border:1px solid #d1d5db;background:#fff;padding:10px 13px;border-radius:12px;font-weight:750;cursor:pointer;';
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