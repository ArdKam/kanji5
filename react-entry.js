(()=>{
'use strict';
const params=new URLSearchParams(location.search);
if(params.get('legacy')==='1'||params.get('v2')==='1'||params.get('react')==='0')return;
document.documentElement.classList.remove('kanji5-v2-default');
document.documentElement.classList.add('kanji5-react-default');
const style=document.createElement('style');
style.textContent='.kanji5-react-default .wrap>header{display:none!important}.kanji5-react-default #app{display:none!important}.kanji5-react-default #loading{display:none!important}.kanji5-react-default #root{display:block!important;min-height:100vh}';
document.head.appendChild(style);
const reactStylesheet=document.createElement('link');
reactStylesheet.rel='stylesheet';
reactStylesheet.href='./react-dist/kanji5-react.css';
reactStylesheet.dataset.kanji5React='true';
document.head.appendChild(reactStylesheet);
import('./react-dist/kanji5-react.js').catch(error=>console.error('Kanji 5 React presentation failed to boot.',error));
})();
