const clone=v=>structuredClone(v);
export const V16_SYNC_SCHEMA_VERSION=1;
const completed=h=>Array.isArray(h)?h.filter(x=>x&&x.status!=='active'&&x.endedAt):[];
const MODES=['meaning','reading','production','vocabulary','context'];
export function sanitizeSessionHistory(history,limit=30){const map=new Map();for(const row of completed(history)){const key=String(row.sessionId||`${row.startedAt||''}|${row.endedAt||''}`);map.set(key,clone(row))}return[...map.values()].sort((a,b)=>String(a.endedAt||'').localeCompare(String(b.endedAt||''))).slice(-Math.max(1,Number(limit)||30))}
export function mergeSessionHistory(local,remote,limit=30){return sanitizeSessionHistory([...sanitizeSessionHistory(local,limit),...sanitizeSessionHistory(remote,limit)],limit)}
function validProfile(p){return p&&Number(p.schemaVersion)===1&&p.skills&&typeof p.skills==='object'}
function newer(a,b){return String(a?.updatedAt||'')>=String(b?.updatedAt||'')?a:b}
export function mergeSkillProfile(local,remote){
 if(!validProfile(local))return validProfile(remote)?clone(remote):null;
 if(!validProfile(remote))return clone(local);
 const recentSource=newer(local,remote);
 const out={schemaVersion:1,updatedAt:String(local.updatedAt||'')>=String(remote.updatedAt||'')?local.updatedAt:remote.updatedAt,sessions:Math.max(Number(local.sessions)||0,Number(remote.sessions)||0),skills:{}};
 for(const mode of MODES){
  const a=local.skills?.[mode]||{},b=remote.skills?.[mode]||{};
  const attempts=(Number(a.attempts)||0)+(Number(b.attempts)||0);
  const correct=Math.min(attempts,(Number(a.correct)||0)+(Number(b.correct)||0));
  const r=recentSource.skills?.[mode]||{};
  const recentAttempts=Math.max(0,Number(r.recentAttempts)||0);
  const recentCorrect=Math.min(recentAttempts,Math.max(0,Number(r.recentCorrect)||0));
  const recentAccuracy=recentAttempts?recentCorrect/recentAttempts*100:Math.max(0,Number(r.recentAccuracy)||0);
  const momentum=Math.max(-1,Math.min(1,Number(r.momentum)||0));
  out.skills[mode]={attempts,correct,accuracy:attempts?correct/attempts*100:0,mastery:(correct+1)/(attempts+2),recentAttempts,recentCorrect,recentAccuracy,momentum};
 }
 return out;
}
function validBookmarkRecord(record){
 return record&&typeof record==='object'&&typeof record.saved==='boolean'&&typeof record.updatedAt==='string'&&Number.isFinite(Date.parse(record.updatedAt));
}
function mergeKanjiBookmarks(local={},remote={}){
 const out={};
 const a=local&&typeof local==='object'&&!Array.isArray(local)?local:{};
 const b=remote&&typeof remote==='object'&&!Array.isArray(remote)?remote:{};
 for(const character of new Set([...Object.keys(a),...Object.keys(b)])){
  const left=validBookmarkRecord(a[character])?a[character]:null;
  const right=validBookmarkRecord(b[character])?b[character]:null;
  if(!left&&!right)continue;
  let chosen;
  if(!left)chosen=right;
  else if(!right)chosen=left;
  else{
   const leftTime=Date.parse(left.updatedAt),rightTime=Date.parse(right.updatedAt);
   if(leftTime!==rightTime)chosen=leftTime>rightTime?left:right;
   else if(left.saved!==right.saved)chosen=left.saved?right:left; // Equal-time deletion tombstones win to prevent resurrection.
   else chosen=JSON.stringify(left)<=JSON.stringify(right)?left:right;
  }
  out[character]={saved:chosen.saved,updatedAt:chosen.updatedAt};
 }
 return out;
}
export function mergeV16SyncData(local={},remote={}){
 const lh=sanitizeSessionHistory(local.sessionHistory),rh=sanitizeSessionHistory(remote.sessionHistory);
 const localComponents=local.components&&typeof local.components==='object'?local.components:{};
 const remoteComponents=remote.components&&typeof remote.components==='object'?remote.components:{};
 const components={...localComponents,...remoteComponents};
 if(Object.prototype.hasOwnProperty.call(localComponents,'kanjiBookmarks')||Object.prototype.hasOwnProperty.call(remoteComponents,'kanjiBookmarks')){
  components.kanjiBookmarks=mergeKanjiBookmarks(localComponents.kanjiBookmarks,remoteComponents.kanjiBookmarks);
 }
 return {v16SyncSchemaVersion:V16_SYNC_SCHEMA_VERSION,sessionHistory:mergeSessionHistory(lh,rh),components,skillProfile:mergeSkillProfile(local.skillProfile,remote.skillProfile)};
}
