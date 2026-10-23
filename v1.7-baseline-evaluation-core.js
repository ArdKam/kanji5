(()=>{
'use strict';
// P2-B: compare only explicitly persisted adaptive/baseline learner outcomes.
if(typeof globalThis==='undefined'||globalThis.__KANJI5_V17_BASELINE_EVALUATION__)return;
const STRATEGIES=Object.freeze(['adaptive','baseline']);
const ATTRIBUTES=Object.freeze(['meaning','reading','production','vocabulary','context']);
const asCount=value=>Math.max(0,Number(value)||0);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
function normalizeModeResults(raw){
  const out={};
  for(const attribute of ATTRIBUTES){
    const value=raw?.[attribute]||{};
    const attempts=asCount(value.attempts);
    const correct=clamp(asCount(value.correct),0,attempts);
    out[attribute]={attempts,correct,accuracy:attempts?correct/attempts:0};
  }
  return out;
}
function normalizeSession(raw){
  if(!raw||typeof raw!=='object'||raw.status)return null;
  const strategy=String(raw.evaluationStrategy||'');
  if(!STRATEGIES.includes(strategy))return null;
  const modeResults=normalizeModeResults(raw.modeResults);
  const attempts=Object.values(modeResults).reduce((sum,row)=>sum+row.attempts,0);
  if(!attempts)return null;
  const correct=Object.values(modeResults).reduce((sum,row)=>sum+row.correct,0);
  return Object.freeze({sessionId:String(raw.sessionId||''),strategy,evaluationSchemaVersion:Number(raw.evaluationSchemaVersion)||0,modeResults,attempts,correct,accuracy:correct/attempts,endedAt:String(raw.endedAt||'')});
}
function summarizeSessions(sessions,strategy){
  const normalized=(Array.isArray(sessions)?sessions:[]).map(item=>item?.strategy&&item?.modeResults?item:normalizeSession(item)).filter(Boolean).filter(session=>session.strategy===strategy);
  let attempts=0,correct=0;
  const attributes={};
  for(const attribute of ATTRIBUTES){let a=0,c=0;for(const session of normalized){a+=session.modeResults[attribute].attempts;c+=session.modeResults[attribute].correct}attributes[attribute]={attempts:a,correct:c,accuracy:a?c/a:0}}
  for(const session of normalized){attempts+=session.attempts;correct+=session.correct}
  const accuracy=attempts?correct/attempts:0;
  return Object.freeze({strategy,sessions:normalized.length,attempts,correct,accuracy,uncertainty:attempts?Math.sqrt(accuracy*(1-accuracy)/attempts):0.5,attributes:Object.freeze(attributes)});
}
function compareStrategies(sessions,{minSessions=1,minAttempts=1}={}){
  const raw=Array.isArray(sessions)?sessions:[];
  const eligible=raw.map(normalizeSession).filter(Boolean);
  const adaptive=summarizeSessions(eligible,'adaptive');
  const baseline=summarizeSessions(eligible,'baseline');
  const enough=adaptive.sessions>=minSessions&&baseline.sessions>=minSessions&&adaptive.attempts>=minAttempts&&baseline.attempts>=minAttempts;
  return Object.freeze({schemaVersion:1,status:enough?'ready':'insufficient-data',adaptive,baseline,delta:Object.freeze({accuracy:enough?adaptive.accuracy-baseline.accuracy:null,attempts:adaptive.attempts-baseline.attempts}),evidence:Object.freeze({eligibleSessions:eligible.length,excludedSessions:raw.length-eligible.length,minSessions,minAttempts})});
}
function buildPersistedOutcomeReport(sessionHistory,options={}){return compareStrategies(sessionHistory,options)}
const api=Object.freeze({STRATEGIES,ATTRIBUTES,normalizeModeResults,normalizeSession,summarizeSessions,compareStrategies,buildPersistedOutcomeReport});
globalThis.__KANJI5_V17_BASELINE_EVALUATION__=api;
})();
