import fs from 'node:fs';

const stage=fs.readFileSync('scripts/v1.5-maintenance-stage.txt','utf8').trim();
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const patchRecallCleanup=()=>{
  const indexPath='index.html';
  let index=fs.readFileSync(indexPath,'utf8');
  const duplicate=/<script id="v1\.2-recall-result-fix">[\s\S]*?<\/script>/;
  if(duplicate.test(index)) index=index.replace(duplicate,'');
  fs.writeFileSync(indexPath,index);

  const uiPath='v1.2-enhancements.js';
  let ui=fs.readFileSync(uiPath,'utf8');
  const globalObserver=/  const observer = new MutationObserver\(\(\) => \{\n    const answerBox = \$\("#answerBox"\);\n    if \(answerBox\?\.classList\.contains\("show"\)\) setupProgressiveReveal\(\);\n  \}\);\n  observer\.observe\(document\.body, \{ childList: true, subtree: true \}\);/;
  if(globalObserver.test(ui)) ui=ui.replace(globalObserver,`  const observer = new MutationObserver(() => {
    const answerBox = $("#answerBox");
    if (answerBox?.classList.contains("show")) setupProgressiveReveal();
  });
  const studyRoot = document.getElementById("studyPanel") || document.getElementById("study");
  if (studyRoot) observer.observe(studyRoot, { childList: true, subtree: true });`);
  fs.writeFileSync(uiPath,ui);
};
const patchEducationTestApi=()=>{
  const path='v1.4-education-ui.js';
  let ui=fs.readFileSync(path,'utf8');
  const choiceHandler="document.addEventListener('click',e=>{const t=e.target;if(!t?.matches?.('.v14-edu-choice')||edu.answered)return;const wrong=t.dataset.choice||'',ok=wrong===edu.item?.character;edu.answered=true;const entry=record(edu.mode,{correct:ok,quality:ok?'exact':'wrong'},ok?'':wrong);renderResult({correct:ok,quality:ok?'exact':'wrong',stage:entry.stage})},true);";
  if(ui.includes(choiceHandler)) ui=ui.replace(choiceHandler,"function handleChoice(t){if(!t?.matches?.('.v14-edu-choice')||edu.answered)return;const wrong=t.dataset.choice||'',ok=wrong===edu.item?.character;edu.answered=true;const entry=record(edu.mode,{correct:ok,quality:ok?'exact':'wrong'},ok?'':wrong);renderResult({correct:ok,quality:ok?'exact':'wrong',stage:entry.stage})}document.addEventListener('click',e=>handleChoice(e.target),true);");
  assert(ui.includes("function handleChoice(t)"),'Production choice handler refactor failed');
  const marker="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',buildUI);else buildUI();";
  assert(ui.includes(marker),'Education UI bootstrap marker missing');
  const api="window.__KANJI5_EDU_UI_API__=Object.freeze({startEducation,handleChoice,getState:()=>({item:edu.item,mode:edu.mode,word:edu.word,sentence:edu.sentence,answered:edu.answered})});";
  if(!ui.includes('__KANJI5_EDU_UI_API__')) ui=ui.replace(marker,`${marker}\n${api}`);
  else ui=ui.replace(/window\.__KANJI5_EDU_UI_API__=Object\.freeze\([^;]+\);/,api);
  fs.writeFileSync(path,ui);
};
const patchInitializationSharing=()=>{
  const path='index.html';
  let index=fs.readFileSync(path,'utf8');
  const oldDeck=`async function loadDeck(){\n  $("loadStatus").textContent="در حال دریافت فهرست Jōyō...";\n  const res=await fetch(DATA_URL,{cache:"force-cache"});\n  if(!res.ok)throw new Error("Could not load local kanji dataset");\n  const data=await res.json();\n  const all=Array.isArray(data)?data:(data.kanji||[]);\n  if(all.length!==2136)throw new Error(\`Runtime kanji dataset must contain 2136 entries, got \${all.length}\`);\n  state.deck=all;\n  localStorage.setItem("kanji5-deck",JSON.stringify(state.deck));\n}`;
  const newDeck=`async function loadDeck(){\n  $("loadStatus").textContent="در حال دریافت فهرست Jōyō...";\n  const prefetched=window.__KANJI5_P0_DATA_PROMISE;\n  if(prefetched){\n    const all=await prefetched;\n    if(Array.isArray(all)&&all.length===2136){state.deck=all;localStorage.setItem("kanji5-deck",JSON.stringify(state.deck));return}\n  }\n  const res=await fetch(DATA_URL,{cache:"force-cache"});\n  if(!res.ok)throw new Error("Could not load local kanji dataset");\n  const data=await res.json();\n  const all=Array.isArray(data)?data:(data.kanji||[]);\n  if(all.length!==2136)throw new Error(\`Runtime kanji dataset must contain 2136 entries, got \${all.length}\`);\n  state.deck=all;\n  localStorage.setItem("kanji5-deck",JSON.stringify(state.deck));\n}`;
  assert(index.includes(oldDeck),'Dataset loader shape changed; refusing unsafe replacement');
  index=index.replace(oldDeck,newDeck);
  const oldFsrs=`const mod=await Promise.race([import(FSRS_URL),new Promise((_,reject)=>setTimeout(()=>reject(new Error("FSRS_LOAD_TIMEOUT")),10000))]);({createEmptyCard,fsrs,Rating}=mod);`;
  const newFsrs=`const shared=window.__KANJI5_P0_FSRS_PROMISE;const loadPromise=shared?shared.then(mod=>{if(!mod)throw new Error("FSRS_PREFETCH_FAILED");return mod}):import(FSRS_URL);const mod=await Promise.race([loadPromise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("FSRS_LOAD_TIMEOUT")),10000))]);({createEmptyCard,fsrs,Rating}=mod);`;
  assert(index.includes(oldFsrs),'FSRS loader shape changed; refusing unsafe replacement');
  index=index.replace(oldFsrs,newFsrs);
  fs.writeFileSync(path,index);
};
const patchDailyCounterMerge=()=>{
  const path='supabase-sync.js';let sync=fs.readFileSync(path,'utf8');
  const old='    const localToday = String(local.today || ""), remoteToday = String(remote.today || "");\n    merged.today = localToday >= remoteToday ? (localToday || remoteToday) : remoteToday;\n    merged.todayNew = Math.max(local.todayNew || 0, remote.todayNew || 0);\n    merged.todayReviewCount = Math.max(local.todayReviewCount || 0, remote.todayReviewCount || 0);\n    merged.goalCelebrated = Boolean(local.goalCelebrated || remote.goalCelebrated);';
  const next='    const localToday = String(local.today || ""), remoteToday = String(remote.today || "");\n    const useLocalToday = localToday >= remoteToday;\n    const newerTodayState = useLocalToday ? local : remote;\n    merged.today = useLocalToday ? (localToday || remoteToday) : remoteToday;\n    merged.todayNew = Math.max(0, Number(newerTodayState.todayNew) || 0);\n    merged.todayReviewCount = Math.max(0, Number(newerTodayState.todayReviewCount) || 0);\n    merged.goalCelebrated = Boolean(newerTodayState.goalCelebrated);';
  assert(sync.includes(old),'Daily counter merge block changed; refusing unsafe replacement');
  sync=sync.replace(old,next);fs.writeFileSync(path,sync);
};

if(stage==='p0-3'){patchRecallCleanup();patchEducationTestApi()}
if(stage==='p0-4'){patchInitializationSharing()}
if(stage==='p1-3'){patchDailyCounterMerge()}
if(stage.startsWith('p0-1-p0-2')){
  patchRecallCleanup();
  if(stage==='p0-1-p0-2-p0-loader'){
    const indexPath='index.html';
    let index=fs.readFileSync(indexPath,'utf8');
    const anchor='<script src="./v1.4-education-ui.js"></script>';
    assert(index.includes(anchor),'Education UI script anchor missing');
    if(!index.includes('<script src="./v1.5-p0.js"></script>')) index=index.replace(anchor,anchor+'\n<script src="./v1.5-p0.js"></script>');
    fs.writeFileSync(indexPath,index);
  }
}
const verifyIndex=fs.readFileSync('index.html','utf8');
const verifyUi=fs.readFileSync('v1.2-enhancements.js','utf8');
assert(!verifyIndex.includes('v1.2-recall-result-fix'),'Duplicate recall-result implementation remains');
assert(!verifyIndex.includes('setInterval(paint, 500)'),'500ms recall polling remains');
assert(!verifyIndex.includes('observer.observe(document.body, {childList:true,subtree:true})'),'Global recall body observer remains');
assert(!verifyUi.includes('observer.observe(document.body, { childList: true, subtree: true })'),'Global enhancement body observer remains');
assert(verifyUi.includes('document.getElementById("studyPanel") || document.getElementById("study")'),'Targeted enhancement observer missing');
assert(verifyIndex.includes('<script src="./v1.5-p0.js"></script>'),'v1.5 P0 runtime loader missing');
if(stage==='p0-3'){
  const edu=fs.readFileSync('v1.4-education-ui.js','utf8');
  assert(edu.includes('__KANJI5_EDU_UI_API__'),'Behavioral Education test API missing');
  assert(edu.includes('function handleChoice(t)'),'Behavioral Production handler API missing');
}
if(stage==='p0-4'){
  assert(verifyIndex.includes('const prefetched=window.__KANJI5_P0_DATA_PROMISE'),'Main dataset loader does not consume shared P0 promise');
  assert(verifyIndex.includes('const shared=window.__KANJI5_P0_FSRS_PROMISE'),'Main FSRS loader does not consume shared P0 promise');
  assert(verifyIndex.includes('const res=await fetch(DATA_URL,{cache:"force-cache"})'),'Dataset network fallback disappeared');
  assert(verifyIndex.includes('):import(FSRS_URL)'),'FSRS fallback import disappeared');
}
if(stage==='p1-3'){
  const sync=fs.readFileSync('supabase-sync.js','utf8');
  assert(sync.includes('const useLocalToday = localToday >= remoteToday;'),'Daily merge date selection missing');
  assert(sync.includes('const newerTodayState = useLocalToday ? local : remote;'),'Daily counters are not tied to the newer date');
  assert(sync.includes('Number(newerTodayState.todayNew)'),'Daily new counter still merges across dates');
  assert(sync.includes('Number(newerTodayState.todayReviewCount)'),'Daily review counter still merges across dates');
  assert(sync.includes('Boolean(newerTodayState.goalCelebrated)'),'Goal celebration is not scoped to newer date');
}
console.log(`Maintenance ${stage} passed.`);
