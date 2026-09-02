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

if(stage==='p0-3'){
  patchRecallCleanup();
  patchEducationTestApi();
}
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
console.log(`Maintenance ${stage} passed.`);
