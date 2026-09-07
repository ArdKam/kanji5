(()=>{
'use strict';
if(typeof globalThis==='undefined'||globalThis.__KANJI5_V17_EVALUATION__)return;
const ATTRIBUTES=Object.freeze(['meaning','reading','production','vocabulary','context']);
const HISTORY_LIMIT=32;
const asCount=value=>Math.max(0,Number(value)||0);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
function normalizeHistory(raw){
  const source=Array.isArray(raw)?raw:[];
  return source.filter(item=>item&&typeof item==='object').slice(-HISTORY_LIMIT).map(item=>({correct:item.correct===true,at:String(item.at||'')}));
}
function normalizeStats(raw){
  const attempts=asCount(raw?.attempts);
  const correct=clamp(asCount(raw?.correct),0,attempts);
  const history=normalizeHistory(raw?.history);
  return {attempts,correct,accuracy:attempts?correct/attempts:0,history,uncertainty:attempts?Math.sqrt((correct/attempts)*(1-correct/attempts)/attempts):0.5};
}
function summarizeHistory(history){
  const normalized=normalizeHistory(history);
  let errors=0,recoveryOpportunities=0,recoveries=0;
  for(let i=0;i<normalized.length;i+=1){
    if(normalized[i].correct)continue;
    errors+=1;
    const next=normalized[i+1];
    if(next){recoveryOpportunities+=1;if(next.correct)recoveries+=1;}
  }
  return {errors,recoveryOpportunities,recoveries,recoveryRate:recoveryOpportunities?recoveries/recoveryOpportunities:null};
}
function summarizeAttribute(raw){
  const stats=normalizeStats(raw),history=summarizeHistory(stats.history);
  return Object.freeze({...stats,...history});
}
function buildAttributeMetrics(knowledgeByCard){
  const out={};
  for(const attribute of ATTRIBUTES){
    let attempts=0,correct=0,errors=0,recoveryOpportunities=0,recoveries=0,cards=0;
    for(const entry of Object.values(knowledgeByCard&&typeof knowledgeByCard==='object'?knowledgeByCard:{})){
      const summary=summarizeAttribute(entry?.[attribute]);
      if(summary.attempts)cards+=1;
      attempts+=summary.attempts;correct+=summary.correct;errors+=summary.errors;recoveryOpportunities+=summary.recoveryOpportunities;recoveries+=summary.recoveries;
    }
    const accuracy=attempts?correct/attempts:0;
    out[attribute]=Object.freeze({cards,attempts,correct,accuracy,errors,recoveryOpportunities,recoveries,recoveryRate:recoveryOpportunities?recoveries/recoveryOpportunities:null,uncertainty:attempts?Math.sqrt(accuracy*(1-accuracy)/attempts):0.5});
  }
  return Object.freeze(out);
}
function buildEvaluationReport(knowledgeByCard,{schemaVersion=1,generatedAt=new Date().toISOString()}={}){
  const attributes=buildAttributeMetrics(knowledgeByCard);
  const totals=Object.values(attributes).reduce((acc,s)=>({attempts:acc.attempts+s.attempts,correct:acc.correct+s.correct,errors:acc.errors+s.errors,recoveryOpportunities:acc.recoveryOpportunities+s.recoveryOpportunities,recoveries:acc.recoveries+s.recoveries}),{attempts:0,correct:0,errors:0,recoveryOpportunities:0,recoveries:0});
  const accuracy=totals.attempts?totals.correct/totals.attempts:0;
  return Object.freeze({schemaVersion,generatedAt,attributes,total:Object.freeze({...totals,accuracy,recoveryRate:totals.recoveryOpportunities?totals.recoveries/totals.recoveryOpportunities:null,uncertainty:totals.attempts?Math.sqrt(accuracy*(1-accuracy)/totals.attempts):0.5})});
}
const api=Object.freeze({ATTRIBUTES,HISTORY_LIMIT,normalizeHistory,normalizeStats,summarizeHistory,summarizeAttribute,buildAttributeMetrics,buildEvaluationReport});
globalThis.__KANJI5_V17_EVALUATION__=api;
})();
