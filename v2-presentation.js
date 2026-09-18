(()=> {
'use strict';

const params = new URLSearchParams(location.search);
if (params.get('legacy') === '1') return;

const oldApp = document.getElementById('app');
const loading = document.getElementById('loading');
if (oldApp) oldApp.hidden = true;
if (loading) loading.hidden = true;

const root = document.createElement('main');
root.id = 'v2App';
root.className = 'v2-shell';
root.setAttribute('aria-labelledby', 'v2Title');

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = './v2-presentation.css';
document.head.appendChild(stylesheet);

const skip = document.createElement('a');
skip.className = 'v2-skip-link';
skip.setAttribute('href','#v2Exercise');
skip.textContent = 'Skip to current exercise';
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
title.textContent = 'Kanji 5';
header.appendChild(title);

const headerMeta = document.createElement('div');
headerMeta.className = 'v2-header-meta';
const sessionProgress = document.createElement('div');
sessionProgress.className = 'v2-session-progress';
headerMeta.appendChild(sessionProgress);
header.appendChild(headerMeta);
root.appendChild(header);

const content = document.createElement('div');
content.className = 'v2-content';
root.appendChild(content);
document.body.appendChild(root);

const text = value => String(value ?? '').trim() || '—';
const labels = {meaning:'Meaning',reading:'Reading',production:'Production',vocabulary:'Vocabulary',context:'Context'};
const outcomes = {correct:'Correct',wrong:'Wrong',unknown:"Don't know",near_miss:'Almost',empty:'Empty',invalid:'Unavailable'};

let lastFeedbackFocusKey = '';

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

  const progress = document.createElement('div');
  progress.className = 'v2-progress';
  progress.setAttribute('role','progressbar');
  progress.setAttribute('aria-label','Session progress');
  progress.setAttribute('aria-valuemin','0');
  progress.setAttribute('aria-valuemax','100');
  progress.setAttribute('aria-valuenow',String(Math.round(fraction*100)));

  const fill = document.createElement('div');
  fill.className = 'v2-progress-fill';
  fill.style.width = Math.round(fraction*100) + '%';
  progress.appendChild(fill);

  const meta = document.createElement('div');
  meta.className = 'v2-progress-meta';
  meta.textContent = total > 0 ? Math.min(done,total) + ' / ' + total : 'Ready to learn';
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

  if (kind === 'meaning') {
    const caption = document.createElement('div');
    caption.className = 'v2-stimulus-caption';
    caption.textContent = 'Meaning cue';
    const value = document.createElement('div');
    value.className = 'v2-stimulus-meaning';
    value.textContent = primary;
    wrap.append(caption,value);
  } else if (kind === 'masked-vocabulary') {
    const word = document.createElement('div');
    word.className = 'v2-stimulus-text';
    word.lang = 'ja';
    word.textContent = primary;
    wrap.appendChild(word);
    if (secondary !== '—') {
      const reading = document.createElement('div');
      reading.className = 'v2-stimulus-secondary';
      reading.lang = 'ja';
      reading.textContent = secondary;
      wrap.appendChild(reading);
    }
    if (translation !== '—') {
      const meaning = document.createElement('div');
      meaning.className = 'v2-stimulus-translation';
      meaning.textContent = translation;
      wrap.appendChild(meaning);
    }
  } else if (kind === 'masked-context') {
    const sentence = document.createElement('div');
    sentence.className = 'v2-stimulus-context';
    sentence.lang = 'ja';
    sentence.textContent = primary;
    wrap.appendChild(sentence);
    if (translation !== '—') {
      const meaning = document.createElement('div');
      meaning.className = 'v2-stimulus-translation';
      meaning.textContent = translation;
      wrap.appendChild(meaning);
    }
  } else {
    const kanji = document.createElement('div');
    kanji.className = 'v2-kanji';
    kanji.lang = 'ja';
    kanji.textContent = primary;
    wrap.appendChild(kanji);
  }
  parent.appendChild(wrap);
}

function renderExercise(snapshot) {
  const ex = snapshot?.exercise || {};
  const section = document.createElement('section');
  section.id = 'v2Exercise';
  section.tabIndex = -1;
  section.className = 'v2-exercise-card';
  section.setAttribute('aria-labelledby','v2ExerciseTitle');

  const top = document.createElement('div');
  top.className = 'v2-exercise-top';

  const mode = document.createElement('span');
  mode.className = 'v2-mode-badge';
  mode.textContent = labels[ex.mode] || 'Practice';

  const step = document.createElement('span');
  step.className = 'v2-exercise-step';
  step.textContent = 'Active recall';
  top.append(mode,step);

  section.appendChild(top);
  section.appendChild(heading('Current exercise','v2ExerciseTitle'));

  const prompt = document.createElement('p');
  prompt.id = 'v2Prompt';
  prompt.className = 'v2-prompt';
  prompt.textContent = ex.prompt || 'Exercise';
  section.appendChild(prompt);

  if (!ex?.mode) {
    const empty = document.createElement('div');
    empty.className = 'v2-empty-state';
    const p = document.createElement('p');
    p.textContent = 'No exercise is ready yet.';
    const start = document.createElement('button');
    start.type = 'button';
    start.id = 'v2StartExercise';
    start.className = 'v2-btn v2-btn-primary';
    start.textContent = 'Start exercise';
    start.addEventListener('click', async () => { await window.__KANJI5_EDU_BRIDGE__?.start?.(); });
    empty.append(p,start);
    section.appendChild(empty);
    return section;
  }

  renderStimulus(section,ex);

  const field = document.createElement('div');
  field.className = 'v2-answer-area';

  const label = document.createElement('label');
  label.className = 'v2-field-label';
  label.htmlFor = 'v2AnswerInput';
  label.textContent = 'Your answer';

  const input = document.createElement('input');
  input.id = 'v2AnswerInput';
  input.className = 'v2-input';
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-describedby','v2Prompt');
  input.placeholder = ex.stimulus?.inputPlaceholder || 'Type your answer';

  const actions = document.createElement('div');
  actions.className = 'v2-actions';

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.id = 'v2Submit';
  submit.className = 'v2-btn v2-btn-primary';
  submit.textContent = 'Check answer';
  submit.addEventListener('click',async()=>{
    const bridge = window.__KANJI5_EDU_BRIDGE__;
    if (!bridge) return;
    submit.disabled = true;
    unknown.disabled = true;
    await bridge.submitValue(input.value);
  });

  const unknown = document.createElement('button');
  unknown.type = 'button';
  unknown.id = 'v2DontKnow';
  unknown.className = 'v2-btn v2-btn-secondary';
  unknown.textContent = "Don't know";
  unknown.addEventListener('click',async()=>{
    const bridge = window.__KANJI5_EDU_BRIDGE__;
    if (!bridge) return;
    submit.disabled = true;
    unknown.disabled = true;
    await bridge.dontKnow();
  });

  input.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();submit.click();}
  });

  actions.append(submit,unknown);
  field.append(label,input,actions);
  section.appendChild(field);
  return section;
}

function renderFeedback(snapshot) {
  const feedback = snapshot?.feedback || {};
  if (!feedback.outcome) return null;

  const section = document.createElement('section');
  section.id = 'v2Feedback';
  section.className = 'v2-feedback-card v2-feedback-' + (feedback.correct ? 'success' : 'error');
  section.setAttribute('aria-live','polite');
  section.setAttribute('aria-atomic','true');
  section.setAttribute('role','status');
  section.tabIndex = -1;

  const icon = document.createElement('div');
  icon.className = 'v2-feedback-icon';
  icon.setAttribute('aria-hidden','true');
  icon.textContent = feedback.correct ? '✓' : feedback.outcome === 'unknown' ? '?' : '!';

  const body = document.createElement('div');
  body.className = 'v2-feedback-body';

  const title = document.createElement('h2');
  title.className = 'v2-feedback-title';
  title.textContent = outcomes[feedback.outcome] || feedback.outcome;

  const detail = document.createElement('p');
  detail.className = 'v2-feedback-detail';
  detail.textContent = feedback.correct ? 'Good retrieval.' : (feedback.reason || 'Review the answer and try again.');

  body.append(title,detail);

  if (!feedback.correct && snapshot?.exercise?.answerHint) {
    const answer = document.createElement('div');
    answer.className = 'v2-feedback-answer';
    answer.textContent = 'Answer: ' + snapshot.exercise.answerHint;
    body.appendChild(answer);
  }

  const actions = document.createElement('div');
  actions.className = 'v2-actions v2-feedback-actions';

  if (feedback.state === 'pending_retry') {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.id = 'v2Retry';
    retry.className = 'v2-btn v2-btn-secondary';
    retry.textContent = 'Retry same skill';
    retry.addEventListener('click',async()=>{
      const bridge = window.__KANJI5_EDU_BRIDGE__;
      if (!bridge?.retry) return;
      retry.disabled = true;
      await bridge.retry();
    });
    actions.appendChild(retry);
  }

  const next = document.createElement('button');
  next.type = 'button';
  next.id = 'v2Next';
  next.className = 'v2-btn v2-btn-primary';
  next.textContent = 'Next exercise';
  next.addEventListener('click',async()=>{await window.__KANJI5_EDU_BRIDGE__?.next?.();});
  actions.appendChild(next);

  body.appendChild(actions);
  section.append(icon,body);
  return section;
}

function renderInsights(snapshot) {
  const details = document.createElement('details');
  details.className = 'v2-insights';
  const summary = document.createElement('summary');
  summary.textContent = 'Session insights';
  details.appendChild(summary);

  const grid = document.createElement('div');
  grid.className = 'v2-insights-grid';

  const skills = document.createElement('section');
  skills.className = 'v2-insight-panel';
  skills.appendChild(heading('Learner skills','v2LearnerTitle'));
  for (const mode of Object.keys(labels)) {
    const item = snapshot?.learner?.attributes?.[mode] || {};
    row(skills,labels[mode],text(item.state)+' · recent '+Math.round((Number(item.recentAccuracy)||0)*100)+'%');
  }

  const reason = document.createElement('section');
  reason.className = 'v2-insight-panel';
  reason.appendChild(heading('Adaptive focus','v2ReasonTitle'));
  row(reason,'Skill',labels[snapshot?.adaptiveReason?.mode] || snapshot?.adaptiveReason?.mode);
  row(reason,'Action',snapshot?.adaptiveReason?.action);
  if (Array.isArray(snapshot?.adaptiveReason?.reasons) && snapshot.adaptiveReason.reasons.length) row(reason,'Why',snapshot.adaptiveReason.reasons.join(' · '));

  const summaryPanel = document.createElement('section');
  summaryPanel.className = 'v2-insight-panel';
  summaryPanel.appendChild(heading('Session summary','v2SummaryTitle'));
  row(summaryPanel,'Attempts',snapshot?.sessionSummary?.attempts);
  row(summaryPanel,'Correct',snapshot?.sessionSummary?.correct);
  row(summaryPanel,'Accuracy',Math.round((Number(snapshot?.sessionSummary?.accuracy)||0)*100)+'%');

  const recent = document.createElement('section');
  recent.className = 'v2-insight-panel';
  recent.appendChild(heading('Recent outcomes','v2RecentTitle'));
  const list = Array.isArray(snapshot?.recentOutcomes) ? snapshot.recentOutcomes : [];
  if (!list.length) {
    const empty = document.createElement('p');
    empty.className = 'v2-empty';
    empty.textContent = 'No recent outcomes yet.';
    recent.appendChild(empty);
  } else {
    for (const item of list) {
      const node = document.createElement('div');
      node.className = 'v2-outcome-row';
      const kanji = document.createElement('strong');
      kanji.className = 'v2-outcome-kanji';
      kanji.lang = 'ja';
      kanji.textContent = item.character || '—';
      const detail = document.createElement('span');
      detail.className = 'v2-outcome-detail';
      detail.textContent = (labels[item.mode]||item.mode||'—')+' · '+(item.quality||item.outcome||'—');
      const result = document.createElement('strong');
      result.className = 'v2-outcome-result';
      result.textContent = item.correct ? '✓' : (outcomes[item.outcome]||item.outcome||'—');
      node.append(kanji,detail,result);
      recent.appendChild(node);
    }
  }

  grid.append(skills,reason,summaryPanel,recent);
  details.appendChild(grid);
  return details;
}

function render(snapshot) {
  content.textContent = '';
  renderHeader(snapshot);
  content.appendChild(renderExercise(snapshot));
  const feedback = renderFeedback(snapshot);
  if (feedback) content.appendChild(feedback);
  content.appendChild(renderInsights(snapshot));

  const feedbackKey = [snapshot?.feedback?.outcome,snapshot?.feedback?.retryCount,snapshot?.feedback?.recovered,snapshot?.feedback?.reason].join('|');
  if (snapshot?.feedback?.outcome && feedbackKey !== lastFeedbackFocusKey) {
    lastFeedbackFocusKey = feedbackKey;
    queueMicrotask(()=>{
      const target = document.getElementById('v2Feedback');
      if (target) target.focus({preventScroll:true});
    });
  }
}

let subscribed=false;
let bootstrapped=false;
let boundaryReadyListener=false;

async function init() {
  const boundary = window.__KANJI5_V19_V2_BOUNDARY__;
  if (!boundary) return;
  try {
    if (!subscribed) {
      document.addEventListener('kanji5:v1.9-v2-view-models',event=>render(event?.detail||{}));
      render(await boundary.snapshot());
      subscribed=true;
    }
    const bridge = window.__KANJI5_EDU_BRIDGE__;
    if (!bridge) { setTimeout(init,50); return; }
    if (!bootstrapped) {
      bootstrapped=true;
      const snapshot=await boundary.snapshot();
      if (!snapshot.exercise?.mode) await bridge.start();
      render(await boundary.snapshot());
    }
  } catch(error) {
    render({});
    console.error(error);
  }
}

if (!boundaryReadyListener) {
  boundaryReadyListener=true;
  document.addEventListener('kanji5:v1.9-v2-boundary-ready',()=>{void init();});
}
void init();
})();