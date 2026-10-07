import assert from "node:assert/strict";
import fs from "node:fs";

import { buildLearnerContent, selectLearnerExamples, learnerContentPolicy } from "../v1.9-learner-content-core.js";
import { createContentEvidenceStore } from "../v1.9-content-evidence.js";
import { validateContextSentence, contentDifficulty } from "../v1.9-data-quality-core.js";
import { legacyEducationDefinition } from "../v2-domain-core.js";

const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
const kanjiCatalog=JSON.parse(fs.readFileSync("kanji-data.json","utf8")).kanji;
const education=fs.readFileSync("v1.5-education-ui.js","utf8");
const boundary=fs.readFileSync("v1.9-v2-boundary.js","utf8");
const placement=fs.readFileSync("frontend/src/app/placement-logic.ts","utf8");
const diagnostic=fs.readFileSync("frontend/src/app/PlacementDiagnostic.tsx","utf8");
const serviceWorker=fs.readFileSync("sw.js","utf8");
const audit=fs.readFileSync("docs/EDUCATIONAL-CONTENT-AUDIT.md","utf8");

assert.equal(legacyEducationDefinition("production").exercise,"typed-kanji-production");

for(const marker of [
  "independent-typed-production",
  "cued-kanji-completion",
  "cued-sentence-completion",
  "revealed_self_report",
  "content-exposure",
]) assert.ok(education.includes(marker),`missing educational modality marker: ${marker}`);
assert.match(app,/cued-kanji-choice/);

assert.match(app,/production&&showProductionOptions\?\{hintUsed:true\}/);
assert.match(boundary,/submitExercise\(value,meta=\{\}\)/);
assert.match(serviceWorker, /["']\.\/v1\.9-learner-content-core\.js["']/);
assert.match(boundary,/fn\(String\(value\?\?''\),meta&&typeof meta==='object'\?meta:\{\}\)/);

const production=buildLearnerContent({character:"一",meanings:["one","one radical (no.1)"],on:["イチ","イツ"],kun:["ひと-","ひと.つ"]});
assert.deepEqual(production.meanings.primary,["one"]);
assert.ok(production.meanings.reference.includes("one radical (no.1)"));
assert.deepEqual(production.readings.coreOn,["イチ"]);
assert.deepEqual(production.readings.coreKun,["ひと-"]);
assert.ok(production.readings.referenceOn.includes("イツ"));
assert.equal(learnerContentPolicy().version,"1.0.0");
for(const item of kanjiCatalog.slice(0,80).filter(item=>item?.character)){
  const model=buildLearnerContent({character:item.character,meanings:item.meanings||item.meaning,on:item.on,kun:item.kun});
  const source=new Set(model.sourceMeanings);
  for(const value of [...model.meanings.primary,...model.meanings.secondary,...model.meanings.reference]) assert.ok(source.has(value),`learner layer must not invent gloss: ${item.character} / ${value}`);
}


const ambiguous=buildLearnerContent({character:"日",meanings:["day","sun","Japan"]});
assert.deepEqual(ambiguous.meanings.primary,["day","sun"]);
assert.deepEqual(ambiguous.meanings.secondary,["Japan"]);

const exampleFixture=[
  {word:"学校",reading:"がっこう",meaning:"school"},
  {word:"学年",reading:"がくねん",meaning:"school year"},
  {word:"学ぶ",reading:"まなぶ",meaning:"to study; to learn"},
  {word:"学",reading:"がく",meaning:"learning"},
  {word:"学校",reading:"がっこう",meaning:"duplicate"},
  {word:"学生",reading:"がくせい",meaning:"student"},
  {word:"English",reading:"えいご",meaning:"invalid target"},
  {word:"学年",reading:"",meaning:"missing reading"},
];
const examples=selectLearnerExamples(exampleFixture,"学",6);
assert.equal(examples.length,4);
assert.deepEqual(examples.map(x=>x.word),["学ぶ","学年","学校","学生"]);
assert.ok(!examples.some(x=>x.word==="English"));

const contextFixtures=[
  {text:"私は学生です。",english:"I am a student."},
  {text:"学校へ行きます。",english:"I go to school."},
  {text:"新しい学びがあります。",english:"There is new learning."},
  {text:"学ぶことは大切です。",english:"Learning is important."},
];
for(const fixture of contextFixtures){
  const checked=validateContextSentence(fixture,"学");
  assert.equal(checked.valid,true);
  assert.ok(contentDifficulty(fixture,"学","context")>=0);
}
assert.equal(validateContextSentence({text:"学",english:""},"学").valid,false);

const components={};
const store=createContentEvidenceStore({
  readComponents:()=>components,
  writeComponents:value=>{Object.assign(components,value);return true;}
},{now:()=> "2026-10-05T00:00:00.000Z",limit:64});
store.recordExposure({mode:"vocabulary",contentId:"vocabulary:test",character:"学",contentKind:"vocabulary",provenance:"fixture"});
store.recordOutcome({mode:"vocabulary",contentId:"vocabulary:test",character:"学",outcome:"correct",independent:true,recovery:false,attemptType:"cued-kanji-completion"});
let row=store.get("vocabulary","vocabulary:test");
assert.equal(row.independentPracticeCount,1);
assert.equal(row.correctCount,1);
store.recordOutcome({mode:"vocabulary",contentId:"vocabulary:test",character:"学",outcome:"correct",independent:false,recovery:false,attemptType:"revealed_self_report"});
row=store.get("vocabulary","vocabulary:test");
assert.equal(row.independentPracticeCount,1);
assert.equal(row.correctCount,1);
store.recordOutcome({mode:"vocabulary",contentId:"vocabulary:test",character:"学",outcome:"wrong",independent:false,recovery:true,attemptType:"guided_recovery"});
row=store.get("vocabulary","vocabulary:test");
assert.equal(row.recoveryCount,1);

assert.match(education,/const independent=!isRecoveryAttempt&&!productionSelfReport/);
assert.match(education,/attemptType=isRecoveryAttempt\?'guided_recovery':productionSelfReport\?'revealed_self_report':edu\.mode==='meaning'\|\|edu\.mode==='reading'\?'free_recall':'cued_recognition'/);
assert.match(app,/effectiveModality=production/);
assert.match(education,/const primaryMeanings=learnerContent\.meanings\.primary\.length\?learnerContent\.meanings\.primary:\(edu\.item\.meaning\|\|\[\]\)/);
assert.match(education,/primary:primaryMeanings\.join\(' · '\)/);

assert.match(placement,/confidence: "high" \| "boundary" \| "limited"/);
assert.match(placement,/upperBoundReached/);
assert.match(placement,/PLACEMENT_SEMANTIC_FIXTURES/);
assert.match(placement,/semanticMeaningOverlap/);
assert.match(diagnostic,/data-placement-confidence/);
assert.match(diagnostic,/diagnosticPlacementBoundary/);
assert.match(diagnostic,/diagnosticPlacementUpperBound/);
assert.match(audit,/Placement uncertainty documented\./);
assert.match(audit,/Independent retrieval separated from reveal\/self-report/);
const mnemonics=fs.readFileSync("frontend/src/app/prepared-mnemonic-core.js","utf8");
assert.match(mnemonics,/source:\s*"curated"/);
assert.match(mnemonics,/source:\s*"generated"/);
assert.match(app,/data-mnemonic-source=\{preparedMnemonic.source\}/);

console.log("C4 educational validity regression contracts passed.");
