(()=>{
'use strict';
document.documentElement.classList.add('kanji5-react-default');
const style=document.createElement('style');
style.textContent='#root{display:block;min-height:100vh}';
document.head.appendChild(style);

const exerciseFeedbackStyle=document.createElement('style');
exerciseFeedbackStyle.dataset.kanji5ExerciseFeedback='true';
exerciseFeedbackStyle.textContent="#exercise.exercise-result-correct,#exercise.exercise-result-wrong{position:relative;overflow:hidden;transition:background-color .18s ease,border-color .18s ease,box-shadow .18s ease,transform .18s ease;}\n#exercise.exercise-result-correct{background:rgba(126,140,90,.13);border-color:rgba(126,140,90,.52);box-shadow:0 22px 48px -28px rgba(76,105,42,.46);animation:kanji5ExerciseCorrect .52s ease both;}\n#exercise.exercise-result-wrong{background:rgba(192,57,43,.09);border-color:rgba(192,57,43,.48);box-shadow:0 22px 48px -28px rgba(192,57,43,.38);animation:kanji5ExerciseWrong .52s ease both;}\n#exercise.exercise-result-correct .actions,#exercise.exercise-result-wrong .actions,#exercise.exercise-result-correct .wide,#exercise.exercise-result-wrong .wide{display:none!important;}\n.exercise-feedback-overlay{min-height:150px;padding:24px 18px;border:1px solid currentColor;border-radius:24px;display:grid;place-items:center;align-content:center;gap:10px;text-align:center;font-weight:850;animation:kanji5ExerciseFeedbackIn .22s ease both;}\n.exercise-result-correct .exercise-feedback-overlay{color:var(--matcha);background:rgba(126,140,90,.11);}\n.exercise-result-wrong .exercise-feedback-overlay{color:var(--shu);background:rgba(192,57,43,.08);}\n.exercise-feedback-icon{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;font-size:32px;font-weight:900;background:var(--paper);box-shadow:0 10px 24px -18px rgba(28,26,23,.55);}\n.exercise-feedback-label{color:var(--sumi);font-size:22px;line-height:1.25;}\n@keyframes kanji5ExerciseCorrect{0%{transform:scale(1)}42%{transform:scale(1.012)}100%{transform:scale(1)}}\n@keyframes kanji5ExerciseWrong{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}\n@keyframes kanji5ExerciseFeedbackIn{0%{opacity:0;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}\n@media(prefers-reduced-motion:reduce){#exercise.exercise-result-correct,#exercise.exercise-result-wrong,.exercise-feedback-overlay{animation:none!important;transition:none!important;}}";
document.head.appendChild(exerciseFeedbackStyle);
const reactStylesheet=document.createElement('link');
reactStylesheet.rel='stylesheet';
reactStylesheet.href='./react-dist/kanji5-react.css?v=20260923-cardfinal5';
reactStylesheet.dataset.kanji5React='true';
document.head.appendChild(reactStylesheet);
function installInstantExerciseFeedback(){
  if(window.__KANJI5_INSTANT_EXERCISE_FEEDBACK__)return;
  window.__KANJI5_INSTANT_EXERCISE_FEEDBACK__=true;
  const root=document.getElementById('root');
  if(!root)return;
  const enhance=()=>{
    const exercise=root.querySelector('#exercise');
    if(!exercise)return;
    const feedback=exercise.nextElementSibling;
    if(!(feedback instanceof HTMLElement)||!feedback.classList.contains('feedback'))return;
    if(feedback.dataset.kanji5Processed==='true')return;
    feedback.dataset.kanji5Processed='true';
    const correct=feedback.classList.contains('feedback-good');
    exercise.classList.remove('exercise-result-correct','exercise-result-wrong');
    exercise.classList.add(correct?'exercise-result-correct':'exercise-result-wrong');
    exercise.querySelector('.exercise-feedback-overlay')?.remove();
    const overlay=document.createElement('div');
    overlay.className='exercise-feedback-overlay';
    overlay.setAttribute('role','status');
    overlay.setAttribute('aria-live','polite');
    const icon=document.createElement('span');
    icon.className='exercise-feedback-icon';
    icon.textContent=correct?'✓':(feedback.querySelector('.feedback-icon')?.textContent?.trim()||'!');
    const label=document.createElement('strong');
    label.className='exercise-feedback-label';
    label.textContent=feedback.querySelector('h2')?.textContent?.trim()||(correct?'درست':'نادرست');
    overlay.append(icon,label);
    exercise.appendChild(overlay);
    exercise.querySelectorAll('.actions,.wide').forEach(el=>el.setAttribute('hidden','true'));
    feedback.setAttribute('hidden','true');
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
    window.setTimeout(()=>{
      const nextButton=exercise.querySelector('.button.primary.wide');
      if(nextButton instanceof HTMLButtonElement&&!nextButton.disabled)nextButton.click();
    },reduced?120:560);
  };
  const observer=new MutationObserver(enhance);
  observer.observe(root,{childList:true,subtree:true});
  enhance();
}
import('./react-dist/kanji5-react.js?v=20260923-feedback1')
  .then(()=>installInstantExerciseFeedback())
  .catch(error=>console.error('Kanji 5 React presentation failed to boot.',error));
