const STATES=Object.freeze(['unseen','introduced','guided','retrievable','stable']);
const ERROR_TYPES=Object.freeze(['wrong_choice','wrong_input','unknown','near_miss','repeated_confusion','unseen_content']);

const clampText=(value,max)=>String(value??'').trim().slice(0,Math.max(1,max));
const nowIso=value=>value instanceof Date?value.toISOString():String(value||new Date().toISOString());
const asNow=value=>Number.isFinite(Number(value))?Number(value):Date.now();

export const CONTENT_SCHEMA_VERSION=1;
export const CONTENT_STORE_LIMIT=512;
export const CONTENT_STATES=STATES;
export const CONTENT_ERROR_TYPES=ERROR_TYPES;

export function contentKey(mode,contentId){
  const m=clampText(mode,24),id=clampText(contentId,220);
  return m&&id?m+':'+id:'';
}

function emptyItem(input={},now=Date.now()){
  return {
    mode:clampText(input.mode,24),
    contentId:clampText(input.contentId,220),
    targetKanji:clampText(input.targetKanji,8),
    state:'unseen',
    exposureCount:0,
    attemptCount:0,
    correctCount:0,
    wrongCount:0,
    recoveryCount:0,
    successStreak:0,
    firstExposedAt:null,
    lastExposedAt:null,
    firstAttemptAt:null,
    lastAttemptAt:null,
    lastCorrectAt:null,
    lastOutcome:null,
    updatedAt:new Date(asNow(now)).toISOString()
  };
}

export function emptyStore(){
  return {schemaVersion:CONTENT_SCHEMA_VERSION,items:{},mistakes:{}};
}

export function normalizeStore(store){
  const source=store&&typeof store==='object'?store:{};
  return {
    schemaVersion:CONTENT_SCHEMA_VERSION,
    items:source.items&&typeof source.items==='object'&&!Array.isArray(source.items)?source.items:{},
    mistakes:source.mistakes&&typeof source.mistakes==='object'&&!Array.isArray(source.mistakes)?source.mistakes:{}
  };
}

export function getContentItem(store,mode,contentId){
  const normalized=normalizeStore(store),key=contentKey(mode,contentId);
  const raw=key?normalized.items[key]:null;
  if(!raw||typeof raw!=='object')return null;
  return {...raw,state:STATES.includes(raw.state)?raw.state:'unseen'};
}

export function isExposed(store,mode,contentId){
  return getContentItem(store,mode,contentId)?.state!=='unseen';
}

export function hasExposedContent(store,mode){
  const normalized=normalizeStore(store);
  return Object.values(normalized.items).some(item=>String(item?.mode||'')===String(mode||'')&&String(item?.state||'')!=='unseen');
}

export function listExposedContentIds(store,mode){
  const normalized=normalizeStore(store),seen=[];
  for(const [key,item] of Object.entries(normalized.items)){
    if(String(item?.mode||'')===String(mode||'')&&item?.state!=='unseen')seen.push(String(item.contentId||key));
  }
  return seen;
}

export function applyExposure(store,input={},now=Date.now()){
  const normalized=normalizeStore(store),key=contentKey(input.mode,input.contentId);
  if(!key)return normalized;
  const timestamp=new Date(asNow(now)).toISOString();
  const current=getContentItem(normalized,input.mode,input.contentId)||emptyItem(input,now);
  const next={...current,
    mode:clampText(input.mode,24),
    contentId:clampText(input.contentId,220),
    targetKanji:clampText(input.targetKanji,8)||current.targetKanji,
    state:current.state==='unseen'?'introduced':current.state,
    exposureCount:Math.min(999,current.exposureCount+1),
    firstExposedAt:current.firstExposedAt||timestamp,
    lastExposedAt:timestamp,
    updatedAt:timestamp
  };
  normalized.items={...normalized.items,[key]:next};
  return trimStore(normalized);
}

function nextStateAfterCorrect(current,{recovery=false}={},now=Date.now()){
  if(recovery)return current;
  if(current.state==='introduced'||current.state==='guided')return'retrievable';
  if(current.state==='retrievable'&&current.successStreak>=2&&current.lastCorrectAt&&asNow(now)-Date.parse(current.lastCorrectAt)>=30*60*1000)return'stable';
  return current.state;
}

function mistakeType(input){
  const requested=String(input.errorType||'');
  if(ERROR_TYPES.includes(requested))return requested;
  if(input.unseenContent)return'unseen_content';
  if(input.outcome==='unknown')return'unknown';
  if(input.outcome==='near_miss')return'near_miss';
  return input.choiceBased?'wrong_choice':'wrong_input';
}

export function applyAttempt(store,input={},now=Date.now()){
  const normalized=normalizeStore(store),key=contentKey(input.mode,input.contentId);
  if(!key)return normalized;
  const timestamp=new Date(asNow(now)).toISOString();
  const current=getContentItem(normalized,input.mode,input.contentId)||emptyItem(input,now);
  const correct=input.correct===true;
  const recovery=input.recovery===true;
  const previousState=current.state;
  const next={...current,
    mode:clampText(input.mode,24),
    contentId:clampText(input.contentId,220),
    targetKanji:clampText(input.targetKanji,8)||current.targetKanji,
    attemptCount:Math.min(999,current.attemptCount+1),
    correctCount:Math.min(999,current.correctCount+(correct?1:0)),
    wrongCount:Math.min(999,current.wrongCount+(correct?0:1)),
    recoveryCount:Math.min(999,current.recoveryCount+(recovery?1:0)),
    firstAttemptAt:current.firstAttemptAt||timestamp,
    lastAttemptAt:timestamp,
    lastOutcome:String(input.outcome|| (correct?'correct':'wrong')),
    updatedAt:timestamp
  };
  if(correct){
    next.successStreak=Math.min(99,current.successStreak+1);
    next.state=nextStateAfterCorrect(current,{recovery},asNow(now));
    next.lastCorrectAt=timestamp;
  }else{
    next.successStreak=0;
    next.state=previousState==='unseen'?'unseen':'guided';
    next.lastCorrectAt=current.lastCorrectAt||null;
  }
  normalized.items={...normalized.items,[key]:next};

  const previousMistake=normalized.mistakes[key];
  if(correct){
    if(previousMistake){
      const recovered=Boolean(recovery)||previousMistake.wrongCount>0;
      const currentStreak=Math.min(99,(previousMistake.currentStreak||0)+1);
      normalized.mistakes[key]={...previousMistake,
        recoveryCount:Math.min(999,(previousMistake.recoveryCount||0)+(recovery?1:0)),
        lastRecoveredAt:recovery?timestamp:(previousMistake.lastRecoveredAt||null),
        currentStreak,
        status:currentStreak>=2?'cooldown':'recovered',
        updatedAt:timestamp
      };
      if(!recovered)normalized.mistakes[key].status='active';
    }
  }else{
    const type=mistakeType(input);
    const wrongCount=Math.min(999,(previousMistake?.wrongCount||0)+1);
    normalized.mistakes[key]={
      targetKanji:clampText(input.targetKanji,8),
      mode:clampText(input.mode,24),
      contentId:clampText(input.contentId,220),
      correctAnswer:clampText(input.correctAnswer,240),
      lastWrongAnswer:clampText(input.wrongAnswer,240),
      wrongCount,
      recentWrongCount:Math.min(999,(previousMistake?.recentWrongCount||0)+1),
      firstWrongAt:previousMistake?.firstWrongAt||timestamp,
      lastWrongAt:timestamp,
      recoveryCount:Math.min(999,previousMistake?.recoveryCount||0),
      lastRecoveredAt:previousMistake?.lastRecoveredAt||null,
      currentStreak:0,
      contentExposureState:next.state,
      errorType:wrongCount>=2?'repeated_confusion':type,
      status:'active',
      updatedAt:timestamp
    };
  }
  return trimStore(normalized);
}

export function trimStore(store,limit=CONTENT_STORE_LIMIT){
  const normalized=normalizeStore(store);
  const max=Math.max(64,Math.min(2048,Number(limit)||CONTENT_STORE_LIMIT));
  const entries=Object.entries(normalized.items).sort((a,b)=>Date.parse(String(a[1]?.updatedAt||''))-Date.parse(String(b[1]?.updatedAt||'')));
  const keep=entries.slice(-max);
  const allowed=new Set(keep.map(([key])=>key));
  const items=Object.fromEntries(keep);
  const mistakes=Object.fromEntries(Object.entries(normalized.mistakes).filter(([key])=>allowed.has(key)).sort((a,b)=>Date.parse(String(a[1]?.updatedAt||''))-Date.parse(String(b[1]?.updatedAt||''))).slice(-max));
  return {schemaVersion:CONTENT_SCHEMA_VERSION,items,mistakes};
}
