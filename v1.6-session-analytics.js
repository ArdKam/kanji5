(()=>{
'use strict';
if(window.__KANJI5_V16_SESSION_ANALYTICS__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
window.__KANJI5_V16_SESSION_ANALYTICS__=true;
const MODES=['meaning','reading','production','vocabulary','context'];
const LABELS={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
const fa=v=>Number(v||0).toLocaleString('fa-IR');
const pct=v=>`${Math.round(Math.max(0,Math.min(100,Number(v)||0)))}٪`;
const signedPct=v=>{const n=Math.round(Number(v)||0);return`${n>=0?'+':''}${n}٪`};
function normalize(s){const a=Math.max(0,Number(s?.attempts)||0),c=Math.min(a,Math.max(0,Number(s?.correct)||0));return{attempts:a,correct:c,accuracy:a?c/a*100:0}}
function sessions(){return(state.readSessionHistory?.()||[]).filter(x=>x&&x.status!=='active'&&x.endedAt).slice(-7)}
function aggregate(rows){const out={};for(const m of MODES)out[m]=normalize();for(const row of rows)for(const m of MODES){const s=normalize(row.modeResults?.[m]);out[m].attempts+=s.attempts;out[m].correct+=s.correct}for(const m of MODES)out[m].accuracy=out[m].attempts?out[m].correct/out[m].attempts*100:0;return out}
function render(){
  const host=document.getElementById('v16Session');if(!host)return;
  let box=document.getElementById('v16SessionAnalytics');
  if(!box){
    box=document.createElement('section');box.id='v16SessionAnalytics';
    box.style.cssText='margin-top:17px;padding:13px;border:1px solid var(--line,#e5e7eb);border-radius:14px;background:#fff';
    (document.getElementById('v16History')?.parentElement||host).appendChild(box)
  }
  const rows=sessions();
  box.replaceChildren();
  if(!rows.length){
    const title=document.createElement('h3');title.textContent='روند عملکرد';title.style.cssText='font-size:13px;margin:0 0 7px';
    const copy=document.createElement('div');copy.textContent='پس از پایان اولین جلسه، روند عملکرد اینجا نمایش داده می‌شود.';copy.style.cssText='font-size:12px;color:var(--muted,#6b7280)';
    box.append(title,copy);return
  }
  const totalReviews=rows.reduce((n,x)=>n+(Number(x.reviews)||0),0);
  const latest=aggregate(rows.slice(-3)),previous=aggregate(rows.slice(-6,-3));
  const trend=Object.values(latest).reduce((n,s)=>n+s.attempts,0);
  const prior=Object.values(previous).reduce((n,s)=>n+s.attempts,0);
  const latestRate=trend?Object.values(latest).reduce((n,s)=>n+s.correct,0)/trend*100:0;
  const priorRate=prior?Object.values(previous).reduce((n,s)=>n+s.correct,0)/prior*100:latestRate;
  const delta=latestRate-priorRate;
  const best=MODES.map(m=>({m,s:latest[m]})).filter(x=>x.s.attempts).sort((a,b)=>b.s.accuracy-a.s.accuracy)[0];
  const weak=MODES.map(m=>({m,s:latest[m]})).filter(x=>x.s.attempts).sort((a,b)=>a.s.accuracy-b.s.accuracy)[0];

  const title=document.createElement('h3');title.textContent='روند عملکرد (۷ جلسهٔ اخیر)';title.style.cssText='font-size:13px;margin:0 0 8px';
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:9px';
  const stat=(value,label)=>{const cell=document.createElement('div');const strong=document.createElement('strong');strong.textContent=value;strong.style.fontSize='17px';const sub=document.createElement('div');sub.textContent=label;sub.style.cssText='font-size:11px;color:var(--muted,#6b7280)';cell.append(strong,sub);return cell};
  grid.append(stat(fa(rows.length),'جلسه'),stat(fa(totalReviews),'مرور FSRS'),stat(signedPct(delta),'تغییر دقت'));

  const modeGrid=document.createElement('div');modeGrid.style.cssText='display:grid;grid-template-columns:repeat(2,1fr);gap:6px';
  MODES.forEach(mode=>{const span=document.createElement('span');const st=latest[mode];span.textContent=LABELS[mode]+': '+(st.attempts?fa(st.correct)+'/'+fa(st.attempts)+' · '+pct(st.accuracy):'—');modeGrid.append(span)});
  const summary=document.createElement('div');summary.textContent='قوی‌ترین: '+(best?LABELS[best.m]:'—')+' · نیازمند توجه: '+(weak?LABELS[weak.m]:'—');summary.style.cssText='margin-top:8px;font-size:11px;color:#4b5563';
  box.append(title,grid,modeGrid,summary)
}
render();
document.addEventListener('kanji5:v1.6-education-result',render);
document.addEventListener('kanji5:v1.6-session-finished',()=>setTimeout(render,0));
})();
