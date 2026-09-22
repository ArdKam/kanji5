(()=>{
'use strict';
document.documentElement.classList.add('kanji5-react-default');
const style=document.createElement('style');
style.textContent='#root{display:block;min-height:100vh}';
document.head.appendChild(style);
const reactStylesheet=document.createElement('link');
reactStylesheet.rel='stylesheet';
reactStylesheet.href='./react-dist/kanji5-react.css';
reactStylesheet.dataset.kanji5React='true';
document.head.appendChild(reactStylesheet);
const flipStylesheet=document.createElement('link');
flipStylesheet.rel='stylesheet';
flipStylesheet.href='./learning-card-flip-runtime.css';
flipStylesheet.dataset.kanji5LearningFlip='true';
document.head.appendChild(flipStylesheet);
import('./react-dist/kanji5-react.js')
  .then(()=>import('./learning-card-flip-runtime.js'))
  .catch(error=>console.error('Kanji 5 React presentation failed to boot.',error));
})();
