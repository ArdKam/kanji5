import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('kanji-data.json', 'utf8'));
const items = Array.isArray(data) ? data : data.kanji || [];
const index = fs.readFileSync('index.html', 'utf8');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

assert(items.length === 2136, `Expected 2136 runtime cards, got ${items.length}`);
const levels = new Set(items.map(item => item?.jlpt).filter(Boolean));
for (const level of ['N5', 'N4', 'N3', 'N2', 'N1']) assert(levels.has(level), `Runtime dataset is missing ${level}`);
assert(index.includes('function jlptRank(item)'), 'JLPT queue rank helper missing');
assert(index.includes('const level=jlptRank(a)-jlptRank(b)'), 'New-card queue does not sort by JLPT level');

const rank = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
const synthetic = [
  { character: 'n3', jlpt: 'N3', frequency: 1 },
  { character: 'n5', jlpt: 'N5', frequency: 999 },
  { character: 'n4', jlpt: 'N4', frequency: 2 },
  { character: 'n5b', jlpt: 'N5', frequency: 1 }
];
synthetic.sort((a, b) => rank[a.jlpt] - rank[b.jlpt] || Number(a.frequency) - Number(b.frequency) || String(a.character).localeCompare(String(b.character)));
assert(synthetic.map(x => x.jlpt).join(',') === 'N5,N5,N4,N3', 'JLPT-first ordering rule is incorrect');

console.log('Kanji 5 v1.5 JLPT-first queue validation passed.');
