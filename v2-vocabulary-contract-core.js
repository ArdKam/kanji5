import { buildVocabularyItemViewModel } from './v2-vocabulary-view-core.js';

export const VOCABULARY_CONTRACT_SCHEMA_VERSION=1;
export const VOCABULARY_CONTRACT='2.0.0-vocabulary-contract';

const STATES=Object.freeze(['unseen','introduced','retrievable','stable']);
const STAGES=Object.freeze(['introduction','guided','retrieval']);

const safeObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const text=(value,limit=240)=>String(value??'').normalize('NFKC').trim().slice(0,limit);

function normalizeLimit(value,fallback=50){
  const n=Number(value);
  return Number.isFinite(n)?Math.max(1,Math.min(200,Math.floor(n))):fallback;
}

function normalizeItems(items,recordsByContentId){
  const records=safeObject(recordsByContentId);
  return (Array.isArray(items)?items:[])
    .map(item=>buildVocabularyItemViewModel(item,records[item?.contentId]))
    .filter(item=>item&&item.contentId);
}

function matchesFilter(item,filter){
  const value=safeObject(filter);
  if(value.contentId&&item.contentId!==text(value.contentId))return false;
  if(value.state&&item.state!==String(value.state))return false;
  if(value.status&&item.status!==String(value.status))return false;
  if(value.stage&&item.contentStage!==String(value.stage))return false;
  if(value.kanji&&!(Array.isArray(item.linkedKanji)&&item.linkedKanji.includes(text(value.kanji))))return false;
  return true;
}

function summarize(items){
  const counts={
    total:items.length,
    states:Object.fromEntries(STATES.map(state=>[state,0])),
    stages:Object.fromEntries(STAGES.map(stage=>[stage,0])),
    status:{new:0,learning:0,retrievable:0,stable:0},
  };
  for(const item of items){
    if(counts.states[item.state]!=null)counts.states[item.state]++;
    if(counts.stages[item.contentStage]!=null)counts.stages[item.contentStage]++;
    if(counts.status[item.status]!=null)counts.status[item.status]++;
  }
  return counts;
}

export function buildVocabularyContract(input={}){
  const value=safeObject(input);
  const all=normalizeItems(value.items,value.recordsByContentId);
  const filtered=all.filter(item=>matchesFilter(item,value.filter));
  const limit=normalizeLimit(value.limit);
  const selectedId=text(value.selectedContentId);
  const selected=selectedId?filtered.find(item=>item.contentId===selectedId)||null:null;
  const visible=filtered.slice(0,limit);

  return Object.freeze({
    contractVersion:VOCABULARY_CONTRACT,
    schemaVersion:VOCABULARY_CONTRACT_SCHEMA_VERSION,
    kind:'vocabulary-contract',
    domain:'vocabulary',
    summary:Object.freeze(summarize(filtered)),
    total:filtered.length,
    limit,
    hasMore:filtered.length>visible.length,
    selectedContentId:selected?.contentId||null,
    selected,
    items:Object.freeze(visible),
  });
}

export function selectVocabularyContractItem(contract,contentId){
  const source=safeObject(contract);
  const id=text(contentId);
  if(!id)return null;
  return (Array.isArray(source.items)?source.items:[]).find(item=>item.contentId===id)||null;
}
