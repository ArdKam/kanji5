(()=>{
'use strict';
if(typeof globalThis==='undefined'||globalThis.__KANJI5_V17_TUNING__)return;
const ATTRIBUTES=Object.freeze(['meaning','reading','production','vocabulary','context']);
const DEFAULT_THRESHOLDS=Object.freeze([0.10,0.15,0.20,0.25,0.30]);
const DEFAULT_HALF_LIFE_DAYS=Object.freeze([7,14,30,60]);
const asCount=v=>Math.max(0,Number(v)||0);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
function recencyWeight(at,now=Date.now(),halfLifeDays=30){
  const t=Date.parse(String(at||''));
  if(!Number.isFinite(t))return 1;
  const ageDays=Math.max(0,(Number(now)-t)/86400000);
  const halfLife=Math.max(1,Number(halfLifeDays)||30);
  return Math.pow(0.5,ageDays/halfLife);
}
function summarizeOutcomes(rows,{now=Date.now(),halfLifeDays=30}={}){
  const source=Array.isArray(rows)?rows:[];
  let weightedAttempts=0,weightedCorrect=0,attempts=0,correct=0;
  for(const row of source){const a=asCount(row?.attempts),c=clamp(asCount(row?.correct),0,a),w=recencyWeight(row?.at||row?.lastAt,now,halfLifeDays);attempts+=a;correct+=c;weightedAttempts+=a*w;weightedCorrect+=c*w}
  return Object.freeze({attempts,correct,accuracy:attempts?correct/attempts:0,weightedAttempts,weightedCorrect,weightedAccuracy:weightedAttempts?weightedCorrect/weightedAttempts:0,uncertainty:attempts?1/Math.sqrt(attempts+1):0.5});
}
function chooseThreshold(candidates,rows,{minimumAttempts=3}={}){
  const values=(Array.isArray(candidates)?candidates:DEFAULT_THRESHOLDS).map(Number).filter(Number.isFinite);
  const eligible=(Array.isArray(rows)?rows:[]).filter(row=>asCount(row?.attempts)>=minimumAttempts);
  if(!eligible.length)return Object.freeze({status:'insufficient-data',threshold:null,sample:0,signal:0});
  const scored=values.map(threshold=>{const selected=eligible.filter(row=>Number(row?.weakness)>=threshold);const signal=selected.reduce((n,row)=>n+Number(row?.outcomeDelta||0),0);return{threshold,signal,sample:selected.length}}).sort((a,b)=>b.signal-a.signal||a.threshold-b.threshold);
  const best=scored[0];
  return Object.freeze({status:best?'ready':'insufficient-data',threshold:best?.threshold??null,sample:best?.sample||0,signal:best?.signal||0});
}
function chooseRecencyHalfLife(candidates,rows,{minimumAttempts=3}={}){
  const values=(Array.isArray(candidates)?candidates:DEFAULT_HALF_LIFE_DAYS).map(Number).filter(v=>Number.isFinite(v)&&v>0);
  if(!Array.isArray(rows)||!rows.length)return Object.freeze({status:'insufficient-data',halfLifeDays:null,score:0});
  const scored=values.map(days=>{const summary=summarizeOutcomes(rows,{halfLifeDays:days});const score=summary.weightedAccuracy-summary.accuracy;return{halfLifeDays:days,score,summary}}).sort((a,b)=>b.score-a.score||a.halfLifeDays-b.halfLifeDays);
  const best=scored[0];
  return Object.freeze({status:best?'ready':'insufficient-data',halfLifeDays:best?.halfLifeDays??null,score:best?.score||0,summary:best?.summary||null});
}
function chooseSecondaryAttribute(ranked,{primary=null,minScore=0.15}={}){
  const list=Array.isArray(ranked)?ranked:[];
  const candidate=list.find(item=>item&&item.attribute!==primary&&ATTRIBUTES.includes(item.attribute)&&Number(item.score)>=Number(minScore));
  return candidate?.attribute||null;
}
function buildTuningRecommendation({thresholdRows=[],recencyRows=[],rankedAttributes=[]}={},options={}){
  const threshold=chooseThreshold(options.thresholds||DEFAULT_THRESHOLDS,thresholdRows,options);
  const recency=chooseRecencyHalfLife(options.halfLifeDays||DEFAULT_HALF_LIFE_DAYS,recencyRows,options);
  const secondary=chooseSecondaryAttribute(rankedAttributes,{primary:options.primary||null,minScore:options.secondaryMinScore??0.15});
  const ready=threshold.status==='ready'||recency.status==='ready'||Boolean(secondary);
  return Object.freeze({schemaVersion:1,status:ready?'ready':'insufficient-data',threshold,recency,secondaryAttribute:secondary,applied:false});
}
const api=Object.freeze({ATTRIBUTES,DEFAULT_THRESHOLDS,DEFAULT_HALF_LIFE_DAYS,recencyWeight,summarizeOutcomes,chooseThreshold,chooseRecencyHalfLife,chooseSecondaryAttribute,buildTuningRecommendation});
globalThis.__KANJI5_V17_TUNING__=api;
})();
