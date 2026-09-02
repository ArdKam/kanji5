import fs from 'node:fs';

const stage=fs.readFileSync('scripts/v1.5-maintenance-stage.txt','utf8').trim();
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

if(stage==='p0-1-p0-2'){
  const indexPath='index.html';
  let index=fs.readFileSync(indexPath,'utf8');
  const duplicate=/<script id="v1\\.2-recall-result-fix">[\\s\\S]*?<\\/script>/;
  assert(duplicate.test(index),'Duplicate recall-result implementation not found');
  index=index.replace(duplicate,'');
  fs.writeFileSync(indexPath,index);

  const uiPath='v1.2-enhancements.js';
  let ui=fs.readFileSync(uiPath,'utf8');
  const globalObserver=/  const observer = new MutationObserver\(\(\) => \{\n    const answerBox = \$\("#answerBox"\);\n    if \(answerBox\?\.classList\.contains\("show"\)\) setupProgressiveReveal\(\);\n  \}\);\n  observer\.observe\(document\.body, \{ childList: true, subtree: true \}\);/;
  assert(globalObserver.test(ui),'Global body observer not found in v1.2-enhancements.js');
  ui=ui.replace(globalObserver,`  const observer = new MutationObserver(() => {
    const answerBox = $("#answerBox");
    if (answerBox?.classList.contains("show")) setupProgressiveReveal();
  });
  const studyRoot = document.getElementById("studyPanel") || document.getElementById("study");
  if (studyRoot) observer.observe(studyRoot, { childList: true, subtree: true });`);
  fs.writeFileSync(uiPath,ui);

  const verifyIndex=fs.readFileSync(indexPath,'utf8');
  const verifyUi=fs.readFileSync(uiPath,'utf8');
  assert(!verifyIndex.includes('v1.2-recall-result-fix'),'Duplicate recall-result implementation remains');
  assert(!verifyIndex.includes('setInterval(paint, 500)'),'500ms recall polling remains');
  assert(!verifyIndex.includes('observer.observe(document.body, {childList:true,subtree:true})'),'Global recall body observer remains');
  assert(!verifyUi.includes('observer.observe(document.body, { childList: true, subtree: true })'),'Global enhancement body observer remains');
  assert(verifyUi.includes('document.getElementById("studyPanel") || document.getElementById("study")'),'Targeted enhancement observer missing');
  console.log('P0-1/P0-2 maintenance patch passed.');
}else{
  console.log(`No maintenance action for stage: ${stage}`);
}
