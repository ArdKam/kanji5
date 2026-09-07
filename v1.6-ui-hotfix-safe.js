(()=>{
'use strict';
if(typeof window==='undefined'||typeof document==='undefined')return;
if(window.__KANJI5_V16_UI_HOTFIX_SAFE__)return;
window.__KANJI5_V16_UI_HOTFIX_SAFE__=true;
function ensureStyle(){
  if(document.getElementById('v16-ui-hotfix-safe-style'))return;
  const style=document.createElement('style');
  style.id='v16-ui-hotfix-safe-style';
  style.textContent=`#v16Session.v16-dashboard-collapsed{display:none!important}#v16DashboardToolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}#v16DashboardToggle{border:1px solid var(--line,#e5e7eb);background:var(--panel,#fff);color:var(--ink,#111827);border-radius:12px;padding:8px 11px;cursor:pointer;font-weight:800;font-size:12px}.v16-dashboard-mini{font-size:11px;color:var(--muted,#6b7280)}.v14-edu-input,input,textarea,select{font-size:16px!important}@media(max-width:700px){#v16DashboardToolbar{margin-bottom:8px}.v16-dashboard-mini{white-space:nowrap}}`;
  document.head.appendChild(style);
}
function setup(){
  ensureStyle();
  const panel=document.querySelector('#v16Session'),study=document.querySelector('#studyPanel');
  if(!panel||!study)return false;
  let bar=document.querySelector('#v16DashboardToolbar');
  if(!bar){
    bar=document.createElement('div');
    bar.id='v16DashboardToolbar';
    bar.innerHTML='<button id="v16DashboardToggle" type="button" aria-expanded="false" aria-controls="v16Session">نمایش داشبورد جلسه</button><span class="v16-dashboard-mini" id="v16DashboardMini" aria-live="polite"></span>';
    study.parentNode.insertBefore(bar,study);
  }
  const toggle=document.querySelector('#v16DashboardToggle');
  if(toggle&&!toggle.dataset.bound){
    toggle.dataset.bound='1';
    toggle.addEventListener('click',()=>{
      const open=!panel.classList.contains('v16-dashboard-open');
      panel.classList.toggle('v16-dashboard-open',open);
      panel.classList.toggle('v16-dashboard-collapsed',!open);
      toggle.setAttribute('aria-expanded',String(open));
      toggle.textContent=open?'بستن داشبورد':'نمایش داشبورد جلسه';
    });
  }
  if(!panel.classList.contains('v16-dashboard-open'))panel.classList.add('v16-dashboard-collapsed');
  return true;
}
window.__KANJI5_V16_UI_HOTFIX_API__=Object.freeze({refresh:setup,stop:()=>{}});
setup();
})();
