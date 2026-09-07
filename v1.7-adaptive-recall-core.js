(()=>{
'use strict';
if(typeof globalThis==='undefined')return;
const ATTRIBUTES=Object.freeze(['meaning','reading','production','vocabulary','context']);
const DEFAULT_WINDOW_DAYS=30;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
const asCount=value=>Math.max(0,Number(value)||0);
function normalizeAttributeStats(raw){
  const attempts=asCount(raw?.attempts);
  const correct=clamp(asCount(raw?.correct),0,attempts);
  const accuracy=attempts?correct/attempts:0;
  return Object.freeze({attempts,correct,accuracy});
}
function normalizeKnowledgeEntry(raw){
  const source=raw&&typeof raw==='object'?raw:{};
  return Object.freeze(Object.fromEntries(ATTRIBUTES.map(attribute=>[attribute,normalizeAttributeStats(source[attribute])])));
}
function scoreAttribute(raw,{now=Date.now(),windowDays=DEFAULT_WINDOW_DAYS}={}){
  const stats=normalizeAttributeStats(raw);
  const uncertainty=stats.attempts===0?0.25:1/Math.sqrt(stats.attempts+1);
  const weakness=1-stats.accuracy;
  const underSampled=Math.min(0.25,uncertainty*0.75);
  return clamp(weakness*0.7+underSampled,0,1);
}
function rankWeakAttributes(entry,options={}){
  const normalized=normalizeKnowledgeEntry(entry);
  return ATTRIBUTES.map(attribute=>({attribute,score:scoreAttribute(normalized[attribute],options),stats:normalized[attribute]}))
    .sort((a,b)=>b.score-a.score||ATTRIBUTES.indexOf(a.attribute)-ATTRIBUTES.indexOf(b.attribute));
}
function selectRecallAttributes(entry,{maxAttributes=2,minScore=0.15,...options}={}){
  const limit=Math.max(1,Math.min(ATTRIBUTES.length,Number(maxAttributes)||2));
  const ranked=rankWeakAttributes(entry,options);
  const selected=ranked.filter(item=>item.score>=minScore).slice(0,limit);
  return (selected.length?selected:ranked.slice(0,1)).map(item=>item.attribute);
}
function buildAdaptiveRecallPlan(knowledgeByCard,{cardId,maxAttributes=2,minScore=0.15,...options}={}){
  const entry=knowledgeByCard?.[cardId]||{};
  const attributes=selectRecallAttributes(entry,{maxAttributes,minScore,...options});
  return Object.freeze({schemaVersion:1,cardId:String(cardId||''),attributes,primary:attributes[0]||null,generatedAt:new Date(options.now||Date.now()).toISOString()});
}
const api=Object.freeze({ATTRIBUTES,normalizeKnowledgeEntry,scoreAttribute,rankWeakAttributes,selectRecallAttributes,buildAdaptiveRecallPlan});
globalThis.__KANJI5_V17_ADAPTIVE_RECALL__=api;
})();
