import fs from 'node:fs';

const uiPath='v1.4-education-ui.js';
let ui=fs.readFileSync(uiPath,'utf8');

if(!ui.includes('function escapeHTML')){
  ui=ui.replace(
    "function pane(){return $('#v14EducationPane')}",
    "function escapeHTML(value){return String(value??'').replace(/[&<>\\\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[ch]))}\nfunction pane(){return $('#v14EducationPane')}"
  );
}

ui=ui.replace(/async function startEducation\(\)\{[\s\S]*?\nfunction record\(mode,result,wrong=''\)\{/, [
  'async function startEducation(){',
  '  const p=pane();if(!p)return;const seen=getSeenItems();if(!seen.length){edu={item:null,mode:null,word:null,sentence:null,answered:false};showEmpty();return}',
  '  showLoading();const settings=readSettings(),modes=CORE.getAvailableModes(settings,true),knowledge=readKnowledge();',
  '  const item=CORE.selectEducationItem(seen,knowledge,modes,{now:Date.now(),excludeCharacters:edu.item?.character?[edu.item.character]:[]})||seen[0];',
  '  const stats=knowledge[item.character]||{};let mode=CORE.chooseBestExercise(item,stats,modes,{now:Date.now()});let words=[],sentence=null;',
  "  const safeModes=modes.filter(x=>x==='meaning'||x==='reading'||x==='production');",
  "  if(mode==='vocabulary'){",
  '    words=await fetchWords(item.character);',
  "    if(!words.length)mode=CORE.chooseBestExercise(item,stats,safeModes,{now:Date.now()});",
  "  }else if(mode==='context'){",
  '    const sentences=await fetchContextSentences(item.character);',
  '    sentence=sentences[Math.floor(Math.random()*Math.min(sentences.length,8))]||null;',
  "    if(!sentence)mode=CORE.chooseBestExercise(item,stats,safeModes,{now:Date.now()});",
  '  }',
  '  writeKnowledge(CORE.ensureEntry(readKnowledge(),item.character,true));',
  "  edu={item,mode,word:mode==='vocabulary'&&words.length?words[Math.floor(Math.random()*Math.min(words.length,8))]:null,sentence,answered:false};",
  '  renderEducation();',
  '}',
  "function record(mode,result,wrong=''){"
].join('\n'));

ui=ui.replace(/>\$\{blanked\}<\/div>/, '>${escapeHTML(blanked)}</div>');
ui=ui.replace(/>\$\{edu\.sentence\.english\|\|'—'\}<\/div>/, ">\${escapeHTML(edu.sentence.english||'—')}</div>");
ui=ui.replace(/>\$\{edu\.word\.word\.replaceAll\(item\.character,'＿'\)\}<\/div>/, '>${escapeHTML(edu.word.word.replaceAll(item.character,\'＿\'))}</div>');
ui=ui.replace(/>\$\{edu\.word\.reading\}<\/div>/, '>\${escapeHTML(edu.word.reading)}</div>');
ui=ui.replace('return `${edu.sentence.text} · ${edu.sentence.english||\'\'}`;', 'return `${escapeHTML(edu.sentence.text)} · ${escapeHTML(edu.sentence.english||\'\')}`;');
ui=ui.replace('return edu.word?`${edu.word.word} · ${edu.word.reading}`:edu.item.character;', 'return edu.word?`${escapeHTML(edu.word.word)} · ${escapeHTML(edu.word.reading)}`:escapeHTML(edu.item.character);');

const focus='setTimeout(()=>$(\'#v14EduInput\')?.focus()||$(\'#v14EduProductionInput\')?.focus(),0)';
if(ui.includes(focus) && !ui.includes("if(edu.mode==='vocabulary'||edu.mode==='context')$('#v14EduSubmit')?.remove();")){
  ui=ui.replace(focus, "if(edu.mode==='vocabulary'||edu.mode==='context')$('#v14EduSubmit')?.remove();"+focus);
}

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
