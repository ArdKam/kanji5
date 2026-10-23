(()=>{
'use strict';
if(typeof globalThis==='undefined'||globalThis.__KANJI5_V17_EVALUATION__)return;
const ATTRIBUTES=Object.freeze(['meaning','reading','production','vocabulary','context']);
const HISTORY_LIMIT=32;
const asCount=v=>Math.max(0,Number(v)||0);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
function normalizeHistory(raw){
  const source=Array.isArray(raw)?raw:[];
  return source.filter(item=>item&&typeof item==='object').slice(-HISTORY_LIMIT).map(item=>({correct:item.correct===true,at:String(item.at||'')}));
}
function normalizeStats(raw){
  const attempts=asCount(raw?.attempts);
  const correct=clamp(asCount(raw?.correct),0,attempts);
  const history=normalizeHistory(raw?.history);
  return {attempts,correct,accuracy:attempts?correct/attempts:0,history,uncertainty:attempts?1/Math.sqrt(attempts+1):0.25};
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
  return {errors,recoveryOpportunities,recoveries,recoveryRate:recoveryOpportunities?recoveries/recoveryOpportunities:0};
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
    out[attribute]=Object.freeze({cards,attempts,correct,accuracy:attempts?correct/attempts:0,errors,recoveryOpportunities,recoveries,recoveryRate:recoveryOpportunities?recoveries/recoveryOpportunities:0,uncertainty:attempts?1/Math.sqrt(attempts+1):0.25});
  }
  return Object.freeze(out);
}
function buildEvaluationReport(knowledgeByCard,{schemaVersion=1,generatedAt=new Date().toISOString()}={}){
  const attributes=buildAttributeMetrics(knowledgeByCard);
  const totals=Object.values(attributes).reduce((acc,s)=>({attempts:acc.attempts+s.attempts,correct:acc.correct+s.correct,errors:acc.errors+s.errors,recoveryOpportunities:acc.recoveryOpportunities+s.recoveryOpportunities,recoveries:acc.recoveries+s.recoveries}),{attempts:0,correct:0,errors:0,recoveryOpportunities:0,recoveries:0});
  return Object.freeze({schemaVersion,generatedAt,attributes,total:Object.freeze({...totals,accuracy:totals.attempts?totals.correct/totals.attempts:0,recoveryRate:totals.recoveryOpportunities?totals.recoveries/totals.recoveryOpportunities:0})});
}
function comparePolicyOutcomes(records){
  const groups={};
  for(const record of Array.isArray(records)?records:[]){
    const policy=String(record?.policy||'');
    if(!policy)continue;
    const attempts=asCount(record?.attempts||1),correct=clamp(asCount(record?.correct||0),0,attempts);
    const group=groups[policy]||{attempts:0,correct:0};
    group.attempts+=attempts;group.correct+=correct;groups[policy]=group;
  }
  return Object.freeze(Object.fromEntries(Object.entries(groups).map(([policy,s])=>[policy,Object.freeze({...s,accuracy:s.attempts?s.correct/s.attempts:0})])));
}
function chooseThresholdCandidate(candidates,rows,{minimumAttempts=1}={}){
  const valid=(Array.isArray(candidates)?candidates:[]).map(value=>Number(value)).filter(Number.isFinite);
  const scored=valid.map(threshold=>{
    const eligible=(Array.isArray(rows)?rows:[]).filter(row=>asCount(row?.attempts)>=minimumAttempts);
    const weak=eligible.filter(row=>Number(row?.weakness)>=threshold);
    const signal=weak.reduce((n,row)=>n+Number(row?.outcomeDelta||0),0);
    return {threshold,signal,sample:weak.length};
  }).sort((a,b)=>b.signal-a.signal||a.threshold-b.threshold);
  return scored[0]||null;
}
const api=Object.freeze({ATTRIBUTES,HISTORY_LIMIT,normalizeHistory,normalizeStats,summarizeHistory,summarizeAttribute,buildAttributeMetrics,buildEvaluationReport,comparePolicyOutcomes,chooseThresholdCandidate});
globalThis.__KANJI5_V17_EVALUATION__=api;
})();
