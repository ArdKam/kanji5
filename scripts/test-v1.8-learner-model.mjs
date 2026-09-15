import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

let components={};
const state={
  readSessionHistory:()=>[
    {sessionId:'s1',endedAt:'2026-09-10T10:00:00Z',modeResults:{production:{attempts:2,correct:0,lastCorrect:false},reading:{attempts:20,correct:20,lastCorrect:true},meaning:{attempts:2,correct:2}}},
    {sessionId:'s2',endedAt:'2026-09-11T10:00:00Z',modeResults:{production:{attempts:2,correct:1,lastCorrect:true},reading:{attempts:20,correct:20,lastCorrect:true},meaning:{attempts:2,correct:2}}},
    {sessionId:'s3',endedAt:'2026-09-12T10:00:00Z',modeResults:{production:{attempts:2,correct:0,lastCorrect:false},reading:{attempts:20,correct:20,lastCorrect:true},meaning:{attempts:2,correct:2}}}
  ],
  readComponents:()=>components,
  writeComponents:value=>{components=value;return true}
};
const document={getElementById:()=>null,addEventListener(){}};
const context={window:{},globalThis:{},document,Date,JSON,setTimeout,clearTimeout};
context.window.__KANJI5_STATE__=state;
vm.createContext(context);
vm.runInContext(fs.readFileSync('v1.6-skill-profile.js','utf8'),context);
const api=context.window.__KANJI5_V16_SKILL_PROFILE__;
assert.ok(api);
assert.ok(api.update());
const ranked=api.rank();
const production=ranked.find(x=>x.mode==='production');
const reading=ranked.find(x=>x.mode==='reading');
assert.ok(production);
assert.ok(reading);
assert.equal(production.recentErrors,2);
assert.equal(production.recoveryRate,1);
assert.equal(production.momentum,0);
assert.ok(production.mastery<reading.mastery);
assert.ok(production.accuracy<reading.accuracy);
console.log('Kanji 5 v1.8 Learner Model contract passed.');
