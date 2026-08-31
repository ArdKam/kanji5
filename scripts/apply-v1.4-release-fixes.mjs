import fs from 'node:fs';

const uiPath='v1.4-education-ui.js';
let ui=fs.readFileSync(uiPath,'utf8');

if(!ui.includes('function escapeHTML')){
  ui=ui.replace("function pane(){return $('#v14EducationPane')}","function escapeHTML(value){return String(value??'').replace(/[&<>\\\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[ch]))}\nfunction pane(){return $('#v14EducationPane')}");
}

ui=ui.replace(/async function startEducation\(\)\{[\s\S]*?\nfunction record\(mode,result,wrong=''\)\{/,
`async function startEducation(){
  const p=pane();if(!p)return;const seen=getSeenItems();if(!seen.length){edu={item:null,mode:null,word:null,sentence:null,answered:false};showEmpty();return}
  showLoading();const settings=readSettings(),modes=CORE.getAvailableModes(settings,true),knowledge=readKnowledge();
  const item=CORE.selectEducationItem(seen,knowledge,modes,{now:Date.now(),excludeCharacters:edu.item?.character?[edu.item.character]:[]})||seen[0];
  const stats=knowledge[item.character]||{};let mode=CORE.chooseBestExercise(item,stats,modes,{now:Date.now()});let words=[],sentence=null;
  const safeModes=modes.filter(x=>x==='meaning'||x==='reading'||x==='production');
  if(mode==='vocabulary'){
    words=await fetchWords(item.character);
    if(!words.length)mode=CORE.chooseBestExercise(item,stats,safeModes,{now:Date.now()});
  }else if(mode==='context'){
    const sentences=await fetchContextSentences(item.character);
    sentence=sentences[Math.floor(Math.random()*Math.min(sentences.length,8))]||null;
    if(!sentence)mode=CORE.chooseBestExercise(item,stats,safeModes,{now:Date.now()});
  }
  writeKnowledge(CORE.ensureEntry(readKnowledge(),item.character,true));
  edu={item,mode,word:mode==='vocabulary'&&words.length?words[Math.floor(Math.random()*Math.min(words.length,8))]:null,sentence,answered:false};
  renderEducation();
}
function record(mode,result,wrong=''){`);

ui=ui.replace("<div class=\"v14-edu-answer\">${answerText()}</div>","<div class=\"v14-edu-answer\">${answerText()}</div>");
ui=ui.replace("const blanked=edu.sentence.text.replaceAll(item.character,'＿');body=\`<div class=\"v14-edu-word\" style=\"font-size:24px;line-height:1.8;letter-spacing:0\">${blanked}</div><div class=\"v14-edu-meaning\">${edu.sentence.english||'—'}</div>${renderChoices(chooseChoices(item))}\`",
"const blanked=edu.sentence.text.replaceAll(item.character,'＿');body=\`<div class=\"v14-edu-word\" style=\"font-size:24px;line-height:1.8;letter-spacing:0\">${escapeHTML(blanked)}</div><div class=\"v14-edu-meaning\">${escapeHTML(edu.sentence.english||'—')}</div>${renderChoices(chooseChoices(item))}\`");
ui=ui.replace("else if(edu.mode==='vocabulary'&&edu.word){prompt='کانجی گمشدهٔ واژه را انتخاب کن.';body=\`<div class=\"v14-edu-word\">${edu.word.word.replaceAll(item.character,'＿')}</div><div class=\"v14-edu-reading\">${edu.word.reading}</div>${renderChoices(chooseChoices(item))}\`}",
"else if(edu.mode==='vocabulary'&&edu.word){prompt='کانجی گمشدهٔ واژه را انتخاب کن.';body=\`<div class=\"v14-edu-word\">${escapeHTML(edu.word.word.replaceAll(item.character,'＿'))}</div><div class=\"v14-edu-reading\">${escapeHTML(edu.word.reading)}</div>${renderChoices(chooseChoices(item))}\`}");
ui=ui.replace("p.innerHTML=\`<div class=\"v14-edu-wrap\"><div class=\"v14-edu-title\">🧠 تمرین آموزشی</div><div class=\"v14-edu-meta\">${stageLabel(CORE.getStage(readKnowledge()[item.character]))} · ${edu.mode}</div><div class=\"v14-edu-prompt\">${prompt}</div>${body}<div class=\"v14-edu-actions\"><button type=\"button\" class=\"primary\" id=\"v14EduSubmit\">بررسی پاسخ</button><button type=\"button\" class=\"secondary\" id=\"v14EduDontKnow\">نمی‌دانم</button></div></div>\`",
"const checkButton=(edu.mode==='vocabulary'||edu.mode==='context')?'':\`<button type=\"button\" class=\"primary\" id=\"v14EduSubmit\">بررسی پاسخ</button>\`;p.innerHTML=\`<div class=\"v14-edu-wrap\"><div class=\"v14-edu-title\">🧠 تمرین آموزشی</div><div class=\"v14-edu-meta\">${stageLabel(CORE.getStage(readKnowledge()[item.character]))} · ${edu.mode}</div><div class=\"v14-edu-prompt\">${escapeHTML(prompt)}</div>${body}<div class=\"v14-edu-actions\">${checkButton}<button type=\"button\" class=\"secondary\" id=\"v14EduDontKnow\">نمی‌دانم</button></div></div>\`");
ui=ui.replace("return `${edu.sentence.text} · ${edu.sentence.english||''}`;","return `${escapeHTML(edu.sentence.text)} · ${escapeHTML(edu.sentence.english||'')}`;");
ui=ui.replace("return edu.word?`${edu.word.word} · ${edu.word.reading}`:edu.item.character;","return edu.word?`${escapeHTML(edu.word.word)} · ${escapeHTML(edu.word.reading)}`:escapeHTML(edu.item.character);");
fs.writeFileSync(uiPath,ui);

const indexPath='index.html';
let index=fs.readFileSync(indexPath,'utf8');
index=index.replace(/\s*<style id="v1\.3-(?:education|p1)">[\s\S]*?<\/style>/g,'');
fs.writeFileSync(indexPath,index);

const swPath='sw.js';
let sw=fs.readFileSync(swPath,'utf8');
if(!sw.includes('TATOEBA_ORIGIN')){
  sw=sw.replace("const API_ORIGIN='https://kanjiapi.dev';","const API_ORIGIN='https://kanjiapi.dev';\nconst TATOEBA_ORIGIN='https://api.tatoeba.org';");
  sw=sw.replace("if(u.origin===API_ORIGIN&&u.pathname.startsWith('/v1/words/')){e.respondWith(apiCacheFirst(r));return}","if(u.origin===API_ORIGIN&&u.pathname.startsWith('/v1/words/')){e.respondWith(apiCacheFirst(r));return}if(u.origin===TATOEBA_ORIGIN&&u.pathname.startsWith('/v1/sentences')){e.respondWith(apiCacheFirst(r));return}");
}
fs.writeFileSync(swPath,sw);
console.log('Applied v1.4 release hardening.');
