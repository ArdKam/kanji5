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
})();
