import fs from 'node:fs';

const path = 'v1.4-education-ui.js';
let source = fs.readFileSync(path, 'utf8');

if (!source.includes('function fetchContextSentences')) {
  const needle = 'async function fetchWords(ch){';
  const inserted = `async function fetchContextSentences(ch){
  const key=\`kanji5-edu-context-\${ch}\`;
  try{const cached=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(cached)&&cached.length)return cached}catch(_){}
  try{
    const url=new URL('https://api.tatoeba.org/v1/sentences');
    url.searchParams.set('lang','jpn');
    url.searchParams.set('q',ch);
    url.searchParams.set('trans:lang','eng');
    url.searchParams.set('trans:is_direct','yes');
    url.searchParams.set('is_orphan','no');
    url.searchParams.set('is_unapproved','no');
    url.searchParams.set('limit','12');
    const response=await fetch(url.toString(),{cache:'force-cache'});
    if(!response.ok)return[];
    const payload=await response.json();
    const rows=Array.isArray(payload?.data)?payload.data:[];
    const out=[];const seen=new Set();
    for(const row of rows){
      const text=String(row?.text||'').trim();
      if(!text||!text.includes(ch)||seen.has(text))continue;
      seen.add(text);
      const translations=Array.isArray(row?.translations)?row.translations:[];
      const english=translations.flatMap(group=>Array.isArray(group)?group:[group]).map(t=>String(t?.text||'').trim()).find(Boolean)||'';
      out.push({id:row?.id||'',text,english});
      if(out.length>=8)break;
    }
    if(out.length)try{localStorage.setItem(key,JSON.stringify(out))}catch(_){}
    return out;
  }catch(_){return[]}
}
async function fetchWords(ch){`;
  if (!source.includes(needle)) throw new Error('Expected fetchWords function not found');
  source = source.replace(needle, inserted);
}

if (!source.includes('sentence:null')) {
  source = source.replace(
    'let edu={item:null,mode:null,word:null,answered:false};',
    'let edu={item:null,mode:null,word:null,sentence:null,answered:false};'
  );
}

const oldContext = `else if(edu.mode==='context'&&edu.word){prompt='با توجه به معنی و خوانش، کانجی مناسب را انتخاب کن.';body=\`<div class="v14-edu-meaning">\${edu.word.meaning||'—'}</div><div class="v14-edu-reading">\${edu.word.reading}</div>\${renderChoices(chooseChoices(item))}\`}`;
const newContext = `else if(edu.mode==='context'&&edu.sentence){prompt='با توجه به جمله، کانجی مناسب را انتخاب کن.';const blanked=edu.sentence.text.replaceAll(item.character,'＿');body=\`<div class="v14-edu-word" style="font-size:24px;line-height:1.8;letter-spacing:0">\${blanked}</div><div class="v14-edu-meaning">\${edu.sentence.english||'—'}</div>\${renderChoices(chooseChoices(item))}\`}`;
if (source.includes(oldContext)) source = source.replace(oldContext, newContext);

const oldStart = /async function startEducation\(\)[\\s\\S]*?\\nfunction record\(mode,result,wrong=''\)\{/;
const newStart = `async function startEducation(){
  const p=pane();if(!p)return;
  const seen=getSeenItems();
  if(!seen.length){edu={item:null,mode:null,word:null,sentence:null,answered:false};showEmpty();return}
  showLoading();
  const settings=readSettings(),modes=CORE.getAvailableModes(settings,true),knowledge=readKnowledge();
  const item=CORE.selectEducationItem(seen,knowledge,modes,{now:Date.now(),excludeCharacters:edu.item?.character?[edu.item.character]:[]})||seen[0];
  const stats=knowledge[item.character]||{};
  let mode=CORE.chooseBestExercise(item,stats,modes,{now:Date.now()});
  let words=[],sentence=null;
  if(mode==='vocabulary'){
    words=await fetchWords(item.character);
    if(!words.length)mode=CORE.chooseBestExercise(item,stats,modes.filter(x=>x!=='vocabulary'),{now:Date.now()});
  }else if(mode==='context'){
    const sentences=await fetchContextSentences(item.character);
    sentence=sentences[Math.floor(Math.random()*Math.min(sentences.length,8))]||null;
    if(!sentence)mode=CORE.chooseBestExercise(item,stats,modes.filter(x=>x!=='context'),{now:Date.now()});
  }
  writeKnowledge(CORE.ensureEntry(readKnowledge(),item.character,true));
  edu={item,mode,word:mode==='vocabulary'&&words.length?words[Math.floor(Math.random()*Math.min(words.length,8))]:null,sentence,answered:false};
  renderEducation();
}
function record(mode,result,wrong=''){`;
if (oldStart.test(source)) source = source.replace(oldStart, newStart);

const oldChoices = /function chooseChoices\(target\)\{[\s\S]*?\nasync function fetchContextSentences/;
const newChoices = `function chooseChoices(target){const history=readKnowledge()[target.character]?.distractors||{};const pool=getDeck().filter(x=>x?.character&&x.character!==target.character);return [target,...CORE.chooseDistractors(target,pool,history,3)].sort(()=>Math.random()-.5)}
async function fetchContextSentences`;
if (oldChoices.test(source)) source = source.replace(oldChoices, newChoices);

fs.writeFileSync(path, source);
console.log('Applied deterministic v1.4 contextual and smart-distractor wiring.');
