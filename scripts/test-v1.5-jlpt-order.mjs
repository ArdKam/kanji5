import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('kanji-data.json', 'utf8'));
const items = Array.isArray(data) ? data : data.kanji || [];
if (items.length !== 2136) throw new Error(`Expected 2136 cards, got ${items.length}`);

const levels = new Set(items.map(item => item?.jlpt).filter(Boolean));
for (const level of ['N5', 'N4', 'N3', 'N2', 'N1']) {
  if (!levels.has(level)) throw new Error(`Runtime dataset is missing JLPT level ${level}`);
}

const counts = Object.fromEntries(['N5', 'N4', 'N3', 'N2', 'N1'].map(level => [level, items.filter(item => item?.jlpt === level).length]));
if (Object.values(counts).some(count => count <= 0)) throw new Error('Each JLPT level must contain at least one runtime card');

const runtime = fs.readFileSync('v1.2-runtime-fixes.js', 'utf8');
if (runtime.includes('window.fetch =') || runtime.includes('document.body')) {
  throw new Error('JLPT validation must not rely on global fetch interception or document.body observers');
}

console.log('Kanji 5 v1.5 JLPT metadata checks passed; JLPT-first queue ordering remains intentionally disabled until it can be implemented directly in buildQueue.');
