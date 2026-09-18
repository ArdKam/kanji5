export const V2_BOUNDARY_VERSION='1.9.0-v2-boundary-contract';
export const MODES=Object.freeze(['meaning','reading','production','vocabulary','context']);
export const OUTCOMES=Object.freeze(['correct','wrong','unknown','near_miss','empty','invalid']);
function text(value,max=240){const s=String(value??'').trim();return s.slice(0,max)}
function finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function bool(value){return value===true}
function clone(value){return JSON.parse(JSON.stringify(value))}

export function buildSessionViewModel(session){
  const source=session&&typeof session==='object'?session:{};
  const remainingModes={};for(const mode of MODES)remainingModes[mode]=Math.max(0,finite(source.remainingModes?.[mode],0));
  const modeResults={};for(const mode of MODES){const s=source.modeResults?.[mode]||{};modeResults[mode]={attempts:Math.max(0,finite(s.attempts,0)),correct:Math.max(0,finite(s.correct,0)),lastOutcome:OUTCOMES.includes(s.lastOutcome)?s.lastOutcome:null,lastAt:text(s.lastAt,80),graderVersion:text(s.graderVersion,80)}}
  const plannedTotal=Math.max(0,finite((source.plan?.modes||[]).reduce((sum,item)=>sum+finite(item?.plannedCount,0),0),0));
  const remainingTotal=MODES.reduce((sum,mode)=>sum+remainingModes[mode],0);
  const effectivePlanned=plannedTotal||remainingTotal;
  const completionFraction=source.status==='active'&&effectivePlanned>0?Math.max(0,Math.min(1,(effectivePlanned-remainingTotal)/effectivePlanned)):source.status==='active'?0:1;
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'session',sessionId:text(source.sessionId,120),status:text(source.status,40)||'unknown',resumed:bool(source.resumed),planRevision:Math.max(0,finite(source.planRevision,0)),remainingModes,modeResults,plannedTotal:effectivePlanned,remainingTotal,completionFraction,completed:source.status!=='active',updatedAt:text(source.updatedAt||source.endedAt,80)})
}

export function buildExerciseViewModel(input={}){const source=input&&typeof input==='object'?input:{};const mode=MODES.includes(source.mode)?source.mode:null;const stimulus=source.stimulus&&typeof source.stimulus==='object'?source.stimulus:{};return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'exercise',mode,prompt:text(source.prompt),character:text(source.character,16),stimulus:Object.freeze({kind:text(stimulus.kind,40),primary:text(stimulus.primary,2400),secondary:text(stimulus.secondary,1200),translation:text(stimulus.translation,1200),inputPlaceholder:text(stimulus.inputPlaceholder,160)}),choices:Object.freeze(Array.isArray(source.choices)?source.choices.map(value=>text(value,16)).filter(Boolean).slice(0,4):[]),answerHint:text(source.answerHint,2400),contentId:text(source.contentId,120),contentVersion:text(source.contentVersion,80),provenance:text(source.provenance,120)})}

export function buildFeedbackViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};const mode=MODES.includes(source.mode)?source.mode:null;const outcome=OUTCOMES.includes(source.outcome)?source.outcome:null;
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'feedback',mode,outcome,correct:bool(source.correct),quality:text(source.quality,80),score:Math.max(0,Math.min(1,finite(source.score,0))),graderVersion:text(source.graderVersion,80),schemaVersion:Math.max(0,finite(source.schemaVersion,0)),reason:text(source.reason,240),recovered:bool(source.recovered),retryCount:Math.max(0,finite(source.retryCount,0)),state:text(source.state,60)})
}

export function buildLearnerSkillSummary(model){
  const source=model&&typeof model==='object'?model:{};const attrs={};for(const mode of MODES){const a=source.attributes?.[mode]||{};attrs[mode]={state:text(a.state,40)||'unseen',accuracy:Math.max(0,Math.min(1,finite(a.accuracy,0))),recentAccuracy:Math.max(0,Math.min(1,finite(a.recentAccuracy,0))),confidence:Math.max(0,Math.min(1,finite(a.confidence,0))),momentum:Math.max(-1,Math.min(1,finite(a.momentum,0))),repeatedFailure:bool(a.repeatedFailure)}}
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'learner-skill-summary',modelVersion:text(source.version,80)||text(source.modelVersion,80),attributes:attrs})
}

export function buildSessionSummary(session){
  const source=session&&typeof session==='object'?session:{};const modeResults=source.modeResults||{};let attempts=0,correct=0;for(const mode of MODES){attempts+=Math.max(0,finite(modeResults[mode]?.attempts,0));correct+=Math.max(0,finite(modeResults[mode]?.correct,0))}
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'session-summary',sessionId:text(source.sessionId,120),attempts,correct,accuracy:attempts?Math.max(0,Math.min(1,correct/attempts)):0,completionStatus:source.status==='active'?'active':'complete'})
}

export function buildRecentOutcomesViewModel(input=[]){
  const rows=Array.isArray(input)?input:[];
  return rows.slice(0,8).map(source=>Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'recent-outcome',character:text(source?.character,16),mode:MODES.includes(source?.mode)?source.mode:null,outcome:OUTCOMES.includes(source?.outcome)?source.outcome:null,correct:bool(source?.correct),quality:text(source?.quality,80),score:Math.max(0,Math.min(1,finite(source?.score,0))),at:text(source?.at,80)}));
}

export function buildAdaptiveReasonViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};const mode=MODES.includes(source.mode)?source.mode:null;
  const reasons=Array.isArray(source.reasons)?source.reasons.filter(v=>typeof v==='string').map(v=>text(v,160)).filter(Boolean).slice(0,5):[];
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'adaptive-reason',mode,action:text(source.action,60),reasons,score:finite(source.score,0)})
}

export function buildBoundarySnapshot(input={}){
  const source=input&&typeof input==='object'?input:{};
  const snapshot={contractVersion:V2_BOUNDARY_VERSION,session:buildSessionViewModel(source.session),exercise:buildExerciseViewModel(source.exercise),feedback:buildFeedbackViewModel(source.feedback),learner:buildLearnerSkillSummary(source.learner),sessionSummary:buildSessionSummary(source.session),recentOutcomes:buildRecentOutcomesViewModel(source.recentOutcomes),adaptiveReason:buildAdaptiveReasonViewModel(source.adaptiveReason)};
  return Object.freeze(clone(snapshot));
}

export function isV2BoundarySnapshot(value){return Boolean(value&&value.contractVersion===V2_BOUNDARY_VERSION&&value.session?.kind==='session'&&value.exercise?.kind==='exercise'&&value.feedback?.kind==='feedback'&&value.learner?.kind==='learner-skill-summary'&&value.sessionSummary?.kind==='session-summary'&&Array.isArray(value.recentOutcomes)&&value.adaptiveReason?.kind==='adaptive-reason')}
