(()=>{
'use strict';
if(typeof window==='undefined'||typeof document==='undefined')return;
if(window.__KANJI5_V16_UI_HOTFIX__)return;
window.__KANJI5_V16_UI_HOTFIX__=true;
const faDigits=s=>String(s??'').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const $=(s,r=document)=>r.querySelector?.(s)||null;
let frozenDuration=null;
let panelObserver=null;
let discoveryObserver=null;
function setText(node,value){if(node&&node.textContent!==value)node.textContent=value}
function ensureStyle(){if($('#v16-ui-hotfix-style'))return;const style=document.createElement('style');style.id='v16-ui-hotfix-style';style.textContent=`#v16Session.v16-dashboard-collapsed{display:none!important}#v16DashboardToolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}#v16DashboardToggle{border:1px solid var(--line,#e5e7eb);background:var(--panel,#fff);color:var(--ink,#111827);border-radius:12px;padding:8px 11px;cursor:pointer;font-weight:800;font-size:12px}.v16-dashboard-mini{font-size:11px;color:var(--muted,#6b7280)}.v14-edu-input,input,textarea,select{font-size:16px!important}@media(max-width:700px){#v16DashboardToolbar{margin-bottom:8px}.v16-dashboard-mini{white-space:nowrap}}`;document.head.appendChild(style)}
function syncPanel(panel,toggle){if(!panel||!toggle)return;const open=panel.classList.contains('v16-dashboard-open');panel.classList.toggle('v16-dashboard-collapsed',!open);toggle.setAttribute('aria-expanded',String(open));setText(toggle,open?'بستن داشبورد':'نمایش داشبورد جلسه')}
function ensureToolbar(){const panel=$('#v16Session'),study=$('#studyPanel');if(!panel||!study)return false;let bar=$('#v16DashboardToolbar');if(!bar){bar=document.createElement('div');bar.id='v16DashboardToolbar';bar.innerHTML='<button id="v16DashboardToggle" type="button" aria-expanded="false" aria-controls="v16Session">نمایش داشبورد جلسه</button><span class="v16-dashboard-mini" id="v16DashboardMini" aria-live="polite"></span>';study.parentNode.insertBefore(bar,study)}const toggle=$('#v16DashboardToggle');if(toggle&&!toggle.dataset.bound){toggle.dataset.bound='1';toggle.addEventListener('click',()=>{const open=!panel.classList.contains('v16-dashboard-open');panel.classList.toggle('v16-dashboard-open',open);syncPanel(panel,toggle);if(open)window.__KANJI5_V16_SESSION_API__?.refresh?.()})}if(!panel.classList.contains('v16-dashboard-open')&&!panel.classList.contains('v16-dashboard-collapsed'))panel.classList.add('v16-dashboard-collapsed');return true}
function updateTimerUi(){normalizeTimer();freezeFinishedDuration();updateMini()}
function updateMini(){const mini=$('#v16DashboardMini');if(!mini)return;const reviews=$('#v16Reviews')?.textContent||'۰';const duration=$('#v16Duration')?.textContent||'۰:۰۰';setText(mini,`جلسه: ${faDigits(reviews)} مرور · ${faDigits(duration)}`)}
function freezeFinishedDuration(){const finish=$('#v16Finish'),duration=$('#v16Duration');if(!finish||!duration)return;const done=finish.disabled||finish.textContent.includes('ذخیره شد');if(done){if(frozenDuration===null)frozenDuration=duration.textContent;setText(duration,faDigits(frozenDuration))}else{frozenDuration=null;setText(duration,faDigits(duration.textContent))}}
function normalizeTimer(){const duration=$('#v16Duration');if(!duration)return;const text=duration.textContent.replace(/[^0-9۰-۹:]/g,'');setText(duration,faDigits(text))}
function refresh(){ensureStyle();if(!ensureToolbar())return false;updateTimerUi();return true}
function attachPanelObserver(panel){if(panelObserver)panelObserver.disconnect();refresh();panelObserver=new MutationObserver(updateTimerUi);panelObserver.observe(panel,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','class']})}
function discoverPanel(){if($('#v16Session')){attachPanelObserver($('#v16Session'));return}const root=$('#app')||document.body;discoveryObserver=new MutationObserver(()=>{const panel=$('#v16Session');if(!panel)return;discoveryObserver.disconnect();discoveryObserver=null;attachPanelObserver(panel)});discoveryObserver.observe(root,{childList:true,subtree:true})}
window.__KANJI5_V16_UI_HOTFIX_API__=Object.freeze({refresh,stop:()=>{panelObserver?.disconnect();discoveryObserver?.disconnect();panelObserver=null;discoveryObserver=null}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensureStyle();discoverPanel()},{once:true});else{ensureStyle();discoverPanel()}
})();
