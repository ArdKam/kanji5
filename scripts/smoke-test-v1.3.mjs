import fs from 'node:fs';
import vm from 'node:vm';

const files = [
  'index.html','sw.js','v1.3-p1.js','v1.3-p0.js','v1.3-perf.js',
  'v1.3-storage-bridge.js','v1.3-settings.js','vendor/ts-fsrs-5.4.1.mjs'
];
for (const file of files) if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);

const html = fs.readFileSync('index.html','utf8');
const sw = fs.readFileSync('sw.js','utf8');
const p1 = fs.readFileSync('v1.3-p1.js','utf8');
const perf = fs.readFileSync('v1.3-perf.js','utf8');
const p0 = fs.readFileSync('v1.3-p0.js','utf8');
const fsrs = fs.readFileSync('vendor/ts-fsrs-5.4.1.mjs','utf8');

const requiredScripts = ['./v1.3-p0.js','./v1.3-perf.js','./v1.3-storage-bridge.js','./v1.3-settings.js','./v1.3-p1.js'];
for (const src of requiredScripts) {
  const count = html.split(`<script src="${src}"></script>`).length - 1;
  if (count !== 1) throw new Error(`${src} must be included exactly once in index.html`);
}
if (html.indexOf('./v1.3-p0.js') > html.indexOf('<script type="module">')) throw new Error('p0 must load before the main module');
if (sw.includes('res.text()') || sw.includes("replace('<script")) throw new Error('Service worker must not rewrite HTML at request time');
if (!sw.includes('./vendor/ts-fsrs-5.4.1.mjs')) throw new Error('Local FSRS bundle missing from service-worker shell');
if (p0.includes('esm.sh')) throw new Error('v1.3-p0.js still references esm.sh');
if (p1.includes('a.includes(c)||c.includes(a)')) throw new Error('Meaning grading still uses unsafe bidirectional substring matching');
if (perf.includes('marks.app-ready')) throw new Error('Invalid app-ready property access remains');
if (!p1.includes('v13EduDontKnow')) throw new Error('Education mode lost the Do Not Know action');
if (!p1.includes('v13-edu-choice')) throw new Error('Education multiple-choice UI is missing');
if (fsrs.length < 30000 || /esm\.sh/i.test(fsrs)) throw new Error('Local FSRS bundle looks invalid');

for (const file of ['v1.3-production-ui.js','v1.3-education-v2.js','v1.3-dont-know.js']) {
  if (fs.existsSync(file)) throw new Error(`Dead v1.3 file should be removed: ${file}`);
}

for (const source of [p1,perf,sw]) {
  try { new vm.Script(source); } catch (e) { throw new Error(`Syntax error: ${e.message}`); }
}

console.log('Kanji 5 v1.3 smoke test passed.');
