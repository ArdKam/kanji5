import fs from 'node:fs';
import vm from 'node:vm';

const files = [
  'index.html','sw.js','v1.3-p1.js','v1.3-p0.js','v1.3-perf.js',
  'v1.3-storage-bridge.js','v1.3-settings.js','v1.3-education-runtime-fix.js',
  'v1.3-education-choice-only.js','vendor/ts-fsrs-5.4.1.mjs'
];
for (const file of files) if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);

const html = fs.readFileSync('index.html','utf8');
const sw = fs.readFileSync('sw.js','utf8');
const p1 = fs.readFileSync('v1.3-p1.js','utf8');
const perf = fs.readFileSync('v1.3-perf.js','utf8');
const p0 = fs.readFileSync('v1.3-p0.js','utf8');
const guard = fs.readFileSync('v1.3-education-runtime-fix.js','utf8');
const bridge = fs.readFileSync('v1.3-storage-bridge.js','utf8');
const choices = fs.readFileSync('v1.3-education-choice-only.js','utf8');
const fsrs = fs.readFileSync('vendor/ts-fsrs-5.4.1.mjs','utf8');

const requiredScripts = [
  './v1.3-p0.js','./v1.3-perf.js','./v1.3-storage-bridge.js','./v1.3-settings.js',
  './v1.3-p1.js','./v1.3-education-runtime-fix.js','./v1.3-education-choice-only.js'
];
for (const src of requiredScripts) {
  const count = html.split(`<script src="${src}"></script>`).length - 1;
  if (count !== 1) throw new Error(`${src} must be included exactly once in index.html`);
}
if (html.indexOf('./v1.3-p0.js') > html.indexOf('<script type="module">')) throw new Error('p0 must load before the main module');
if (sw.includes('res.text()') || sw.includes("replace('<script")) throw new Error('Service worker must not rewrite HTML at request time');
if (!sw.includes('./vendor/ts-fsrs-5.4.1.mjs')) throw new Error('Local FSRS bundle missing from service-worker shell');
if (!sw.includes('kanji5-shell-v35')) throw new Error('Service-worker shell cache version regressed');
if (!sw.includes('staleWhileRevalidate')) throw new Error('Navigation must use stale-while-revalidate caching');
if (!p0.includes('window.__KANJI5_P0_DATA_PROMISE')) throw new Error('P0 dataset promise missing');
if (p1.includes('a.includes(c)||c.includes(a)')) throw new Error('Meaning grading still uses unsafe bidirectional substring matching');
if (perf.includes('marks.app-ready')) throw new Error('Invalid app-ready property access remains');
if (!p1.includes('v13EduDontKnow')) throw new Error('Education mode lost the Do Not Know action');
if (!p1.includes('v13-edu-choice')) throw new Error('Education multiple-choice UI is missing');
if (!p1.includes('function scoreDistractor') || !p1.includes('function chooseChoices')) throw new Error('Canonical smart distractor logic missing');
if (!p1.includes('history=readKnowledge()[target.character]?.distractors')) throw new Error('Personal distractor history missing');
if (!p1.includes('sharedReading') || !p1.includes('sharedMeaning') || !p1.includes('strokeScore')) throw new Error('Smart distractor scoring missing');
if (!p1.includes('function mastery(') || !p1.includes('mastery(target.character')) throw new Error('Difficulty calibration missing');
if (!guard.includes('__KANJI5_P0_DATA_PROMISE')) throw new Error('Education dataset guard is not connected to P0');
if (!guard.includes('stopPropagation')) throw new Error('Education guard does not prevent premature tab initialization');
if (!guard.includes(".v13-tab[data-tab=\"education\"]")) throw new Error('Education tab selector missing from guard');
if (!guard.includes('v13-edu-choice') || !guard.includes('v13EduSubmit')) throw new Error('Choice-mode submit cleanup is missing');
if (!bridge.includes('serializedSource') || !bridge.includes('JSON.stringify(data)')) throw new Error('Storage bridge is not using serialized deck caching');
if (!choices.includes('v13-edu-choice-only')) throw new Error('Choice-only education layer missing');
if (!choices.includes("mode==='meaning'") || !choices.includes("mode==='reading'")) throw new Error('Choice-only layer must cover meaning and reading');
if (!choices.includes('submit.click()') || !choices.includes('hidden')) throw new Error('Choice-only layer is not wired to canonical grading');
if (choices.includes('<textarea') || /<input[^>]+type=["']text/i.test(choices)) throw new Error('Choice-only layer must not add free-text educational controls');
if (fs.existsSync('scripts/build-kanji-data.mjs')) throw new Error('Broken raw-dataset build script should not be present');
if (fsrs.length < 30000 || /esm\.sh/i.test(fsrs)) throw new Error('Local FSRS bundle looks invalid');

for (const file of ['v1.3-production-ui.js','v1.3-education-v2.js','v1.3-dont-know.js','v1.3-smart-distractors.js','scripts/apply-smart-distractors.mjs']) {
  if (fs.existsSync(file)) throw new Error(`Dead v1.3 file should be removed: ${file}`);
}

for (const source of [p1,perf,p0,guard,choices,sw,bridge]) {
  try { new vm.Script(source); } catch (e) { throw new Error(`Syntax error: ${e.message}`); }
}

console.log('Kanji 5 v1.3 smoke test passed.');
