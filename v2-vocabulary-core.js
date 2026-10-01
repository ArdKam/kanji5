import { canonicalContentId } from './v2-domain-core.js';

export const VOCABULARY_SCHEMA_VERSION=1;
export const VOCABULARY_DOMAIN='vocabulary';
const MAX_TEXT=240;
const MAX_GLOSS=160;
const MAX_GLOSSES=8;
const JAPANESE_KANJI_RE=/[\\u3400-\\u9fff]/;

function text(value,max=MAX_TEXT){
  return String(value??'').normalize('NFKC').replace(/[ \\t\\r\\n]+/g,' ').trim().slice(0,max);
}

export function normalizeVocabularyText(value){
  return text(value,MAX_TEXT);
}

export function stableVocabularyHash(value){
  let hash=2166136261;
  const source=String(value??'');
  for(let i=0;i<source.length;i++){
    hash^=source.charCodeAt(i);
    hash=Math.imul(hash,16777619);
  }
  return (hash>>>0).toString(16).padStart(8,'0');
}

function normalizedGlosses(entry){
  const raw=Array.isArray(entry?.glosses)
    ? entry.glosses
    : Array.isArray(entry?.meanings)
      ? entry.meanings
      : typeof entry?.meaning==='string'
        ? entry.meaning.split(';')
        : [];
  const values=raw.map(value=>text(value,MAX_GLOSS)).filter(Boolean);
  return [...new Set(values)].slice(0,MAX_GLOSSES);
}

function linkedKanjiFromWritten(written){
  const explicit=Array.isArray(written?.linkedKanji)?written.linkedKanji:[];
  const source=String(written?.written??'');
  const discovered=[...source].filter(character=>JAPANESE_KANJI_RE.test(character));
  return [...new Set([...explicit,...discovered]
    .map(value=>text(value,8))
    .flatMap(value=>[...value])
    .filter(character=>JAPANESE_KANJI_RE.test(character)))].sort();
}

function stableSourceId(entry){
  return text(entry?.sourceId||entry?.id,160);
}

export function vocabularyContentId(entry,options={}){
  const source=text(options.source||entry?.source||'kanjiapi.dev',64).toLowerCase()||'unknown';
  const sourceId=stableSourceId(entry);
  if(sourceId)return canonicalContentId(VOCABULARY_DOMAIN,source+':'+sourceId);
  const written=text(entry?.written||entry?.word);
  const reading=text(entry?.reading);
  if(!written||!reading)throw new Error('VOCABULARY_CONTENT_ID_REQUIRES_WORD_AND_READING');
  return canonicalContentId(VOCABULARY_DOMAIN,source+':'+stableVocabularyHash(written+'|'+reading));
}

export function normalizeVocabularyItem(entry,options={}){
  const source=text(options.source||entry?.source||'kanjiapi.dev',64).toLowerCase()||'unknown';
  const written=text(entry?.written||entry?.word);
  const reading=text(entry?.reading);
  const glosses=normalizedGlosses(entry);
  const linkedKanji=linkedKanjiFromWritten({written,linkedKanji:options.linkedKanji||entry?.linkedKanji});
  const contentId=text(entry?.contentId,MAX_TEXT)||vocabularyContentId(entry,options);
  const provenance={
    source,
    sourceVersion:text(options.sourceVersion||entry?.sourceVersion,80)||null,
    sourceId:stableSourceId(entry)||null
  };
  return {
    schemaVersion:VOCABULARY_SCHEMA_VERSION,
    domain:VOCABULARY_DOMAIN,
    contentId,
    written,
    reading,
    lemma:text(entry?.lemma||written,MAX_TEXT),
    glosses,
    partOfSpeech:Array.isArray(entry?.partOfSpeech)
      ? [...new Set(entry.partOfSpeech.map(value=>text(value,80)).filter(Boolean))].slice(0,8)
      : typeof entry?.partOfSpeech==='string'
        ? [text(entry.partOfSpeech,80)].filter(Boolean)
        : [],
    linkedKanji:linkedKanji.map(character=>canonicalContentId('kanji',character)),
    provenance,
    word:written,
    meaning:glosses.join('; ')
  };
}

export function validateVocabularyItem(item){
  const value=item&&typeof item==='object'?item:{};
  const reasons=[];
  if(value.schemaVersion!==VOCABULARY_SCHEMA_VERSION)reasons.push('schema_version');
  if(value.domain!==VOCABULARY_DOMAIN)reasons.push('domain');
  if(!text(value.contentId))reasons.push('missing_content_id');
  if(!text(value.written))reasons.push('missing_written');
  if(!text(value.reading))reasons.push('missing_reading');
  if(!Array.isArray(value.glosses)||!value.glosses.length)reasons.push('missing_glosses');
  if(value.provenance?.source&&!text(value.provenance.source))reasons.push('invalid_source');
  return {valid:reasons.length===0,reasons};
}

export function normalizeVocabularyList(items,options={}){
  const accepted=[];
  const rejected=[];
  const seen=new Set();
  for(const raw of Array.isArray(items)?items:[]){
    try{
      const item=normalizeVocabularyItem(raw,options);
      const checked=validateVocabularyItem(item);
      if(!checked.valid){rejected.push({entry:raw,reasons:checked.reasons});continue}
      if(seen.has(item.contentId))continue;
      seen.add(item.contentId);
      accepted.push(item);
    }catch(error){
      rejected.push({entry:raw,reasons:[error?.message||'invalid_vocabulary_item']});
    }
  }
  return {version:VOCABULARY_SCHEMA_VERSION,domain:VOCABULARY_DOMAIN,items:accepted,rejected};
}

export function vocabularyRelatesToKanji(item,character){
  const key=text(character,8);
  if(!key)return false;
  const contentId=canonicalContentId('kanji',key);
  return Array.isArray(item?.linkedKanji)&&item.linkedKanji.includes(contentId);
}

export function filterVocabularyByKanji(items,character){
  return (Array.isArray(items)?items:[]).filter(item=>vocabularyRelatesToKanji(item,character));
}
