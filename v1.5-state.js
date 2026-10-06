(()=>{
'use strict';
if(window.__KANJI5_STATE__)return;
const storage=window.__KANJI5_STORAGE__||localStorage;
const K=Object.freeze({
  deviceId:'kanji5-device-id',
  state:'kanji5-v1',
  cards:'kanji5-v1-cards',
  reviews:'kanji5-v1-reviews',
  knowledge:'kanji5-v1.2-knowledge',
  components:'kanji5-v1.5-components',
  lastAttempt:'kanji5-v1.2-last-attempt',
  sessionHistory:'kanji5-v1.6-session-history',
  deck:'kanji5-deck',
  deckVersion:'kanji5-deck-version',
  educationSettings:'kanji5-v1.3-education-settings',
  snapshot:'kanji5-v1-snapshot',
  snapshotCommit:'kanji5-v1-snapshot-commit',
  syncMeta:'kanji5-v1.2-sync-meta',
  reviewSummary:'kanji5-v1-review-summary'
});
window.__KANJI5_STORAGE_KEYS__=K;
const DEVICE_KEY=K.deviceId,STORAGE=K.state,CARDS_STORAGE=K.cards,REVIEWS_STORAGE=K.reviews,KNOWLEDGE_STORAGE=K.knowledge,COMPONENT_KEY=K.components,LAST_ATTEMPT_KEY=K.lastAttempt,SESSION_HISTORY_KEY=K.sessionHistory,DECK_KEY=K.deck,DECK_VERSION_KEY=K.deckVersion,SETTINGS_KEY=K.educationSettings;
const REVIEW_SUMMARY_STORAGE=K.reviewSummary,SYNC_META_KEY=K.syncMeta;
const SNAPSHOT_STORAGE='kanji5-v1-snapshot',SNAPSHOT_COMMIT='kanji5-v1-snapshot-commit',BACKUP_RESTORE_TXN_STORAGE='kanji5-backup-restore-transaction',PERSISTENCE_SCHEMA_VERSION=1,REVIEW_EVENT_SCHEMA_VERSION=2,SESSION_HISTORY_LIMIT=30,REVIEW_HISTORY_LIMIT=2000,REVIEW_SUMMARY_DAYS=90,REVIEW_SUMMARY_EVENT_KEYS_LIMIT=2000,MNEMONIC_SCHEMA_VERSION=1;
const PORTABLE_BACKUP_FORMAT='kanji5-backup',PORTABLE_BACKUP_VERSION=2,SUPPORTED_PORTABLE_BACKUP_VERSIONS=Object.freeze([1,2]);
const DOMAIN_IDENTITY_SCHEMA_VERSION=1;
const VALID_DOMAINS=Object.freeze(['kanji','vocabulary','context','grammar']);
function identityText(value,max=240){return String(value??'').trim().slice(0,max)}
function canonicalIdentityId(domain,sourceId){
  const d=identityText(domain,40).toLowerCase(),source=identityText(sourceId,200);
  if(!VALID_DOMAINS.includes(d)||!source)return '';
  return source.startsWith(d+':')?source:d+':'+source;
}
function canonicalIdentityCardId(domain,contentId,skill='integrated',exercise='scheduled-review'){
  const canonical=canonicalIdentityId(domain,contentId);
  if(!canonical)return '';
  const parsed=canonical.split(':');
  const d=parsed.shift()||'kanji',source=identityText(parsed.join(':'),180)||'unknown';
  return `card:${d}:${source}:${identityText(skill,64)||'integrated'}:${identityText(exercise,64)||'scheduled-review'}`;
}
function inferLegacyIdentity(key,item,record){
  const domain=VALID_DOMAINS.includes(identityText(record?.domain,40).toLowerCase())?identityText(record.domain,40).toLowerCase():'kanji';
  const sourceId=identityText(record?.sourceId||item?.character||item?.id||key,200);
  const contentId=identityText(record?.contentId,240)||canonicalIdentityId(domain,sourceId);
  const skill=identityText(record?.skill,64)||'integrated';
  const exercise=identityText(record?.exercise,64)||'scheduled-review';
  return {identitySchemaVersion:DOMAIN_IDENTITY_SCHEMA_VERSION,domain,contentId,cardId:identityText(record?.cardId,240)||canonicalIdentityCardId(domain,contentId,skill,exercise),skill,exercise};
}
function migrateCardRecords(cards,deck=[]){
  if(!cards||typeof cards!=='object'||Array.isArray(cards))return false;
  const index=new Map();
  for(const item of Array.isArray(deck)?deck:[]){
    const id=identityText(item?.id,200),character=identityText(item?.character,16);
    if(id)index.set(id,item);
    if(character)index.set(character,item);
  }
  let changed=false;
  for(const [key,record] of Object.entries(cards)){
    if(!record||typeof record!=='object'||Array.isArray(record))continue;
    const identity=inferLegacyIdentity(key,index.get(key),record);
    for(const [field,value] of Object.entries(identity)){
      if(record[field]!==value){record[field]=value;changed=true}
    }
  }
  return changed;
}

const defaults={dailyNew:5,retention:.90,maxInterval:36500,dailyGoal:20,leechThreshold:8};
const educationDefaults={production:true,vocabulary:true,context:true};
let activeState=null;
const todayKey=()=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function deviceId(){try{let id=storage.getItem(DEVICE_KEY);if(!id){id=crypto.randomUUID?.()||`device-${Date.now()}-${Math.random().toString(36).slice(2)}`;storage.setItem(DEVICE_KEY,id)}return id}catch(_){return'legacy'}}
function eventId(){return crypto.randomUUID?.()||`review-${Date.now()}-${Math.random().toString(36).slice(2)}`}
function createInitial(overrides={}){const created={schemaVersion:PERSISTENCE_SCHEMA_VERSION,settings:{...defaults,...(overrides.settings||{})},deck:Array.isArray(overrides.deck)?overrides.deck:[],cards:overrides.cards&&typeof overrides.cards==='object'?overrides.cards:{},reviews:Array.isArray(overrides.reviews)?overrides.reviews:[],reviewSummary:normalizeReviewSummary(overrides.reviewSummary),knowledge:overrides.knowledge&&typeof overrides.knowledge==='object'?overrides.knowledge:{},today:overrides.today||'',todayNew:Number(overrides.todayNew)||0,todayReviewCount:Number(overrides.todayReviewCount)||0,goalCelebrated:Boolean(overrides.goalCelebrated),queue:Array.isArray(overrides.queue)?overrides.queue:[],current:overrides.current||null,revealed:Boolean(overrides.revealed),examples:overrides.examples&&typeof overrides.examples==='object'?overrides.examples:{},streak:{current:0,longest:0,lastActiveDate:null,...(overrides.streak||{})}};activeState=created;return created}
function normalizeReviewEvent(event){if(!event||typeof event!=='object')return event;const normalized={...event};if(!normalized.eventSchemaVersion)normalized.eventSchemaVersion=1;if(normalized.eventSchemaVersion===1&&normalized.baseRecord&&!normalized.resultRecord)normalized.resultRecord=structuredClone(normalized.baseRecord);const legacyId=identityText(normalized.id,200);if(legacyId&&!normalized.contentId){const identity=inferLegacyIdentity(legacyId,null,normalized);Object.assign(normalized,identity)}return normalized}
function reviewKey(event){return String(event?.eventId||`${event?.id||''}|${event?.at||''}|${event?.rating||''}|${event?.due||''}|${event?.scheduledDays||0}`)}
function emptyReviewSummary(){return{schemaVersion:1,totalReviews:0,nonAgainReviews:0,daily:[],lastReviewKey:null,lastReviewAt:null,knownEventIds:[],deviceTotals:{},dailyByDevice:{}}}
function normalizeReviewSummary(raw){
  const source=safeObject(raw)||{};
  const deviceTotals={};
  const rawDeviceTotals=safeObject(source.deviceTotals);
  for(const [device,value] of Object.entries(rawDeviceTotals||{})){const id=String(device||'').slice(0,160);if(!id)continue;deviceTotals[id]={total:Math.max(0,Math.round(Number(value?.total)||0)),nonAgain:Math.max(0,Math.round(Number(value?.nonAgain)||0))}}
  const dailyByDevice={};
  const rawDailyByDevice=safeObject(source.dailyByDevice);
  for(const [dateValue,devices] of Object.entries(rawDailyByDevice||{})){const date=String(dateValue).slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!devices||typeof devices!=='object')continue;const row={};for(const [device,value] of Object.entries(devices)){const id=String(device||'').slice(0,160);if(!id)continue;row[id]={count:Math.max(0,Math.round(Number(value?.count)||0)),nonAgain:Math.max(0,Math.round(Number(value?.nonAgain)||0))}}if(Object.keys(row).length)dailyByDevice[date]=row}
  const legacyDaily=Array.isArray(source.daily)?source.daily.map(row=>({date:String(row?.date||'').slice(0,10),count:Math.max(0,Math.round(Number(row?.count)||0)),nonAgain:Math.max(0,Math.round(Number(row?.nonAgain)||0))})).filter(row=>/^\d{4}-\d{2}-\d{2}$/.test(row.date)).slice(-REVIEW_SUMMARY_DAYS):[];
  const totalFromDevices=Object.values(deviceTotals).reduce((sum,row)=>sum+row.total,0);
  const nonAgainFromDevices=Object.values(deviceTotals).reduce((sum,row)=>sum+Math.min(row.total,row.nonAgain),0);
  const totalReviews=deviceTotals && Object.keys(deviceTotals).length?totalFromDevices:Math.max(0,Math.round(Number(source.totalReviews)||0));
  const nonAgainReviews=deviceTotals && Object.keys(deviceTotals).length?Math.min(totalReviews,nonAgainFromDevices):Math.min(totalReviews,Math.max(0,Math.round(Number(source.nonAgainReviews)||0)));
  const knownEventIds=[...new Set((Array.isArray(source.knownEventIds)?source.knownEventIds:[]).map(value=>String(value||'').slice(0,240)).filter(Boolean))].slice(-REVIEW_SUMMARY_EVENT_KEYS_LIMIT);
  return{schemaVersion:1,totalReviews,nonAgainReviews,daily:legacyDaily,lastReviewKey:source.lastReviewKey?String(source.lastReviewKey).slice(0,240):null,lastReviewAt:source.lastReviewAt?String(source.lastReviewAt):null,knownEventIds,deviceTotals,dailyByDevice};
}
function reviewSummaryEventId(event){return String(event?.eventId||reviewKey(event))}
function reviewSummaryDeviceId(event){return String(event?.deviceId||'legacy').slice(0,160)||'legacy'}
function reviewSummaryDayKey(at){return String(at||'').slice(0,10)}
function ensureReviewSummary(seed,reviews){
  const summary=normalizeReviewSummary(seed);
  if(summary.totalReviews>0||Object.keys(summary.deviceTotals).length>0||!Array.isArray(reviews)||reviews.length===0)return summary;
  return updateReviewSummary(reviews,summary);
}
function updateReviewSummary(reviews,seed=null){
  let summary=normalizeReviewSummary(seed),events=compactReviews(reviews,REVIEW_HISTORY_LIMIT),known=new Set(summary.knownEventIds);
  const hasDeviceTotals=Object.keys(summary.deviceTotals).length>0;
  if(!hasDeviceTotals&&summary.totalReviews>0){
    summary.deviceTotals.legacy={total:summary.totalReviews,nonAgain:summary.nonAgainReviews};
    for(const event of events)known.add(reviewSummaryEventId(event));
  }
  for(const event of events){
    const id=reviewSummaryEventId(event);if(known.has(id))continue;
    const device=reviewSummaryDeviceId(event),date=reviewSummaryDayKey(event.at),isNonAgain=String(event.rating||'')!=='Again';
    const totals=summary.deviceTotals[device]||(summary.deviceTotals[device]={total:0,nonAgain:0});totals.total+=1;if(isNonAgain)totals.nonAgain+=1;
    const dateRows=summary.dailyByDevice[date]||(summary.dailyByDevice[date]={}),daily=dateRows[device]||(dateRows[device]={count:0,nonAgain:0});daily.count+=1;if(isNonAgain)daily.nonAgain+=1;
    known.add(id);
  }
  summary.totalReviews=Object.values(summary.deviceTotals).reduce((sum,row)=>sum+row.total,0);
  summary.nonAgainReviews=Math.min(summary.totalReviews,Object.values(summary.deviceTotals).reduce((sum,row)=>sum+Math.min(row.total,row.nonAgain),0));
  const dailyMap=new Map();
  for(const row of summary.daily)dailyMap.set(row.date,{date:row.date,count:row.count,nonAgain:row.nonAgain});
  for(const [date,devices] of Object.entries(summary.dailyByDevice)){
    const aggregate={date,count:0,nonAgain:0};for(const value of Object.values(devices)){aggregate.count+=Math.max(0,Number(value?.count)||0);aggregate.nonAgain+=Math.max(0,Math.min(Number(value?.count)||0,Number(value?.nonAgain)||0))}dailyMap.set(date,aggregate);
  }
  summary.daily=[...dailyMap.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-REVIEW_SUMMARY_DAYS);
  for(const date of Object.keys(summary.dailyByDevice))if(!summary.daily.some(row=>row.date===date))delete summary.dailyByDevice[date];
  const last=events.at(-1);if(last){summary.lastReviewKey=reviewSummaryEventId(last);summary.lastReviewAt=String(last.at||'')}
  summary.knownEventIds=[...known].slice(-REVIEW_SUMMARY_EVENT_KEYS_LIMIT);
  return summary;
}
function readReviewSummary(){return normalizeReviewSummary(safeParse(readValue(REVIEW_SUMMARY_STORAGE,null)))}
function writeReviewSummary(reviews,seed=null){return writeObject(REVIEW_SUMMARY_STORAGE,normalizeReviewSummary(seed))}
function restoreJournalSnapshot(){
  const journal=safeParse(storage.getItem(BACKUP_RESTORE_TXN_STORAGE));if(!journal||journal.schemaVersion!==1||!Array.isArray(journal.original))return true;
  if(journal.status==='committed'){try{storage.removeItem(BACKUP_RESTORE_TXN_STORAGE);return true}catch(_){return false}}
  try{for(const item of journal.original){const key=String(item?.key||'');if(!key)continue;if(item.value===null||item.value===undefined)storage.removeItem(key);else storage.setItem(key,String(item.value))}storage.removeItem(BACKUP_RESTORE_TXN_STORAGE);return true}catch(_){window.__KANJI5_PERSISTENCE_RECOVERY_REQUIRED__=true;return false}
}
function captureRestoreJournal(prepared){const keys=[STORAGE,CARDS_STORAGE,REVIEWS_STORAGE,KNOWLEDGE_STORAGE,COMPONENT_KEY,LAST_ATTEMPT_KEY,SESSION_HISTORY_KEY,SETTINGS_KEY,REVIEW_SUMMARY_STORAGE,SYNC_META_KEY,DECK_VERSION_KEY,SNAPSHOT_STORAGE,SNAPSHOT_COMMIT];return{schemaVersion:1,status:'applying',createdAt:new Date().toISOString(),targetChecksum:prepared.__targetBackupChecksum||null,original:keys.map(key=>({key,value:storage.getItem(key)}))}}
function writeJournal(journal){storage.setItem(BACKUP_RESTORE_TXN_STORAGE,JSON.stringify(journal))}

function compactReviews(reviews,limit=REVIEW_HISTORY_LIMIT){const map=new Map();for(const raw of Array.isArray(reviews)?reviews:[]){const event=normalizeReviewEvent(raw);if(!event||!event.id||!event.at)continue;map.set(reviewKey(event),event)}return[...map.values()].sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))||reviewKey(a).localeCompare(reviewKey(b))).slice(-Math.max(1,Number(limit)||REVIEW_HISTORY_LIMIT))}
function safeParse(raw){try{return raw?JSON.parse(raw):null}catch(_){return null}}
function safeObject(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:null}
function readObject(key,fallback={}){const value=safeObject(safeParse(storage.getItem(key)));return value||fallback}
function writeObject(key,value){try{storage.setItem(key,JSON.stringify(value&&typeof value==='object'?value:{}));return true}catch(_){return false}}
function readValue(key,fallback=null){try{const raw=storage.getItem(key);return raw===null?fallback:raw}catch(_){return fallback}}
function readDeck(){const value=safeParse(readValue(DECK_KEY,null));return Array.isArray(value)?value:[]}
function readKnowledge(){return readObject(KNOWLEDGE_STORAGE,{})}
function writeKnowledge(value){const next=value&&typeof value==='object'&&!Array.isArray(value)?value:{};if(!writeObject(KNOWLEDGE_STORAGE,next))return false;if(activeState)activeState.knowledge=structuredClone(next);return true}
function readSettings(){return{...educationDefaults,...readObject(SETTINGS_KEY,{})}}
function writeSettings(value){const next={...educationDefaults,...(value&&typeof value==='object'?value:{})};return writeObject(SETTINGS_KEY,next)}
function readAppState(){return safeObject(safeParse(readValue(STORAGE,null)))||{}}
function readReviews(){const value=safeParse(readValue(REVIEWS_STORAGE,[]));return Array.isArray(value)?value.filter(item=>item&&typeof item==='object'):[]}
function readComponents(){return readObject(COMPONENT_KEY,{})}
function readMnemonics(){const knowledge=readKnowledge();const value=safeObject(knowledge.v2Mnemonics);return value||{}}
function writeMnemonics(value){const next=value&&typeof value==='object'&&!Array.isArray(value)?value:{};const knowledge=readKnowledge();knowledge.v2Mnemonics=next;return writeKnowledge(knowledge)}
function writeComponents(value){return writeObject(COMPONENT_KEY,value&&typeof value==='object'&&!Array.isArray(value)?value:{})}
function writeLastAttempt(value){try{storage.setItem(LAST_ATTEMPT_KEY,JSON.stringify(value&&typeof value==='object'?value:{}));return true}catch(_){return false}}
function backupSummary(data){const core=data?.core||{};const reviewSummary=normalizeReviewSummary(core.reviewSummary);const knowledge=core.knowledge&&typeof core.knowledge==='object'?core.knowledge:{};const mnemonics=knowledge.v2Mnemonics&&typeof knowledge.v2Mnemonics==='object'?knowledge.v2Mnemonics:{};return{cards:Object.keys(core.cards&&typeof core.cards==='object'?core.cards:{}).length,reviews:reviewSummary.totalReviews||(Array.isArray(core.reviews)?core.reviews.length:0),personalMnemonics:Object.values(mnemonics).filter(value=>typeof value==='string'&&value.trim()).length,completedSessions:Array.isArray(data?.sessionHistory)?data.sessionHistory.length:0}}
function sha256Text(value){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0xfc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x6ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const input=String(value??''),bytes=[];
  for(let i=0;i<input.length;i++){
    let cp=input.codePointAt(i);
    if(cp>0xffff)i++;
    if(cp<=0x7f)bytes.push(cp);
    else if(cp<=0x7ff)bytes.push(0xc0|(cp>>6),0x80|(cp&0x3f));
    else if(cp<=0xffff)bytes.push(0xe0|(cp>>12),0x80|((cp>>6)&0x3f),0x80|(cp&0x3f));
    else bytes.push(0xf0|(cp>>18),0x80|((cp>>12)&0x3f),0x80|((cp>>6)&0x3f),0x80|(cp&0x3f));
  }
  const bitLen=bytes.length*8;
  bytes.push(0x80);
  while((bytes.length%64)!==56)bytes.push(0);
  for(let shift=56;shift>=0;shift-=8)bytes.push(Math.floor(bitLen/2**shift)&0xff);
  const rotr=(x,n)=>(x>>>n)|(x<<(32-n)),W=new Uint32Array(64);
  for(let offset=0;offset<bytes.length;offset+=64){
    for(let i=0;i<16;i++)W[i]=((bytes[offset+i*4]<<24)|(bytes[offset+i*4+1]<<16)|(bytes[offset+i*4+2]<<8)|bytes[offset+i*4+3])>>>0;
    for(let i=16;i<64;i++){
      const s0=(rotr(W[i-15],7)^rotr(W[i-15],18)^(W[i-15]>>>3))>>>0;
      const s1=(rotr(W[i-2],17)^rotr(W[i-2],19)^(W[i-2]>>>10))>>>0;
      W[i]=(W[i-16]+s0+W[i-7]+s1)>>>0;
    }
    let [a,b,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){
      const S1=(rotr(e,6)^rotr(e,11)^rotr(e,25))>>>0;
      const ch=((e&f)^((~e)&g))>>>0;
      const temp1=(h+S1+ch+K[i]+W[i])>>>0;
      const S0=(rotr(a,2)^rotr(a,13)^rotr(a,22))>>>0;
      const maj=((a&b)^(a&c)^(b&c))>>>0;
      const temp2=(S0+maj)>>>0;
      h=g;g=f;f=e;e=(d+temp1)>>>0;d=c;c=b;b=a;a=(temp1+temp2)>>>0;
    }
    H=[
      (H[0]+a)>>>0,(H[1]+b)>>>0,(H[2]+c)>>>0,(H[3]+d)>>>0,
      (H[4]+e)>>>0,(H[5]+f)>>>0,(H[6]+g)>>>0,(H[7]+h)>>>0
    ];
  }
  return H.map(x=>x.toString(16).padStart(8,'0')).join('');
}
function portableIntegrityPayload(record){return JSON.stringify({format:record.format,version:record.version,createdAt:record.createdAt,data:record.data,metadata:record.metadata,summary:record.summary})}
function portableChecksum(record){return 'sha256:'+sha256Text(portableIntegrityPayload(record))}
function portableBackup(state=activeState||loadState()){
  state.reviewSummary=ensureReviewSummary(state.reviewSummary||readReviewSummary(),state.reviews);
  const core=makeSnapshot(state,REVIEW_HISTORY_LIMIT).payload;
  const data={core:{settings:core.settings,today:core.today,todayNew:core.todayNew,todayReviewCount:core.todayReviewCount,goalCelebrated:core.goalCelebrated,streak:core.streak,cards:core.cards,reviews:core.reviews,reviewSummary:core.reviewSummary,knowledge:core.knowledge},education:{...readSettings()},sessionHistory:readSessionHistory().filter(row=>row?.status!=='active'),components:readComponents()};
  const metadata={backupSchemaVersion:PORTABLE_BACKUP_VERSION,reviewSummarySchemaVersion:1,deckVersion:readValue(DECK_VERSION_KEY,null),persistenceSchemaVersion:PERSISTENCE_SCHEMA_VERSION,reviewEventSchemaVersion:REVIEW_EVENT_SCHEMA_VERSION};
  const record={format:PORTABLE_BACKUP_FORMAT,version:PORTABLE_BACKUP_VERSION,createdAt:new Date().toISOString(),data,metadata,summary:backupSummary(data)};
  return{...record,checksum:portableChecksum(record)};
}
function validPortableBackup(backup){
  if(!backup||typeof backup!=='object'||backup.format!==PORTABLE_BACKUP_FORMAT||typeof backup.createdAt!=='string')return false;
  const data=safeObject(backup.data),metadata=safeObject(backup.metadata),summary=safeObject(backup.summary);
  if(!data||!safeObject(data.core)||!safeObject(data.education)||!Array.isArray(data.sessionHistory)||safeObject(data.components)===null||!metadata||!summary||typeof backup.checksum!=='string')return false;
  try{
    if(Number(backup.version)===PORTABLE_BACKUP_VERSION)return backup.checksum===portableChecksum(backup);
    if(Number(backup.version)===1)return backup.checksum===fnv1a({data,metadata});
    return false;
  }catch(_){return false}
}
function migratePortableBackup(backup){
  const version=Number(backup?.version);
  if(!SUPPORTED_PORTABLE_BACKUP_VERSIONS.includes(version))throw new Error('KANJI5_BACKUP_VERSION_UNSUPPORTED');
  const migrated=structuredClone(backup);
  if(version===1){
    const data=safeObject(migrated.data)||{},core=safeObject(data.core)||{};
    core.reviewSummary=core.reviewSummary?normalizeReviewSummary(core.reviewSummary):updateReviewSummary(core.reviews||[]);
    migrated.data={...data,core};
    migrated.version=PORTABLE_BACKUP_VERSION;
    migrated.metadata={...safeObject(migrated.metadata),backupSchemaVersion:PORTABLE_BACKUP_VERSION,reviewSummarySchemaVersion:1};
    migrated.checksum=portableChecksum(migrated);
  }
  return migrated;
}
function clampNumber(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback}
function sanitizePortableData(backup){
  const data=backup.data||{},core=data.core||{},education=data.education||{};
  const reviewSummary=ensureReviewSummary(core.reviewSummary,core.reviews);
  const statePayload={settings:{...defaults,dailyNew:Math.round(clampNumber(core.settings?.dailyNew,1,30,defaults.dailyNew)),retention:clampNumber(core.settings?.retention,.8,.98,defaults.retention),maxInterval:Math.round(clampNumber(core.settings?.maxInterval,1,36500,defaults.maxInterval)),dailyGoal:Math.round(clampNumber(core.settings?.dailyGoal,1,500,defaults.dailyGoal)),leechThreshold:Math.round(clampNumber(core.settings?.leechThreshold,2,30,defaults.leechThreshold))},today:typeof core.today==='string'?core.today:'',todayNew:Math.max(0,Math.round(Number(core.todayNew)||0)),todayReviewCount:Math.max(0,Math.round(Number(core.todayReviewCount)||0)),goalCelebrated:Boolean(core.goalCelebrated),streak:safeObject(core.streak)||{current:0,longest:0,lastActiveDate:null},cards:safeObject(core.cards)||{},reviews:compactReviews(core.reviews,REVIEW_HISTORY_LIMIT),reviewSummary,knowledge:safeObject(core.knowledge)||{}};
  const educationSettings={production:Boolean(education.production),vocabulary:Boolean(education.vocabulary),context:Boolean(education.context)};
  const sessionHistory=(Array.isArray(data.sessionHistory)?data.sessionHistory:[]).filter(row=>row&&typeof row==='object'&&row.status!=='active').slice(-SESSION_HISTORY_LIMIT).map(row=>structuredClone(row));
  const components=safeObject(data.components)||{};
  const snapshot={schemaVersion:PERSISTENCE_SCHEMA_VERSION,createdAt:typeof backup.createdAt==='string'?backup.createdAt:new Date().toISOString(),payload:statePayload,checksum:fnv1a(statePayload)};
  return{snapshot,educationSettings,sessionHistory,components,deckVersion:typeof backup.metadata?.deckVersion==='string'?backup.metadata.deckVersion:null,summary:backupSummary({core:statePayload,education:educationSettings,sessionHistory,components}),__targetBackupChecksum:String(backup.checksum||'')};
}
function writeRequiredObject(key,value){if(!writeObject(key,value))throw new Error('KANJI5_BACKUP_WRITE_FAILED')}
function applyPortableData(prepared){
  writeRequiredObject(SNAPSHOT_STORAGE,prepared.snapshot);writeRequiredObject(SNAPSHOT_COMMIT,{schemaVersion:PERSISTENCE_SCHEMA_VERSION,checksum:prepared.snapshot.checksum,committedAt:new Date().toISOString()});writeLegacy(prepared.snapshot);writeRequiredObject(SETTINGS_KEY,prepared.educationSettings);writeRequiredObject(SESSION_HISTORY_KEY,prepared.sessionHistory);writeRequiredObject(COMPONENT_KEY,prepared.components);writeRequiredObject(REVIEW_SUMMARY_STORAGE,prepared.snapshot.payload.reviewSummary||emptyReviewSummary());storage.removeItem(SYNC_META_KEY);if(prepared.deckVersion!==null)storage.setItem(DECK_VERSION_KEY,String(prepared.deckVersion));storage.removeItem(LAST_ATTEMPT_KEY);activeState=hydrateCards(applyLoaded(createInitial({today:todayKey()}),prepared.snapshot.payload,defaults));return prepared.summary;
}

function restorePortableBackup(backup){
  if(!restoreJournalSnapshot())throw new Error('KANJI5_PERSISTENCE_RECOVERY_REQUIRED');if(!validPortableBackup(backup))throw new Error('KANJI5_INVALID_BACKUP');const migrated=migratePortableBackup(backup),prepared=sanitizePortableData(migrated),journal=captureRestoreJournal(prepared);
  try{writeJournal(journal);const result=applyPortableData(prepared);writeJournal({...journal,status:'committed'});storage.removeItem(BACKUP_RESTORE_TXN_STORAGE);return result}catch(error){restoreJournalSnapshot();throw error}
}

function readSessionHistory(){const value=safeParse(readValue(SESSION_HISTORY_KEY,[]));return Array.isArray(value)?value.filter(item=>item&&typeof item==='object').slice(-SESSION_HISTORY_LIMIT):[]}
function writeSessionHistory(value){const history=Array.isArray(value)?value.filter(item=>item&&typeof item==='object').slice(-SESSION_HISTORY_LIMIT):[];return writeObject(SESSION_HISTORY_KEY,history)}
function appendSessionSummary(summary){if(!summary||typeof summary!=='object')return false;const history=readSessionHistory();history.push(structuredClone(summary));return writeSessionHistory(history)}
function clearRuntimeKnowledge(){let ok=true;for(const key of [KNOWLEDGE_STORAGE,COMPONENT_KEY,LAST_ATTEMPT_KEY]){try{storage.removeItem(key)}catch(_){ok=false}}if(activeState)activeState.knowledge={};return ok}
function fnv1a(value){const input=JSON.stringify(value);let hash=2166136261;for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(16)}
function readLegacyParts(){const main=safeObject(safeParse(storage.getItem(STORAGE))),cards=safeObject(safeParse(storage.getItem(CARDS_STORAGE))),reviews=safeParse(storage.getItem(REVIEWS_STORAGE)),knowledge=safeObject(safeParse(storage.getItem(KNOWLEDGE_STORAGE)));return{main,cards,reviews:Array.isArray(reviews)?reviews:null,knowledge}}
function snapshotPayload(state,reviewLimit=REVIEW_HISTORY_LIMIT){const cards=state.cards&&typeof state.cards==='object'?state.cards:{};const storedKnowledge=safeObject(safeParse(storage.getItem(KNOWLEDGE_STORAGE)));const knowledge={...(storedKnowledge||{}),...((state.knowledge&&typeof state.knowledge==='object')?state.knowledge:{})};const reviewSummary=ensureReviewSummary(state.reviewSummary||readReviewSummary(),state.reviews);return{settings:state.settings,today:state.today,todayNew:state.todayNew,todayReviewCount:state.todayReviewCount,goalCelebrated:state.goalCelebrated,streak:state.streak,cards,reviews:compactReviews(state.reviews,reviewLimit),reviewSummary,knowledge}}
function makeSnapshot(state,reviewLimit=REVIEW_HISTORY_LIMIT){const payload=snapshotPayload(state,reviewLimit);return{schemaVersion:PERSISTENCE_SCHEMA_VERSION,createdAt:new Date().toISOString(),payload,checksum:fnv1a(payload)}}
function validSnapshot(snapshot){const payload=safeObject(snapshot?.payload);return Number(snapshot?.schemaVersion)===PERSISTENCE_SCHEMA_VERSION&&!!payload&&snapshot.checksum===fnv1a(payload)&&payload.cards&&typeof payload.cards==='object'&&Array.isArray(payload.reviews)&&safeObject(payload.knowledge)!==null}
function readSnapshot(){const snapshot=safeParse(storage.getItem(SNAPSHOT_STORAGE));const commit=safeParse(storage.getItem(SNAPSHOT_COMMIT));if(!validSnapshot(snapshot)||!commit)return null;return commit.schemaVersion===PERSISTENCE_SCHEMA_VERSION&&commit.checksum===snapshot.checksum?snapshot:null}
function writeLegacy(snapshot){const p=snapshot.payload;storage.setItem(STORAGE,JSON.stringify({schemaVersion:PERSISTENCE_SCHEMA_VERSION,settings:p.settings,today:p.today,todayNew:p.todayNew,todayReviewCount:p.todayReviewCount,goalCelebrated:p.goalCelebrated,streak:p.streak,cards:p.cards}));storage.setItem(CARDS_STORAGE,JSON.stringify(p.cards||{}));storage.setItem(REVIEWS_STORAGE,JSON.stringify(p.reviews||[]));storage.setItem(KNOWLEDGE_STORAGE,JSON.stringify(p.knowledge||{}))}
function commitSnapshot(state,reviewLimit=REVIEW_HISTORY_LIMIT){const snapshot=makeSnapshot(state,reviewLimit);storage.setItem(SNAPSHOT_STORAGE,JSON.stringify(snapshot));storage.setItem(SNAPSHOT_COMMIT,JSON.stringify({schemaVersion:PERSISTENCE_SCHEMA_VERSION,checksum:snapshot.checksum,committedAt:new Date().toISOString()}));try{writeLegacy(snapshot)}catch(_){}return snapshot}
function legacySnapshot(){const parts=readLegacyParts();const x=parts.main;if(!x)return null;const cards=parts.cards??x.cards??{};const reviews=parts.reviews??x.reviews??[];const knowledge=parts.knowledge??x.knowledge??{};if(!cards||typeof cards!=='object'||!Array.isArray(reviews)||!knowledge||typeof knowledge!=='object'||Array.isArray(knowledge))return null;return{schemaVersion:PERSISTENCE_SCHEMA_VERSION,createdAt:null,payload:{settings:x.settings,today:x.today,todayNew:x.todayNew,todayReviewCount:x.todayReviewCount,goalCelebrated:x.goalCelebrated,streak:x.streak,cards,reviews:compactReviews(reviews),reviewSummary:updateReviewSummary(reviews),knowledge}}}
function reconcileSnapshot(snapshot){const parts=readLegacyParts();const payload={...snapshot.payload};if(parts.main)for(const field of ['settings','today','todayNew','todayReviewCount','goalCelebrated','streak'])if(parts.main[field]!==undefined)payload[field]=parts.main[field];if(parts.cards)payload.cards=parts.cards;if(parts.reviews&&parts.reviews.length>payload.reviews.length)payload.reviews=compactReviews([...payload.reviews,...parts.reviews]);if(parts.knowledge)payload.knowledge={...payload.knowledge,...parts.knowledge};payload.reviews=compactReviews(payload.reviews);return{...snapshot,payload,checksum:fnv1a(payload)}}
function save(state=activeState){if(!state||typeof state!=='object')return;activeState=state;migrateCardRecords(state.cards,state.deck?.length?state.deck:readDeck());state.knowledge={...(safeObject(safeParse(storage.getItem(KNOWLEDGE_STORAGE)))||{}),...(state.knowledge||{})};const reviews=compactReviews(state.reviews,REVIEW_HISTORY_LIMIT).map(normalizeReviewEvent);state.reviews=reviews;state.reviewSummary=ensureReviewSummary(state.reviewSummary||readReviewSummary(),reviews);try{writeReviewSummary(reviews,state.reviewSummary);commitSnapshot(state,reviews.length);return}catch(error){try{commitSnapshot(state,Math.min(reviews.length,500));return}catch(_){try{const metadata={settings:state.settings,today:state.today,todayNew:state.todayNew,todayReviewCount:state.todayReviewCount,goalCelebrated:state.goalCelebrated,streak:state.streak,cards:state.cards&&typeof state.cards==='object'?state.cards:{}};storage.setItem(STORAGE,JSON.stringify(metadata));storage.setItem(CARDS_STORAGE,JSON.stringify(metadata.cards));storage.setItem(REVIEWS_STORAGE,JSON.stringify(reviews.slice(-500)));storage.setItem(KNOWLEDGE_STORAGE,JSON.stringify(state.knowledge||{}));}catch(__){}}}}
function applyLoaded(state,x,defaultsValue){const next={...state,...x,settings:{...defaultsValue,...(x.settings||{})},streak:{current:0,longest:0,lastActiveDate:null,...(x.streak||{})},knowledge:x.knowledge&&typeof x.knowledge==='object'?x.knowledge:{}};next.schemaVersion=PERSISTENCE_SCHEMA_VERSION;if(next.today!==todayKey()){next.today=todayKey();next.todayNew=0;next.todayReviewCount=0;next.goalCelebrated=false}next.reviews=compactReviews(next.reviews,REVIEW_HISTORY_LIMIT);next.reviewSummary=ensureReviewSummary(next.reviewSummary||readReviewSummary(),next.reviews);return next}
function loadSaved(state,defaultsValue=defaults){try{if(!restoreJournalSnapshot())throw new Error('KANJI5_PERSISTENCE_RECOVERY_REQUIRED');let snapshot=readSnapshot();const fromSnapshot=Boolean(snapshot);if(!snapshot){snapshot=legacySnapshot();}if(!snapshot){const next={...state,today:todayKey(),schemaVersion:PERSISTENCE_SCHEMA_VERSION};activeState=next;return next}if(fromSnapshot)snapshot=reconcileSnapshot(snapshot);const payload=snapshot.payload||{};const next=applyLoaded(state,payload,defaultsValue);migrateCardRecords(next.cards,next.deck?.length?next.deck:readDeck());next.reviews=next.reviews.map(normalizeReviewEvent);try{commitSnapshot(next,next.reviews.length)}catch(_){}activeState=next;return next}catch(error){if(String(error?.message||error)==='KANJI5_PERSISTENCE_RECOVERY_REQUIRED'||window.__KANJI5_PERSISTENCE_RECOVERY_REQUIRED__)throw error;const next={...state,today:todayKey(),schemaVersion:PERSISTENCE_SCHEMA_VERSION};activeState=next;return next}}
function reviveCard(card){if(!card)return null;const out=structuredClone(card);for(const key of ['due','last_review'])if(out[key])out[key]=new Date(out[key]);return out}
function hydrateCards(state){for(const id of Object.keys(state.cards||{}))if(state.cards[id])state.cards[id].card=reviveCard(state.cards[id].card);activeState=state;return state}
function reset(defaultsValue,deck=[]){restoreJournalSnapshot();const next=createInitial({settings:{...defaultsValue},deck,today:todayKey()});try{clearRuntimeKnowledge();writeSessionHistory([]);try{sessionStorage.removeItem('v19RecoveryState')}catch(_){}save(next)}catch(_){}return next}
function loadState(defaultsValue=defaults){return loadSaved(createInitial({today:todayKey()}),defaultsValue)}
function saveState(state){save(state);return state}
function transaction(mutator){if(typeof mutator!=='function')throw new TypeError('transaction requires a function');const current=loadState();const draft=structuredClone(current);const result=mutator(draft)??draft;save(result);return result}
restoreJournalSnapshot();
window.__KANJI5_STATE__=Object.freeze({DEFAULTS:Object.freeze({...defaults}),EDUCATION_DEFAULTS:Object.freeze({...educationDefaults}),STORAGE,CARDS_STORAGE,REVIEWS_STORAGE,KNOWLEDGE_STORAGE,COMPONENT_KEY,LAST_ATTEMPT_KEY,SESSION_HISTORY_KEY,SESSION_HISTORY_LIMIT,REVIEW_HISTORY_LIMIT,REVIEW_SUMMARY_DAYS,REVIEW_SUMMARY_STORAGE,SYNC_META_KEY,DECK_KEY,DECK_VERSION_KEY,SETTINGS_KEY,SNAPSHOT_STORAGE,SNAPSHOT_COMMIT,PERSISTENCE_SCHEMA_VERSION,REVIEW_EVENT_SCHEMA_VERSION,MNEMONIC_SCHEMA_VERSION,DOMAIN_IDENTITY_SCHEMA_VERSION,todayKey,deviceId,eventId,createInitial,normalizeReviewEvent,migrateCardRecords,canonicalIdentityId,canonicalIdentityCardId,readDeck,readKnowledge,writeKnowledge,readSettings,writeSettings,readAppState,readReviews,readComponents,writeComponents,readMnemonics,writeMnemonics,writeLastAttempt,readSessionHistory,writeSessionHistory,appendSessionSummary,clearRuntimeKnowledge,portableBackup,validPortableBackup,migratePortableBackup,restorePortableBackup,save,loadSaved,loadState,saveState,transaction,readReviewSummary,writeReviewSummary,updateReviewSummary,reviveCard,hydrateCards,reset});
})();
