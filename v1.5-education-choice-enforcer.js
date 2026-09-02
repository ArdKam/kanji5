(()=>{
'use strict';
if(window.__KANJI5_V15_CHOICE_ENFORCER__)return;
window.__KANJI5_V15_CHOICE_ENFORCER__=true;
const root=()=>document.querySelector('#v14EducationPane');
const makeChoices=target=>{
  const core=window.__KANJI5_EDU_CORE__;
  const deck=Array.isArray(window.__KANJI5_P0_DATA)?window.__KANJI5_P0_DATA:[];
  if(!target||!deck.length)return[];
  const history=(()=>{try{return JSON.parse(localStorage.getItem('kanji5-v1.2-knowledge')||'{}')[target.character]?.distractors||{}}catch(_){return{}}})();
  const ranked=core?.chooseDistractors?core.chooseDistractors(target,deck,history,3):deck.filter(x=>x?.character&&x.character!==target.character).slice(0,3);
  const result=[target,...ranked.filter(x=>x?.character&&x.character!==target.character)];
  const seen=new Set(result.map(x=>x.character));
  for(const item of deck){if(result.length>=4)break;if(item?.character&&!seen.has(item.character)){seen.add(item.character);result.push(item)}}
  return result.slice(0,4).sort(()=>Math.random()-.5);
};
function enforce(){
  const pane=root();
  const input=pane?.querySelector('#v14EduProductionInput');
  if(!pane||!input||input.dataset.v15ChoiceEnforced==='1')return;
  const wrap=input.closest('.v14-edu-wrap');
  if(!wrap)return;
  const prompt=wrap.querySelector('.v14-edu-prompt');
  const text=String(prompt?.textContent||'').trim();
  if(!text)return;
  const deck=Array.isArray(window.__KANJI5_P0_DATA)?window.__KANJI5_P0_DATA:[];
  const target=deck.find(item=>Array.isArray(item?.meaning)&&item.meaning.some(meaning=>text.includes(String(meaning))));
  if(!target)return;
  const choices=makeChoices(target);
  if(choices.length<4)return;
  input.type='hidden';
  input.setAttribute('aria-hidden','true');
  input.tabIndex=-1;
  input.style.display='none';
  input.dataset.v15ChoiceEnforced='1';
  if(prompt)prompt.textContent='برای معنی زیر، کانجی مناسب را انتخاب کن.';
  const oldSubmit=wrap.querySelector('#v14EduSubmit');
  if(oldSubmit)oldSubmit.remove();
  const grid=document.createElement('div');
  grid.className='v14-edu-grid v15-production-choice-grid';
  grid.setAttribute('role','group');
  grid.setAttribute('aria-label','انتخاب کانجی');
  for(const choice of choices){
    const button=document.createElement('button');
    button.type='button';
    button.className='secondary v14-edu-choice v15-production-choice';
    button.dataset.v15Production=choice.character;
    button.textContent=choice.character;
    grid.appendChild(button);
  }
  input.parentNode.insertBefore(grid,input);
  wrap.dataset.v15ProductionTarget=target.character;
}
const observe=()=>{const pane=root();if(!pane)return false;const observer=new MutationObserver(enforce);observer.observe(pane,{childList:true,subtree:true});enforce();return true};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
setTimeout(enforce,50);setTimeout(enforce,250);setTimeout(enforce,1000);
})();
