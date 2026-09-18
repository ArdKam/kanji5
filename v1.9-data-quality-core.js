export const DATA_QUALITY_VERSION='1.9.0-data-quality';

const JAPANESE_RE=/[\u3040-\u30ff\u3400-\u9fff]/;
const KANA_RE=/[\u3040-\u30ff]/;
const LATIN_RE=/[A-Za-z]/;

export function normalizeContentText(value){
  return String(value??'')
    .normalize('NFKC')
    .replace(/[\u00a0\u200b\ufeff]/g,' ')
    .replace(/[ \t\r\n]+/g,' ')
    .trim();
}

export function normalizeContentKey(value){
  return normalizeContentText(value).toLocaleLowerCase('en-US');
}

export function validateVocabularyEntry(entry,character=''){
  const target=normalizeContentText(character);
  const word=normalizeContentText(entry?.word);
  const reading=normalizeContentText(entry?.reading);
  const meaning=normalizeContentText(entry?.meaning);
  const reasons=[];
  if(!word) reasons.push('empty_word');
  if(target&&!word.includes(target)) reasons.push('missing_target');
  if(!reading) reasons.push('empty_reading');
  if(reading&&!KANA_RE.test(reading)) reasons.push('malformed_reading');
  if(!meaning) reasons.push('empty_meaning');
  if(word&&[...word].length<2) reasons.push('too_short');
  return {valid:reasons.length===0,reasons,entry:{...entry,word,reading,meaning}};
}

export function validateContextSentence(entry,character=''){
  const target=normalizeContentText(character);
  const text=normalizeContentText(entry?.text);
  const english=normalizeContentText(entry?.english);
  const reasons=[];
  if(!text) reasons.push('empty_sentence');
  if(target&&!text.includes(target)) reasons.push('missing_target');
  if(text&&!JAPANESE_RE.test(text)) reasons.push('malformed_japanese');
  if(!english) reasons.push('empty_translation');
  if(english&&!LATIN_RE.test(english)) reasons.push('malformed_translation');
  return {valid:reasons.length===0,reasons,entry:{...entry,text,english}};
}

export function dedupeStable(items,keyFn=value=>value){
  const seen=new Set();
  const out=[];
  for(const item of Array.isArray(items)?items:[]){
    const key=normalizeContentKey(keyFn(item));
    if(!key||seen.has(key))continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function validateVocabularyList(items,character=''){
  const accepted=[],rejected=[];
  for(const item of Array.isArray(items)?items:[]){
    const checked=validateVocabularyEntry(item,character);
    if(checked.valid)accepted.push(checked.entry); else rejected.push({entry:item,reasons:checked.reasons});
  }
  return {items:dedupeStable(accepted,x=>`${x.word}|${x.reading}`),rejected,version:DATA_QUALITY_VERSION};
}

export function validateContextList(items,character=''){
  const accepted=[],rejected=[];
  for(const item of Array.isArray(items)?items:[]){
    const checked=validateContextSentence(item,character);
    if(checked.valid)accepted.push(checked.entry); else rejected.push({entry:item,reasons:checked.reasons});
  }
  return {items:dedupeStable(accepted,x=>`${x.id}|${x.text}|${x.english}`),rejected,version:DATA_QUALITY_VERSION};
}

function codePointCompare(left,right){
  const a=String(left),b=String(right),length=Math.min(a.length,b.length);
  for(let i=0;i<length;i++){
    const ac=a.codePointAt(i),bc=b.codePointAt(i);
    if(ac<bc)return -1;
    if(ac>bc)return 1;
    if(ac>0xffff)i++;
    if(bc>0xffff)i++;
  }
  return a.length-b.length;
}

export function selectDeterministic(items,keyFn=value=>value){
  const list=Array.isArray(items)?items.filter(Boolean):[];
  if(!list.length)return null;
  return [...list].sort((a,b)=>codePointCompare(normalizeContentKey(keyFn(a)),normalizeContentKey(keyFn(b)))||codePointCompare(JSON.stringify(a),JSON.stringify(b)))[0]||null;
}

function kanjiComplexity(value,target=''){
  return [...String(value||'')].filter(ch=>/[\u3400-\u9fff]/.test(ch)&&ch!==String(target||'')).length;
}
export function contentDifficulty(entry,target='',kind='vocabulary'){
  if(kind==='vocabulary'){
    const word=normalizeContentText(entry?.word),reading=normalizeContentText(entry?.reading);
    return Math.max(0,Math.min(1,kanjiComplexity(word,target)*0.18+Math.max(0,[...word].length-3)*0.07+Math.max(0,[...reading].length-5)*0.025));
  }
  const sentence=normalizeContentText(entry?.text);
  return Math.max(0,Math.min(1,Math.max(0,[...sentence].length-12)*0.025+kanjiComplexity(sentence,target)*0.10));
}
export function selectAdaptiveContent(items,target='',options={}){
  const list=Array.isArray(items)?items.filter(Boolean):[];
  if(!list.length)return null;
  const attempts=Math.max(0,Number(options.attempts)||0);const rawAccuracy=Number(options.accuracy);const accuracy=Number.isFinite(rawAccuracy)?Math.max(0,Math.min(1,rawAccuracy)):0.5;
  const targetDifficulty=attempts<2?0.25:accuracy<0.6?0.25:accuracy>0.9?0.7:0.45;
  const kind=options.kind==='context'?'context':'vocabulary';
  return [...list].sort((a,b)=>Math.abs(contentDifficulty(a,target,kind)-targetDifficulty)-Math.abs(contentDifficulty(b,target,kind)-targetDifficulty)
    || contentDifficulty(a,target,kind)-contentDifficulty(b,target,kind)
    || codePointCompare(normalizeContentKey(kind==='context'?a?.text:a?.word),normalizeContentKey(kind==='context'?b?.text:b?.word))
    || codePointCompare(JSON.stringify(a),JSON.stringify(b)))[0]||null;
}
export function safeContentFallback(preferredModes,availableModes,fallbackModes=['meaning','reading','production']){
  const supported=new Set(Array.isArray(availableModes)?availableModes:[]);
  for(const mode of Array.isArray(preferredModes)?preferredModes:[])if(supported.has(mode))return mode;
  for(const mode of fallbackModes)if(supported.has(mode))return mode;
  return null;
}
