import { DOMAIN_SCHEMA_VERSION, legacyEducationDefinition } from './v2-domain-core.js';
import { buildLearnerContent, selectLearnerExamples } from './v1.9-learner-content-core.js';

export const V2_BOUNDARY_VERSION='1.9.0-v2-boundary-contract';
export const MODES=Object.freeze(['meaning','reading','production','vocabulary','context']);
export const OUTCOMES=Object.freeze(['correct','wrong','unknown','near_miss','empty','invalid']);
function text(value,max=240){const s=String(value??'').trim();return s.slice(0,max)}
function finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function bool(value){return value===true}
function clone(value){return JSON.parse(JSON.stringify(value))}

export function buildDailySummaryViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'daily-summary',dueCount:Math.max(0,finite(source.dueCount,0)),newCount:Math.max(0,finite(source.newCount,0)),masteredCount:Math.max(0,finite(source.masteredCount,0)),streak:Math.max(0,finite(source.streak,0))});
}
export function buildDailyGoalViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};
  const target=Math.max(1,finite(source.target,1)),completed=Math.max(0,finite(source.completed,0));
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'daily-goal',completed,target,progress:Math.max(0,Math.min(1,completed/target)),celebrated:bool(source.celebrated)});
}
export function buildUpcomingReviewsViewModel(input=[]){
  return Object.freeze((Array.isArray(input)?input:[]).slice(0,6).map(source=>Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'upcoming-review',character:text(source?.character,16),dueAt:text(source?.dueAt,80)})));
}
export function buildSettingsViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'settings',dailyNew:Math.max(1,Math.min(30,finite(source.dailyNew,5))),dailyGoal:Math.max(1,Math.min(500,finite(source.dailyGoal,20))),leechThreshold:Math.max(2,Math.min(30,finite(source.leechThreshold,8))),retention:Math.max(0,Math.min(1,finite(source.retention,.9))),maxInterval:Math.max(1,finite(source.maxInterval,36500)),production:source.production!==false,vocabulary:source.vocabulary!==false,context:source.context!==false});
}
export function buildStatsViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};
  const masterySource=source.masteryDistribution&&typeof source.masteryDistribution==='object'?source.masteryDistribution:{};
  const aggregateForDomain={totalReviews:Math.max(0,finite(source.totalReviews,0)),nonAgainRate:Math.max(0,Math.min(1,finite(source.nonAgainRate,0))),studiedCount:Math.max(0,finite(source.studiedCount,0)),deckSize:Math.max(0,finite(source.deckSize,0)),leechCount:Math.max(0,finite(source.leechCount,0))};
  const masteryDistribution=Object.freeze({
    unseen:Math.max(0,finite(masterySource.unseen,0)),
    learning:Math.max(0,finite(masterySource.learning,0)),
    attention:Math.max(0,finite(masterySource.attention,0)),
    stable:Math.max(0,finite(masterySource.stable,0)),
    mastered:Math.max(0,finite(masterySource.mastered,0)),
    average:Math.max(0,Math.min(1,finite(masterySource.average,0))),
    total:Math.max(0,finite(masterySource.total,0))
  });
  const evaluationSource=source.evaluation&&typeof source.evaluation==='object'?source.evaluation:{};
  const evaluationAttributes={};
  for(const mode of MODES){
    const row=evaluationSource.attributes?.[mode]&&typeof evaluationSource.attributes[mode]==='object'?evaluationSource.attributes[mode]:{};
    evaluationAttributes[mode]=Object.freeze({
      attempts:Math.max(0,finite(row.attempts,0)),
      accuracy:Math.max(0,Math.min(1,finite(row.accuracy,0))),
      recentAccuracy:Math.max(0,Math.min(1,finite(row.recentAccuracy,0))),
      retentionRate:row.retentionRate==null?null:Math.max(0,Math.min(1,finite(row.retentionRate,0))),
      recoveryRate:Math.max(0,Math.min(1,finite(row.recoveryRate,0))),
      repeatedFailureRate:Math.max(0,Math.min(1,finite(row.repeatedFailureRate,0)))
    });
  }
  const modeDistribution={};
  for(const mode of MODES)modeDistribution[mode]=Math.max(0,finite(evaluationSource.modeDistribution?.[mode],0));
  const comparisonSource=evaluationSource.comparison&&typeof evaluationSource.comparison==='object'?evaluationSource.comparison:{};
  const comparison=Object.freeze({
    available:Boolean(comparisonSource.available),
    sufficient:Boolean(comparisonSource.sufficient),
    accuracyDelta:comparisonSource.accuracyDelta==null?null:finite(comparisonSource.accuracyDelta,null),
    recoveryDelta:comparisonSource.recoveryDelta==null?null:finite(comparisonSource.recoveryDelta,null),
    coverageDelta:comparisonSource.coverageDelta==null?null:finite(comparisonSource.coverageDelta,null),
    evidenceReason:text(comparisonSource.evidenceReason,80)||'insufficient-evidence'
  });
  const evaluation=Object.freeze({
    version:text(evaluationSource.version,80),
    sessions:Math.max(0,finite(evaluationSource.sessions,0)),
    completedSessions:Math.max(0,finite(evaluationSource.completedSessions,0)),
    sessionCompletionRate:evaluationSource.sessionCompletionRate==null?null:Math.max(0,Math.min(1,finite(evaluationSource.sessionCompletionRate,0))),
    totalAttempts:Math.max(0,finite(evaluationSource.totalAttempts,0)),
    accuracy:Math.max(0,Math.min(1,finite(evaluationSource.accuracy,0))),
    unknownRate:Math.max(0,Math.min(1,finite(evaluationSource.unknownRate,0))),
    recoveryRate:Math.max(0,Math.min(1,finite(evaluationSource.recoveryRate,0))),
    repeatedFailureRate:Math.max(0,Math.min(1,finite(evaluationSource.repeatedFailureRate,0))),
    attributeCoverage:Math.max(0,Math.min(1,finite(evaluationSource.attributeCoverage,0))),
    averageRecallsPerSession:Math.max(0,finite(evaluationSource.averageRecallsPerSession,0)),
    modeDistribution:Object.freeze(modeDistribution),
    attributes:Object.freeze(evaluationAttributes),
    comparison,
    evidence:Object.freeze({
      sessions:Math.max(0,finite(evaluationSource.evidence?.sessions,0)),
      attempts:Math.max(0,finite(evaluationSource.evidence?.attempts,0)),
      sufficient:Boolean(evaluationSource.evidence?.sufficient),
      reason:text(evaluationSource.evidence?.reason,80)||'insufficient-evidence'
    })
  });
  const domainSource=source.domains&&typeof source.domains==='object'?source.domains:{};const domains={};for(const [domain,row] of Object.entries(domainSource))domains[domain]=Object.freeze({domain,domainSchemaVersion:DOMAIN_SCHEMA_VERSION,...aggregateForDomain,...(row&&typeof row==='object'?row:{})});if(!domains.kanji)domains.kanji=Object.freeze({domain:'kanji',domainSchemaVersion:DOMAIN_SCHEMA_VERSION,...aggregateForDomain});return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'stats',domainSchemaVersion:DOMAIN_SCHEMA_VERSION,domains:Object.freeze(domains),totalReviews:Math.max(0,finite(source.totalReviews,0)),nonAgainRate:Math.max(0,Math.min(1,finite(source.nonAgainRate,0))),studiedCount:Math.max(0,finite(source.studiedCount,0)),deckSize:Math.max(0,finite(source.deckSize,0)),longestStreak:Math.max(0,finite(source.longestStreak,0)),currentStreak:Math.max(0,finite(source.currentStreak,0)),leechCount:Math.max(0,finite(source.leechCount,0)),last7:Object.freeze(Array.isArray(source.last7)?source.last7.slice(0,7).map(item=>Object.freeze({label:text(item?.label,30),count:Math.max(0,finite(item?.count,0))})):[]),masteryDistribution,evaluation});
}

export function buildSessionViewModel(session){
  const source=session&&typeof session==='object'?session:{};
  const experience=source.experience==='practice'?'practice':'review';
  const remainingModes={};for(const mode of MODES)remainingModes[mode]=Math.max(0,finite(source.remainingModes?.[mode],0));
  const modeResults={};for(const mode of MODES){const s=source.modeResults?.[mode]||{};const definition=legacyEducationDefinition(mode);modeResults[mode]={attempts:Math.max(0,finite(s.attempts,0)),correct:Math.max(0,finite(s.correct,0)),domain:text(s.domain,40)||text(source.domain,40)||definition.domain,domainSchemaVersion:DOMAIN_SCHEMA_VERSION,skill:text(s.skill,80)||definition.skill,exercise:text(s.exercise,80)||definition.exercise,lastOutcome:OUTCOMES.includes(s.lastOutcome)?s.lastOutcome:null,lastAt:text(s.lastAt,80),graderVersion:text(s.graderVersion,80)}}
  const plannedTotal=Math.max(0,finite((source.plan?.modes||[]).reduce((sum,item)=>sum+finite(item?.plannedCount,0),0),0));
  const remainingTotal=MODES.reduce((sum,mode)=>sum+remainingModes[mode],0);
  const effectivePlanned=plannedTotal||remainingTotal;
  const completionFraction=source.status==='active'&&effectivePlanned>0?Math.max(0,Math.min(1,(effectivePlanned-remainingTotal)/effectivePlanned)):source.status==='active'?0:1;
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'session',domain:text(source.domain,40)||'kanji',domainSchemaVersion:DOMAIN_SCHEMA_VERSION,experience,sessionId:text(source.sessionId,120),status:text(source.status,40)||'unknown',resumed:bool(source.resumed),planRevision:Math.max(0,finite(source.planRevision,0)),remainingModes,modeResults,plannedTotal:effectivePlanned,remainingTotal,completionFraction,completed:source.status!=='active',updatedAt:text(source.updatedAt||source.endedAt,80)})
}

function defaultExerciseModality(mode,stage){if(stage==='introduction')return 'content-exposure';return ({meaning:'free-recall',reading:'free-recall',production:'independent-typed-production',vocabulary:'cued-kanji-completion',context:'cued-sentence-completion'}[mode]||'unknown');}

export function buildExerciseViewModel(input={}){const source=input&&typeof input==='object'?input:{};const mode=MODES.includes(source.mode)?source.mode:null;const definition=mode?legacyEducationDefinition(mode):{domain:'kanji',skill:'integrated',exercise:'exercise'};const stimulus=source.stimulus&&typeof source.stimulus==='object'?source.stimulus:{};const choices=Array.isArray(source.choices)?source.choices.map(value=>text(value,16)).filter(Boolean).slice(0,4):[];const contentStage=['introduction','guided','retrieval'].includes(String(source.contentStage||''))?String(source.contentStage):'retrieval';const modality=text(source.modality,60)||defaultExerciseModality(mode,contentStage);return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'exercise',domain:text(source.domain,40)||definition.domain,domainSchemaVersion:DOMAIN_SCHEMA_VERSION,skill:text(source.skill,80)||definition.skill,exercise:text(source.exercise,80)||definition.exercise,mode,prompt:text(source.prompt),character:text(source.character,16),stimulus:Object.freeze({kind:text(stimulus.kind,40),primary:text(stimulus.primary,2400),secondary:text(stimulus.secondary,1200),translation:text(stimulus.translation,1200),inputPlaceholder:text(stimulus.inputPlaceholder,160)}),choices,answerHint:text(source.answerHint,2400),contentId:text(source.contentId,120),contentVersion:text(source.contentVersion,80),provenance:text(source.provenance,120),contentStage,contentState:text(source.contentState,60),modality})}

export function buildLearningCardViewModel(input={}){const source=input&&typeof input==='object'?input:{};const character=text(source.character,16);const meanings=Array.isArray(source.meanings)?source.meanings.map(value=>text(value,160)).filter(Boolean).slice(0,8):[];const on=Array.isArray(source.on)?source.on.map(value=>text(value,80)).filter(Boolean).slice(0,8):[];const kun=Array.isArray(source.kun)?source.kun.map(value=>text(value,80)).filter(Boolean).slice(0,8):[];const learnerContent=buildLearnerContent({character,meanings,on,kun,vocabularySupportedReadings:source.vocabularySupportedReadings});const rawExamples=Array.isArray(source.examples)?source.examples.slice(0,12).map(example=>({word:text(example?.word,120),reading:text(example?.reading,120),meaning:text(example?.meaning,240)})).filter(example=>example.word):[];const examples=selectLearnerExamples(rawExamples,character,6);return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'learning-card',domain:'kanji',domainSchemaVersion:DOMAIN_SCHEMA_VERSION,contentId:text(source.contentId,240)||(character?'kanji:'+character:''),active:source.active===true,character,isNew:source.isNew===true,revealed:source.revealed===true,meanings,on,kun,sourceMeanings:learnerContent.sourceMeanings,learnerMeanings:learnerContent.meanings,learnerReadings:learnerContent.readings,examples,hint:text(source.hint,240),revealLabel:text(source.revealLabel,120)||'نمایش اطلاعات کانجی'})}

export function buildFeedbackViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};const mode=MODES.includes(source.mode)?source.mode:null;const outcome=OUTCOMES.includes(source.outcome)?source.outcome:null;const definition=mode?legacyEducationDefinition(mode):{domain:'kanji',skill:'integrated',exercise:'exercise'};
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'feedback',domain:text(source.domain,40)||definition.domain,domainSchemaVersion:DOMAIN_SCHEMA_VERSION,skill:text(source.skill,80)||definition.skill,exercise:text(source.exercise,80)||definition.exercise,mode,outcome,correct:bool(source.correct),quality:text(source.quality,80),score:Math.max(0,Math.min(1,finite(source.score,0))),graderVersion:text(source.graderVersion,80),schemaVersion:Math.max(0,finite(source.schemaVersion,0)),reason:text(source.reason,240),recovered:bool(source.recovered),retryCount:Math.max(0,finite(source.retryCount,0)),state:text(source.state,60),attemptType:text(source.attemptType,60),modality:text(source.modality,40),independent:source.independent!==false,sessionEligible:source.sessionEligible!==false,revealed:bool(source.revealed),responseTimeMs:Math.max(0,finite(source.responseTimeMs,0))})
}

export function buildLearnerSkillSummary(model){
  const source=model&&typeof model==='object'?model:{};const attrs={};for(const mode of MODES){const a=source.attributes?.[mode]||{};attrs[mode]={state:text(a.state,40)||'unseen',accuracy:Math.max(0,Math.min(1,finite(a.accuracy,0))),recentAccuracy:Math.max(0,Math.min(1,finite(a.recentAccuracy,0))),confidence:Math.max(0,Math.min(1,finite(a.confidence,0))),momentum:Math.max(-1,Math.min(1,finite(a.momentum,0))),attempts:Math.max(0,finite(a.attempts,0)),recentAttempts:Math.max(0,finite(a.recentAttempts,0)),repeatedFailure:bool(a.repeatedFailure)}}
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'learner-skill-summary',modelVersion:text(source.version,80)||text(source.modelVersion,80),attributes:attrs})
}

export function buildSessionSummary(session){
  const source=session&&typeof session==='object'?session:{};const modeResults=source.modeResults||{};let attempts=0,correct=0;for(const mode of MODES){attempts+=Math.max(0,finite(modeResults[mode]?.attempts,0));correct+=Math.max(0,finite(modeResults[mode]?.correct,0))}
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'session-summary',sessionId:text(source.sessionId,120),attempts,correct,accuracy:attempts?Math.max(0,Math.min(1,correct/attempts)):0,completionStatus:source.status==='active'?'active':'complete'})
}

export function buildRecentOutcomesViewModel(input=[]){
  const rows=Array.isArray(input)?input:[];
  return rows.slice(0,8).map(source=>{const mode=MODES.includes(source?.mode)?source.mode:null;const definition=mode?legacyEducationDefinition(mode):{domain:'kanji',skill:'integrated',exercise:'exercise'};return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'recent-outcome',domain:text(source?.domain,40)||definition.domain,domainSchemaVersion:DOMAIN_SCHEMA_VERSION,contentId:text(source?.contentId,240),character:text(source?.character,16),mode,outcome:OUTCOMES.includes(source?.outcome)?source.outcome:null,correct:bool(source?.correct),quality:text(source?.quality,80),score:Math.max(0,Math.min(1,finite(source?.score,0))),at:text(source?.at,80),attemptType:text(source?.attemptType,60),modality:text(source?.modality,40),independent:source?.independent!==false,recovery:bool(source?.recovery),revealed:bool(source?.revealed)});});
}

export function buildAdaptiveReasonViewModel(input={}){
  const source=input&&typeof input==='object'?input:{};const mode=MODES.includes(source.mode)?source.mode:null;
  const reasons=Array.isArray(source.reasons)?source.reasons.filter(v=>typeof v==='string').map(v=>text(v,160)).filter(Boolean).slice(0,5):[];
  return Object.freeze({contractVersion:V2_BOUNDARY_VERSION,kind:'adaptive-reason',mode,action:text(source.action,60),reasons,score:finite(source.score,0),character:text(source.character,16),contentId:text(source.contentId,120),modality:text(source.modality,40)})
}

export function buildBoundarySnapshot(input={}){
  const source=input&&typeof input==='object'?input:{};
  const snapshot={contractVersion:V2_BOUNDARY_VERSION,session:buildSessionViewModel(source.session),learning:buildLearningCardViewModel(source.learning),exercise:buildExerciseViewModel(source.exercise),feedback:buildFeedbackViewModel(source.feedback),learner:buildLearnerSkillSummary(source.learner),sessionSummary:buildSessionSummary(source.session),recentOutcomes:buildRecentOutcomesViewModel(source.recentOutcomes),adaptiveReason:buildAdaptiveReasonViewModel(source.adaptiveReason),dailySummary:buildDailySummaryViewModel(source.dailySummary),dailyGoal:buildDailyGoalViewModel(source.dailyGoal),upcomingReviews:buildUpcomingReviewsViewModel(source.upcomingReviews),settings:buildSettingsViewModel(source.settings),stats:buildStatsViewModel(source.stats)};
  return Object.freeze(clone(snapshot));
}

export function isV2BoundarySnapshot(value){return Boolean(value&&value.contractVersion===V2_BOUNDARY_VERSION&&value.session?.kind==='session'&&value.learning?.kind==='learning-card'&&value.exercise?.kind==='exercise'&&value.feedback?.kind==='feedback'&&value.learner?.kind==='learner-skill-summary'&&value.sessionSummary?.kind==='session-summary'&&Array.isArray(value.recentOutcomes)&&value.adaptiveReason?.kind==='adaptive-reason'&&value.dailySummary?.kind==='daily-summary'&&value.dailyGoal?.kind==='daily-goal'&&Array.isArray(value.upcomingReviews)&&value.settings?.kind==='settings'&&value.stats?.kind==='stats')}
