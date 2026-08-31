(()=>{
'use strict';
if(window.__KANJI5_SMART_DISTRACTORS__)return;
window.__KANJI5_SMART_DISTRACTORS__=true;
const KNOW='kanji5-v1.2-knowledge';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const norm=v=>String(v??'').toLowerCase().normalize('NFKC').replace(/[\s\u3000._-]+/g,'');
const meaningTokens=v=>String(v??'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>1);
function deck(){return Array.isArray(window.__KANJI5_P0_DATA)?window.__KANJI5_P0_DATA:[]}
function knowledge(){try{return JSON.parse(localStorage.getItem(KNOW)||'{}')}catch(_){return{}}}
function mastery(ch){const n=knowledge()[ch]||{};let a=0,c=0;for(const k of ['production','vocabulary','context']){if(n[k]){a+=n[k].attempts||0;c+=n[k].correct||0}}return(a?c/a:.5)}
function featureScore(target,c){
 const tr=new Set([...(target.on||[]),...(target.kun||[])].map(norm).filter(Boolean));
 const cr=new Set([...(c.on||[]),...(c.kun||[])].map(norm).filter(Boolean));
 const sharedReading=[...tr].some(x=>cr.has(x));
 const tm=new Set((target.meaning||[]).flatMap(meaningTokens));
 const cm=new Set((c.meaning||[]).flatMap(meaningTokens));
 const sharedMeaning=[...tm].filter(x=>cm.has(x)).length;
 const meaningScore=tm.size&&cm.size?sharedMeaning/Math.max(1,Math.min(tm.size,cm.size)):0;
 const strokeDiff=Math.abs(Number(target.strokes||0)-Number(c.strokes||0));
 const strokeScore=Math.max(0,1-strokeDiff/8);
 const gradeScore=target.grade&&c.grade&&target.grade===c.grade?1:0;
 const freqA=Number(target.frequency||0),freqB=Number(c.frequency||0);
 const freqScore=freqA&&freqB?Math.max(0,1-Math.abs(Math.log(freqA/freqB))/4):0;
 return(sharedReading?4:0)+meaningScore*3+strokeScore*1.2+gradeScore*.45+freqScore*.25;
}
function pastMistakes(ch){const n=knowledge()[ch];const ds=n?.distractors||{};return Object.entries(ds).sort((a,b)=>(b[1]||0)-(a[1]||0)).map(([x])=>x)}
function ranked(target,pool){const past=pastMistakes(target.character);const rank=new Map(past.map((x,i)=>[x,100-i]));const scored=pool.map(c=>({c,score:featureScore(target,c)+(rank.get(c.character)||0)}));scored.sort((a,b)=>b.score-a.score);return scored}
function choose(target,pool){
 const rankedPool=ranked(target,pool),m=mastery(target.character),out=[];
 const top=[...rankedPool];
 if(top.length){out.push(top.shift().c)}
 const midStart=m<.7?Math.min(4,Math.floor(rankedPool.length/3)):0;
 while(top.length&&out.length<3){let idx=midStart; if(idx>=top.length)idx=0;out.push(top.splice(idx,1)[0].c)}
 return out;
}
function recordMistake(target,wrong){if(!target||!wrong||wrong===target)return;const all=knowledge(),n=all[target]||{},d=n.distractors||{};d[wrong]=(d[wrong]||0)+1;n.distractors=d;all[target]=n;try{localStorage.setItem(KNOW,JSON.stringify(all))}catch(_){} }
function enhance(gate){
 const prompt=$('.v13-p1-prompt',gate),grid=$('.v13-choice-grid',gate);if(!prompt||!grid)return;
 const text=prompt.textContent||'';
 if(!/انتخاب کن/.test(text))return;
 const el=$('.kanji'),ch=el?.textContent?.trim();if(!ch||grid.dataset.smart==='1')return;
 const d=deck(),target=d.find(x=>x.character===ch);if(!target)return;
 let pool=d.filter(x=>x.character&&x.character!==ch);
 const picks=choose(target,pool);
 if(picks.length<3)return;
 const choices=[target,...picks].sort(()=>Math.random()-.5);
 grid.innerHTML=choices.map(c=>`<button type="button" class="secondary v13-edu-choice" data-choice="${c.character}">${c.character}</button>`).join('');
 grid.dataset.smart='1';
 $$('.v13-edu-choice',grid).forEach(b=>b.addEventListener('click',()=>recordMistake(ch,b.dataset.choice===ch?'':b.dataset.choice),{capture:true}));
}
const observer=new MutationObserver(()=>{const gate=$('.v13-p1-gate');if(gate)enhance(gate)});
observer.observe(document.body,{childList:true,subtree:true});
})();
