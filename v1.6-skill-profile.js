(()=>{
'use strict';
if(window.__KANJI5_V16_SKILL_PROFILE__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
const MODES=['meaning','reading','production','vocabulary','context'];
const LABELS={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
const KEY='v16SkillProfile',SCHEMA=1;
function norm(v){const a=Math.max(0,Number(v?.attempts)||0),c=Math.min(a,Math.max(0,Number(v?.correct)||0));return{attempts:a,correct:c,accuracy:a?c/a*100:0,mastery:(c+1)/(a+2)}}
function completed(){return(state.readSessionHistory?.()||[]).filter(x=>x&&!x.status&&x.endedAt&&x.modeResults)}
function aggregate(rows){const out={};for(const m of MODES)out[m]={attempts:0,correct:0};for(const row of rows)for(const m of MODES){const s=norm(row.modeResults?.[m]);out[m].attempts+=s.attempts;out[m].correct+=s.correct}for(const m of MODES)out[m]=norm(out[m]);return out}
function read(){const components=state.readComponents?.()||{};const p=components[KEY];return p&&Number(p.schemaVersion)===SCHEMA?p:null}
let fingerprint='';
function update(){const rows=completed();if(!rows.length){render();return false}const source=rows.map(x=>`${x.sessionId||''}:${x.endedAt||''}:${JSON.stringify(x.modeResults||{})}`).join('|');if(source===fingerprint){render();return true}fingerprint=source;const components=state.readComponents?.()||{};const next={schemaVersion:SCHEMA,updatedAt:new Date().toISOString(),sessions:rows.length,skills:aggregate(rows)};const ok=Boolean(state.writeComponents?.({...components,[KEY]:next}));render();return ok}
function rank(){const p=read();return p?MODES.map(mode=>({mode,label:LABELS[mode],...norm(p.skills?.[mode])})).sort((a,b)=>a.accuracy-b.accuracy||b.attempts-a.attempts):[]}
function render(){const host=document.getElementById('v16Session');if(!host)return;let box=document.getElementById('v16SkillProfile');if(!box){box=document.createElement('section');box.id='v16SkillProfile';box.style.cssText='margin-top:12px;padding:12px;border:1px solid var(--line,#e5e7eb);border-radius:14px;background:#fff';host.appendChild(box)}const p=read(),rows=rank();if(!p||!p.sessions){box.innerHTML='<strong style="font-size:13px">پروفایل مهارت بلندمدت</strong><div style="font-size:12px;color:var(--muted,#6b7280);margin-top:5px">پس از اولین جلسهٔ کامل، سابقهٔ مهارت‌ها ذخیره می‌شود.</div>';return}const weak=rows.find(x=>x.attempts),strong=[...rows].reverse().find(x=>x.attempts);box.innerHTML=`<strong style="font-size:13px">پروفایل مهارت بلندمدت</strong><div style="font-size:11px;color:var(--muted,#6b7280);margin:4px 0 8px">بر اساس ${p.sessions.toLocaleString('fa-IR')} جلسهٔ کامل</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px">${rows.map(x=>`<span>${x.label}: ${x.attempts?`${Math.round(x.accuracy).toLocaleString('fa-IR')}٪ · ${x.attempts.toLocaleString('fa-IR')} تلاش`:'—'}</span>`).join('')}</div><div style="margin-top:8px;font-size:11px;color:#4b5563">نیازمند توجه: ${weak?.label||'—'} · قوی‌ترین: ${strong?.label||'—'}</div>`}
const api=Object.freeze({read,update,rank});
window.__KANJI5_V16_SKILL_PROFILE__=api;
update();render();setInterval(()=>{update();render()},1000);
})();
