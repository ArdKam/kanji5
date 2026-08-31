import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('v1.2-runtime-fixes.js', 'utf8');
const listeners = {};
const document = {
  querySelector() { return null; },
  addEventListener(name, fn) { listeners[name] = fn; },
  body: {},
};
const context = {
  console,
  Response,
  URL,
  Math,
  Date,
  setTimeout,
  clearTimeout,
  location: { href: 'https://example.test/' },
  document,
  MutationObserver: class { observe() {} },
  window: {},
};
context.window = context.window;
context.window.fetch = async () => {
  const data = [];
  for (let i = 0; i < 2136; i += 1) {
    const level = i < 20 ? 'N5' : i < 40 ? 'N4' : i < 60 ? 'N3' : i < 80 ? 'N2' : i < 100 ? 'N1' : undefined;
    data.push({ id: String(i), character: String.fromCodePoint(0x4e00 + i), jlpt: level });
  }
  return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
};

vm.runInNewContext(source, context, { filename: 'v1.2-runtime-fixes.js' });

const api = context.window.__KANJI5_V15_P0_JLPT__;
if (!api) throw new Error('JLPT ordering API was not installed');

const sample = [
  { jlpt: 'N5' }, { jlpt: 'N5' },
  { jlpt: 'N4' }, { jlpt: 'N4' },
  { jlpt: 'N3' }, { jlpt: 'N2' }, { jlpt: 'N1' },
  { jlpt: undefined },
];
if (!api.testOrder(sample)) throw new Error('JLPT rank helper rejects a valid N5→N1 order');
if (api.jlptRank({ jlpt: 'N5' }) !== 0) throw new Error('N5 rank is wrong');
if (api.jlptRank({ jlpt: 'N1' }) !== 4) throw new Error('N1 rank is wrong');

const response = await context.window.fetch('./kanji-data.json');
const ordered = await response.json();
if (ordered.length !== 2136) throw new Error(`Expected 2136 cards, got ${ordered.length}`);
const ranks = ordered.map(api.jlptRank);
if (!ranks.every((rank, i) => i === 0 || rank >= ranks[i - 1])) {
  throw new Error('Fetched dataset was not grouped by JLPT rank');
}
const first100 = ordered.slice(0, 100);
if (first100.some((item) => !item.jlpt)) throw new Error('Unclassified cards leaked into the classified JLPT groups');

console.log('Kanji 5 v1.5 JLPT-first ordering behavior passed.');
