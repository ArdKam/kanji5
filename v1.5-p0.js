(() => {
  "use strict";

  if (window.__KANJI5_V15_P0__) return;
  window.__KANJI5_V15_P0__ = true;

  const KNOW_KEY = "kanji5-v1.2-knowledge";
  const COMPONENT_KEY = "kanji5-v1.5-components";
  const $ = (selector, root = document) => root.querySelector(selector);

  function readJSON(key, fallback) { try { const raw=localStorage.getItem(key); if(!raw)return fallback; const value=JSON.parse(raw); return value&&typeof value==="object"?value:fallback; } catch(_){ return fallback; } }
  function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_) {}}
  function normalize(value){return String(value==null?"":value).trim().toLowerCase().normalize("NFKC").replace(/[\s\u3000]+/g,"");}
  function getDeck(){return Array.isArray(window.__KANJI5_P0_DATA)?window.__KANJI5_P0_DATA:[];}

  function ensureComponentEntry(character){
    const all=readJSON(COMPONENT_KEY,{});
    if(!all[character]||typeof all[character]!=="object")all[character]={meaning:{},reading:{},updatedAt:null};
    if(!all[character].meaning||typeof all[character].meaning!=="object")all[character].meaning={};
    if(!all[character].reading||typeof all[character].reading!=="object")all[character].reading={};
    return all;
  }
  function componentAccuracy(stats){const attempts=Math.max(0,Number(stats?.attempts)||0),correct=Math.min(attempts,Math.max(0,Number(stats?.correct)||0));return attempts?(correct+1)/(attempts+2):0;}
  function getFocusComponent(character,mode){
    const item=getDeck().find(entry=>entry&&entry.character===character); if(!item)return null;
    const state=ensureComponentEntry(character)[character][mode];
    const values=mode==="reading"?[...(item.on||[]),...(item.kun||[])]:[...(item.meaning||[])];
    const candidates=values.map(raw=>({raw,key:normalize(raw),accuracy:componentAccuracy(state[normalize(raw)]||{})}));
    candidates.sort((a,b)=>a.accuracy-b.accuracy); return candidates[0]||null;
  }
  function gradeFocusedRecall(mode,answer,focus){const core=window.__KANJI5_EDU_CORE__;if(!core||!focus)return false;return mode==="reading"?Boolean(core.gradeReading(answer,[focus]).correct):Boolean(core.gradeMeaning(answer,[focus]).correct);}
  function recordFocusedRecall(character,mode,focus,correct){
    const all=ensureComponentEntry(character),bucket=all[character][mode],key=normalize(focus),stats=bucket[key]||{attempts:0,correct:0,lastAt:null};
    stats.attempts+=1;if(correct)stats.correct+=1;stats.lastAt=new Date().toISOString();bucket[key]=stats;all[character].updatedAt=stats.lastAt;writeJSON(COMPONENT_KEY,all);
  }
  function enhanceRecall(){
    const gate=$(".v12-recall-gate"),kanji=$(".kanji");if(!gate||!kanji)return;
    const character=String(kanji.textContent||"").trim();if(!character||gate.dataset.v15Ready===character)return;
    const mode=String(gate.textContent||"").includes("خوانش")?"reading":"meaning",focus=getFocusComponent(character,mode);
    gate.dataset.v15Ready=character;gate.dataset.v15Mode=mode;if(!focus)return;gate.dataset.v15Focus=focus.raw;
    const prompt=[...gate.querySelectorAll("div")].find(node=>{const text=String(node.textContent||"").trim();return text.includes("معنی این کانجی")||text.includes("حداقل یک خوانش");});
    if(prompt)prompt.textContent=mode==="meaning"?`معنی هدف: «${focus.raw}» — سعی کن همین معنی را از حافظه به یاد بیاوری.`:`خوانش هدف: «${focus.raw}» — سعی کن همین خوانش را از حافظه به یاد بیاوری.`;
  }
  function recordRecall(event){
    const gate=event.target?.closest?.(".v12-recall-gate"),button=event.target?.closest?.("button");if(!gate||!button||button.id==="v15DontKnowRecall")return;
    const kanji=$(".kanji"),input=gate.querySelector("input,textarea");if(!kanji||!input)return;
    const character=String(kanji.textContent||"").trim(),answer=String(input.value||"").trim(),mode=gate.dataset.v15Mode||"meaning",focus=gate.dataset.v15Focus||"";
    if(!character||!answer||!focus)return;recordFocusedRecall(character,mode,focus,gradeFocusedRecall(mode,answer,focus));
  }
  function addDontKnowRecall(){
    const gate=$(".v12-recall-gate");if(!gate||$("#v15DontKnowRecall",gate))return;
    const input=gate.querySelector("input,textarea");if(!input)return;
    const button=document.createElement("button");button.type="button";button.id="v15DontKnowRecall";button.className="secondary";button.textContent="نمی‌دانم";
    button.addEventListener("click",()=>{
      const answer=gate.querySelector(".answer");
      if(answer)answer.classList.add("show");
      gate.querySelector(".reveal")?.click();
      const result=gate.querySelector(".v12-recall-result");
      if(result){result.className="v12-recall-result unknown";result.textContent="این مورد را نمی‌دانستم";}
      gate.dataset.v15DontKnow="1";
    });
    input.parentElement?.appendChild(button);
  }

  function getProductionTarget(input){
    const wrap=input?.closest?.(".v14-edu-wrap");if(!wrap)return null;
    const cached=wrap.dataset.v15Target;if(cached)return getDeck().find(item=>item?.character===cached)||null;
    const prompt=$(".v14-edu-prompt",wrap),text=String(prompt?.textContent||"").trim();if(!text)return null;
    const normalizedPrompt=normalize(text),target=getDeck().find(item=>Array.isArray(item?.meaning)&&item.meaning.some(meaning=>normalizedPrompt.includes(normalize(meaning))));
    if(target)wrap.dataset.v15Target=target.character;return target||null;
  }
  function getProductionChoices(target){
    const core=window.__KANJI5_EDU_CORE__,history=readJSON(KNOW_KEY,{})[target.character],distractorHistory=history?.distractors||{},candidates=[target];
    if(core&&typeof core.chooseDistractors==="function")candidates.push(...core.chooseDistractors(target,getDeck(),distractorHistory,6));
    const result=[],seen=new Set();
    for(const candidate of candidates){if(!candidate?.character||seen.has(candidate.character))continue;seen.add(candidate.character);result.push(candidate);if(result.length===4)return result;}
    for(const candidate of getDeck()){if(!candidate?.character||seen.has(candidate.character))continue;seen.add(candidate.character);result.push(candidate);if(result.length===4)return result;}
    return result;
  }
  function enhanceProduction(){
    const input=$("#v14EduProductionInput");if(!input)return;const wrap=input.closest(".v14-edu-wrap");if(!wrap||input.dataset.v15Replaced==="1"||$(".v15-production-grid",wrap))return;
    const target=getProductionTarget(input);if(!target)return;const choices=getProductionChoices(target);if(choices.length<4)return;
    const prompt=$(".v14-edu-prompt",wrap);if(prompt){prompt.textContent="برای معنی زیر، کانجی مناسب را انتخاب کن.";prompt.dataset.v15Prompt="1";}
    const submit=$("#v14EduSubmit",wrap);if(submit)submit.style.display="none";
    input.type="hidden";input.setAttribute("aria-hidden","true");input.tabIndex=-1;input.style.display="none";input.dataset.v15Replaced="1";
    const grid=document.createElement("div");grid.className="v14-edu-grid v15-production-grid";grid.setAttribute("role","group");grid.setAttribute("aria-label","انتخاب کانجی");
    for(const choice of choices){const button=document.createElement("button");button.type="button";button.className="secondary v15-production-choice";button.dataset.v15Production=choice.character;button.textContent=choice.character;grid.appendChild(button);}
    input.parentNode.insertBefore(grid,input);
  }
  function chooseProduction(event){const button=event.target?.closest?.("[data-v15-production]");if(!button)return;const input=$("#v14EduProductionInput");if(!input)return;input.value=button.dataset.v15Production||"";$("#v14EduSubmit")?.click();}

  function startTargetedObservers(){
    const studyRoot=$("#studyPanel")||$("#study")||document.body;
    const observer=new MutationObserver(()=>{enhanceRecall();addDontKnowRecall();enhanceProduction();});
    observer.observe(studyRoot,{childList:true,subtree:true});
    enhanceRecall();addDontKnowRecall();enhanceProduction();
  }
  document.addEventListener("click",recordRecall,true);
  document.addEventListener("click",chooseProduction,true);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startTargetedObservers,{once:true});else startTargetedObservers();
})();
