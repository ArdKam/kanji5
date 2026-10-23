import { validateVocabularyList, validateContextList, selectDeterministic, selectAdaptiveContent } from './v1.9-data-quality-core.js';
import { normalizeVocabularyItem } from './v2-vocabulary-core.js';
import { canonicalContentId } from './v2-domain-core.js';

const API_ORIGIN='https://kanjiapi.dev';
const TATOEBA_ORIGIN='https://api.tatoeba.org';
const TATOEBA_REUSABLE_TEXT_LICENSES=new Set(['CC BY 2.0 FR','CC0 1.0']);
function stableContentHash(value){
  let h=2166136261;
  const source=String(value??'');
  for(let i=0;i<source.length;i++){h^=source.charCodeAt(i);h=Math.imul(h,16777619)}
  return (h>>>0).toString(16).padStart(8,'0');
}
function sentenceContentId(id,text,english){
  const stableId=String(id??'').trim();
  if(stableId)return canonicalContentId('context','tatoeba:'+stableId);
  return canonicalContentId('context','tatoeba:'+stableContentHash(String(text??'')+'|'+String(english??'')));
}
function tatoebaSentenceUrl(id){
  const normalized=String(id??'').trim();
  return /^\d+$/.test(normalized)?`https://tatoeba.org/en/sentences/show/${normalized}`:null;
}


async function requestJSONResult(url){
  try{
    const response=await fetch(url,{cache:'force-cache'});
    if(response.headers?.get?.('X-Kanji5-Offline-Fallback')==='1'){
      return {availability:'offline',data:null};
    }
    if(!response.ok){
      globalThis.__KANJI5_OBSERVABILITY__?.capture?.('network-request-failure',new Error(`Network request failed (${response.status})`),{endpoint:new URL(url).pathname,status:response.status,dataAffected:'false'});
      return {availability:'unavailable',data:null};
    }
    return {availability:'available',data:await response.json()};
  }catch(error){
    globalThis.__KANJI5_OBSERVABILITY__?.capture?.('network-request-failure',error,{endpoint:(()=>{try{return new URL(url).pathname}catch(_){return 'unknown'}})(),dataAffected:'false'});
    return {availability:'unavailable',data:null};
  }
}

async function requestJSON(url){
  const result=await requestJSONResult(url);
  return result.availability==='available'?result.data:null;
}

export async function fetchWordsResult(character){
  const result=await requestJSONResult(`${API_ORIGIN}/v1/words/${encodeURIComponent(character)}`);
  if(result.availability!=='available')return {availability:result.availability,items:[]};
  if(!Array.isArray(result.data))return {availability:'unavailable',items:[]};
  const data=result.data;
  const out=[],seen=new Set();
  for(const entry of data){
    for(const variant of Array.isArray(entry?.variants)?entry.variants:[]){
      const word=typeof variant?.written==='string'?variant.written:'';
      const reading=typeof variant?.pronounced==='string'?variant.pronounced:'';
      const meaning=(Array.isArray(entry?.meanings)?entry.meanings:[])
        .flatMap(m=>Array.isArray(m?.glosses)?m.glosses:[])
        .filter(gloss=>typeof gloss==='string')
        .slice(0,2)
        .join('; ');
      const variantKey=`${word}|${reading}`;
      if(!word.includes(character)||!reading||!meaning||seen.has(variantKey))continue;
      seen.add(variantKey);
      out.push(normalizeVocabularyItem({word,reading,meaning,source:'kanjiapi.dev'}));
      if(out.length>=24)break;
    }
    if(out.length>=24)break;
  }
  return {availability:'available',items:validateVocabularyList(out,character).items.slice(0,12)};
}

export async function fetchWords(character){
  return (await fetchWordsResult(character)).items;
}

export async function fetchContextSentences(character){
  const url=new URL(`${TATOEBA_ORIGIN}/v1/sentences`);
  url.searchParams.set('lang','jpn');
  url.searchParams.set('q',character);
  url.searchParams.set('trans:lang','eng');
  url.searchParams.set('trans:is_direct','yes');
  url.searchParams.set('is_orphan','no');
  url.searchParams.set('is_unapproved','no');
  // Keep only sentence records with explicitly reusable text licenses.
  url.searchParams.append('license','CC BY 2.0 FR');
  url.searchParams.append('license','CC0 1.0');
  url.searchParams.set('sort','relevance');
  url.searchParams.set('limit','24');
  const payload=await requestJSON(url.toString());
  const rows=Array.isArray(payload?.data)?payload.data:[];
  const out=[],seen=new Set();
  for(const row of rows){
    const text=String(row?.text||'').trim();
    if(!text||!text.includes(character)||seen.has(text)||!TATOEBA_REUSABLE_TEXT_LICENSES.has(row?.license))continue;
    const translations=Array.isArray(row?.translations)?row.translations:[];
    const translation=translations.flatMap(x=>Array.isArray(x)?x:[x])
      .find(value=>typeof value?.text==='string'&&value.text.trim()&&TATOEBA_REUSABLE_TEXT_LICENSES.has(value.license));
    const english=typeof translation?.text==='string'?translation.text.trim():'';
    if(!english)continue;
    seen.add(text);
    out.push({
      id:row?.id||'',
      text,
      english,
      contentId:sentenceContentId(row?.id,text,english),
      source:'tatoeba',
      sourceUrl:tatoebaSentenceUrl(row?.id),
      sourceOwner:typeof row?.owner==='string'?row.owner:null,
      sourceLicense:typeof row?.license==='string'?row.license:null,
      translationId:translation?.id??null,
      translationUrl:tatoebaSentenceUrl(translation?.id),
      translationOwner:typeof translation?.owner==='string'?translation.owner:null,
      translationLicense:typeof translation?.license==='string'?translation.license:null
    });
    if(out.length>=16)break;
  }
  return validateContextList(out,character).items.slice(0,8);
}

export function selectWord(words,options={}){
  const target=String(options.target||'');
  if(options.adaptive)return selectAdaptiveContent(words,target,{kind:'vocabulary',attempts:options.attempts,accuracy:options.accuracy});
  return selectDeterministic(words,x=>`${x?.word||''}|${x?.reading||''}`);
}

export function selectContextSentence(sentences,options={}){
  const target=String(options.target||'');
  if(options.adaptive)return selectAdaptiveContent(sentences,target,{kind:'context',attempts:options.attempts,accuracy:options.accuracy});
  return selectDeterministic(sentences,x=>`${x?.text||''}|${x?.english||''}`);
}
