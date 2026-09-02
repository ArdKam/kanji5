(()=>{
'use strict';
if(window.__KANJI5_EDU_CHOICE_ONLY__)return;
window.__KANJI5_EDU_CHOICE_ONLY__=true;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const DATA=()=>Array.isArray(window.__KANJI5_P0_DATA)?window.__KANJI5_P0_DATA:[];
const norm=v=>String(v??'').trim().toLowerCase().normalize('NFKC').replace(/[\s\u3000]+/g,'');
const uniq=a=>[...new Set(a.filter(Boolean))];
function target(){return $('.v13-edu-kanji')?.textContent?.trim()||''}
function candidates(mode,item){
  const deck=DATA().filter(x=>x?.character&&x.character!==item.character);
  if(mode==='meaning'){
    const pool=[];
    for(const x of deck)for(const m of x.meaning||[])pool.push(String(m).trim());
    return uniq(pool).filter(m=>m&&m.length<45);
  }
  const pool=[];
  for(const x of deck)for(const r of [...(x.on||[]),...(x.kun||[])])pool.push(String(r).trim());
  return uniq(pool).filter(Boolean);
}
function makeOptions(mode,item){
  const correct=mode==='meaning' ? String(item.meaning?.[0]||'').trim() : String(item.on?.[0]||item.kun?.[0]||'').trim();
  if(!correct)return [];
  const all=candidates(mode,item).filter(v=>norm(v)!==norm(correct));
  const options=[correct];
  for(const v of all){
    if(!options.some(x=>norm(x)===norm(v))){options.push(v);if(options.length===4)break}
  }
  return options.length===4?options:[];
}
function transform(){
  const pane=$('#v13EducationPane');
  if(!pane||pane.hidden)return;
  const input=$('#v13EduInput',pane);
  const card=$('.v13-edu-kanji',pane)?.textContent?.trim();
  if(!input||!card||pane.dataset.choiceMode)return;
  const item=DATA().find(x=>x?.character===card);
  if(!item)return;
  const title=$('.v13-edu-title',pane)?.textContent||'';
  const mode=title.includes('Reading')||/خوانش/.test($('.v13-edu-prompt',pane)?.textContent||'')?'reading':'meaning';
  const options=makeOptions(mode,item);
  if(options.length!==4)return;
  pane.dataset.choiceMode=mode;
  const grid=document.createElement('div');
  grid.className='v13-edu-choice-only-grid';
  for(const option of options){
    const b=document.createElement('button');
    b.type='button';b.className='secondary v13-edu-choice-only';b.dataset.answer=option;b.textContent=option;
    grid.appendChild(b);
  }
  input.replaceWith(Object.assign(document.createElement('input'),{type:'hidden',id:'v13EduInput',value:''}));
  const submit=$('#v13EduSubmit',pane);if(submit)submit.hidden=true;
  const prompt=$('.v13-edu-prompt',pane);if(prompt)prompt.textContent=mode==='meaning'?'معنی این کانجی کدام است؟':'خوانش رایج این کانجی کدام است؟';
  input.remove();
  const hidden=$('#v13EduInput',pane);
  const anchor=hidden?.parentElement||pane;
  anchor.appendChild(grid);
  const actions=$('.v13-edu-actions',pane);if(actions)actions.style.display='flex';
}
function choose(button){
  const pane=button.closest('#v13EducationPane');
  const hidden=$('#v13EduInput',pane),submit=$('#v13EduSubmit',pane);
  if(!hidden||!submit||pane.dataset.choiceLocked==='1')return;
  pane.dataset.choiceLocked='1';
  $$('.v13-edu-choice-only',pane).forEach(b=>b.disabled=true);
  hidden.value=button.dataset.answer||'';
  submit.click();
}
const observer=new MutationObserver(()=>transform());
function boot(){observer.observe(document.body,{childList:true,subtree:true});transform()}
document.addEventListener('click',event=>{
  const b=event.target?.closest?.('.v13-edu-choice-only');
  if(!b)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  choose(b);
},true);
new MutationObserver(()=>{for(const pane of $$('#v13EducationPane'))if(pane.dataset.choiceLocked==='1'&&!pane.querySelector('.v13-edu-choice-only')){delete pane.dataset.choiceMode;delete pane.dataset.choiceLocked}}).observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
