(()=>{
'use strict';
if(typeof window==='undefined'||typeof document==='undefined')return;
if(window.__KANJI5_V16_SESSION_UI__)return;
window.__KANJI5_V16_SESSION_UI__=true;
const DASHBOARD_STATE_KEY='kanji5-v16-dashboard-open';
function ensureStyle(){
  if(document.getElementById('v16-ui-session-style'))return;
  const style=document.createElement('style');
  style.id='v16-ui-session-style';
  style.textContent=`#v16Session.v16-dashboard-collapsed{display:none!important}#v16DashboardToolbar{display:flex;align-items:center;justify-content:flex-start;gap:8px;margin:0 0 12px;min-height:42px}#v16DashboardToolbar button{border:1px solid var(--line,#e5e7eb);background:var(--panel,#fff);color:var(--ink,#111827);border-radius:12px;padding:9px 12px;cursor:pointer;font-weight:800;font-size:12px}#v16DashboardToolbar #v16Start{background:var(--accent,#111827);color:#fff;border-color:var(--accent,#111827);padding:13px 20px;font-size:15px;min-height:48px}#v16DashboardToolbar #v16FinishExternal{background:#fff;border-color:#d1d5db}.v16-dashboard-mini{font-size:11px;color:var(--muted,#6b7280)}.v14-edu-input,input,textarea,select{font-size:16px!important}@media(max-width:700px){#v16DashboardToolbar{margin-bottom:8px;flex-wrap:wrap}#v16DashboardToolbar #v16Start{width:100%;min-height:52px}.v16-dashboard-mini{white-space:nowrap}}`;
  document.head.appendChild(style);
}
function writeDashboardOpen(open){
  try{sessionStorage.setItem(DASHBOARD_STATE_KEY,open?'1':'0')}catch(_){ }
}
function setOpen(panel,toggle,open){
  panel.classList.toggle('v16-dashboard-open',open);
  panel.classList.toggle('v16-dashboard-collapsed',!open);
  if(toggle){toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'بستن داشبورد':'نمایش داشبورد جلسه'}
}
function setup(){
  ensureStyle();
  const panel=document.querySelector('#v16Session'),study=document.querySelector('#studyPanel'),api=window.__KANJI5_V16_SESSION_API__;
  if(!panel||!study||!api)return false;
  let bar=document.querySelector('#v16DashboardToolbar');
  if(!bar){
    bar=document.createElement('div');bar.id='v16DashboardToolbar';
    bar.innerHTML='<button id="v16Start" type="button">شروع جلسه</button><button id="v16FinishExternal" type="button" hidden>پایان جلسه</button><button id="v16DashboardToggle" type="button" aria-expanded="false" aria-controls="v16Session" hidden>بستن داشبورد</button><span class="v16-dashboard-mini" id="v16DashboardMini" aria-live="polite" hidden></span>';
    panel.parentNode.insertBefore(bar,panel);
  }
  const start=document.querySelector('#v16Start'),finish=document.querySelector('#v16FinishExternal'),toggle=document.querySelector('#v16DashboardToggle'),mini=document.querySelector('#v16DashboardMini');
  const sync=()=>{
    const s=api.getSession?.()||{};
    const started=Boolean(s.startedAt)||Boolean(s.started),finished=Boolean(s.finished);
    if(start)start.hidden=started||finished;
    if(finish)finish.hidden=!started||finished;
    if(toggle)toggle.hidden=!started;
    if(mini){mini.hidden=!started;mini.textContent=started?(finished?'جلسه پایان یافت':`جلسه: ${s.reviews||0} مرور`):''}
    if(!started){writeDashboardOpen(false);setOpen(panel,toggle,false)}
  };
  if(start&&!start.dataset.bound){
    start.dataset.bound='1';
    start.addEventListener('click',()=>{
      let result=false;
      try{result=api.start?.()}catch(error){console.error('KANJI5_V16_SESSION_START_FAILED',error)}
      if(result!==false){writeDashboardOpen(false);setOpen(panel,toggle,false);start.hidden=true;finish.hidden=false;toggle.hidden=false;mini.hidden=false}
      try{sync()}catch(error){console.error('KANJI5_V16_UI_SYNC_FAILED',error)}
      try{api.refresh?.()}catch(error){console.error('KANJI5_V16_SESSION_REFRESH_FAILED',error)}
      try{sync()}catch(error){console.error('KANJI5_V16_UI_SYNC_FAILED',error)}
      if(result!==false)queueMicrotask(()=>{try{sync()}catch(error){console.error('KANJI5_V16_UI_SYNC_FAILED',error)}})
    })
  }
  if(finish&&!finish.dataset.bound){
    finish.dataset.bound='1';
    finish.addEventListener('click',()=>{
      try{api.finish?.()}catch(error){console.error('KANJI5_V16_SESSION_FINISH_FAILED',error)}
      writeDashboardOpen(false);setOpen(panel,toggle,false);
      try{sync()}catch(error){console.error('KANJI5_V16_UI_SYNC_FAILED',error)}
      try{api.refresh?.()}catch(error){console.error('KANJI5_V16_SESSION_REFRESH_FAILED',error)}
      try{sync()}catch(error){console.error('KANJI5_V16_UI_SYNC_FAILED',error)}
    })
  }
  if(toggle&&!toggle.dataset.bound){
    toggle.dataset.bound='1';
    toggle.addEventListener('click',()=>{const open=!panel.classList.contains('v16-dashboard-open');writeDashboardOpen(open);setOpen(panel,toggle,open)})
  }
  window.__KANJI5_V16_SESSION_UI_API__=Object.freeze({refresh:setup,stop:()=>{}});
  try{sync()}catch(error){console.error('KANJI5_V16_UI_SYNC_FAILED',error)}
  const s=api.getSession?.()||{};if(Boolean(s.startedAt)||Boolean(s.started)){writeDashboardOpen(false);setOpen(panel,toggle,false)}
  return true;
}
setup();
})();