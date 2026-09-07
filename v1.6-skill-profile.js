(()=>{
'use strict';
if(window.__KANJI5_V16_SKILL_PROFILE__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
const MODES=['meaning','reading','production','vocabulary','context'];
const LABELS={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
const KEY='v16SkillProfile',SCHEMA=1,RECENT_WINDOW=3;
function norm(v){const a=Math.max(0,Number(v?.attempts)||0),c=Math.min(a,Math.max(0,Number(v?.correct)||0));return{attempts:a,correct:c,accuracy:a?c/a*100:0,mastery:(c+1)/(a+2)}}
function completed(){return(state.readSessionHistory?.()||[]).filter(x=>x&&!x.status&&x.endedAt&&x.modeResults).slice().sort((a,b)=>Date.parse(a.endedAt)-Date.parse(b.endedAt))}
function aggregate(rows){const out={};for(const m of MODES)out[m]={attempts:0,correct:0};for(const row of rows)for(const m of MODES){const s=norm(row.modeResults?.[m]);out[m].attempts+=s.attempts;out[m].correct+=s.correct}for(const m of MODES)out[m]=norm(out[m]);return out}
function aggregateRecent(rows){return aggregate(rows.slice(-RECENT_WINDOW))}
function buildProfile(rows){const all=aggregate(rows),recent=aggregateRecent(rows),skills={};for(const m of MODES){const base=all[m],window=recent[m],momentum=base.attempts&&window.attempts?Math.max(-1,Math.min(1,(window.accuracy-base.accuracy)/100)):0;skills[m]={...base,recentAttempts:window.attempts,recentCorrect:window.correct,recentAccuracy:window.accuracy,momentum}}return{schemaVersion:SCHEMA,updatedAt:new Date().toISOString(),sessions:rows.length,skills}}
function read(){const components=state.readComponents?.()||{};const p=components[KEY];return p&&Number(p.schemaVersion)===SCHEMA?p:null}
let fingerprint='';
function publish(p){window.__KANJI5_V16_PROFILE_PRIOR__=p?Object.freeze({schemaVersion:p.schemaVersion,sessions:p.sessions,skills:Object.freeze({...p.skills})}):null}
function update(){const rows=completed();if(!rows.length){publish(null);render();return false}const source=rows.map(x=>`${x.sessionId||''}:${x.endedAt||''}:${JSON.stringify(x.modeResults||{})}`).join('|');if(source===fingerprint){publish(read());render();return true}fingerprint=source;const components=state.readComponents?.()||{};const next=buildProfile(rows);const ok=Boolean(state.writeComponents?.({...components,[KEY]:next}));publish(next);render();return ok}
function rank(){const p=read();return p?MODES.map(mode=>({mode,label:LABELS[mode],...norm(p.skills?.[mode]),recentAccuracy:Number(p.skills?.[mode]?.recentAccuracy)||0,momentum:Number(p.skills?.[mode]?.momentum)||0})).sort((a,b)=>a.accuracy-b.accuracy||a.momentum-b.momentum||b.attempts-a.attempts):[]}
function render(){const host=document.getElementById('v16Session');if(!host)return;let box=document.getElementById('v16SkillProfile');if(!box){box=document.createElement('section');box.id='v16SkillProfile';box.style.cssText='margin-top:12px;padding:12px;border:1px solid var(--line,#e5e7eb);border-radius:14px;background:#fff';host.appendChild(box)}const p=read(),rows=rank();if(!p||!p.sessions){box.innerHTML='<strong style="font-size:13px">پروفایل مهارت بلندمدت</strong><div style="font-size:12px;color:var(--muted,#6b7280);margin-top:5px">پس از اولین جلسهٔ کامل، سابقهٔ مهارت‌ها ذخیره می‌شود.</div>';return}const weak=rows.find(x=>x.attempts),strong=[...rows].reverse().find(x=>x.attempts);const trendLabel=v=>v>0.03?'بهتر':v<-0.03?'ضعیف‌تر':'پایدار';box.innerHTML=`<strong style="font-size:13px">پروفایل مهارت بلندمدت</strong><div style="font-size:11px;color:var(--muted,#6b7280);margin:4px 0 8px">بر اساس ${p.sessions.toLocaleString('fa-IR')} جلسهٔ کامل · روند ۳ جلسهٔ اخیر</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px">${rows.map(x=>`<span>${x.label}: ${x.attempts?`${Math.round(x.accuracy).toLocaleString('fa-IR')}٪ · اخیر ${Math.round(x.recentAccuracy).toLocaleString('fa-IR')}٪ · ${trendLabel(x.momentum)}`:'—'}`).join('')}</div><div style="margin-top:8px;font-size:11px;color:#4b5563">نیازمند توجه: ${weak?.label||'—'} · قوی‌ترین: ${strong?.label||'—'}</div>`}
const api=Object.freeze({read,update,rank});
window.__KANJI5_V16_SKILL_PROFILE__=api;
publish(read());
update();
document.addEventListener('kanji5:v1.6-session-finished',()=>setTimeout(update,0));
document.addEventListener('kanji5:v1.6-education-result',()=>{publish(read())});
})();
