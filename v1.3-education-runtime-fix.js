(()=>{'use strict';
if(window.__KANJI5_EDUCATION_DATA_GUARD__)return;
window.__KANJI5_EDUCATION_DATA_GUARD__=true;
const $=s=>document.querySelector(s);
const ready=window.__KANJI5_P0_DATA_PROMISE||Promise.resolve(window.__KANJI5_P0_DATA||[]);
let retrying=false;
async function retryEducation(){
  if(retrying)return;
  retrying=true;
  try{
    const data=await ready;
    if(Array.isArray(data)&&data.length===2136){
      const tab=$('.v13-tab[data-tab="education"]');
      const pane=$('#v13EducationPane');
      const empty=pane&&/هنوز کانجی‌ای برای تمرین آموزشی نداری/.test(pane.textContent||'');
      if(tab&&empty)tab.click();
    }
  }finally{retrying=false}
}
document.addEventListener('click',e=>{
  if(e.target?.id==='v13EduBack'){
    setTimeout(()=>{$('#v13StartEducation')?.remove();$('#ratings')?.classList.add('show')},0);
  }
  if(e.target?.closest?.('.v13-tab[data-tab="education"]'))setTimeout(retryEducation,0);
},true);
const observer=new MutationObserver(()=>{
  const pane=$('#v13EducationPane');
  if(pane&&/هنوز کانجی‌ای برای تمرین آموزشی نداری/.test(pane.textContent||''))retryEducation();
});
observer.observe(document.body,{childList:true,subtree:true});
})();
