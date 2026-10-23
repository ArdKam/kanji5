const clone=v=>structuredClone(v);
export const V16_SYNC_SCHEMA_VERSION=1;
const completed=h=>Array.isArray(h)?h.filter(x=>x&&x.status!=='active'&&x.endedAt):[];
const MODES=['meaning','reading','production','vocabulary','context'];
export function sanitizeSessionHistory(history,limit=30){const map=new Map();for(const row of completed(history)){const key=String(row.sessionId||`${row.startedAt||''}|${row.endedAt||''}`);map.set(key,clone(row))}return[...map.values()].sort((a,b)=>String(a.endedAt||'').localeCompare(String(b.endedAt||''))).slice(-Math.max(1,Number(limit)||30))}
export function mergeSessionHistory(local,remote,limit=30){return sanitizeSessionHistory([...sanitizeSessionHistory(local,limit),...sanitizeSessionHistory(remote,limit)],limit)}
const timestamp = value => String(value || '');
function canonicalValue(value) {
  if (value instanceof Date) return value.toJSON();
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])]));
  }
  return value;
}
const stableJson = value => JSON.stringify(canonicalValue(value));
const jsonEqual = (a, b) => stableJson(a) === stableJson(b);

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
function mergeTimestampMaps(local = {}, remote = {}) {
  const out = {};
  for (const key of new Set([...Object.keys(local || {}), ...Object.keys(remote || {})])) {
    const a = timestamp(local?.[key]), b = timestamp(remote?.[key]);
    const value = a >= b ? a : b;
    if (value) out[key] = value;
  }
  return out;
}

function mergeRecordMap(local = {}, remote = {}) {
  const out = {};
  for (const key of new Set([...Object.keys(local || {}), ...Object.keys(remote || {})])) {
    const a = local?.[key], b = remote?.[key];
    if (!a) out[key] = clone(b);
    else if (!b) out[key] = clone(a);
    else out[key] = clone(timestamp(a.updatedAt) >= timestamp(b.updatedAt) ? a : b);
  }
  return out;
}

function mergeComponents(local = {}, remote = {}, localClocks = {}, remoteClocks = {}) {
  const out = {};
  const clockMap = mergeTimestampMaps(localClocks, remoteClocks);
  const keys = new Set([
    ...Object.keys(local || {}), ...Object.keys(remote || {}),
    ...Object.keys(localClocks || {}), ...Object.keys(remoteClocks || {})
  ]);
  for (const key of keys) {
    const hasLocal = Object.prototype.hasOwnProperty.call(local || {}, key);
    const hasRemote = Object.prototype.hasOwnProperty.call(remote || {}, key);
    const a = local?.[key], b = remote?.[key];
    const localAt = timestamp(localClocks?.[key]), remoteAt = timestamp(remoteClocks?.[key]);

    if (key === 'kanjiBookmarks' && hasLocal && hasRemote) {
      out[key] = mergeKanjiBookmarks(a, b);
      continue;
    }
    if (key === 'v19ContentEvidence' && hasLocal && hasRemote) {
      out[key] = mergeRecordMap(a, b);
      continue;
    }
    if (hasLocal && hasRemote) {
      if (jsonEqual(a, b)) out[key] = clone(a);
      else if (localAt && remoteAt) out[key] = clone(localAt !== remoteAt ? (localAt > remoteAt ? a : b) : (stableJson(a) >= stableJson(b) ? a : b));
      else if (localAt) out[key] = clone(a);
      else if (remoteAt) out[key] = clone(b);
      else if (timestamp(a?.updatedAt) || timestamp(b?.updatedAt)) out[key] = clone(newer(a, b));
      else {
        out[key] = clone(a); // Legacy conflicts choose local once, then persist a clock to converge.
        clockMap[key] = new Date().toISOString();
      }
      continue;
    }
    if (hasLocal) {
      if (!(remoteAt && (!localAt || remoteAt >= localAt))) out[key] = clone(a);
      continue;
    }
    if (hasRemote) {
      if (!(localAt && (!remoteAt || localAt >= remoteAt))) out[key] = clone(b);
    }
  }
  return { components: out, componentUpdatedAtByKey: clockMap };
}


export function mergeV16SyncData(local={},remote={}) {
 const lh=sanitizeSessionHistory(local.sessionHistory),rh=sanitizeSessionHistory(remote.sessionHistory);
 const mergedComponents=mergeComponents(
   local.components,
   remote.components,
   local.componentUpdatedAtByKey,
   remote.componentUpdatedAtByKey
 );
 return {
   v16SyncSchemaVersion:V16_SYNC_SCHEMA_VERSION,
   sessionHistory:mergeSessionHistory(lh,rh),
   components:mergedComponents.components,
   componentUpdatedAtByKey:mergedComponents.componentUpdatedAtByKey,
   skillProfile:mergeSkillProfile(local.skillProfile,remote.skillProfile)
 };
}
