(()=>{
'use strict';
const BUTTON_ID='v13DontKnow';
function currentGate(){return document.querySelector('.v13-p1-gate');}
function addButton(){
  const gate=currentGate();
  const submit=document.getElementById('v13P1Submit');
  if(!gate||!submit||document.getElementById(BUTTON_ID)) return;
  const btn=document.createElement('button');
  btn.id=BUTTON_ID;
  btn.type='button';
  btn.className='secondary';
  btn.textContent='نمی‌دانم';
  btn.style.cssText='width:100%;margin-top:8px';
  btn.addEventListener('click',()=>{
    btn.disabled=true;
    const choices=gate.querySelectorAll('.v13-production-choice');
    if(choices.length){
      const target=document.querySelector('.kanji')?.textContent?.trim()||'';
      const wrong=[...choices].find(x=>(x.dataset.choice||'')!==target);
      if(wrong){wrong.click();return;}
    }
    const input=document.getElementById('v13P1Input');
    if(input){input.value='__DONT_KNOW__';submit.click();}
  });
  submit.insertAdjacentElement('afterend',btn);
}
const observer=new MutationObserver(addButton);
observer.observe(document.body,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',addButton,{once:true});
addButton();
})();
