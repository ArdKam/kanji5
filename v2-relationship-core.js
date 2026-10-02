import { canonicalContentId, isDomain } from './v2-domain-core.js';

export const RELATIONSHIP_SCHEMA_VERSION=1;

const RELATION_KINDS=Object.freeze([
  'vocabulary-kanji',
  'vocabulary-context',
  'grammar-vocabulary',
  'grammar-context'
]);

const text=(value,max=240)=>String(value??'').normalize('NFKC').trim().slice(0,max);

export function canonicalRelationship({fromDomain,fromContentId,toDomain,toContentId,kind,sourceVersion='1'}={}){
  const from=String(fromDomain??'').trim().toLowerCase();
  const to=String(toDomain??'').trim().toLowerCase();
  const relation=text(kind,64);
  if(!isDomain(from)||!isDomain(to))throw new Error('INVALID_KANJI5_RELATIONSHIP_DOMAIN');
  if(!RELATION_KINDS.includes(relation))throw new Error('INVALID_KANJI5_RELATIONSHIP_KIND');
  const fromId=canonicalContentId(from,fromContentId);
  const toId=canonicalContentId(to,toContentId);
  return Object.freeze({
    schemaVersion:RELATIONSHIP_SCHEMA_VERSION,
    kind:relation,
    fromDomain:from,
    fromContentId:fromId,
    toDomain:to,
    toContentId:toId,
    sourceVersion:text(sourceVersion,80)||'1'
  });
}

export function buildVocabularyKanjiRelations(item){
  const fromId=text(item?.contentId);
  if(!fromId)return [];
  const targets=Array.isArray(item?.linkedKanji)?item.linkedKanji:[];
  return uniqueRelationships(targets.map(toContentId=>canonicalRelationship({
    fromDomain:'vocabulary',
    fromContentId:fromId,
    toDomain:'kanji',
    toContentId:toContentId,
    kind:'vocabulary-kanji',
    sourceVersion:item?.sourceVersion||item?.provenance?.sourceVersion||'1'
  })));
}

export function buildVocabularyContextRelations(vocabularyItem,contextItems){
  const fromId=text(vocabularyItem?.contentId);
  if(!fromId||!Array.isArray(contextItems))return [];
  const written=text(vocabularyItem?.written||vocabularyItem?.word,120);
  if(!written)return [];
  return uniqueRelationships(contextItems
    .filter(context=>text(context?.contentId)&&text(context?.text).includes(written))
    .map(context=>canonicalRelationship({
      fromDomain:'vocabulary',
      fromContentId:fromId,
      toDomain:'context',
      toContentId:context.contentId,
      kind:'vocabulary-context',
      sourceVersion:context?.sourceVersion||context?.provenance?.sourceVersion||'1'
    })));
}

function uniqueRelationships(rows){
  const seen=new Set();
  return rows.filter(row=>{
    const key=row.kind+'|'+row.fromContentId+'|'+row.toContentId;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  }).sort((a,b)=>
    a.kind.localeCompare(b.kind)
    || a.fromContentId.localeCompare(b.fromContentId)
    || a.toContentId.localeCompare(b.toContentId)
  );
}

export { RELATION_KINDS };
