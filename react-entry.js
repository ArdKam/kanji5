(()=>{
'use strict';
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=157').catch(()=>{});
document.documentElement.classList.add('kanji5-react-default');
const startupRoot=document.getElementById('kanji5-startup-shell');
const startupObserver=startupRoot?new MutationObserver(()=>{
  if(document.querySelector('#root .app-shell')){
    startupRoot.classList.add('is-ready');
    window.setTimeout(()=>{
      startupRoot.remove();
      startupObserver?.disconnect();
    },180);
  }
}):null;
startupObserver?.observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true});
const style=document.createElement('style');
style.textContent='#root{display:block;min-height:100vh}';
document.head.appendChild(style);
let reactStylesheet=document.querySelector('link[data-kanji5-react-styles]');
if(!reactStylesheet){
  reactStylesheet=document.createElement('link');
  reactStylesheet.rel='stylesheet';
  reactStylesheet.href='./react-dist/kanji5-react.css?v=20260925-release14';
  reactStylesheet.dataset.kanji5React='true';
  document.head.appendChild(reactStylesheet);
}
import('./react-dist/kanji5-react.js?v=20260925-release14')
  .catch(error=>console.error('Kanji 5 React presentation failed to boot.',error));

function mountAccountFallback(){
  const root=document.getElementById('root');
  const existing=root?.querySelector('.account-button');
  if(existing){ document.querySelector('[data-kanji5-account-fallback]')?.remove(); document.querySelector('[data-kanji5-account-fallback-dialog]')?.remove(); return; }
  const headerActions=document.querySelector('.header-actions');
  if(!headerActions || document.querySelector('[data-kanji5-account-fallback]')) return;
  const lang=()=>localStorage.getItem('kanji5-ui-language')==='en'?'en':'fa';
  const copy=(key)=>({
    fa:{account:'حساب',signIn:'ورود',create:'ایجاد حساب',email:'ایمیل',password:'رمز عبور',login:'ورود به حساب',signup:'ایجاد حساب',magic:'ارسال لینک ورود',useMagic:'ورود با لینک جادویی',useEmail:'ایمیل و رمز عبور',already:'حساب دارید؟ ورود',newAccount:'حساب ندارید؟ ایجاد حساب',google:'ورود با Google (به‌زودی)',close:'بستن',signedIn:'وارد شده‌اید',syncNow:'همگام‌سازی',signOut:'خروج',synced:'همگام',syncing:'در حال همگام‌سازی',idle:'',unavailable:'حساب در دسترس نیست',unavailableHint:'اتصال سرویس حساب هنوز آماده نشده است.',sent:'لینک ورود به ایمیل شما ارسال شد.',confirm:'حساب ساخته شد؛ ایمیل خود را برای تأیید بررسی کنید.',error:'عملیات حساب انجام نشد.'},
    en:{account:'Account',signIn:'Sign in',create:'Create account',email:'Email',password:'Password',login:'Sign in',signup:'Create account',magic:'Send magic link',useMagic:'Magic link',useEmail:'Email & password',already:'Already have an account? Sign in',newAccount:'New here? Create account',google:'Google sign-in (coming soon)',close:'Close',signedIn:'Signed in',syncNow:'Sync now',signOut:'Sign out',synced:'Synced',syncing:'Syncing',idle:'',unavailable:'Account unavailable',unavailableHint:'The account service is not ready yet.',sent:'Magic link sent to your email.',confirm:'Account created; check your email to confirm.',error:'Account operation failed.'}
  })[lang()][key]??key;
  const btn=document.createElement('button');
  btn.type='button'; btn.className='account-button'; btn.dataset.kanji5AccountFallback='true'; btn.setAttribute('aria-label',copy('account')); btn.title=copy('account');
  btn.innerHTML='<span class="account-avatar account-avatar-guest" aria-hidden="true">◎</span><span class="account-button-label">'+copy('signIn')+'</span>';
  headerActions.appendChild(btn);
  const dialog=document.createElement('dialog');
  dialog.className='dialog account-dialog'; dialog.dataset.kanji5AccountFallbackDialog='true';
  dialog.innerHTML='<button class="dialog-close" type="button" aria-label="'+copy('close')+'">×</button><div class="account-dialog-heading"><span class="account-avatar account-avatar-guest" aria-hidden="true">◎</span><div><p class="eyebrow">'+copy('account')+'</p><h2 id="kanji5-fallback-account-title">'+copy('account')+'</h2></div></div><div class="kanji5-account-body"></div>';
  document.body.appendChild(dialog);
  const body=dialog.querySelector('.kanji5-account-body');
  let unsubscribe=()=>{}; let authMode='email'; let intent='sign-in'; let busy=false;
  const api=()=>window.__KANJI5_ACCOUNT__;
  const state=()=>api()?.getState?.()||{status:'loading',user:null,syncStatus:'idle',error:null};
  const render=()=>{
    if(!body)return;
    const s=state(); const f=copy; const user=s.user;
    if(s.status==='signed-in'){
      const name=user?.name||user?.email||f('signedIn');
      btn.classList.add('is-signed-in'); btn.setAttribute('aria-label',name); btn.title=name;
      btn.innerHTML='<span class="account-avatar account-avatar-fallback" aria-hidden="true">'+String(name).trim().charAt(0).toUpperCase()+'</span><span class="account-button-label">'+name.replace(/</g,'&lt;')+'</span>';
      body.innerHTML='<div class="account-user-card"><span class="account-avatar account-avatar-fallback" aria-hidden="true">'+String(name).trim().charAt(0).toUpperCase()+'</span><div class="account-user-copy"><strong>'+name.replace(/</g,'&lt;')+'</strong>'+(user?.email?'<span>'+String(user.email).replace(/</g,'&lt;')+'</span>':'')+'</div><span class="sync-pill sync-'+s.syncStatus+'">'+f(s.syncStatus==='syncing'?'syncing':s.syncStatus==='synced'?'synced':'idle')+'</span></div><div class="account-actions"><button class="button secondary" data-action="sync" type="button">'+f('syncNow')+'</button><button class="button secondary" data-action="signout" type="button">'+f('signOut')+'</button></div>';
      body.querySelector('[data-action="sync"]')?.addEventListener('click',async()=>{if(busy)return;busy=true;render();try{await api().syncNow();}catch(_){body.insertAdjacentHTML('beforeend','<p class="account-error" role="alert">'+f('error')+'</p>');}finally{busy=false;render();}});
      body.querySelector('[data-action="signout"]')?.addEventListener('click',async()=>{if(busy)return;busy=true;render();try{await api().signOut();dialog.close();}catch(_){body.insertAdjacentHTML('beforeend','<p class="account-error" role="alert">'+f('error')+'</p>');}finally{busy=false;render();}});
      return;
    }
    btn.classList.remove('is-signed-in'); btn.setAttribute('aria-label',f('account')); btn.title=f('account'); btn.innerHTML='<span class="account-avatar account-avatar-guest" aria-hidden="true">◎</span><span class="account-button-label">'+f('signIn')+'</span>';
    if(s.status==='loading'){ body.innerHTML='<p class="account-copy">'+f('signIn')+'…</p>'; return; }
    if(s.status==='unavailable'){ body.innerHTML='<section class="account-notice account-notice-warning"><strong>'+f('unavailable')+'</strong><p>'+f('unavailableHint')+'</p></section>'; return; }
    body.innerHTML='<p class="account-copy">'+f('account')+'</p><div class="account-auth-tabs"><button type="button" data-auth-mode="email" class="'+(authMode==='email'?'is-active':'')+'">'+f('useEmail')+'</button><button type="button" data-auth-mode="magic" class="'+(authMode==='magic'?'is-active':'')+'">'+f('useMagic')+'</button></div><form class="account-auth-form"><label><span>'+f('email')+'</span><input name="email" type="email" autocomplete="email" required></label>'+(authMode==='email'?'<label><span>'+f('password')+'</span><input name="password" type="password" autocomplete="'+(intent==='sign-in'?'current-password':'new-password')+'" minlength="6" required></label>':'')+'<button class="button primary account-email-button" type="submit" '+(busy?'disabled':'')+'>'+(busy?f('signIn'):authMode==='magic'?f('magic'):intent==='sign-in'?f('login'):f('signup'))+'</button></form>'+(authMode==='email'?'<button class="account-text-action" type="button" data-toggle-intent>'+(intent==='sign-in'?f('newAccount'):f('already'))+'</button>':'')+'<div class="account-divider"><span>or</span></div><button class="button secondary account-google-button account-google-pending" type="button" disabled>'+f('google')+'</button>';
    const form=body.querySelector('form'); form?.addEventListener('submit',async ev=>{ev.preventDefault(); if(busy)return; busy=true; render(); try{const a=api(); const email=String(form.querySelector('[name=email]')?.value||''); if(authMode==='magic'){await a.sendMagicLink(email); body.insertAdjacentHTML('beforeend','<p class="account-message" role="status">'+f('sent')+'</p>');}else{const password=String(form.querySelector('[name=password]')?.value||''); if(intent==='sign-in'){await a.signInWithPassword(email,password); dialog.close();}else{const r=await a.signUpWithPassword(email,password); body.insertAdjacentHTML('beforeend','<p class="account-message" role="status">'+(r.needsEmailConfirmation?f('confirm'):f('signedIn'))+'</p>'); if(!r.needsEmailConfirmation)dialog.close();}}}catch(_){body.insertAdjacentHTML('beforeend','<p class="account-error" role="alert">'+f('error')+'</p>');}finally{busy=false;render();}}, {once:true});
    body.querySelectorAll('[data-auth-mode]').forEach(el=>el.addEventListener('click',()=>{authMode=el.getAttribute('data-auth-mode')||'email';render();}));
    body.querySelector('[data-toggle-intent]')?.addEventListener('click',()=>{intent=intent==='sign-in'?'sign-up':'sign-in';render();});
  };
  btn.addEventListener('click',()=>{render();dialog.showModal();});
  dialog.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>render());
  let attached=false;
  const attach=()=>{const a=api(); if(!a||attached)return; attached=true; render(); unsubscribe=a.subscribe(render);};
  const wait=()=>{ if(document.querySelector('#root .account-button')){btn.remove();dialog.remove();unsubscribe();return;} attach(); if(!attached)window.setTimeout(wait,100); };
  wait();
  window.setTimeout(()=>mountAccountFallback(),500);
}
const accountStyle=document.createElement('style');
accountStyle.textContent='[data-kanji5-account-fallback]{min-height:44px;border:1px solid var(--line,#ddd);background:var(--paper,#fbf8f0);color:var(--sumi,#211f1b);border-radius:14px;padding:6px 10px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;font:inherit}.account-avatar{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--washi,#f0eadf);color:var(--sumi,#211f1b);font-weight:800;flex:0 0 auto}.account-button-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:700}.account-dialog{width:min(460px,calc(100vw - 28px));padding:28px}.account-dialog-heading{display:flex;align-items:center;gap:14px;padding-inline-end:28px;margin-bottom:18px}.account-dialog-heading .account-avatar{width:48px;height:48px}.account-copy{margin:0 0 16px;color:var(--mute,#746f67);line-height:1.8}.account-user-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px;border:1px solid var(--line,#ddd);border-radius:14px}.account-user-copy{min-width:0;display:grid;gap:3px}.account-user-copy strong,.account-user-copy span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.account-user-copy span{color:var(--mute,#746f67);font-size:12px}.account-actions{display:flex;gap:8px;margin-top:14px}.account-actions>*{flex:1}.account-auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;margin:14px 0 12px;border:1px solid var(--line,#ddd);border-radius:12px;background:var(--washi,#f0eadf)}.account-auth-tabs button{min-height:44px;border:0;border-radius:8px;background:transparent;color:var(--mute,#746f67);font-size:11px;font-weight:700;cursor:pointer}.account-auth-tabs button.is-active{background:var(--paper,#fbf8f0);color:var(--sumi,#211f1b)}.account-auth-form{display:grid;gap:10px}.account-auth-form label{display:grid;gap:5px}.account-auth-form label>span{font-size:10px;font-weight:700;color:var(--mute,#746f67)}.account-auth-form input{width:100%;min-height:42px;padding:8px 10px;border:1px solid var(--line,#ddd);border-radius:10px;background:var(--paper,#fbf8f0);color:var(--sumi,#211f1b);font:inherit;font-size:12px;box-sizing:border-box}.account-email-button,.account-google-button{width:100%;justify-content:center}.account-text-action{min-height:44px;border:0;background:transparent;color:var(--mute,#746f67);font-size:10px;cursor:pointer;padding:5px}.account-divider{display:flex;align-items:center;gap:10px;margin:16px 0 12px;color:var(--mute,#746f67);font-size:10px}.account-divider:before,.account-divider:after{content:"";height:1px;flex:1;background:var(--line,#ddd)}.account-divider span{white-space:nowrap}.account-message{margin:12px 0 0;padding:9px 10px;border:1px solid var(--line,#ddd);border-radius:10px;background:var(--paper,#fbf8f0);font-size:11px;line-height:1.6}.account-error{margin:12px 0 0;color:#a23a2a;font-size:12px;line-height:1.6}';
document.head.appendChild(accountStyle);
setTimeout(mountAccountFallback,50);
setTimeout(mountAccountFallback,250);

})();
