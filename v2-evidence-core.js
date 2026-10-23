import { DOMAIN_SCHEMA_VERSION } from './v2-domain-core.js';

export const EVIDENCE_SCHEMA_VERSION=1;
const text=(value,max=240)=>String(value??'').normalize('NFKC').trim().slice(0,max);
const scalar=value=>value==null||['string','number','boolean'].includes(typeof value);
const version=(value,max=80)=>text(value,max)||null;

export function buildEvidenceEnvelope(input={}){
  const source=input&&typeof input==='object'?input:{};
  const evidence={};
  if(source.evidence&&typeof source.evidence==='object'&&!Array.isArray(source.evidence)){
    for(const [key,value] of Object.entries(source.evidence)){
      if(['input','answer','rawAnswer','rawInput'].includes(key))continue;
      if(scalar(value))evidence[text(key,64)]=value;
    }
  }
  return Object.freeze({
    schemaVersion:EVIDENCE_SCHEMA_VERSION,
    domainSchemaVersion:DOMAIN_SCHEMA_VERSION,
    attemptId:version(source.attemptId,120),
    timestamp:version(source.timestamp,80),
    domain:version(source.domain,40),
    contentId:version(source.contentId,240),
    cardId:version(source.cardId,240),
    mode:version(source.mode,40),
    attribute:version(source.attribute,40),
    outcome:version(source.outcome,40),
    score:Number.isFinite(Number(source.score))?Math.max(0,Math.min(1,Number(source.score))):null,
    graderVersion:version(source.graderVersion),
    learnerModelVersion:version(source.learnerModelVersion),
    plannerVersion:version(source.plannerVersion),
    evidence:Object.freeze(evidence)
  });
}

export function hasRawLearnerInput(envelope){
  const value=envelope&&typeof envelope==='object'?envelope:{};
  return Object.prototype.hasOwnProperty.call(value,'input')
    || Object.prototype.hasOwnProperty.call(value,'answer')
    || Object.prototype.hasOwnProperty.call(value,'rawInput')
    || Object.prototype.hasOwnProperty.call(value,'rawAnswer');
}
