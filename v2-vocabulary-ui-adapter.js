import { normalizeVocabularyItem } from './v2-vocabulary-core.js';
import { buildVocabularyContract } from './v2-vocabulary-contract-core.js';

export const VOCABULARY_UI_ADAPTER_SCHEMA_VERSION=1;
export const VOCABULARY_UI_ADAPTER='2.0.0-vocabulary-ui-adapter';

const safeObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const text=(value,limit=240)=>String(value??'').normalize('NFKC').trim().slice(0,limit);

function normalizeItems(items){
  const out=[];
  for(const raw of Array.isArray(items)?items:[]){
    try{out.push(normalizeVocabularyItem(raw));}catch(_){}
  }
  return out;
}

function readRecord(store,item){
  if(typeof store?.get!=='function')return null;
  const contentId=text(item?.contentId);
  try{
    const adapted=store.get(item);
    if(adapted&&typeof adapted==='object')return adapted;
  }catch(_){}
  try{
    const direct=store.get('vocabulary',contentId);
    return direct&&typeof direct==='object'?direct:null;
  }catch(_){
    return null;
  }
}

function readRecords(items,store){
  if(!store||typeof store.get!=='function')return {};
  const records={};
  for(const item of items){
    const contentId=text(item?.contentId);
    if(!contentId)continue;
    const record=readRecord(store,item);
    if(record)records[contentId]=record;
  }
  return records;
}

export function buildVocabularyPageContract(input={}){
  const value=safeObject(input);
  const items=normalizeItems(value.items);
  const recordsByContentId=value.recordsByContentId&&typeof value.recordsByContentId==='object'
    ? value.recordsByContentId
    : readRecords(items,value.evidenceStore);
  return buildVocabularyContract({
    items,
    recordsByContentId,
    filter:value.filter,
    limit:value.limit,
    selectedContentId:value.selectedContentId,
  });
}

export function createVocabularyUiAdapter({evidenceStore}={}){
  return Object.freeze({
    schemaVersion:VOCABULARY_UI_ADAPTER_SCHEMA_VERSION,
    contract:VOCABULARY_UI_ADAPTER,
    build(input={}){return buildVocabularyPageContract({...safeObject(input),evidenceStore});},
    records(items){return readRecords(normalizeItems(items),evidenceStore);},
  });
}
