(()=>{
'use strict';

function button({label,className='v2-btn',id,type='button',disabled=false,ariaLabel,onClick}={}){
  const el=document.createElement('button');
  el.type=type; if(id)el.id=id; el.className=className; el.textContent=String(label??''); el.disabled=Boolean(disabled);
  if(ariaLabel)el.setAttribute('aria-label',ariaLabel); if(onClick)el.addEventListener('click',onClick); return el;
}
function card({className='v2-card',tag='section'}={}){const el=document.createElement(tag);el.className=className;return el;}
function badge(label,className='v2-mode-badge'){const el=document.createElement('span');el.className=className;el.textContent=String(label??'');return el;}
function progress(value,{label='پیشرفت',className='v2-progress'}={}){const wrap=document.createElement('div');wrap.className=className;wrap.setAttribute('role','progressbar');wrap.setAttribute('aria-label',label);wrap.setAttribute('aria-valuemin','0');wrap.setAttribute('aria-valuemax','100');const pct=Math.max(0,Math.min(100,Number(value)||0));wrap.setAttribute('aria-valuenow',String(Math.round(pct)));const fill=document.createElement('div');fill.className='v2-progress-fill';fill.style.width=pct+'%';wrap.appendChild(fill);return wrap;}
function stat(label,value,kind='default'){const el=card({className:'v2-daily-stat v2-daily-stat-'+kind});const number=document.createElement('strong');number.className='v2-daily-stat-value';number.textContent=String(value??'—');const caption=document.createElement('span');caption.textContent=String(label??'');el.append(number,caption);return el;}
function kanji(value,className='v2-learning-kanji'){const el=document.createElement('div');el.className=className;el.lang='ja';el.textContent=String(value??'');return el;}
function choice(label,{className='v2-btn v2-production-choice',onClick}={}){return button({label,className,onClick});}
function empty(message='فعلاً چیزی برای نمایش نیست.'){const el=card({className:'v2-empty-state'});el.textContent=message;return el;}
window.__KANJI5_V2_COMPONENTS__=Object.freeze({button,card,badge,progress,stat,kanji,choice,empty});
})();
