const API_ORIGIN='https://kanjiapi.dev';
const TATOEBA_ORIGIN='https://api.tatoeba.org';

async function requestJSON(url){
  try{
    const response=await fetch(url,{cache:'force-cache'});
    if(!response.ok)return null;
    return await response.json();
  }catch(_){
    return null;
  }
}

export async function fetchWords(character){
  const data=await requestJSON(`${API_ORIGIN}/v1/words/${encodeURIComponent(character)}`);
  if(!Array.isArray(data))return [];
  const out=[],seen=new Set();
  for(const entry of data){
    for(const variant of Array.isArray(entry?.variants)?entry.variants:[]){
      const word=String(variant?.written||'');
      const reading=String(variant?.pronounced||'');
      if(!word.includes(character)||!reading||seen.has(word))continue;
      seen.add(word);
      out.push({word,reading,meaning:(Array.isArray(entry?.meanings)?entry.meanings:[]).flatMap(m=>Array.isArray(m?.glosses)?m.glosses:[]).slice(0,2).join('; ')});
      if(out.length>=12)break;
    }
    if(out.length>=12)break;
  }
  return out;
}

export async function fetchContextSentences(character){
  const url=new URL(`${TATOEBA_ORIGIN}/v1/sentences`);
  url.searchParams.set('lang','jpn');
  url.searchParams.set('q',character);
  url.searchParams.set('trans:lang','eng');
  url.searchParams.set('trans:is_direct','yes');
  url.searchParams.set('is_orphan','no');
  url.searchParams.set('is_unapproved','no');
  url.searchParams.set('limit','12');
  const payload=await requestJSON(url.toString());
  const rows=Array.isArray(payload?.data)?payload.data:[];
  const out=[],seen=new Set();
  for(const row of rows){
    const text=String(row?.text||'').trim();
    if(!text||!text.includes(character)||seen.has(text))continue;
    const translations=Array.isArray(row?.translations)?row.translations:[];
    const english=translations.flatMap(x=>Array.isArray(x)?x:[x]).map(x=>String(x?.text||'').trim()).find(Boolean)||'';
    if(!english)continue;
    seen.add(text);
    out.push({id:row?.id||'',text,english});
    if(out.length>=8)break;
  }
  return out;
}
