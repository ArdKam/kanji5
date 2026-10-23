export const DATA_INTEGRITY_VERSION='1.9.0-data-integrity';

const OUTCOMES=new Set(['correct','wrong','unknown','empty','invalid']);
const RECOVERY_OUTCOMES=new Set(['correct','wrong','unknown','near_miss','empty','invalid']);

function clone(value){
  return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
}

export function inferOutcome(record){
  const explicit=String(record?.outcome||'').trim();
  if(OUTCOMES.has(explicit))return explicit;
  if(String(record?.quality||'').toLowerCase()==='unknown')return 'unknown';
  if(String(record?.quality||'').toLowerCase()==='empty')return 'empty';
  if(String(record?.quality||'').toLowerCase()==='invalid')return 'invalid';
  if(record?.correct===true)return 'correct';
  if(record?.correct===false)return 'wrong';
  return 'invalid';
}

export function migrateOutcomeRecord(record){
  const next=clone(record&&typeof record==='object'?record:{});
  let changed=false;
  if(!next.outcome||!OUTCOMES.has(String(next.outcome))){next.outcome=inferOutcome(next);changed=true}
  if(!next.schemaVersion){next.schemaVersion=Number(next.eventSchemaVersion)||1;changed=true}
  if(next.score==null){next.score=next.outcome==='correct'?1:0;changed=true}
  if(next.correct==null){next.correct=next.outcome==='correct';changed=true}
  if(next.quality==null){next.quality=next.outcome;changed=true}
  if(!next.graderVersion)next.graderVersion='legacy-unversioned';
  return {record:next,changed};
}

export function migrateRecoveryEvidence(record){
  const next=clone(record&&typeof record==='object'?record:{});
  let changed=false;
  const outcome=String(next.outcome||inferOutcome(next));
  if(!next.outcome||!RECOVERY_OUTCOMES.has(outcome)){next.outcome=outcome;changed=true}
  if(next.recovery===undefined){next.recovery=Boolean(next.recovered)||outcome==='correct'&&Boolean(next.retryOf);changed=true}
  if(next.recoveryAttempt==null){next.recoveryAttempt=Number(next.retryCount||0);changed=true}
  if(!next.recordedAt) {next.recordedAt=next.at||next.updatedAt||new Date(0).toISOString();changed=true}
  return {record:next,changed};
}

export function migrateLearnerEvidence(evidenceByKanji){
  const source=evidenceByKanji&&typeof evidenceByKanji==='object'&&!Array.isArray(evidenceByKanji)?evidenceByKanji:{};
  const next={};
  let changed=false;
  for(const [character,raw] of Object.entries(source)){
    const rows=Array.isArray(raw)?raw:[];
    const migrated=[];
    for(const item of rows){const x=migrateOutcomeRecord(item);const y=migrateRecoveryEvidence(x.record);migrated.push(y.record);changed ||= x.changed||y.changed}
    next[character]=migrated;
  }
  return {value:next,changed,version:DATA_INTEGRITY_VERSION};
}

export function migrateComponents(components){
  const next=clone(components&&typeof components==='object'&&!Array.isArray(components)?components:{});
  let changed=false;
  if(next.v19LearnerEvidence){
    const migrated=migrateLearnerEvidence(next.v19LearnerEvidence);
    next.v19LearnerEvidence=migrated.value;
    changed ||= migrated.changed;
  }
  if(next.v19LearnerModel&&typeof next.v19LearnerModel==='object'&&!next.v19LearnerModel.version){
    next.v19LearnerModel={...next.v19LearnerModel,version:'1.9.0-learner-model'};
    changed=true;
  }
  return {value:next,changed,version:DATA_INTEGRITY_VERSION};
}

export function migrateSessionHistory(history){
  const source=Array.isArray(history)?history:[];
  let changed=false;
  const value=source.map(raw=>{
    const next=clone(raw&&typeof raw==='object'?raw:{});
    if(next.status==='active'&&!next.schemaVersion){next.schemaVersion=2;changed=true}
    if(next.status!=='active'&&!next.schemaVersion){next.schemaVersion=1;changed=true}
    if(next.ratings&&typeof next.ratings==='object')next.ratings={Again:0,Hard:0,Good:0,Easy:0,...next.ratings};
    return next;
  });
  return {value,changed,version:DATA_INTEGRITY_VERSION};
}
