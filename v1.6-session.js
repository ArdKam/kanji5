(()=>{
'use strict';
if(window.__KANJI5_V16_SESSION__)return;
const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');
window.__KANJI5_V16_SESSION__=true;
const session={startedAt:Date.now(),reviews:0,recall:0,unknown:0};
const $=(selector,root=document)=>root?.querySelector?.(selector)||null;
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const faNumber=value=>Number(value||0).toLocaleString('fa-IR');
const pct=value=>`${Math.round(Math.max(0,Math.min(100,Number(value)||0)))}%`;
function injectStyle(){
 if($('#v16-session-style'))return;
 const style=document.createElement('style'); style.id='v16-session-style';
 style.textContent=`#v16Session{margin:0 0 16px;padding:20px;background:var(--panel,#fff);border:1px solid var(--line,#e5e7eb);border-radius:22px;box-shadow:var(--shadow,0 12px 35px rgba(0,0,0,.08))}.v16-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}.v16-title{margin:0;font-size:19px;font-weight:850}.v16-sub{margin:5px 0 0;color:var(--muted,#6b7280);font-size:12px}.v16-live{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:#f3f4f6;color:#4b5563;font-size:11px;font-weight:800}.v16-dot{width:7px;height:7px;border-radius:50%;background:#16a34a}.v16-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.v16-card{background:#f9fafb;border:1px solid var(--line,#e5e7eb);border-radius:15px;padding:12px}.v16-card .n{font-size:22px;font-weight:850}.v16-card .l{font-size:11px;color:var(--muted,#6b7280);margin-top:3px}.v16-progress{height:9px;background:#eef0f2;border-radius:99px;overflow:hidden;margin:15px 0 7px}.v16-progress>div{height:100%;background:var(--accent,#111827);border-radius:99px;transition:width .25s}.v16-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:var(--muted,#6b7280)}.v16-section{margin-top:17px}.v16-section h3{font-size:13px;margin:0 0 10px}.v16-modes{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.v16-mode{padding:9px;background:#fff;border:1px solid var(--line,#e5e7eb);border-radius:12px}.v16-mode-top{display:flex;justify-content:space-between;gap:5px;font-size:11px}.v16-mode-label{color:var(--muted,#6b7280)}.v16-mode-value{font-weight:800}.v16-meter{height:6px;background:#eef0f2;border-radius:99px;overflow:hidden;margin-top:7px}.v16-meter>div{height:100%;background:#4b5563;border-radius:99px}.v16-attn{margin-top:12px;padding:11px 12px;border-radius:13px;background:#fff7ed;border:1px solid #fed7aa;font-size:12px}.v16-attn strong{display:block;margin-bottom:3px}@media(max-width:700px){#v16Session{padding:16px}.v16-grid{grid-template-columns:repeat(2,1fr)}.v16-modes{grid-template-columns:repeat(2,1fr)}}`;
 document.head.appendChild(style);
}
function ensurePanel(){
 const app=$('#app');
 if(!app||$('#v16Session'))return $('#v16Session');
 const panel=document.createElement('section'); panel.id='v16Session'; panel.setAttribute('aria-labelledby','v16SessionTitle');
 panel.innerHTML=`<div class="v16-head"><div><h2 class="v16-title" id="v16SessionTitle">جلسهٔ امروز</h2><p class="v16-sub">وضعیت مرور، جلسهٔ جاری و نقاط ضعف یادگیری</p></div><span class="v16-live"><span class="v16-dot" aria-hidden="true"></span>زنده</span></div><div class="v16-grid"><div class="v16-card"><div class="n" id="v16Due">0</div><div class="l">مرور باقی‌مانده</div></div><div class="v16-card"><div class="n" id="v16New">0</div><div class="l">کانجی جدید</div></div><div class="v16-card"><div class="n" id="v16Mastered">0</div><div class="l">یادگرفته‌شده</div></div><div class="v16-card"><div class="n" id="v16Streak">0</div><div class="l">روز پیاپی</div></div></div><div class="v16-progress" aria-label="پیشرفت هدف روزانه"><div id="v16GoalBar" style="width:0%"></div></div><div class="v16-row"><span id="v16GoalText">هدف روزانه: ۰/۰</span><span id="v16SessionText">این جلسه: ۰ مرور</span></div><div class="v16-grid" style="margin-top:10px"><div class="v16-card"><div class="n" id="v16Reviews">0</div><div class="l">مرورهای این جلسه</div></div><div class="v16-card"><div class="n" id="v16Recall">0</div><div class="l">تلاش Active Recall</div></div><div class="v16-card"><div class="n" id="v16Unknown">0</div><div class="l">نمی‌دانم</div></div><div class="v16-card"><div class="n" id="v16Duration">۰:۰۰</div><div class="l">زمان جلسه</div></div></div><div class="v16-section"><h3>وضعیت مهارت‌ها</h3><div class="v16-modes" id="v16Modes"></div><div id="v16Attention"></div></div></section>`;
 const studyPanel=$('#studyPanel'); if(studyPanel)app.insertBefore(panel,studyPanel); else app.insertBefore(panel,app.firstElementChild);
 return panel;
}
function modeStats(){
 const knowledge=state.readKnowledge()||{};
 const modes=[['meaning','معنی'],['reading','خوانش'],['production','تولید'],['vocabulary','واژگان'],['context','بافت']];
 return modes.map(([key,label])=>{let attempts=0,correct=0;for(const entry of Object.values(knowledge)){const stat=entry?.[key];if(!stat||typeof stat!=='object')continue;attempts+=Number(stat.attempts)||0;correct+=Number(stat.correct)||0}return{key,label,attempts,accuracy:attempts?correct/attempts*100:0}});
}
function update(){
 const panel=ensurePanel(); if(!panel)return;
 const read=(id)=>String($(id)?.textContent||'0').replace(/[^0-9۰-۹]/g,'');
 const due=read('#dueCount'),fresh=read('#newCount'),mastered=read('#masteredCount'),streak=String($('#streakCount')?.textContent||'0');
 $('#v16Due').textContent=due||'۰'; $('#v16New').textContent=fresh||'۰'; $('#v16Mastered').textContent=mastered||'۰'; $('#v16Streak').textContent=streak;
 const goalText=String($('#goalLabel')?.textContent||'').match(/([0-9۰-۹]+)\s*\/\s*([0-9۰-۹]+)/);
 let done=0,total=0;if(goalText){done=Number(String(goalText[1]).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));total=Number(String(goalText[2]).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))}
 $('#v16GoalText').textContent=goalText?`هدف روزانه: ${goalText[1]}/${goalText[2]}`:'هدف روزانه'; $('#v16GoalBar').style.width=pct(total?done/total*100:0);
 $('#v16Reviews').textContent=faNumber(session.reviews); $('#v16Recall').textContent=faNumber(session.recall); $('#v16Unknown').textContent=faNumber(session.unknown);
 const seconds=Math.floor((Date.now()-session.startedAt)/1000),mm=Math.floor(seconds/60),ss=seconds%60; $('#v16Duration').textContent=`${faNumber(mm)}:${String(ss).padStart(2,'0')}`; $('#v16SessionText').textContent=`این جلسه: ${faNumber(session.reviews)} مرور`;
 const modes=modeStats(),host=$('#v16Modes');
 host.innerHTML=modes.map(mode=>`<div class="v16-mode"><div class="v16-mode-top"><span class="v16-mode-label">${mode.label}</span><span class="v16-mode-value">${mode.attempts?Math.round(mode.accuracy):'—'}</span></div><div class="v16-meter"><div style="width:${pct(mode.accuracy)}"></div></div></div>`).join('');
 const active=modes.filter(mode=>mode.attempts).sort((a,b)=>a.accuracy-b.accuracy)[0];
 $('#v16Attention').innerHTML=active?`<div class="v16-attn"><strong>نیازمند توجه</strong>${active.label} با دقت ${Math.round(active.accuracy)}٪ پایین‌ترین عملکرد ثبت‌شده را دارد.</div>`:'<div class="v16-attn"><strong>هنوز دادهٔ کافی نداریم</strong>با چند تمرین آموزشی، سیستم می‌تواند نقاط ضعف شما را دقیق‌تر مشخص کند.</div>';
}
function bindSession(){
 document.addEventListener('click',event=>{const target=event.target?.closest?.('.rate[data-r]');if(target)session.reviews+=1; if(event.target?.closest?.('#v12SubmitRecall'))session.recall+=1; if(event.target?.closest?.('#v15DontKnowRecall')){session.recall+=1;session.unknown+=1} update()},true);
 const study=$('#studyPanel'); if(study)new MutationObserver(update).observe(study,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
 setInterval(update,1000); update();
}
function start(){injectStyle();const ready=()=>{ensurePanel();bindSession()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready()}
window.__KANJI5_V16_SESSION_API__=Object.freeze({refresh:update,getSession:()=>({...session})});
start();
})();