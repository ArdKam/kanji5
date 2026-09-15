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

export function safeContentFallback(preferredModes,availableModes,fallbackModes=['meaning','reading','production']){
  const supported=new Set(Array.isArray(availableModes)?availableModes:[]);
  for(const mode of Array.isArray(preferredModes)?preferredModes:[])if(supported.has(mode))return mode;
  for(const mode of fallbackModes)if(supported.has(mode))return mode;
  return null;
}
