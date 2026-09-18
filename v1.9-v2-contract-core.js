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
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'session',sessionId:text(source.sessionId,120),status:text(source.status,40)||'unknown',resumed:bool(source.resumed),planRevision:Math.max(0,finite(source.planRevision,0)),remainingModes,modeResults,completed:source.status!=='active',updatedAt:text(source.updatedAt||source.endedAt,80)})
}

export function buildExerciseViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};const mode=MODES.includes(source.mode)?source.mode:null;
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'exercise',mode,prompt:text(source.prompt),character:text(source.character,16),answerHint:text(source.answerHint,240),contentId:text(source.contentId,120),contentVersion:text(source.contentVersion,80),provenance:text(source.provenance,120)})
}

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

export function buildAdaptiveReasonViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};const mode=MODES.includes(source.mode)?source.mode:null;
  const reasons=Array.isArray(source.reasons)?source.reasons.filter(v=>typeof v==='string').map(v=>text(v,160)).filter(Boolean).slice(0,5):[];
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'adaptive-reason',mode,action:text(source.action,60),reasons,score:finite(source.score,0)})
}

export function buildBoundarySnapshot(input={}){
  const source=input&&typeof input==='object'?input:{};
  const snapshot={contractVersion:V2_BOUNDARY_VERSION,session:buildSessionViewModel(source.session),exercise:buildExerciseViewModel(source.exercise),feedback:buildFeedbackViewModel(source.feedback),learner:buildLearnerSkillSummary(source.learner),sessionSummary:buildSessionSummary(source.session),adaptiveReason:buildAdaptiveReasonViewModel(source.adaptiveReason)};
  return Object.freeze(clone(snapshot));
}

export function isV2BoundarySnapshot(value){return Boolean(value&&value.contractVersion===V2_BOUNDARY_VERSION&&value.session?.kind==='session'&&value.exercise?.kind==='exercise'&&value.feedback?.kind==='feedback'&&value.learner?.kind==='learner-skill-summary'&&value.sessionSummary?.kind==='session-summary'&&value.adaptiveReason?.kind==='adaptive-reason')}
