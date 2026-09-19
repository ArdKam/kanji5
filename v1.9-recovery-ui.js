(()=>{
'use strict';
if(window.__KANJI5_V19_RECOVERY_UI__)return;
window.__KANJI5_V19_RECOVERY_UI__=true;
let latest=null;
const LABELS={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
function render(){const pane=document.getElementById('v14EducationPane');if(!pane||pane.hidden||!latest)return;const result=pane.querySelector('.v14-edu-actions');if(!result)return;if(!pane.querySelector('#v19RecoveryFeedback')){const node=document.createElement('div');node.id='v19RecoveryFeedback';node.style.cssText='margin-top:10px;padding:10px 12px;border:1px solid var(--line,#e5e7eb);border-radius:12px;background:#f9fafb;font-size:12px;text-align:center';const mode=LABELS[latest.mode]||latest.mode;const title=latest.recovered?'✅ بازیابی موفق':'💡 نتیجهٔ آموزشی';const reason=latest.outcome==='unknown'?'این پاسخ به‌عنوان «نمی‌دانستم» ثبت شد.':latest.outcome==='near_miss'?'پاسخ نزدیک بود؛ یک تلاش بازیابی پیشنهاد می‌شود.':latest.outcome==='wrong'?'پاسخ نادرست بود؛ یک تلاش بازیابی برای همین مهارت در نظر گرفته شده است.':'پاسخ درست بود.';node.innerHTML=`<strong>${title}</strong><div style="margin-top:4px">${mode} · ${reason}</div>`;result.parentElement.appendChild(node)}
if(latest.retryable&&!latest.recovered&&!pane.querySelector('#v19RetryBtn')){const b=document.createElement('button');b.type='button';b.className='secondary';b.id='v19RetryBtn';b.textContent='یک بار دیگر همین مهارت را تمرین کن';result.prepend(b)}else if(latest.recovered){pane.querySelector('#v19RetryBtn')?.remove()}}

document.addEventListener('kanji5:v1.9-feedback',e=>{latest=e?.detail||null;setTimeout(render,0)});
document.addEventListener('click',async e=>{const b=e.target.closest?.('#v19RetryBtn');if(!b)return;b.disabled=true;const bridge=window.__KANJI5_EDU_BRIDGE__;const ok=Boolean(await bridge?.retry?.());if(!ok)b.disabled=false});
const observer=new MutationObserver(render);observer.observe(document.documentElement,{childList:true,subtree:true});
})();
