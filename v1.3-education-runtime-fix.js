(()=>{'use strict';
const $=s=>document.querySelector(s);
document.addEventListener('click',e=>{
  if(e.target?.id!=='v13EduBack')return;
  setTimeout(()=>{
    $('#v13StartEducation')?.remove();
    $('#ratings')?.classList.add('show');
  },0);
},false);
})();