(()=>{
'use strict';
if(window.__KANJI5_V15_PRODUCTION_MCQ__)return;
window.__KANJI5_V15_PRODUCTION_MCQ__=true;
const CORE=window.__KANJI5_EDU_CORE__;
const $=(s,r=document)=>r.querySelector(s);
const deck=()=>Array.isArray(window.__KANJI5_P0_DATA)?window.__KANJI5_P0_DATA:[];
const norm=v=>String(v??'').trim().toLowerCase().normalize('NFKC').replace(/[\s\u3000]+/g,'');
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function findTarget(input){
 const wrap=input?.closest('.v14-edu-wrap');
 if(!wrap)return null;
 const texts=[...wrap.querySelectorAll('div')].map(x=>String(x.textContent||'').trim()).filter(Boolean);
 for(const item of deck())for(const meaning of item.meaning||[]){const target=norm(meaning);if(texts.some(t=>t.split(' · ').map(norm).includes(target)))return item;}
 return null;
}
function renderChoices(input,target){
 if(!CORE||!target)return false;
 const history={};
 const choices=[target,...(CORE.chooseDistractors?.(target,deck(),history,3)||[])].filter(Boolean);
 const unique=[];const seen=new Set();
 for(const c of choices){if(!c.character||seen.has(c.character))continue;seen.add(c.character);unique.push(c);if(unique.length===4)break;}
 if(unique.length<4)return false;
 input.type='hidden';input.setAttribute('aria-hidden','true');input.tabIndex=-1;
 const prompt=input.closest('.v14-edu-wrap')?.querySelector('.v14-edu-prompt');
 if(prompt)prompt.textContent='برای معنی زیر، کانجی مناسب را انتخاب کن.';
 const grid=document.createElement('div');grid.className='v14-edu-grid v15-production-grid';
 grid.innerHTML=unique.map(c=>`<button type="button" class="secondary v15-production-choice" data-v15-production="${esc(c.character)}">${esc(c.character)}</button>`).join('');
 input.parentNode?.insertBefore(grid,input);input.style.display='none';input.dataset.v15Replaced='1';
 return true;
}
function upgrade(){
 const input=$('#v14EduProductionInput');
 if(!input||input.dataset.v15Replaced==='1')return;
 const target=findTarget(input);if(!target)return;
 renderChoices(input,target);
}
function choose(e){
 const b=e.target?.closest?.('[data-v15-production]');
 if(!b)return;
 const input=$('#v14EduProductionInput');if(!input)return;
 input.value=b.dataset.v15Production||'';
 document.querySelector('#v14EduSubmit')?.click();
}
const obs=new MutationObserver(upgrade);
function start(){obs.observe(document.body,{subtree:true,childList:true});upgrade();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
document.addEventListener('click',choose,true);
})();
