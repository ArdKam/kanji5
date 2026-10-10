(()=>{
'use strict';
try{
  const v=localStorage.getItem("kanji5-theme");
  document.documentElement.dataset.theme=v==="light"||v==="dark"?v:"system";
  document.documentElement.style.colorScheme=v==="dark"?"dark":v==="light"?"light":"light dark";
}catch(_){
  document.documentElement.dataset.theme="system";
  document.documentElement.style.colorScheme="light dark";
}
try{
  // Keep onboarding theme-aware without coupling this layer to React component CSS.
  // The same dark rules are cloned for System, but only inside the OS dark media query.
  const darkRules=
    ':root[data-theme="dark"] .kanji5-onboarding-root{--paper:#171614;--ink:#f4efe3;--mute:#b8afa2;--line:rgba(169,158,141,.24);--line-strong:rgba(169,158,141,.42);--indigo:#e06a5f;--shu:#e06a5f;--washi:rgba(35,33,30,.82);--shadow:0 28px 70px rgba(0,0,0,.32);}' +
    ':root[data-theme="dark"] .kanji5-onboarding-root :is(.kanji5-onboarding-language,.kanji5-onboarding-choice,.kanji5-onboarding-option,.kanji5-onboarding-range-option,.kanji5-onboarding-secondary,.kanji5-onboarding-placement-band,.kanji5-onboarding-host-error,.kanji5-onboarding-swipe-hint:before){background:var(--washi);}' +
    ':root[data-theme="dark"] .kanji5-onboarding-root .kanji5-onboarding-choice.is-selected{border-color:color-mix(in srgb,var(--indigo) 42%,var(--line));background:linear-gradient(120deg,color-mix(in srgb,var(--indigo) 10%,transparent),var(--washi));}' +
    ':root[data-theme="dark"] .kanji5-onboarding-root :is(.kanji5-onboarding-option.is-selected,.kanji5-onboarding-range-option.is-selected){border-color:color-mix(in srgb,var(--indigo) 42%,var(--line));background:color-mix(in srgb,var(--indigo) 9%,var(--washi));}' +
    ':root[data-theme="dark"] .kanji5-onboarding-root .kanji5-onboarding-choice.is-selected .kanji5-onboarding-choice-check{background:var(--indigo);border-color:var(--indigo);color:#171614;}' +
    ':root[data-theme="dark"] .kanji5-onboarding-result{background:linear-gradient(135deg,var(--washi),color-mix(in srgb,var(--indigo) 7%,transparent));}' +
    ':root[data-theme="dark"] .kanji5-onboarding-progress-track{background:color-mix(in srgb,var(--line) 75%,var(--paper));}' +
    ':root[data-theme="dark"] .kanji5-onboarding-progress-track span{background:linear-gradient(90deg,var(--indigo),color-mix(in srgb,var(--indigo) 72%,var(--paper)));}' +
    ':root[data-theme="dark"] .kanji5-onboarding-root :is(.kanji5-onboarding-language button.is-active,.kanji5-onboarding-choice-check.is-selected,.kanji5-onboarding-primary){color:#171614;}' +
    ':root[data-theme="dark"] .kanji5-onboarding-root .kanji5-onboarding-language button.is-active{background:var(--indigo);}' +
    ':root[data-theme="dark"] .kanji5-onboarding-root :is(.kanji5-onboarding-primary,.kanji5-onboarding-secondary,.kanji5-onboarding-ghost,.kanji5-onboarding-footer-action,.kanji5-onboarding-language button,.kanji5-onboarding-choice,.kanji5-onboarding-option,.kanji5-onboarding-range-option):focus-visible{outline-color:color-mix(in srgb,var(--indigo) 50%,transparent);}';
  const systemRules=darkRules.replaceAll(':root[data-theme="dark"]', ':root[data-theme="system"]');
  const style=document.createElement("style");
  style.setAttribute("data-rinemi-onboarding-theme","");
  style.textContent=darkRules+'@media(prefers-color-scheme:dark){'+systemRules+'}';
  document.head.appendChild(style);
}catch(_){}
})();
