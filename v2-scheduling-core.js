import { buildIdentity } from './v2-domain-core.js';

export const SCHEDULING_SCHEMA_VERSION=1;
export const SCHEDULING_AUTHORITY='fsrs';

export function buildSchedulingRequest({domain='kanji',sourceId,contentId,skill='integrated',exercise='scheduled-review',plannerVersion='unknown'}={}){
  const identity=buildIdentity({domain,sourceId,contentId,skill,exercise});
  return Object.freeze({
    schemaVersion:SCHEDULING_SCHEMA_VERSION,
    authority:SCHEDULING_AUTHORITY,
    plannerVersion:String(plannerVersion||'unknown').trim().slice(0,80)||'unknown',
    identity,
  });
}

export function scheduleWithAuthority({scheduler,card,now,rating}={}){
  if(!scheduler||typeof scheduler.next!=='function')throw new Error('KANJI5_SCHEDULER_AUTHORITY_REQUIRED');
  if(!card||typeof card!=='object')throw new Error('KANJI5_SCHEDULING_CARD_REQUIRED');
  return scheduler.next(card,now,rating);
}

export function assertSchedulingAuthority(request){
  return Boolean(request&&request.authority===SCHEDULING_AUTHORITY&&Number(request.schemaVersion)===SCHEDULING_SCHEMA_VERSION);
}