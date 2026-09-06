import assert from 'node:assert/strict';
import fs from 'node:fs';

const session=fs.readFileSync('v1.6-session.js','utf8');
const p0=fs.readFileSync('v1.5-p0.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

assert.match(session,/window\.__KANJI5_V16_SESSION__/,'v1.6 session runtime marker missing');
for(const id of ['v16Session','v16Due','v16New','v16Mastered','v16Streak','v16GoalBar','v16Reviews','v16Recall','v16Unknown','v16Duration','v16Modes','v16Attention'])assert.match(session,new RegExp(`["']${id}["']`),`session dashboard node missing: ${id}`);
assert.match(session,/state\.readKnowledge\(\)/,'session dashboard must consume knowledge through the state boundary');
assert.match(session,/\.rate\[data-r\]/,'session dashboard must observe FSRS ratings');
assert.match(session,/#v15DontKnowRecall/,'session dashboard must observe Active Recall unknown outcomes');
for(const [key,label] of [['meaning','معنی'],['reading','خوانش'],['production','تولید'],['vocabulary','واژگان'],['context','بافت']])assert.match(session,new RegExp(`\\['${key}','${label}'\\]`),`${key} skill metric missing`);
assert.match(p0,/import\('\.\/v1\.6-session\.js'\)/,'v1.6 session runtime must be wired from the active browser runtime');
assert.match(sw,/"\.\/v1\.6-session\.js"/,'v1.6 session runtime must be offline-precached');
assert.match(sw,/const CACHE='kanji5-shell-v50'/,'service-worker cache must advance for the new runtime dependency');
console.log('Kanji 5 v1.6 session contract checks passed.');
// Matcher accepts both single and double quote styles for generated DOM identifiers.
