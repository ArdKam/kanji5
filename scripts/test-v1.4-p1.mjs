import fs from 'node:fs';
import vm from 'node:vm';

const coreSource=fs.readFileSync('v1.4-education-core.js','utf8');
const migration=fs.readFileSync('v1.4-education-migration.js','utf8');
const ui=fs.readFileSync('v1.4-education-ui.js','utf8');
const sync=fs.readFileSync('supabase-sync.js','utf8');
const ctx={window:{},structuredClone:global.structuredClone,localStorage:{getItem(){return null},setItem(){}}};
vm.createContext(ctx);vm.runInContext(coreSource,ctx);
const core=ctx.window.__KANJI5_EDU_CORE__;const assert=(x,m)=>{if(!x)throw new Error(m)};
assert(core,'core missing');
assert(['meaning','reading','production','vocabulary','context'].every(m=>core.registry[m]),'registry incomplete');
assert(core.chooseBestExercise({character:'学'},{meaning:{attempts:9,correct:9},reading:{attempts:8,correct:2},production:{attempts:8,correct:1},vocabulary:{attempts:8,correct:1},context:{attempts:8,correct:1}},core.modes,{now:Date.now()})==='production','weakest skill was not prioritized');
const qualified=core.gradeMeaning('school work',['school work','education']);assert(qualified.correct&&qualified.quality==='exact','meaning exact grading failed');
const partial=core.gradeMeaning('school',['school system']);assert(partial.correct&&partial.quality==='partial','meaning partial grading failed');
assert(!core.gradeMeaning('schol',['school']).correct,'invalid typo was accepted');
assert(core.gradeReading('gaku',['がく']).correct,'reading grading failed');
assert(core.toRomaji('も')==='mo','Romaji も must map to mo');
assert(core.toRomaji('もう')==='mou','Long vowel sequence もう must map to mou');
assert(core.toRomaji('きょう')==='kyou','拗音 sequence きょう must map to kyou');
assert(core.gradeReading('mo',['も']).correct,'Romaji grading regressed for も');
const available=core.getAvailableModes({production:true,vocabulary:true,context:true},true);
assert(available.length===5,'All education modes should be available when enabled');
assert(!core.getAvailableModes({production:false,vocabulary:false,context:false},false).includes('production'),'Disabled production leaked into mode list');
const base={meaning:{attempts:9,correct:9},reading:{attempts:10,correct:2},production:{attempts:6,correct:1},vocabulary:{attempts:3,correct:0},context:{attempts:2,correct:1}};
const ranking=core.selectExercise({character:'学'},base,available,{now:Date.now()});
assert(ranking.length===5&&ranking[0].mode==='production','Adaptive engine did not prioritize the highest-value weak skill');
assert(core.chooseBestExercise({character:'学'},base,available,{now:Date.now()})==='production','Best exercise selection mismatch');
const now=Date.now();
const items=[{character:'学'},{character:'校'},{character:'語'}];
const knowledge={
  '学':{meaning:{attempts:20,correct:20},reading:{attempts:20,correct:20},production:{attempts:20,correct:20},vocabulary:{attempts:20,correct:20},context:{attempts:20,correct:20},stage:'mastered'},
  '校':{meaning:{attempts:8,correct:2,lastAt:new Date(now-10*86400000).toISOString()}},
  '語':{meaning:{attempts:2,correct:2,lastAt:new Date(now-86400000).toISOString()}}
};
assert(typeof core.scoreEducationItem==='function'&&typeof core.selectEducationItem==='function','Adaptive Kanji selection API missing');
const selected=core.selectEducationItem(items,knowledge,available,{now});
assert(selected?.character==='校','Adaptive Kanji selection did not prioritize the weaker/neglected Kanji');
const excluded=core.selectEducationItem(items,knowledge,available,{now,excludeCharacters:['校']});
assert(excluded?.character!=='校','Adaptive Kanji selection ignored current-item exclusion');
assert(core.scoreEducationItem(items[1],knowledge['校'],available,{now})>core.scoreEducationItem(items[0],knowledge['学'],available,{now}),'Weak Kanji did not outscore mastered Kanji');
const empty=core.ensureEntry({},'学',true)['学'];assert(empty.exposedAt&&empty.stage==='exposed','Exposure state initialization failed');
const recorded=core.recordKnowledge({'学':empty},'学','production',false,'校')['学'];
assert(recorded.production.attempts===1&&recorded.distractors['校']===1,'Knowledge recording failed');
const distractorTarget={character:'学',on:['ガク'],kun:['まなぶ'],meaning:['study','learning'],strokes:8,grade:1,frequency:100};
const distractorCandidates=[
  {character:'校',on:['コウ'],meaning:['school'],strokes:10,grade:1,frequency:110},
  {character:'楽',on:['ガク'],meaning:['comfort'],strokes:13,grade:1,frequency:120},
  {character:'習',on:['シュウ'],meaning:['learn'],strokes:11,grade:1,frequency:90},
  {character:'語',on:['ゴ'],meaning:['language'],strokes:14,grade:2,frequency:800}
];
assert(typeof core.scoreDistractor==='function'&&typeof core.chooseDistractors==='function','Smart distractor API missing');
assert(core.scoreDistractor(distractorTarget,distractorCandidates[1],{})>core.scoreDistractor(distractorTarget,distractorCandidates[0],{}),'Shared reading distractor did not receive higher score');
const picked=core.chooseDistractors(distractorTarget,distractorCandidates,{習:2},2);
assert(picked.length===2&&picked.some(x=>x.character==='習'),'Prior wrong distractor history did not influence ranking');
assert(!picked.some(x=>x.character==='学'),'Target Kanji leaked into distractor list');
assert(picked.every(x=>x.character!=='語'||core.scoreDistractor(distractorTarget,x,{習:2})>=0),'Invalid distractor score encountered');
assert(migration.includes('schemaVersion=1')&&migration.includes('kanji5-v1.4-education-meta'),'Migration missing');
assert(ui.includes('CORE.selectEducationItem')&&ui.includes('CORE.chooseBestExercise')&&ui.includes('CORE.gradeMeaning')&&ui.includes('CORE.gradeReading')&&ui.includes('CORE.recordKnowledge'),'UI bypasses canonical education core');
assert(ui.includes('fetchContextSentences')&&ui.includes('api.tatoeba.org/v1/sentences'),'Context sentence API wiring missing');
assert(ui.includes('edu.sentence.text.replaceAll(item.character'),'Context exercise does not blank the target Kanji');
assert(ui.includes('edu.sentence.english'),'Context exercise is missing English translation');
assert(ui.includes('v14EduProductionInput'),'Typed production UI missing');
assert(ui.includes('context')&&ui.includes('vocabulary'),'Vocabulary/context missing');
assert(ui.includes('تمرین بعدی'),'Next exercise flow missing');
assert(ui.includes('CORE.chooseDistractors'),'UI does not use canonical smart distractors');
const selectIndex=ui.indexOf('const item=CORE.selectEducationItem');
const modeIndex=ui.indexOf('let mode=CORE.chooseBestExercise(item,stats,modes');
const wordFetchIndex=ui.indexOf('fetchWords(item.character)');
const contextFetchIndex=ui.indexOf('fetchContextSentences(item.character)');
assert(selectIndex>=0&&modeIndex>selectIndex,'Adaptive item/mode selection ordering is invalid');
assert(wordFetchIndex>modeIndex,'Vocabulary API is fetched before exercise mode is selected');
assert(contextFetchIndex>modeIndex,'Context data is fetched before exercise mode selection');
assert(!ui.includes("const words=await fetchWords(item.character);const finalModes"),'Unconditional vocabulary fetch regression detected');
assert(sync.includes('production')&&sync.includes('vocabulary')&&sync.includes('context'),'Sync merge does not cover all educational modes');
assert(sync.includes('distractors')&&sync.includes('stage'),'Sync educational metadata missing');
console.log('Kanji 5 v1.4 P1 tests passed.');
