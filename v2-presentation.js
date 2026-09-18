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
grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;';
root.appendChild(grid);
document.body.appendChild(root);

const text = value => String(value ?? '').trim() || '—';
const labels = {meaning:'Meaning',reading:'Reading',production:'Production',vocabulary:'Vocabulary',context:'Context'};

function card(titleText) {
  const section = document.createElement('section');
  section.setAttribute('aria-label', titleText);
  section.style.cssText = 'background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:16px;';
  const heading = document.createElement('h2');
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

  const session = card('Session');
  row(session,'Status',snapshot?.session?.status);
  row(session,'Session ID',snapshot?.session?.sessionId);
  row(session,'Plan revision',snapshot?.session?.planRevision);
  row(session,'Resumed',snapshot?.session?.resumed ? 'yes' : 'no');
  grid.appendChild(session);

  const exercise = card('Current exercise');
  const ex = snapshot?.exercise;
  if (ex?.mode) {
    row(exercise,'Skill',labels[ex.mode] || ex.mode);
    row(exercise,'Prompt',ex.prompt);
    if (ex.character) row(exercise,'Kanji',ex.character);
    row(exercise,'Content',ex.contentId);
  } else {
    const p=document.createElement('p');
    p.textContent='No exercise is currently exposed by the learning boundary.';
    exercise.appendChild(p);
  }
  grid.appendChild(exercise);

  const feedback = card('Feedback');
  row(feedback,'Outcome',snapshot?.feedback?.outcome);
  row(feedback,'Score',snapshot?.feedback?.score);
  row(feedback,'Retry count',snapshot?.feedback?.retryCount);
  row(feedback,'Recovered',snapshot?.feedback?.recovered ? 'yes' : 'no');
  if (snapshot?.feedback?.reason) row(feedback,'Reason',snapshot.feedback.reason);
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

  const reason = card('Adaptive reason');
  row(reason,'Skill',labels[snapshot?.adaptiveReason?.mode] || snapshot?.adaptiveReason?.mode);
  row(reason,'Action',snapshot?.adaptiveReason?.action);
  if (Array.isArray(snapshot?.adaptiveReason?.reasons)) row(reason,'Reasons',snapshot.adaptiveReason.reasons.join(' · '));
  grid.appendChild(reason);
}

async function init() {
  const boundary = window.__KANJI5_V19_V2_BOUNDARY__;
  if (!boundary) {
    setTimeout(init, 50);
    return;
  }
  try {
    render(await boundary.snapshot());
    document.addEventListener('kanji5:v1.9-v2-view-models', event => render(event?.detail || {}));
  } catch (error) {
    render({});
    console.error(error);
  }
}
void init();
})();