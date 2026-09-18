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
  practiceButton.disabled = true;
  try { await bridge.start(); } finally { practiceButton.disabled = false; }
});
const statsButton = document.createElement('button');
statsButton.type = 'button';
statsButton.id = 'v2Stats';
statsButton.className = 'v2-btn v2-btn-secondary v2-header-tool';
statsButton.textContent = 'آمار';
statsButton.addEventListener('click', () => document.getElementById('statsBtn')?.click());

const settingsButton = document.createElement('button');
settingsButton.type = 'button';
settingsButton.id = 'v2Settings';
settingsButton.className = 'v2-btn v2-btn-secondary v2-header-tool';
settingsButton.textContent = 'تنظیمات';
settingsButton.addEventListener('click', () => document.getElementById('settingsBtn')?.click());

headerMeta.append(sessionProgress,practiceButton,statsButton,settingsButton);
header.appendChild(headerMeta);
root.appendChild(header);

const content = document.createElement('div');
content.className = 'v2-content';
root.appendChild(content);
document.body.appendChild(root);

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

function speakJapanese(value) {
  const textValue = String(value || '').trim();
  if (!textValue || !('speechSynthesis' in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(textValue);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  } catch (_) {}
}

function audioButton(value, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'v2-audio-button';
  button.textContent = '🔊';
  button.setAttribute('aria-label', label || 'پخش تلفظ');
  button.addEventListener('click', () => speakJapanese(value));
  return button;
}

function renderDailyGoal(parent) {
  const labelNode = document.getElementById('goalLabel');
  const barNode = document.getElementById('goalBar');
  if (!labelNode || !barNode) return;
  const section = document.createElement('section');
  section.className = 'v2-daily-goal';
  const top = document.createElement('div');
  top.className = 'v2-daily-goal-top';
  const label = document.createElement('strong');
  label.textContent = String(labelNode.textContent || 'هدف روزانه');
  const done = document.getElementById('goalDone');
  const badge = document.createElement('span');
  badge.textContent = done && done.style.display !== 'none' ? String(done.textContent || '').trim() : '';
  top.append(label,badge);
  const track = document.createElement('div');
  track.className = 'v2-daily-goal-track';
  const fill = document.createElement('div');
  fill.className = 'v2-daily-goal-fill';
  const width = String(barNode.style.width || '0%');
  fill.style.width = /^\d+(?:\.\d+)?%$/.test(width) ? width : '0%';
  track.appendChild(fill);
  section.append(top,track);
  parent.appendChild(section);
}

function renderUpcomingReviews(parent) {
  const legacyBody = document.getElementById('upcomingReviewsBody');
  if (!legacyBody) return;
  const sourceText = String(legacyBody.textContent || '').trim();
  const section = document.createElement('details');
  section.className = 'v2-upcoming-reviews';
  const summary = document.createElement('summary');
  summary.textContent = 'مرورهای پیش‌رو';
  const body = document.createElement('div');
  body.className = 'v2-upcoming-reviews-body';
  if (legacyBody.childNodes.length) {
    const rows = [...legacyBody.children];
    if (rows.length) {
      for (const legacyRow of rows) {
        const row = document.createElement('div');
        row.className = 'v2-upcoming-row';
        row.textContent = String(legacyRow.textContent || '').trim();
        body.appendChild(row);
      }
    } else {
      body.textContent = sourceText || 'فعلاً مرور زمان‌بندی‌شده‌ای در آینده وجود ندارد.';
    }
  } else {
    body.textContent = sourceText || 'فعلاً مرور زمان‌بندی‌شده‌ای در آینده وجود ندارد.';
  }
  section.append(summary,body);
  parent.appendChild(section);
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

function readLegacyMetric(id) {
  const node = document.getElementById(id);
  return node ? String(node.textContent || '').trim() : '';
}

function renderDailySummary(parent) {
  const section = document.createElement('section');
  section.className = 'v2-daily-summary';
  section.setAttribute('aria-label','خلاصهٔ امروز');
  const items = [
    ['due', 'مرورهای امروز', readLegacyMetric('dueCount')],
    ['new', 'کانجی جدید امروز', readLegacyMetric('newCount')],
    ['mastered', 'یادگرفته‌شده', readLegacyMetric('masteredCount')],
    ['streak', 'روز پیاپی', readLegacyMetric('streakCount')]
  ];
  for (const [kind,label,value] of items) {
    const card = document.createElement('div');
    card.className = 'v2-daily-stat v2-daily-stat-' + kind;
    const number = document.createElement('strong');
    number.className = 'v2-daily-stat-value';
    number.textContent = value || '۰';
    const caption = document.createElement('span');
    caption.textContent = label;
    card.append(number,caption);
    section.appendChild(card);
  }
  parent.appendChild(section);
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

  if (kind === 'meaning') {
    const caption = document.createElement('div');
    caption.className = 'v2-stimulus-caption';
    caption.textContent = 'راهنمای معنا';
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

function renderLearning(snapshot) {
  const card = snapshot?.learning || {};
  const section = document.createElement('section');
  section.id = 'v2LearningCard';
  section.className = 'v2-learning-card';
  section.setAttribute('aria-labelledby','v2LearningTitle');

  const top = document.createElement('div');
  top.className = 'v2-exercise-top';

  const mode = document.createElement('span');
  mode.className = 'v2-mode-badge v2-learning-badge';
  mode.textContent = 'یادگیری';

  const stage = document.createElement('span');
  stage.className = 'v2-exercise-step';
  stage.textContent = card.isNew ? 'آشنایی با کانجی' : 'مرور یادگیری';
  top.append(mode,stage);
  section.appendChild(top);
  section.appendChild(heading('کارت یادگیری','v2LearningTitle'));

  const kanji = document.createElement('div');
  kanji.id = 'v2LearningKanji';
  kanji.className = 'v2-learning-kanji';
  kanji.lang = 'ja';
  kanji.textContent = text(card.character);
  const kanjiRow = document.createElement('div');
  kanjiRow.className = 'v2-learning-kanji-row';
  kanjiRow.append(kanji,audioButton(card.character,'پخش تلفظ کانجی'));
  section.appendChild(kanjiRow);

  if (!card.revealed) {
    const firstReading = [...(card.on || []), ...(card.kun || [])].slice(0,3);
    if (firstReading.length) {
      const readings = document.createElement('div');
      readings.className = 'v2-learning-first-readings';
      readings.lang = 'ja';
      readings.textContent = firstReading.join(' · ');
      section.appendChild(readings);
    }
    const hint = document.createElement('p');
    hint.className = 'v2-learning-hint';
    hint.textContent = card.hint || 'این اولین آشنایی تو با این کانجی است؛ فعلاً آن را یاد بگیر و بعد پاسخ را ببین.';
    section.appendChild(hint);

    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.id = 'v2LearningReveal';
    reveal.className = 'v2-btn v2-btn-primary v2-learning-reveal';
    reveal.textContent = card.revealLabel || 'نمایش اطلاعات کانجی';
    reveal.addEventListener('click', async () => {
      reveal.disabled = true;
      try { await window.__KANJI5_V19_V2_BOUNDARY__?.revealLearning?.(); }
      finally { reveal.disabled = false; }
    });
    section.appendChild(reveal);
    return section;
  }

  const info = document.createElement('div');
  info.className = 'v2-learning-info';

  if (card.meanings?.length) {
    const meanings = document.createElement('div');
    meanings.className = 'v2-learning-meanings';
    meanings.textContent = card.meanings.join(' · ');
    info.appendChild(meanings);
  }

  const readingsGrid = document.createElement('div');
  readingsGrid.className = 'v2-learning-readings';
  for (const [labelText,values] of [['On’yomi',card.on || []],['Kun’yomi',card.kun || []]]) {
    const box = document.createElement('div');
    box.className = 'v2-learning-reading-box';
    const label = document.createElement('span');
    label.className = 'v2-learning-reading-label';
    label.textContent = labelText;
    const value = document.createElement('span');
    value.className = 'v2-learning-reading-value';
    value.lang = 'ja';
    value.textContent = values.length ? values.join(' · ') : '—';
    if (values.length) box.append(label,value,audioButton(values[0],'پخش اولین خوانش'));
    else box.append(label,value);
    readingsGrid.appendChild(box);
  }
  info.appendChild(readingsGrid);

  if (card.examples?.length) {
    const examples = document.createElement('div');
    examples.className = 'v2-learning-examples';
    const exampleTitle = document.createElement('h3');
    exampleTitle.textContent = 'نمونهٔ واژگانی';
    examples.appendChild(exampleTitle);
    for (const example of card.examples) {
      const row = document.createElement('div');
      row.className = 'v2-learning-example';
      row.lang = 'ja';
      row.textContent = [example.word,example.reading].filter(Boolean).join(' · ');
      if (example.reading) row.appendChild(audioButton(example.reading,'پخش تلفظ واژه'));
      examples.appendChild(row);
    }
    info.appendChild(examples);
  }

  section.appendChild(info);

  const ratingTitle = document.createElement('p');
  ratingTitle.className = 'v2-learning-rating-title';
  ratingTitle.textContent = 'بعد از یادگیری، کیفیت مرور را انتخاب کن.';
  section.appendChild(ratingTitle);

  const ratings = document.createElement('div');
  ratings.className = 'v2-learning-ratings';
  for (const [rating,labelText] of [['Again','دوباره'],['Hard','سخت'],['Good','خوب'],['Easy','آسان']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v2-btn v2-learning-rating';
    button.dataset.rating = rating;
    button.textContent = labelText;
    button.addEventListener('click', async () => {
      buttonsDisable(ratings);
      presentationMode = 'auto';
      try { await window.__KANJI5_V19_V2_BOUNDARY__?.rateLearning?.(rating); }
      finally { buttonsEnable(ratings); }
    });
    ratings.appendChild(button);
  }
  section.appendChild(ratings);
  return section;
}

function renderReviewCard(snapshot) {
  const card = snapshot?.learning || {};
  const section = document.createElement('section');
  section.id = 'v2ReviewCard';
  section.className = 'v2-learning-card v2-review-card';
  section.setAttribute('aria-labelledby','v2ReviewTitle');

  const top = document.createElement('div');
  top.className = 'v2-exercise-top';
  const mode = document.createElement('span');
  mode.className = 'v2-mode-badge';
  mode.textContent = 'مرور';
  const step = document.createElement('span');
  step.className = 'v2-exercise-step';
  step.textContent = 'مرور فاصله‌دار';
  top.append(mode,step);
  section.appendChild(top);
  section.appendChild(heading('کارت مرور','v2ReviewTitle'));

  const kanji = document.createElement('div');
  kanji.id = 'v2ReviewKanji';
  kanji.className = 'v2-learning-kanji';
  kanji.lang = 'ja';
  kanji.textContent = text(card.character);
  const reviewKanjiRow = document.createElement('div');
  reviewKanjiRow.className = 'v2-learning-kanji-row';
  reviewKanjiRow.append(kanji,audioButton(card.character,'پخش تلفظ کانجی'));
  section.appendChild(reviewKanjiRow);

  if (!card.revealed) {
    const hint = document.createElement('p');
    hint.className = 'v2-learning-hint';
    hint.textContent = card.hint || 'اول معنی یا خوانش را از حافظه به یاد بیاور.';
    section.appendChild(hint);
    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.id = 'v2ReviewReveal';
    reveal.className = 'v2-btn v2-btn-primary v2-learning-reveal';
    reveal.textContent = 'نمایش پاسخ';
    const recallHost = document.createElement('div');
    recallHost.id = 'v2ReviewRecallHost';
    recallHost.className = 'v2-review-recall-host';
    section.appendChild(recallHost);
    reveal.addEventListener('click', async () => {
      reveal.disabled = true;
      try {
        const opener = window.__KANJI5_V12_OPEN_RECALL__;
        const gate = typeof opener === 'function' ? await opener() : null;
        if (gate) recallHost.replaceChildren(gate);
      } finally { reveal.disabled = false; }
    });
    section.appendChild(reveal);
    return section;
  }

  const info = document.createElement('div');
  info.className = 'v2-learning-info';
  if (card.meanings?.length) {
    const meanings = document.createElement('div');
    meanings.className = 'v2-learning-meanings';
    meanings.textContent = card.meanings.join(' · ');
    info.appendChild(meanings);
  }
  const readingsGrid = document.createElement('div');
  readingsGrid.className = 'v2-learning-readings';
  for (const [labelText,values] of [['On’yomi',card.on || []],['Kun’yomi',card.kun || []]]) {
    const box = document.createElement('div');
    box.className = 'v2-learning-reading-box';
    const label = document.createElement('span');
    label.className = 'v2-learning-reading-label';
    label.textContent = labelText;
    const value = document.createElement('span');
    value.className = 'v2-learning-reading-value';
    value.lang = 'ja';
    value.textContent = values.length ? values.join(' · ') : '—';
    if (values.length) box.append(label,value,audioButton(values[0],'پخش اولین خوانش'));
    else box.append(label,value);
    readingsGrid.appendChild(box);
  }
  info.appendChild(readingsGrid);
  if (card.examples?.length) {
    const examples = document.createElement('div');
    examples.className = 'v2-learning-examples';
    const exampleTitle = document.createElement('h3');
    exampleTitle.textContent = 'نمونهٔ واژگانی';
    examples.appendChild(exampleTitle);
    for (const example of card.examples) {
      const row = document.createElement('div');
      row.className = 'v2-learning-example';
      row.lang = 'ja';
      row.textContent = [example.word,example.reading].filter(Boolean).join(' · ');
      if (example.reading) row.appendChild(audioButton(example.reading,'پخش تلفظ واژه'));
      examples.appendChild(row);
    }
    info.appendChild(examples);
  }
  section.appendChild(info);

  const ratingTitle = document.createElement('p');
  ratingTitle.className = 'v2-learning-rating-title';
  ratingTitle.textContent = 'زمان‌بندی مرور بعدی را با یکی از این چهار پاسخ ثبت کن.';
  section.appendChild(ratingTitle);
  const ratings = document.createElement('div');
  ratings.className = 'v2-learning-ratings';
  for (const [rating,labelText] of [['Again','دوباره'],['Hard','سخت'],['Good','خوب'],['Easy','آسان']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v2-btn v2-learning-rating';
    button.dataset.rating = rating;
    button.textContent = labelText;
    button.addEventListener('click', async () => {
      buttonsDisable(ratings);
      try { await window.__KANJI5_V19_V2_BOUNDARY__?.rateLearning?.(rating); }
      finally { buttonsEnable(ratings); }
    });
    ratings.appendChild(button);
  }
  section.appendChild(ratings);
  return section;
}

function buttonsDisable(container){container?.querySelectorAll('button').forEach(button=>{button.disabled=true})}
function buttonsEnable(container){container?.querySelectorAll('button').forEach(button=>{button.disabled=false})}

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
  step.textContent = 'یادآوری فعال';
  top.append(mode,step);

  section.appendChild(top);
  section.appendChild(heading('تمرین فعلی','v2ExerciseTitle'));

  const prompt = document.createElement('p');
  prompt.id = 'v2Prompt';
  prompt.className = 'v2-prompt';
  prompt.textContent = ex.prompt || 'Exercise';
  section.appendChild(prompt);

  if (!ex?.mode) {
    const empty = document.createElement('div');
    empty.className = 'v2-empty-state';
    const p = document.createElement('p');
    p.textContent = 'هنوز تمرینی آماده نیست.';
    const start = document.createElement('button');
    start.type = 'button';
    start.id = 'v2StartExercise';
    start.className = 'v2-btn v2-btn-primary';
    start.textContent = 'شروع تمرین';
    start.addEventListener('click', async () => { await window.__KANJI5_EDU_BRIDGE__?.start?.(); });
    empty.append(p,start);
    section.appendChild(empty);
    return section;
  }

  renderStimulus(section,ex);

  const choices = Array.isArray(ex.choices) ? ex.choices.filter(Boolean).slice(0,4) : [];
  const productionChoiceMode = ex.mode === 'production' && choices.length >= 4;
  if (productionChoiceMode) {
    const group = document.createElement('div');
    group.id = 'v2ProductionChoices';
    group.className = 'v2-production-choice-grid';
    group.setAttribute('role','group');
    group.setAttribute('aria-label','انتخاب کانجی');
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'v2-btn v2-production-choice';
      button.lang = 'ja';
      button.textContent = choice;
      button.addEventListener('click', async () => {
        buttonsDisable(group);
        unknown.disabled = true;
        await window.__KANJI5_EDU_BRIDGE__?.submitValue?.(choice);
      });
      group.appendChild(button);
    }
    section.appendChild(group);
  }

  const field = document.createElement('div');
  if (productionChoiceMode) field.hidden = true;
  field.className = 'v2-answer-area';

  const label = document.createElement('label');
  label.className = 'v2-field-label';
  label.htmlFor = 'v2AnswerInput';
  label.textContent = 'پاسخ شما';

  const input = document.createElement('input');
  input.id = 'v2AnswerInput';
  input.className = 'v2-input';
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-describedby','v2Prompt');
  input.placeholder = ex.stimulus?.inputPlaceholder || 'پاسخ را وارد کنید';

  const actions = document.createElement('div');
  actions.className = 'v2-actions';

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.id = 'v2Submit';
  submit.className = 'v2-btn v2-btn-primary';
  submit.textContent = 'بررسی پاسخ';
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
  unknown.textContent = 'نمی‌دانم';
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
  const back = document.createElement('button');
  back.type = 'button';
  back.id = 'v2BackToLearning';
  back.className = 'v2-btn v2-btn-secondary v2-back-learning';
  back.textContent = 'بازگشت به کارت یادگیری';
  back.addEventListener('click', async () => {
    presentationMode = 'auto';
    await window.__KANJI5_V19_V2_BOUNDARY__?.clearTransient?.();
    await window.__KANJI5_V19_V2_BOUNDARY__?.refreshLearning?.();
  });
  section.appendChild(back);
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
  title.textContent = localizeOutcome(feedback.outcome);

  const detail = document.createElement('p');
  detail.className = 'v2-feedback-detail';
  detail.textContent = feedback.correct ? 'بازیابی درست بود.' : (feedback.reason || 'پاسخ را مرور کنید و دوباره تلاش کنید.');

  body.append(title,detail);

  if (!feedback.correct && snapshot?.exercise?.answerHint) {
    const answer = document.createElement('div');
    answer.className = 'v2-feedback-answer';
    answer.textContent = 'پاسخ درست: ' + snapshot.exercise.answerHint;
    body.appendChild(answer);
  }

  const actions = document.createElement('div');
  actions.className = 'v2-actions v2-feedback-actions';

  if (feedback.state === 'pending_retry') {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.id = 'v2Retry';
    retry.className = 'v2-btn v2-btn-secondary';
    retry.textContent = 'تکرار همین مهارت';
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
  next.textContent = 'تمرین بعدی';
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
  summary.textContent = 'جزئیات جلسه';
  details.appendChild(summary);

  const grid = document.createElement('div');
  grid.className = 'v2-insights-grid';

  const skills = document.createElement('section');
  skills.className = 'v2-insight-panel';
  skills.appendChild(heading('مهارت‌های یادگیرنده','v2LearnerTitle'));
  for (const mode of Object.keys(labels)) {
    const item = snapshot?.learner?.attributes?.[mode] || {};
    row(skills,labels[mode],localizeState(item.state)+' · اخیر '+toFaDigits(Math.round((Number(item.recentAccuracy)||0)*100))+'٪');
  }

  const reason = document.createElement('section');
  reason.className = 'v2-insight-panel';
  reason.appendChild(heading('تمرکز تطبیقی','v2ReasonTitle'));
  row(reason,'مهارت',labels[snapshot?.adaptiveReason?.mode] || snapshot?.adaptiveReason?.mode);
  row(reason,'عمل',localizeAction(snapshot?.adaptiveReason?.action));
  if (snapshot?.adaptiveReason?.action) row(reason,'دلیل',localizedReason(snapshot.adaptiveReason.action));

  const summaryPanel = document.createElement('section');
  summaryPanel.className = 'v2-insight-panel';
  summaryPanel.appendChild(heading('خلاصه جلسه','v2SummaryTitle'));
  row(summaryPanel,'تلاش‌ها',snapshot?.sessionSummary?.attempts);
  row(summaryPanel,'درست',snapshot?.sessionSummary?.correct);
  row(summaryPanel,'دقت',Math.round((Number(snapshot?.sessionSummary?.accuracy)||0)*100)+'٪');

  const recent = document.createElement('section');
  recent.className = 'v2-insight-panel';
  recent.appendChild(heading('نتایج اخیر','v2RecentTitle'));
  const list = Array.isArray(snapshot?.recentOutcomes) ? snapshot.recentOutcomes : [];
  if (!list.length) {
    const empty = document.createElement('p');
    empty.className = 'v2-empty';
    empty.textContent = 'هنوز نتیجه‌ای ثبت نشده است.';
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
      detail.textContent = (labels[item.mode]||item.mode||'—')+' · '+(localizeQuality(item.quality)||localizeOutcome(item.outcome)||'—');
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
  renderDailySummary(content);
  renderDailyGoal(content);
  renderUpcomingReviews(content);
  const showLearning = presentationMode !== 'exercise' && !snapshot?.exercise?.mode && snapshot?.learning?.active && snapshot.learning.isNew;
  const showReview = presentationMode !== 'exercise' && !snapshot?.exercise?.mode && snapshot?.learning?.active && !snapshot.learning.isNew;
  if (showLearning) {
    content.appendChild(renderLearning(snapshot));
  } else if (showReview) {
    content.appendChild(renderReviewCard(snapshot));
  } else {
    content.appendChild(renderExercise(snapshot));
    const feedback = renderFeedback(snapshot);
    if (feedback) content.appendChild(feedback);
  }
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
      await boundary.refreshLearning?.();
      const snapshot=await boundary.snapshot();
      render(snapshot);
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