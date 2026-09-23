(()=>{
'use strict';
document.documentElement.classList.add('kanji5-react-default');
const style=document.createElement('style');
style.textContent='#root{display:block;min-height:100vh}';
document.head.appendChild(style);
const reactStylesheet=document.createElement('link');
reactStylesheet.rel='stylesheet';
reactStylesheet.href='./react-dist/kanji5-react.css?v=20260923-dailysummary1';
reactStylesheet.dataset.kanji5React='true';
document.head.appendChild(reactStylesheet);
import('./react-dist/kanji5-react.js?v=20260923-headerfix3')
  .catch(error=>console.error('Kanji 5 React presentation failed to boot.',error));
})();
