(()=>{
'use strict';
const FALLBACK_DELAY=1500;
const boot=()=>{
  const reactAccount=document.querySelector('#root .account-button:not([data-kanji5-account-fallback])');
  const launcher=document.querySelector('#kanji5-account-launcher');
  if(reactAccount) return true;
  if(launcher){
    launcher.classList.remove('is-shadowed');
    launcher.classList.add('is-ready');
    launcher.removeAttribute('aria-hidden');
  }
  if(document.querySelector('[data-kanji5-account-fallback]')) return true;
  const lang=()=>localStorage.getItem('kanji5-ui-language')==='en'?'en':'fa';
  const copy=(k)=>({
    fa:{account:'حساب',signIn:'ورود',email:'ایمیل',password:'رمز عبور',login:'ورود به حساب',signup:'ایجاد حساب',magic:'ارسال لینک ورود',emailTab:'ایمیل و رمز عبور',magicTab:'لینک جادویی',toggleNew:'حساب ندارید؟ ایجاد حساب',toggleOld:'حساب دارید؟ ورود',google:'ورود با Google (به‌زودی)',close:'بستن',sync:'همگام‌سازی',signOut:'خروج',signedIn:'وارد شده‌اید',syncing:'در حال همگام‌سازی',synced:'همگام',unavailable:'حساب در دسترس نیست',unavailableHint:'سرویس حساب در حال حاضر قابل دسترسی نیست.',sent:'لینک ورود به ایمیل شما ارسال شد.',confirm:'حساب ساخته شد؛ ایمیل خود را برای تأیید بررسی کنید.',error:'عملیات حساب انجام نشد.'},
    en:{account:'Account',signIn:'Sign in',email:'Email',password:'Password',login:'Sign in',signup:'Create account',magic:'Send magic link',emailTab:'Email & password',magicTab:'Magic link',toggleNew:'New here? Create account',toggleOld:'Already have an account? Sign in',google:'Google sign-in (coming soon)',close:'Close',sync:'Sync now',signOut:'Sign out',signedIn:'Signed in',syncing:'Syncing',synced:'Synced',unavailable:'Account unavailable',unavailableHint:'The account service is currently unavailable.',sent:'Magic link sent to your email.',confirm:'Account created; check your email to confirm.',error:'Account operation failed.'}
  })[lang()][k]||k;
  const existing=document.getElementById('kanji5-account-launcher');
  const btn=existing||document.createElement('button');
  let reactAccountObserver=null;
  btn.type='button'; btn.className='account-button'; btn.dataset.kanji5AccountFallback='true';
  const dialog=document.createElement('dialog'); dialog.className='dialog account-dialog'; dialog.dataset.kanji5AccountFallbackDialog='true';
  document.body.appendChild(dialog);
  if(btn.parentElement!==document.body) document.body.appendChild(btn);
  const cleanupWhenReactMounts=()=>{
    const real=document.querySelector('#root .account-button:not([data-kanji5-account-fallback])');
    if(!real)return false;
    btn.remove();
    dialog.remove();
    reactAccountObserver?.disconnect();
    window.removeEventListener('resize',positionLauncher);
    return true;
  };
  const positionLauncher=()=>{
    const header=document.querySelector('.header');
    if(!header)return;
    const rect=header.getBoundingClientRect();
    btn.style.position='absolute';
    btn.style.left=`${rect.left+window.scrollX}px`;
    btn.style.top=`${rect.top+window.scrollY}px`;
    btn.style.zIndex='60';
  };
  btn.classList.add('is-ready');
  positionLauncher();
  window.addEventListener('resize',positionLauncher,{passive:true});
  const root=document.getElementById('root');
  if(root){
    reactAccountObserver=new MutationObserver(()=>cleanupWhenReactMounts());
    reactAccountObserver.observe(root,{childList:true,subtree:true});
  }
  cleanupWhenReactMounts();
  let mode='email', intent='sign-in', busy=false, notice='', unsubscribe=()=>{};
  const api=()=>window.__KANJI5_ACCOUNT__;
  const waitForApi=async()=>{for(let i=0;i<120;i+=1){const a=api();if(a)return a;await new Promise(r=>setTimeout(r,100));}throw new Error('KANJI5_ACCOUNT_UNAVAILABLE');};
  const state=()=>api()?.getState?.()||{status:'loading',user:null,syncStatus:'idle'};
  const safe=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const render=()=>{
    const s=state(), c=copy;
    const node=(tag,className='',textValue=null)=>{
      const el=document.createElement(tag);
      if(className)el.className=className;
      if(textValue!==null)el.textContent=String(textValue);
      return el;
    };
    const button=(className,textValue,type='button')=>{
      const el=node('button',className,textValue);
      el.type=type;
      return el;
    };
    if(s.status==='signed-in'){
      notice='';
      const name=s.user?.name||s.user?.email||c('signedIn');
      const letter=Array.from(name.trim())[0]||'◎';
      btn.setAttribute('aria-label',name); btn.title=name; btn.classList.add('is-signed-in');
      btn.replaceChildren();
      const btnAvatar=node('span','account-avatar account-avatar-fallback',letter.toUpperCase());
      btnAvatar.setAttribute('aria-hidden','true');
      btn.append(btnAvatar,node('span','account-button-label',name));

      dialog.replaceChildren();
      if(notice){
        dialog.append(node('p','account-message',notice));
      }
      const close=button('dialog-close','×');
      close.setAttribute('aria-label',c('close'));
      const heading=node('div','account-dialog-heading');
      const headingAvatar=node('span','account-avatar account-avatar-fallback',letter.toUpperCase());
      headingAvatar.setAttribute('aria-hidden','true');
      const headingCopy=node('div');
      headingCopy.append(node('p','eyebrow',c('account')),node('h2','',name));
      heading.append(headingAvatar,headingCopy);

      const userCard=node('div','account-user-card');
      const userCopy=node('div','account-user-copy');
      userCopy.append(node('strong','',c('signedIn')));
      if(s.user?.email) userCopy.append(node('span','',s.user.email));
      const syncPill=node('span','sync-pill',c(s.syncStatus==='syncing'?'syncing':'synced'));
      userCard.append(userCopy,syncPill);

      const actions=node('div','account-actions');
      const syncButton=button('button secondary',c('sync'));
      syncButton.dataset.accountSync='true';
      const signOutButton=button('button secondary',c('signOut'));
      signOutButton.dataset.accountSignout='true';
      actions.append(syncButton,signOutButton);
      dialog.append(close,heading,userCard,actions);

      close.onclick=()=>dialog.close();
      syncButton.onclick=async()=>{if(busy)return;busy=true;render();try{const a=await waitForApi();await a.syncNow();}catch(_){}finally{busy=false;render();}};
      signOutButton.onclick=async()=>{if(busy)return;busy=true;try{const a=await waitForApi();await a.signOut();dialog.close();}catch(_){}finally{busy=false;render();}};
      return;
    }

    btn.classList.remove('is-signed-in');
    btn.setAttribute('aria-label',c('account')); btn.title=c('account');
    btn.replaceChildren();
    const guestAvatar=node('span','account-avatar account-avatar-guest','◎');
    guestAvatar.setAttribute('aria-hidden','true');
    btn.append(guestAvatar,node('span','account-button-label',c('signIn')));

    if(s.status==='unavailable'){
      dialog.replaceChildren();
      const close=button('dialog-close','×');
      close.setAttribute('aria-label',c('close'));
      dialog.append(close,node('h2','',c('unavailable')),node('p','account-copy',c('unavailableHint')));
      close.onclick=()=>dialog.close();
      return;
    }

    dialog.replaceChildren();
    const close=button('dialog-close','×');
    close.setAttribute('aria-label',c('close'));
    const heading=node('div','account-dialog-heading');
    const headingAvatar=node('span','account-avatar account-avatar-guest','◎');
    headingAvatar.setAttribute('aria-hidden','true');
    const headingCopy=node('div');
    headingCopy.append(node('p','eyebrow',c('account')),node('h2','',c('signIn')));
    heading.append(headingAvatar,headingCopy);

    const authTabs=node('div','account-auth-tabs');
    const emailTab=button('',c('emailTab'));
    emailTab.dataset.mode='email';
    if(mode==='email')emailTab.classList.add('is-active');
    const magicTab=button('',c('magicTab'));
    magicTab.dataset.mode='magic';
    if(mode==='magic')magicTab.classList.add('is-active');
    authTabs.append(emailTab,magicTab);

    let intentTabs=null;
    if(mode==='email'){
      intentTabs=node('div','account-intent-tabs');
      intentTabs.setAttribute('role','tablist');
      intentTabs.setAttribute('aria-label',c('account'));
      const signInTab=button('',c('login'));
      signInTab.dataset.intentChoice='sign-in'; signInTab.setAttribute('role','tab');
      signInTab.setAttribute('aria-selected',String(intent==='sign-in'));
      if(intent==='sign-in')signInTab.classList.add('is-active');
      const signUpTab=button('',c('signup'));
      signUpTab.dataset.intentChoice='sign-up'; signUpTab.setAttribute('role','tab');
      signUpTab.setAttribute('aria-selected',String(intent==='sign-up'));
      if(intent==='sign-up')signUpTab.classList.add('is-active');
      intentTabs.append(signInTab,signUpTab);
    }

    const form=node('form','account-auth-form');
    form.dataset.authIntent=intent;
    form.dataset.authMode=mode;
    const emailLabel=node('label');
    emailLabel.append(node('span','',c('email')));
    const emailInput=node('input');
    emailInput.name='email'; emailInput.type='email'; emailInput.autocomplete='email'; emailInput.required=true;
    emailLabel.append(emailInput);
    form.append(emailLabel);
    if(mode==='email'){
      const passwordLabel=node('label');
      passwordLabel.append(node('span','',c('password')));
      const passwordInput=node('input');
      passwordInput.name='password'; passwordInput.type='password'; passwordInput.minLength=6;
      passwordInput.autocomplete=intent==='sign-in'?'current-password':'new-password';
      passwordInput.required=true;
      passwordLabel.append(passwordInput);
      form.append(passwordLabel);
    }
    const submit=button('button primary account-email-button',mode==='magic'?c('magic'):intent==='sign-in'?c('login'):c('signup'),'submit');
    form.append(submit);

    const divider=node('div','account-divider');
    divider.append(node('span','', 'or'));
    const google=button('button secondary account-google-button',c('google'));
    google.disabled=true;

    dialog.append(close,heading,authTabs);
    if(intentTabs)dialog.append(intentTabs);
    dialog.append(form,divider,google);

    const preserveAuthFields=(nextMode,nextIntent)=>{
      const email=String(dialog.querySelector('[name="email"]')?.value||'');
      const password=String(dialog.querySelector('[name="password"]')?.value||'');
      mode=nextMode; intent=nextIntent; notice=''; render();
      const nextEmail=dialog.querySelector('[name="email"]');
      const nextPassword=dialog.querySelector('[name="password"]');
      if(nextEmail)nextEmail.value=email;
      if(nextPassword)nextPassword.value=password;
    };
    close.onclick=()=>dialog.close();
    dialog.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>preserveAuthFields(b.dataset.mode==='magic'?'magic':'email',b.dataset.mode==='magic'?'sign-in':intent));
    dialog.querySelectorAll('[data-intent-choice]').forEach(b=>b.onclick=()=>preserveAuthFields('email',b.dataset.intentChoice==='sign-up'?'sign-up':'sign-in'));
    form.onsubmit=async ev=>{
      ev.preventDefault();
      if(busy)return;
      const currentMode=ev.currentTarget.dataset.authMode==='magic'?'magic':'email';
      const currentIntent=ev.currentTarget.dataset.authIntent==='sign-up'?'sign-up':'sign-in';
      const email=String(ev.currentTarget.querySelector('[name=email]')?.value||'').trim();
      const password=String(ev.currentTarget.querySelector('[name=password]')?.value||'');
      busy=true; notice=''; submit.disabled=true;
      submit.textContent=currentMode==='magic'?c('magic')+'…':currentIntent==='sign-up'?c('signup')+'…':c('login')+'…';
      try{
        const a=await waitForApi();
        if(currentMode==='magic'){await a.sendMagicLink(email);notice=c('sent');}
        else if(currentIntent==='sign-in'){await a.signInWithPassword(email,password);dialog.close();return;}
        else{const result=await a.signUpWithPassword(email,password);notice=result.needsEmailConfirmation?c('confirm'):c('signedIn');if(!result.needsEmailConfirmation){dialog.close();return;}}
      }catch(error){
        const code=String(error?.code||'');
        const detail=error instanceof Error?String(error.message||''):String(error||'');
        notice=(code?code+': ':'')+(detail&&detail!=='AUTH_EMAIL_PASSWORD_REQUIRED'?c('error')+' '+detail:c('error'));
      }finally{busy=false;render();}
    };
  };
  btn.onclick=()=>{const reactAccount=document.querySelector('#root .account-button:not(#kanji5-account-launcher)');if(reactAccount){reactAccount.click();return;}render();try{if(dialog.open)dialog.close();if(typeof dialog.show==='function')dialog.show();else dialog.setAttribute('open','');}catch(_){dialog.setAttribute('open','');}dialog.style.setProperty('display','block','important');dialog.style.setProperty('visibility','visible','important');dialog.style.setProperty('opacity','1','important');dialog.style.setProperty('z-index','1000','important');if(!dialog.open)dialog.setAttribute('open','');};
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  const wait=()=>{
    const reactAccount=document.querySelector('#root .account-button');
    if(reactAccount){
      btn.classList.add('is-shadowed');
      btn.style.setProperty('visibility','hidden','important');
      btn.style.setProperty('pointer-events','none','important');
    }else{
      btn.classList.remove('is-shadowed');
      btn.style.setProperty('visibility','visible','important');
      btn.style.setProperty('pointer-events','auto','important');
      positionLauncher();
      btn.classList.add('is-ready');
    }
    const a=api();
    if(a&&!unsubscribe._attached){unsubscribe=a.subscribe(render);unsubscribe._attached=true;render();}
    if(document.body.contains(btn))window.setTimeout(wait,150);
  };
  wait(); return true;
};
const style=document.createElement('style');style.textContent='#kanji5-account-launcher{visibility:visible!important;opacity:1!important;position:absolute!important;left:0!important;top:0!important;z-index:46!important;min-height:42px;border:1px solid var(--line,#ddd);background:var(--paper,#fbf8f0);color:var(--sumi,#211f1b);border-radius:16px;padding:5px 10px;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font:inherit;box-shadow:none}#kanji5-account-launcher.is-ready{visibility:visible!important}#kanji5-account-launcher.is-shadowed{visibility:hidden!important;pointer-events:none!important}[data-kanji5-account-fallback]{min-height:44px;border:1px solid var(--line,#ddd);background:var(--paper,#fbf8f0);color:var(--sumi,#211f1b);border-radius:14px;padding:6px 10px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;font:inherit}.account-avatar{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--washi,#f0eadf);color:var(--sumi,#211f1b);font-weight:800;flex:0 0 auto}.account-button-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:700}.account-dialog{width:min(460px,calc(100vw - 28px));padding:28px}.account-dialog-heading{display:flex;align-items:center;gap:14px;margin-bottom:18px}.account-dialog-heading .account-avatar{width:48px;height:48px}.account-copy{margin:0 0 16px;color:var(--mute,#746f67);line-height:1.8}.account-user-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px;border:1px solid var(--line,#ddd);border-radius:14px}.account-user-copy{min-width:0;display:grid;gap:3px}.account-user-copy strong,.account-user-copy span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.account-user-copy span{color:var(--mute,#746f67);font-size:12px}.account-actions{display:flex;gap:8px;margin-top:14px}.account-actions>*{flex:1}.account-auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;margin:14px 0 12px;border:1px solid var(--line,#ddd);border-radius:12px;background:var(--washi,#f0eadf)}.account-auth-tabs button{min-height:44px;border:0;border-radius:8px;background:transparent;color:var(--mute,#746f67);font-size:11px;font-weight:700}.account-auth-tabs button.is-active{background:var(--paper,#fbf8f0);color:var(--sumi,#211f1b)}.account-intent-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;margin:0 0 12px;border:1px solid var(--line,#ddd);border-radius:12px;background:var(--washi,#f0eadf)}.account-intent-tabs button{min-height:42px;border:0;border-radius:8px;background:transparent;color:var(--mute,#746f67);font-size:11px;font-weight:700}.account-intent-tabs button.is-active{background:var(--paper,#fbf8f0);color:var(--sumi,#211f1b)}.account-auth-form{display:grid;gap:10px}.account-auth-form label{display:grid;gap:5px}.account-auth-form label>span{font-size:10px;font-weight:700;color:var(--mute,#746f67)}.account-auth-form input{width:100%;min-height:42px;padding:8px 10px;border:1px solid var(--line,#ddd);border-radius:10px;background:var(--paper,#fbf8f0);color:var(--sumi,#211f1b);font:inherit;font-size:12px;box-sizing:border-box}.account-email-button,.account-google-button{width:100%;justify-content:center}.account-text-action{min-height:44px;border:0;background:transparent;color:var(--mute,#746f67);font-size:10px;cursor:pointer;padding:5px}.account-divider{display:flex;align-items:center;gap:10px;margin:16px 0 12px;color:var(--mute,#746f67);font-size:10px}.account-divider:before,.account-divider:after{content:"";height:1px;flex:1;background:var(--line,#ddd)}.account-divider span{white-space:nowrap}.account-message{margin:12px 0 0;padding:9px 10px;border:1px solid var(--line,#ddd);border-radius:10px;background:var(--paper,#fbf8f0);font-size:11px;line-height:1.6}.account-error{margin:12px 0 0;color:#a23a2a;font-size:12px;line-height:1.6}@media(max-width:760px){[data-kanji5-account-fallback]{width:42px;min-width:42px;height:42px;align-self:flex-start}.account-dialog{width:calc(100vw - 28px)}}';document.head.appendChild(style);
const start=()=>{
  boot();
  if(!document.querySelector('[data-kanji5-account-fallback]')) window.setTimeout(start,250);
};
start();
})();
