(()=>{
'use strict';
if(window.__KANJI5_EDUCATION_TAB_V6__)return;
window.__KANJI5_EDUCATION_TAB_V6__=true;
const KNOW='kanji5-v1.2-knowledge',SETTINGS='kanji5-v1.3-education-settings';
const EDU_CORE=window.__KANJI5_EDU_CORE__;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const DEFAULTS={production:true,vocabulary:true,context:true};
const normalize=v=>String(v??'').trim().toLowerCase().normalize('NFKC').replace(/[\s\u3000]+/g,'');
function normalizeRomaji(v){return normalize(v).replace(/[^a-z]/g,'').replace(/si/g,'shi').replace(/ti/g,'chi').replace(/tu/g,'tsu').replace(/hu/g,'fu').replace(/zi/g,'ji').replace(/du/g,'zu').replace(/di/g,'ji').replace(/wo/g,'o')}
const HIRA={あ:'a',い:'i',う:'u',え:'e',お:'o',か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',や:'ya',ゆ:'yu',よ:'yo',ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',わ:'wa',を:'o',ん:'n',が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',だ:'da',ぢ:'ji',づ:'zu',で:'de',ど:'do',ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po',ゔ:'vu',ゃ:'ya',ゅ:'yu',ょ:'yo',っ:''};
const PAIRS={きゃ:'kya',きゅ:'kyu',きょ:'kyo',しゃ:'sha',しゅ:'shu',しょ:'sho',ちゃ:'cha',ちゅ:'chu',ちょ:'cho',にゃ:'nya',にゅ:'nyu',にょ:'nyo',ひゃ:'hya',ひゅ:'hyu',ひょ:'hyo',みゃ:'mya',みゅ:'myu',みょ:'myo',りゃ:'rya',りゅ:'ryu',りょ:'ryo',ぎゃ:'gya',ぎゅ:'gyu',ぎょ:'gyo',じゃ:'ja',じゅ:'ju',じょ:'jo',びゃ:'bya',びゅ:'byu',びょ:'byo',ぴゃ:'pya',ぴゅ:'pyu',ぴょ:'pyo'};
function toRomaji(v){const source=String(v??'').normalize('NFKC').replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-96));let out='';for(let i=0;i<source.length;i+=1){const pair=source.slice(i,i+2);if(PAIRS[pair]){out+=PAIRS[pair];i+=1;continue}if(source[i]==='っ'){const next=PAIRS[source.slice(i+1,i+3)]||HIRA[source[i+1]]||'';if(next)out+=next[0];continue}out+=HIRA[source[i]]??source[i]}return out}
function readSettings(){try{return{...DEFAULTS,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')}}catch(_){return{...DEFAULTS}}}
function readKnowledge(){try{return JSON.parse(localStorage.getItem(KNOW)||'{}')}catch(_){return{}}}
function writeKnowledge(v){try{localStorage.setItem(KNOW,JSON.stringify(v))}catch(_){}}
function readAppState(){try{return JSON.parse(localStorage.getItem('kanji5-v1')||'{}')}catch(_){return{}}}
function getDeck(){if(Array.isArray(window.__KANJI5_P0_DATA))return window.__KANJI5_P0_DATA;try{const c=JSON.parse(localStorage.getItem('kanji5-deck')||'[]');return Array.isArray(c)?c:[]}catch(_){return[]}}
function getSeenItems(){const ids=new Set(Object.keys(readAppState().cards||{}));return getDeck().filter(x=>x?.id&&ids.has(x.id))}
function mastery(ch,mode){const s=readKnowledge()[ch]?.[mode]||{attempts:0,correct:0};return EDU_CORE?EDU_CORE.mastery(s):(s.correct+1)/(s.attempts+2)}
function record(ch,mode,correct,wrong=''){const all=readKnowledge();if(EDU_CORE){writeKnowledge(EDU_CORE.recordKnowledge(all,ch,mode,correct,wrong));return}const card=all[ch]||{},stats=card[mode]||{attempts:0,correct:0};stats.attempts+=1;if(correct)stats.correct+=1;stats.lastAt=new Date().toISOString();card[mode]=stats;if(wrong){card.distractors=card.distractors||{};card.distractors[wrong]=(card.distractors[wrong]||0)+1}all[ch]=card;writeKnowledge(all)}
function meaningTokens(v){return String(v??'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>1)}
function scoreDistractor(target,candidate){
  if(!candidate||candidate.character===target.character)return-1;
  const tr=new Set([...(target.on||[]),...(target.kun||[])].map(normalize).filter(Boolean));
  const cr=new Set([...(candidate.on||[]),...(candidate.kun||[])].map(normalize).filter(Boolean));
  const sharedReading=[...tr].some(x=>cr.has(x));
  const tm=new Set((target.meaning||[]).flatMap(meaningTokens));
  const cm=new Set((candidate.meaning||[]).flatMap(meaningTokens));
  const sharedMeaning=[...tm].filter(x=>cm.has(x)).length;
  const meaningScore=tm.size&&cm.size?sharedMeaning/Math.max(1,Math.min(tm.size,cm.size)):0;
  const strokeDiff=Math.abs(Number(target.strokes||0)-Number(candidate.strokes||0));
  const strokeScore=Math.max(0,1-strokeDiff/8);
  const gradeScore=target.grade!=null&&candidate.grade!=null&&target.grade===candidate.grade?1:0;
  const fa=Number(target.frequency||0),fb=Number(candidate.frequency||0);
  const freqScore=fa>0&&fb>0?Math.max(0,1-Math.abs(Math.log(fa/fb))/4):0;
  return(sharedReading?4:0)+meaningScore*3+strokeScore*1.2+gradeScore*.45+freqScore*.25;
}
function chooseChoices(target){
  const history=readKnowledge()[target.character]?.distractors||{};
  const pool=getDeck().filter(x=>x?.character&&x.character!==target.character);
  const masteryLevel=['production','vocabulary','context'].reduce((sum,m)=>sum+mastery(target.character,m),0)/3;
  pool.sort((a,b)=>{
    const ah=history[a.character]||0,bh=history[b.character]||0;
    const ascore=scoreDistractor(target,a),bscore=scoreDistractor(target,b);
    return (bh-ah)*2+(bscore-ascore)*(masteryLevel<.7?1.15:.8);
  });
  return [target,...pool.slice(0,3)].sort(()=>Math.random()-.5);
}
async function fetchWords(ch){
  const key=`kanji5-edu-words-${ch}`;
  try{const c=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(c))return c}catch(_){}
  try{const r=await fetch(`https://kanjiapi.dev/v1/words/${encodeURIComponent(ch)}`,{cache:'force-cache'});if(!r.ok)return[];const data=await r.json(),out=[],seen=new Set();for(const entry of Array.isArray(data)?data:[]){for(const v of entry.variants||[]){const word=v.written||'',reading=v.pronounced||'';if(!word.includes(ch)||!reading||seen.has(word))continue;seen.add(word);out.push({word,reading,meaning:(entry.meanings||[]).flatMap(m=>m.glosses||[]).slice(0,2).join('; ')});if(out.length>=10)break}if(out.length>=10)break}try{localStorage.setItem(key,JSON.stringify(out))}catch(_){}return out}catch(_){return[]}
}
function pickMode(item,words){
  const s=readSettings();
  const modes=EDU_CORE?EDU_CORE.getAvailableModes(s,words.length>0):['meaning','reading'];
  if(!EDU_CORE){if(s.production)modes.push('production');if(words.length&&s.vocabulary)modes.push('vocabulary');if(words.length&&s.context)modes.push('context')}
  const stats=readKnowledge()[item.character]||{};
  if(EDU_CORE)return EDU_CORE.chooseMode(item,stats,modes);
  const fresh=modes.filter(m=>!stats[m]?.attempts);if(fresh.length)return fresh[Math.floor(Math.random()*Math.min(2,fresh.length))];
  const ordered=modes.slice().sort((a,b)=>mastery(item.character,a)-mastery(item.character,b));
  return ordered[Math.floor(Math.random()*Math.min(2,ordered.length))]||'meaning';
}
let edu={item:null,mode:null,word:null,answered:false};
function pane(){return $('#v13EducationPane')}
function buildUI(){
  const panel=$('#studyPanel'),study=$('#study');if(!panel||!study||$('#v13EduTabs'))return;
  const reviewPane=document.createElement('div');reviewPane.id='v13ReviewPane';study.parentNode.insertBefore(reviewPane,study);reviewPane.appendChild(study);
  const tabs=document.createElement('div');tabs.id='v13EduTabs';tabs.innerHTML='<button type="button" class="v13-tab active" data-tab="review">مرور کانجی</button><button type="button" class="v13-tab" data-tab="education">تمرین آموزشی</button>';panel.insertBefore(tabs,reviewPane);
  const educationPane=document.createElement('div');educationPane.id='v13EducationPane';educationPane.hidden=true;panel.appendChild(educationPane);
  tabs.addEventListener('click',event=>{const b=event.target.closest('[data-tab]');if(!b)return;const tab=b.dataset.tab;$$('.v13-tab',tabs).forEach(x=>x.classList.toggle('active',x===b));reviewPane.hidden=tab!=='review';educationPane.hidden=tab!=='education';if(tab==='education')startEducation()});
  const style=document.createElement('style');style.textContent='.v13-tab{border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:13px;padding:11px 12px;font-weight:800;cursor:pointer}.v13-tab.active{background:#111827;color:#fff;border-color:#111827}#v13EduTabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.v13-edu-wrap{border:1px solid var(--line);background:#f9fafb;border-radius:16px;padding:18px}.v13-edu-title{font-weight:850;font-size:17px;margin-bottom:7px}.v13-edu-sub{color:var(--muted);font-size:13px;line-height:1.7;margin-bottom:14px}.v13-edu-prompt{font-size:15px;line-height:1.8;margin-bottom:12px}.v13-edu-input{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:12px;padding:11px;font:inherit;direction:ltr;background:#fff}.v13-edu-kanji{text-align:center;font:90px/1.1 serif;margin:4px 0 14px}.v13-edu-word{text-align:center;font-size:30px;font-weight:850;letter-spacing:3px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin:10px 0}.v13-edu-reading,.v13-edu-meaning{text-align:center;color:var(--muted);direction:ltr;margin:7px 0}.v13-edu-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.v13-edu-choice{font:38px serif;padding:14px 8px;min-height:78px}.v13-edu-actions{display:flex;gap:8px;margin-top:12px}.v13-edu-actions button{flex:1}.v13-edu-answer{text-align:center;line-height:1.8;color:var(--muted)}.v13-edu-empty{text-align:center;padding:45px 15px;color:var(--muted)}@media(max-width:700px){.v13-edu-kanji{font-size:76px}}';document.head.appendChild(style)
}
function showEmpty(){const p=pane();if(p)p.innerHTML='<div class="v13-edu-empty"><div style="font-size:48px">🧠</div><strong>هنوز کانجی‌ای برای تمرین آموزشی نداری.</strong><div>ابتدا چند کانجی را در تب مرور ببین.</div></div>'}
function answerText(){const item=edu.item;if(edu.mode==='meaning')return(item.meaning||[]).join(' · ')||'—';if(edu.mode==='reading')return[...(item.on||[]),...(item.kun||[])].join(' · ')||'—';return edu.word?`${edu.word.word} · ${edu.word.reading}`:item.character}
function renderResult(correct){const p=pane();if(!p)return;p.innerHTML='<div class="v13-edu-wrap"><div class="v13-edu-title">'+(correct?'✅ پاسخ درست بود':'❌ پاسخ درست نبود')+'</div><div class="v13-edu-answer">پاسخ صحیح: <strong>'+answerText()+'</strong></div><div class="v13-edu-actions"><button type="button" class="primary" id="v13EduNext">تمرین بعدی</button><button type="button" class="secondary" id="v13EduReview">بازگشت به مرور</button></div></div>'}
function renderEducation(){
  const p=pane(),item=edu.item;if(!p||!item)return;let body='',prompt='';
  if(edu.mode==='meaning'){prompt='معنی این کانجی چیست؟';body='<div class="v13-edu-kanji">'+item.character+'</div><input id="v13EduInput" class="v13-edu-input" autocomplete="off" spellcheck="false" placeholder="مثلاً: school">'}
  else if(edu.mode==='reading'){prompt='یک خوانش رایج این کانجی را بنویس؛ Hiragana یا Romaji.';body='<div class="v13-edu-kanji">'+item.character+'</div><input id="v13EduInput" class="v13-edu-input" autocomplete="off" spellcheck="false" placeholder="مثلاً: gaku یا がく">'}
  else if(edu.mode==='production'){prompt='برای معنی زیر، کانجی درست را انتخاب کن:';body='<div style="text-align:center;font-weight:800">'+((item.meaning||[]).join(' · ')||'—')+'</div><div class="v13-edu-grid">'+chooseChoices(item).map(c=>'<button type="button" class="secondary v13-edu-choice" data-choice="'+c.character+'">'+c.character+'</button>').join('')+'</div>'}
  else if(edu.word&&edu.mode==='vocabulary'){prompt='کانجیِ گمشدهٔ واژه را از چهار گزینه انتخاب کن.';body='<div class="v13-edu-word">'+edu.word.word.replaceAll(item.character,'＿')+'</div><div class="v13-edu-reading">'+edu.word.reading+'</div><div class="v13-edu-grid">'+chooseChoices(item).map(c=>'<button type="button" class="secondary v13-edu-choice" data-choice="'+c.character+'">'+c.character+'</button>').join('')+'</div>'}
  else if(edu.word&&edu.mode==='context'){prompt='با توجه به معنی و خوانش واژه، کانجی مناسب را انتخاب کن.';body='<div class="v13-edu-meaning">'+(edu.word.meaning||'')+'</div><div class="v13-edu-reading">'+edu.word.reading+'</div><div class="v13-edu-grid">'+chooseChoices(item).map(c=>'<button type="button" class="secondary v13-edu-choice" data-choice="'+c.character+'">'+c.character+'</button>').join('')+'</div>'}
  else{renderResult(false);return}
  p.innerHTML='<div class="v13-edu-wrap"><div class="v13-edu-title">🧠 تمرین آموزشی</div><div class="v13-edu-sub">این تمرین مستقل از کارت مرور است.</div><div class="v13-edu-prompt">'+prompt+'</div><div>'+body+'</div><div class="v13-edu-actions"><button type="button" class="primary" id="v13EduSubmit">بررسی پاسخ</button><button type="button" class="secondary" id="v13EduDontKnow">نمی‌دانم</button></div></div>';
  setTimeout(()=>$('#v13EduInput')?.focus(),0);
}
async function startEducation(){const p=pane();if(!p)return;const seen=getSeenItems();if(!seen.length){edu={item:null,mode:null,word:null,answered:false};showEmpty();return}const item=seen[Math.floor(Math.random()*seen.length)];const words=await fetchWords(item.character);const mode=pickMode(item,words);edu={item,mode,word:(mode==='vocabulary'||mode==='context')&&words.length?words[Math.floor(Math.random()*Math.min(words.length,6))]:null,answered:false};renderEducation()}
function submit(){
  if(edu.answered||!edu.item)return;let correct=false,wrong='',result=null;
  if(edu.mode==='meaning'){const v=$('#v13EduInput')?.value||'';if(!normalize(v)){$('#v13EduInput')?.focus();return}result=EDU_CORE?EDU_CORE.gradeMeaning(v,edu.item.meaning):{correct:(edu.item.meaning||[]).some(x=>normalize(x)===normalize(v))};correct=result.correct}
  else if(edu.mode==='reading'){const v=$('#v13EduInput')?.value||'';if(!normalize(v)){$('#v13EduInput')?.focus();return}result=EDU_CORE?EDU_CORE.gradeReading(v,[...(edu.item.on||[]),...(edu.item.kun||[])],toRomaji):{correct:[...(edu.item.on||[]),...(edu.item.kun||[])].some(x=>normalize(v)===normalize(x)||normalizeRomaji(v)===normalizeRomaji(toRomaji(x)))};correct=result.correct}
  else{const selected=document.activeElement?.closest?.('.v13-edu-choice');if(!selected)return;wrong=selected.dataset.choice||'';correct=wrong===edu.item.character}
  edu.answered=true;record(edu.item.character,edu.mode,correct,correct?'':wrong);$$('.v13-edu-choice').forEach(b=>b.disabled=true);renderResult(correct)
}
document.addEventListener('click',event=>{const t=event.target,id=t?.id;if(id==='v13EduSubmit'){event.preventDefault();submit();return}if(id==='v13EduDontKnow'){event.preventDefault();if(edu.item&&!edu.answered){edu.answered=true;record(edu.item.character,edu.mode,false);renderResult(false)}return}if(id==='v13EduNext'){event.preventDefault();startEducation();return}if(id==='v13EduReview'){event.preventDefault();$('.v13-tab[data-tab="review"]')?.click();return}if(t?.matches?.('.v13-edu-choice')){if(edu.answered)return;const selected=t.dataset.choice||'',correct=selected===edu.item?.character;edu.answered=true;$$('.v13-edu-choice').forEach(b=>b.disabled=true);record(edu.item.character,edu.mode,correct,correct?'':selected);renderResult(correct)}},true);
document.addEventListener('keydown',event=>{if(event.target?.id==='v13EduInput'&&event.key==='Enter'){event.preventDefault();submit()}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',buildUI,{once:true});else buildUI();
})();
