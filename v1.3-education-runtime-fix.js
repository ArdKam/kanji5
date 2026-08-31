(()=>{'use strict';
if(window.__KANJI5_EDUCATION_DATA_GUARD__)return;
window.__KANJI5_EDUCATION_DATA_GUARD__=true;
const $=s=>document.querySelector(s);
const dataPromise=window.__KANJI5_P0_DATA_PROMISE||Promise.resolve(window.__KANJI5_P0_DATA||[]);
let waiting=false;
function isEducationTab(target){return target?.closest?.('.v13-tab[data-tab="education"]')}
function showLoading(){const pane=$('#v13EducationPane');if(pane&&!pane.hidden){pane.innerHTML='<div class="v13-edu-empty"><div style="font-size:42px">⏳</div><strong>در حال آماده‌سازی تمرین‌ها…</strong><div>دادهٔ کانجی در حال بارگذاری است.</div></div>'}}
async function waitForEducation(){
  if(waiting)return;
  waiting=true;
  try{
    const data=await dataPromise;
    if(!Array.isArray(data)||data.length!==2136){
      const pane=$('#v13EducationPane');
      if(pane&&!pane.hidden)pane.innerHTML='<div class="v13-edu-empty"><div style="font-size:42px">⚠️</div><strong>دادهٔ کانجی بارگذاری نشد.</strong><div>صفحه را دوباره بارگذاری کن.</div></div>';
      return;
    }
    const tab=$('.v13-tab[data-tab="education"]');
    if(tab)tab.click();
  }finally{waiting=false}
}
document.addEventListener('click',event=>{
  if(event.target?.id==='v13EduBack'){
    setTimeout(()=>{$('#v13StartEducation')?.remove();$('#ratings')?.classList.add('show')},0);
    return;
  }
  const tab=isEducationTab(event.target);
  if(!tab)return;
  if(Array.isArray(window.__KANJI5_P0_DATA)&&window.__KANJI5_P0_DATA.length===2136)return;
  event.preventDefault();
  event.stopPropagation();
  showLoading();
  void waitForEducation();
},true);
})();
