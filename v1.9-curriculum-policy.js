export const CURRICULUM_POLICY_VERSION='1.0.0';
export const CURRICULUM_STAGES=Object.freeze(['introduction','exposure','practice','reinforcement','maintenance','delayed_verification','retention_verified']);
const TRANSITIONS=Object.freeze({
  introduction:'exposure',
  exposure:'practice',
  practice:'reinforcement',
  reinforcement:'maintenance',
  maintenance:'delayed_verification',
  delayed_verification:'retention_verified'
});
export function nextCurriculumStage(stage){return TRANSITIONS[String(stage||'')]||String(stage||'introduction')}
export function curriculumDecision({stage='introduction',attempts=0,correct=0,delayedEvidence=0,retentionVerified=false}={}){
  const a=Math.max(0,Number(attempts)||0),c=Math.min(a,Math.max(0,Number(correct)||0)),d=Math.max(0,Number(delayedEvidence)||0);
  const accuracy=a?c/a:0;
  if(retentionVerified)return{stage:'retention_verified',reason:'delayed evidence verified retention'};
  if(stage==='maintenance'&&d>0)return{stage:'delayed_verification',reason:'maintenance item has delayed evidence'};
  if(stage==='reinforcement'&&accuracy>=.85&&a>=3)return{stage:'maintenance',reason:'stable repeated performance'};
  if(stage==='practice'&&accuracy<.7&&a>=2)return{stage:'reinforcement',reason:'weak performance needs reinforcement'};
  if(stage==='exposure'&&a>0)return{stage:'practice',reason:'first active evidence collected'};
  if(stage==='introduction')return{stage:'exposure',reason:'initial exposure completed'};
  return{stage:String(stage||'introduction'),reason:'insufficient evidence for transition'};
}
export function isRetentionVerified(value){return value===true}
