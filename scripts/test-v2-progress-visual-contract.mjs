import assert from 'node:assert/strict';
import fs from 'node:fs';

const presentation=fs.readFileSync('v2-presentation.js','utf8');
const css=fs.readFileSync('v2-presentation.css','utf8');

assert.match(presentation,/async function openV2Stats\(\)[\s\S]*ui\.stat\(/);
assert.match(presentation,/function renderInsights\(snapshot\)[\s\S]*ui\.card\(/);
assert.match(presentation,/function renderDailySummary\(parent,snapshot\)[\s\S]*ui\.stat\(/);
assert.match(css,/\.v2-stats-grid \.v2-daily-stat/);
assert.match(css,/\.v2-insight-panel/);
console.log('Kanji 5 Progress visual primitive contract passed.');
