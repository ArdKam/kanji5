import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('v1.5-fsrs-sync-core.js','utf8');
const moduleSource=source.replace(/export (function|const) /g,'$1 ').replace(/export \{[^}]+\};?/g,'');
const wrapped=`${moduleSource};globalThis.__api={mergeReviewEvents,replayCards,latestEventByCard,eventKey,compareEvents}`;
const ctx={structuredClone:global.structuredClone,Date,Math};vm.runInNewContext(wrapped,ctx);const {mergeReviewEvents,replayCards,latestEventByCard}=ctx.__api;
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const base={id:'a',card:{state:0,due:new Date('2026-09-02T10:00:00Z'),last_review:null},reviews:0,lapses:0,learnedAt:null,leech:false};
const postLegacy={...base,card:{...base.card,state:3,due:new Date('2026-09-02T10:01:00Z'),last_review:new Date('2026-09-02T10:01:00Z')},reviews:1};
const legacyEvent={eventId:'A1',deviceId:'A',id:'a',at:'2026-09-02T10:01:00Z',rating:'Good',parentEventId:null,baseRecord:structuredClone(postLegacy),eventSchemaVersion:1};
const newEvent={eventId:'B1',deviceId:'B',id:'a',at:'2026-09-02T10:02:00Z',rating:'Hard',parentEventId:null,eventSchemaVersion:2,baseRecord:structuredClone(base),resultRecord:{...base,reviews:1,card:{...base.card,state:2,due:new Date('2026-09-02T10:02:00Z'),last_review:new Date('2026-09-02T10:02:00Z')}}};
const merged=mergeReviewEvents([legacyEvent],[newEvent]);assert(merged.length===2,'Concurrent review events were not unioned');
assert(mergeReviewEvents(merged,[legacyEvent]).length===2,'Review merge is not idempotent');
let calls=0;
const createScheduler=()=>({Rating:{Again:1,Hard:2,Good:3,Easy:4},next(card,when,rating){calls+=1;return{card:{...card,state:rating,due:when,last_review:when,_applied:(card._applied||0)+1}}}});
const cards=replayCards({},[newEvent],createScheduler);assert(cards.a.reviews===1,'A schema-v2 FSRS event should replay exactly once');assert(calls===1,'A schema-v2 FSRS event was applied more than once');
const legacyCalls=calls;const legacyCards=replayCards({},[legacyEvent],createScheduler);assert(legacyCards.a.reviews===1,'A legacy post-review snapshot must not be applied twice');assert(calls===legacyCalls,'Legacy root event was incorrectly replayed');
const legacyChild={eventId:'A2',deviceId:'A',id:'a',at:'2026-09-02T10:03:00Z',rating:'Again',parentEventId:'A1',baseRecord:structuredClone({...postLegacy,reviews:2,lapses:1}),eventSchemaVersion:1};
const legacyChain=replayCards({},[legacyEvent,legacyChild],createScheduler);assert(legacyChain.a.reviews===2,'Causal child review was not replayed from a legacy root snapshot');assert(legacyChain.a.lapses===0,'Again during Relearning must not inflate mature-review lapse counts');
const legacyRoot2={eventId:'C1',deviceId:'C',id:'a',at:'2026-09-02T10:04:00Z',rating:'Good',parentEventId:null,baseRecord:structuredClone({...base,card:{...base.card,state:2,due:new Date('2026-09-02T10:04:00Z'),last_review:new Date('2026-09-02T10:04:00Z')},reviews:1}),eventSchemaVersion:1};
const concurrentLegacy=replayCards({},[legacyEvent,legacyRoot2],createScheduler);assert(concurrentLegacy.a.reviews===1,'Concurrent legacy roots must resolve to one post-review snapshot, not double-apply roots');
const legacy={id:'a',at:'2026-09-02T09:00:00Z',rating:'Good',due:'2026-09-02T10:00:00Z',scheduledDays:1};assert(mergeReviewEvents([legacy],[]).length===1,'Legacy review entry compatibility failed');
assert(latestEventByCard([legacyEvent,legacyChild]).a.eventId==='A2','Latest event per card is incorrect');
console.log('Kanji 5 v1.5 FSRS replay snapshot/legacy tests passed.');

let schedulingConfigs=[];
const configuredFactory=config=>{schedulingConfigs.push(config);return{Rating:{Again:1,Hard:2,Good:3,Easy:4},next(card,when,rating){return{card:{...card,state:2,due:when,last_review:when,lapses:Number(card.lapses)||0}}}}};
const configBase={id:'cfg',card:{state:0,due:new Date('2026-10-01T00:00:00Z'),last_review:null,lapses:0},reviews:0,lapses:0,learnedAt:null,leech:false};
const configEvents=[
 {eventId:'CFG1',deviceId:'D1',id:'cfg',at:'2026-10-01T00:01:00Z',rating:'Good',parentEventId:null,eventSchemaVersion:2,baseRecord:structuredClone(configBase),schedulingConfig:{retention:.9,maxInterval:36500,learningSteps:['1m','10m'],relearningSteps:['10m'],enableFuzz:true,enableShortTerm:true,leechThreshold:8}},
 {eventId:'CFG2',deviceId:'D1',id:'cfg',at:'2026-10-02T00:01:00Z',rating:'Good',parentEventId:'CFG1',eventSchemaVersion:2,baseRecord:structuredClone(configBase),schedulingConfig:{retention:.95,maxInterval:9000,learningSteps:['1m','10m','23h'],relearningSteps:['10m'],enableFuzz:false,enableShortTerm:true,leechThreshold:6}}
];
replayCards({},configEvents,configuredFactory);
assert.equal(schedulingConfigs.length,2,'Each event must use its captured scheduler config');
assert.equal(schedulingConfigs[0].retention,.9);
assert.equal(schedulingConfigs[1].retention,.95);
assert.deepEqual(Array.from(schedulingConfigs[1].learningSteps),['1m','10m','23h']);
const lapseFactory=()=>({Rating:{Again:1,Hard:2,Good:3,Easy:4},next(card,when,rating){return{card:{...card,state:rating===1?3:2,lapses:(Number(card.lapses)||0)+(rating===1&&card.state===2?1:0),due:when,last_review:when}}}});
const immature={...configBase,id:'immature',card:{...configBase.card,state:1}};
const immatureAgain={eventId:'IM1',id:'immature',at:'2026-10-03T00:00:00Z',rating:'Again',parentEventId:null,eventSchemaVersion:2,baseRecord:immature,resultRecord:{},schedulingConfig:{}};
assert.equal(replayCards({},[immatureAgain],lapseFactory).immature.lapses,0,'Again during Learning must not inflate mature lapses');
const mature={...configBase,id:'mature',card:{...configBase.card,state:2}};
const matureAgain={eventId:'MA1',id:'mature',at:'2026-10-03T00:00:00Z',rating:'Again',parentEventId:null,eventSchemaVersion:2,baseRecord:mature,resultRecord:{},schedulingConfig:{}};
assert.equal(replayCards({},[matureAgain],lapseFactory).mature.lapses,1,'Again during Review must count as a mature lapse');
console.log('Kanji 5 per-event FSRS replay configuration and mature-lapse tests passed.');
