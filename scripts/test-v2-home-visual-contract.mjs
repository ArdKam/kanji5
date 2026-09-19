import assert from 'node:assert/strict';
import fs from 'node:fs';

const presentation=fs.readFileSync('v2-presentation.js','utf8');
const css=fs.readFileSync('v2-presentation.css','utf8');

assert.match(presentation,/const practiceButton = ui\.button\([\s\S]*?تمرین آموزشی/);
assert.match(presentation,/const statsButton = ui\.button\([\s\S]*?آمار/);
assert.match(presentation,/const settingsButton = ui\.button\([\s\S]*?تنظیمات/);
assert.match(presentation,/function renderDailyGoal\(parent,snapshot\)[\s\S]*ui\.card\(/);
assert.match(presentation,/function renderDailyGoal\(parent,snapshot\)[\s\S]*ui\.progress\(/);
assert.match(presentation,/function renderDailySummary\(parent,snapshot\)[\s\S]*ui\.stat\(/);
assert.match(css,/\.v2-daily-goal/);
assert.match(css,/\.v2-daily-summary/);
console.log('Kanji 5 Home visual primitive contract passed.');
