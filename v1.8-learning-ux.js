(()=>{
'use strict';
if(typeof window==='undefined'||window.__KANJI5_V18_LEARNING_UX__)return;
window.__KANJI5_V18_LEARNING_UX__=true;
const LABELS={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
function modeFromMeta(meta){const text=String(meta?.textContent||'');return Object.entries(LABELS).find(([,label])=>text.includes(label))?.[0]||null}
function reason(mode){return({meaning:'این تمرین روی بازیابی مستقل معنی تمرکز دارد.',reading:'این تمرین روی بازیابی مستقل خوانش تمرکز دارد.',production:'این تمرین روی تولید فعال خودِ کانجی تمرکز دارد.',vocabulary:'این تمرین روی بازیابی واژه‌ای که کانجی در آن به‌کار می‌رود تمرکز دارد.',context:'این تمرین روی بازیابی کانجی از روی بافت جمله تمرکز دارد.'})[mode]||'این تمرین بر اساس وضعیت یادگیری فعلی انتخاب شده است.'}
function enhance(){const pane=document.getElementById('v14EducationPane');if(!pane||pane.hidden)return;const meta=pane.querySelector('.v14-edu-meta');const mode=modeFromMeta(meta);if(!mode)return;if(!pane.querySelector('#v18AdaptiveReason')){const node=document.createElement('div');node.id='v18AdaptiveReason';node.style.cssText='margin:8px 0;padding:8px 10px;border:1px solid var(--line,#e5e7eb);border-radius:10px;background:#f9fafb;color:var(--muted,#6b7280);font-size:11px;text-align:center';node.textContent=reason(mode);(pane.querySelector('.v14-edu-prompt')||meta)?.after(node)}const input=pane.querySelector('.v14-edu-input');if(input&&!pane.querySelector('#v18EnterHint')){const node=document.createElement('div');node.id='v18EnterHint';node.style.cssText='margin-top:5px;color:var(--muted,#6b7280);font-size:10px;text-align:center';node.textContent='Enter = بررسی پاسخ · «نمی‌دانم» = ثبت outcome آموزشی';input.after(node)}}
const observer=new MutationObserver(enhance);observer.observe(document.documentElement,{childList:true,subtree:true});enhance();
})();
