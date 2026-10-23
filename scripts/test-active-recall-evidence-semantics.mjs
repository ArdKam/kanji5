import assert from 'node:assert/strict';
import fs from 'node:fs';
import { projectKanjiAttributes } from '../v1.9-learner-model-core.js';
import { nextTask } from '../v1.9-adaptive-planner-core.js';
import { createContentEvidenceStore } from '../v1.9-content-evidence.js';

const selfReported=projectKanjiAttributes(
  { 学:{exposedAt:'2026-09-01T00:00:00.000Z',production:{attempts:2,correct:2}} },
  '学',
  {evidenceByMode:{production:[
    {at:'2026-09-01T00:00:00.000Z',mode:'production',modality:'revealed_self_report',attemptType:'revealed_self_report',outcome:'correct',correct:true,independent:false,revealed:true},
    {at:'2026-09-02T00:00:00.000Z',mode:'production',modality:'revealed_self_report',attemptType:'revealed_self_report',outcome:'correct',correct:true,independent:false,revealed:true}
  ]}}
).attributes.production;
assert.equal(selfReported.attempts,0);
assert.equal(selfReported.correct,0);
assert.equal(selfReported.state,'introduced');

const fourCorrect=projectKanjiAttributes(
  {学:{exposedAt:'2026-09-01T00:00:00.000Z'}},'学',
  {evidenceByMode:{reading:[
    {at:'2026-09-01T00:00:00.000Z',mode:'reading',modality:'free_recall',attemptType:'free_recall',outcome:'correct',correct:true,independent:true},
    {at:'2026-09-02T00:00:00.000Z',mode:'reading',modality:'free_recall',attemptType:'free_recall',outcome:'correct',correct:true,independent:true},
    {at:'2026-09-03T00:00:00.000Z',mode:'reading',modality:'free_recall',attemptType:'free_recall',outcome:'correct',correct:true,independent:true},
    {at:'2026-09-04T00:00:00.000Z',mode:'reading',modality:'free_recall',attemptType:'free_recall',outcome:'correct',correct:true,independent:true}
  ]}}
).attributes.reading;
assert.equal(fourCorrect.attempts,4);
assert.equal(fourCorrect.state,'mastered');

const mixedRecovery=projectKanjiAttributes(
  {学:{exposedAt:'2026-09-01T00:00:00.000Z'}},'学',
  {evidenceByMode:{meaning:[
    {at:'2026-09-01T00:00:00.000Z',mode:'meaning',modality:'free_recall',attemptType:'free_recall',outcome:'wrong',correct:false,independent:true,taskId:'t1'},
    {at:'2026-09-01T00:01:00.000Z',mode:'meaning',modality:'free_recall',attemptType:'guided_recovery',outcome:'correct',correct:true,independent:false,recovery:true,taskId:'t1',retryOf:'t1'},
    {at:'2026-09-02T00:00:00.000Z',mode:'meaning',modality:'free_recall',attemptType:'free_recall',outcome:'correct',correct:true,independent:true,taskId:'t2'}
  ]}}
).attributes.meaning;
assert.equal(mixedRecovery.attempts,2);
assert.equal(mixedRecovery.correct,1);
assert.equal(mixedRecovery.recoveryCount,1);

const planner=nextTask({attributes:{
  meaning:{state:'stable',attempts:8,accuracy:.95,confidence:1,uncertaintyState:'low',errorStreak:0},
  reading:{state:'weak',attempts:8,accuracy:.25,confidence:1,uncertaintyState:'low',errorStreak:2},
  production:{state:'introduced',attempts:1,accuracy:0,confidence:.125,uncertaintyState:'high',errorStreak:0},
  vocabulary:{state:'stable',attempts:8,accuracy:.95,confidence:1,uncertaintyState:'low',errorStreak:0},
  context:{state:'stable',attempts:8,accuracy:.95,confidence:1,uncertaintyState:'low',errorStreak:0}
},availableModes:['meaning','reading','production','vocabulary','context'],remaining:1});
assert.equal(planner.mode,'reading');

let components={};
const store=createContentEvidenceStore({readComponents:()=>components,writeComponents:v=>{components=v;return true}},{now:()=> '2026-09-10T00:00:00.000Z',limit:64});
store.recordExposure({mode:'vocabulary',contentId:'学:学生',character:'学',contentKind:'vocabulary',provenance:'test'});
store.recordOutcome({mode:'vocabulary',contentId:'学:学生',character:'学',outcome:'wrong',selectedAnswer:'校',independent:true,attemptType:'cued_recognition'});
store.recordOutcome({mode:'vocabulary',contentId:'学:学生',character:'学',outcome:'correct',independent:false,recovery:true,attemptType:'guided_recovery'});
store.recordOutcome({mode:'vocabulary',contentId:'学:学生',character:'学',outcome:'correct',independent:false,recovery:true,attemptType:'guided_recovery'});
const record=store.get('vocabulary','学:学生');
assert.equal(record.correctCount,0);
assert.equal(record.practiceCount,1);
assert.equal(record.recoveryCount,2);

const uiText=fs.readFileSync(new URL('../v1.5-education-ui.js',import.meta.url),'utf8');
const appText=fs.readFileSync(new URL('../frontend/src/app/App.tsx',import.meta.url),'utf8');
const sessionText=fs.readFileSync(new URL('../v1.6-session-feedback.js',import.meta.url),'utf8');
assert.match(uiText,/selfReportProduction/);
assert.match(uiText,/preferredModes/);
assert.match(uiText,/independent/);
assert.match(appText,/selfReportProduction/);
assert.match(sessionText,/sessionEligible===false/);
console.log('Active Recall evidence semantics tests passed.');
