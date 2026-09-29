import assert from "node:assert/strict";
import fs from "node:fs";
import { createContentEvidenceStore } from "../v1.9-content-evidence.js";

let components={};
const store=createContentEvidenceStore({
  readComponents:()=>components,
  writeComponents:value=>{components=value;return true;}
},{now:()=> "2026-09-29T00:00:00.000Z",limit:64});

const word={word:"学生",reading:"がくせい",meaning:"student"};
const wordId="学:学生";

assert.equal(store.readiness("vocabulary",wordId),"unseen","new content must start as unseen");
store.recordExposure({mode:"vocabulary",contentId:wordId,character:"学",contentKind:"vocabulary",provenance:"kanjiapi"});
assert.equal(store.readiness("vocabulary",wordId),"introduced","exposure must create introduced state");

const selected=store.selectContent([word,{word:"学校",reading:"がっこう",meaning:"school"}],"vocabulary",{idOf:item=>"学:"+item.word});
assert.equal(selected.word,"学生","recently introduced content should be selected for guided retrieval");

store.recordOutcome({mode:"vocabulary",contentId:wordId,character:"学",outcome:"wrong",selectedAnswer:"校",provenance:"kanjiapi"});
let mistake=store.listMistakes({character:"学",limit:5}).find(row=>row.contentId===wordId);
assert(mistake,"wrong vocabulary content must enter the mistake bank");
assert.equal(mistake.errorType,"wrong_choice");
assert.equal(mistake.lastWrongAnswer,"校");
assert.equal(mistake.state,"introduced");

store.recordOutcome({mode:"vocabulary",contentId:wordId,character:"学",outcome:"correct",provenance:"kanjiapi"});
assert.equal(store.readiness("vocabulary",wordId),"retrievable","one successful guided retrieval should make content retrievable");

store.recordOutcome({mode:"vocabulary",contentId:wordId,character:"学",outcome:"correct",provenance:"kanjiapi"});
assert.equal(store.readiness("vocabulary",wordId),"stable","repeated successful retrieval should mature the content state");
const nextUnseen=store.selectContent([word,{word:"学校",reading:"がっこう",meaning:"school"}],"vocabulary",{idOf:item=>"学:"+item.word});
assert.equal(nextUnseen.word,"学校","new unseen content must remain eligible after an item becomes stable");
assert.equal(store.get("context",wordId),null,"vocabulary and context must have separate content state");

for(let i=0;i<70;i++){
  const id="学:word-"+String(i).padStart(2,"0");
  store.recordExposure({mode:"vocabulary",contentId:id,character:"学",contentKind:"vocabulary",provenance:"test"});
}
assert(Object.keys(components.v19ContentEvidence||{}).length<=64,"content evidence must remain bounded");

const ui=fs.readFileSync(new URL("../v1.5-education-ui.js",import.meta.url),"utf8");
const app=fs.readFileSync(new URL("../frontend/src/app/App.tsx",import.meta.url),"utf8");
const contract=fs.readFileSync(new URL("../v1.9-v2-contract-core.js",import.meta.url),"utf8");

assert(ui.includes("v1.9-content-evidence.js"),"education runtime must load content evidence");
assert(ui.includes("recordExposure"),"unseen content must be recorded as exposure");
assert(ui.includes("contentStage==='introduction'"),"education runtime must distinguish content introduction");
assert(ui.includes("!recoveryTarget&&freshItem"),"fresh Kanji must not jump directly into higher-order recall modes");
assert(ui.includes("!recoveryTarget&&!((mode==='vocabulary'||mode==='context')&&contentStage==='introduction')"),"recovery/introduction must not consume an ordinary recall slot");
assert(ui.includes("!((mode==='vocabulary'||mode==='context')&&contentStage==='introduction')"),"introduction must not consume a normal recall slot");
assert(ui.includes("selectedAnswer"),"content-level selected answers must be carried into evidence");
assert(app.includes("onRetry"),"Active Recall must expose controlled recovery");
assert(app.includes("contentIntroductionPrompt"),"Active Recall must present a content introduction state");
assert(app.includes("yourChoice")&&app.includes("correctChoice"),"wrong feedback must distinguish selected and correct answers");
assert(app.includes("correctAnswerDisplay"),"choice feedback must show the correct Kanji rather than the full vocabulary answer string");
assert(app.includes('ex.mode==="vocabulary"||ex.mode==="context"'),"Vocabulary/Context must remain choice-based in V2 when choices are available");\nassert(!app.includes('<input autoFocus value={answer}') || app.includes('languageSafeContentUnavailable'),"Vocabulary/Context must not rely on Kanji typing as a fallback");\nassert(ui.includes("modality"),"education outcomes must record retrieval modality");\nassert(canonicalModalityAssertion());
assert(contract.includes("contentStage")&&contract.includes("contentState"),"V2 exercise contract must expose readiness metadata");

assert(fs.readFileSync(new URL("../v1.9-learner-model-core.js",import.meta.url),"utf8").includes("modalityStats"),"learner model must project modality-aware evidence");\nassert(fs.readFileSync(new URL("../v2-custom-study-core.js",import.meta.url),"utf8").includes('"mistakes"'),"Custom Study must expose content mistake focus");\nconsole.log("Active Recall content readiness, modality, and bounded mistake-bank checks passed.");
