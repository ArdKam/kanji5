export const RECOVERY_VERSION='1.9.0-recovery-engine';
export const RECOVERY_OUTCOMES=['correct','wrong','unknown','near_miss','empty','invalid'];
export const RECOVERY_STATES=['idle','pending_retry','retrying','recovered','failed','abandoned'];
const MAX_RETRIES=1;
function outcomeOf(result){const o=String(result?.outcome||'');if(RECOVERY_OUTCOMES.includes(o))return o;if(result?.correct===true)return'correct';if(result?.quality==='partial')return'near_miss';return'wrong'}
function retryableOutcome(outcome){return outcome==='wrong'||outcome==='unknown'||outcome==='near_miss'}
function retryLimit(state={}){const value=Object.prototype.hasOwnProperty.call(state||{},'maxRetries')?Number(state.maxRetries):MAX_RETRIES;return Number.isFinite(value)?Math.max(0,Math.min(MAX_RETRIES,Math.floor(value))):MAX_RETRIES}
function retryCountOf(state={}){return Math.max(0,Math.floor(Number(state?.retryCount)||0))}
export function classifyRecoveryOutcome(result={},meta={}){const outcome=outcomeOf(result),mode=String(meta.mode||result.mode||''),taskId=String(meta.taskId||result.taskId||'');return{version:RECOVERY_VERSION,mode,outcome,taskId,character:String(meta.character||result.character||''),contentId:String(meta.contentId||result.contentId||''),feedbackKind:outcome==='unknown'?'did_not_know':outcome==='near_miss'?'near_miss':outcome==='correct'?'correct':outcome==='empty'?'empty':outcome==='invalid'?'invalid':'wrong',retryable:retryableOutcome(outcome),recoveryEligible:retryableOutcome(outcome),reason:String(meta.reason||result.reason||''),answerEvidence:meta.answerEvidence||result.answerEvidence||null}}
export function createRecoveryState(mode,options={}){return{version:RECOVERY_VERSION,mode:String(mode||''),taskId:String(options.taskId||''),character:String(options.character||''),contentId:String(options.contentId||''),state:'idle',retryCount:0,maxRetries:retryLimit({maxRetries:options.maxRetries??MAX_RETRIES}),lastOutcome:null,recovered:false,startedAt:options.startedAt||null,updatedAt:options.updatedAt||null}}
export function applyRecoveryOutcome(state={},feedback={}){
  const stateTask=String(state?.taskId||''),feedbackTask=String(feedback?.taskId||'');
  const mismatch=(left,right)=>Boolean(left&&right&&String(left)!==String(right));
  if(mismatch(stateTask,feedbackTask)||mismatch(state?.mode,feedback?.mode)||mismatch(state?.character,feedback?.character)||mismatch(state?.contentId,feedback?.contentId))return{...state,version:RECOVERY_VERSION,recoveryEligible:false};
  const next={...state,version:RECOVERY_VERSION,mode:String(feedback.mode||state.mode||''),taskId:String(feedback.taskId||state.taskId||''),character:String(feedback.character||state.character||''),contentId:String(feedback.contentId||state.contentId||''),lastOutcome:feedback.outcome||null,updatedAt:feedback.updatedAt||null};
  if(feedback.outcome==='correct'&&state.state==='retrying'){next.state='recovered';next.recovered=true;next.recoveryEligible=false;return next}
  if(!feedback.retryable){next.state=feedback.outcome==='correct'?'idle':'failed';next.recoveryEligible=false;return next}
  if(retryCountOf(state)<retryLimit(state)){next.state='pending_retry';next.recoveryEligible=true;return next}
  next.state='failed';next.recoveryEligible=false;return next
}
export function consumeRetry(state={},now=null){const count=retryCountOf(state),limit=retryLimit(state);if(state.state!=='pending_retry'||count>=limit)return{...state,state:state.state==='pending_retry'&&count>=limit?'failed':state.state,recoveryEligible:false};return{...state,state:'retrying',retryCount:count+1,recoveryEligible:false,updatedAt:now||null}}
export function isRecovered(state){return state?.state==='recovered'&&state.recovered===true}
export function canRetry(state){return state?.state==='pending_retry'&&retryCountOf(state)<retryLimit(state)}
