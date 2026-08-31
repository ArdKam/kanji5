import fs from 'node:fs';

const required = [
  'index.html',
  'sw.js',
  'v1.3-p1.js',
  'v1.3-p0.js',
  'v1.3-dont-know.js',
  'v1.3-perf.js',
  'v1.3-storage-bridge.js',
  'v1.3-settings.js',
  'vendor/ts-fsrs-5.4.1.mjs'
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}
const html = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const p1 = fs.readFileSync('v1.3-p1.js', 'utf8');
const perf = fs.readFileSync('v1.3-perf.js', 'utf8');
const fsrs = fs.readFileSync('vendor/ts-fsrs-5.4.1.mjs', 'utf8');

if (!html.includes('<script src="./v1.3-p1.js"></script>')) {
  throw new Error('index.html must directly load v1.3-p1.js');
}
if (!sw.includes('./v1.3-p0.js') || !sw.includes('./v1.3-p1.js')) {
  throw new Error('Service worker shell is missing core v1.3 scripts');
}
if (!sw.includes('./v1.3-settings.js')) {
  throw new Error('Service worker shell is missing settings script');
}
if (!p1.includes("const KNOW='kanji5-v1.2-knowledge'")) {
  throw new Error('Education knowledge storage is missing');
}
if (!perf.includes("marks['app-ready']")) {
  throw new Error('Performance mark must use bracket notation');
}
if (fsrs.length < 30000 || /esm\.sh/i.test(fsrs)) {
  throw new Error('Local FSRS bundle is missing or looks invalid');
}

console.log('Kanji 5 v1.3 static smoke test passed');
