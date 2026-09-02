const MODES=['meaning','reading','production','vocabulary','context'];
const SCHEMA_VERSION=2;
const statsValue=value=>{const s=value&&typeof value==='object'?value:{};const attempts=Math.max(0,Number(s.attempts)||0);return{attempts,correct:Math.min(Math.max(0,Number(s.correct)||0),attempts),lastAt:typeof s.lastAt==='string'?s.lastAt:''};};
const bucketValue=value=>{const s=statsValue(value);return{attempts:s.attempts,correct:s.correct,lastAt:s.lastAt};};
const totalsFromBuckets=buckets=>{let attempts=0,correct=0,lastAt='';for(const value of Object.values(buckets||{})){const s=bucketValue(value);attempts+=s.attempts;correct+=s.correct;if(s.lastAt>lastAt)lastAt=s.lastAt}return{attempts,correct,lastAt};};
const withBuckets=value=>{const s=statsValue(value);if(value?.byDevice&&typeof value.byDevice==='object'&&Object.keys(value.byDevice).length)return{...s,byDevice:Object.fromEntries(Object.entries(value.byDevice).map(([id,b])=>[id,bucketValue(b)]))};return s;};
export function mergeModeStats(local,remote){
  const l=local&&typeof local==='object'?local:null,r=remote&&typeof remote==='object'?remote:null;
  if(!l)return r?withBuckets(r):{attempts:0,correct:0,lastAt:'',byDevice:{}};
  if(!r)return withBuckets(l);
  const lb=l.byDevice&&typeof l.byDevice==='object'&&Object.keys(l.byDevice).length?l.byDevice:null;
  const rb=r.byDevice&&typeof r.byDevice==='object'&&Object.keys(r.byDevice).length?r.byDevice:null;
  if(!lb&&!rb){
    const ls=statsValue(l),rs=statsValue(r);
    const useRemote=rs.attempts>ls.attempts||(rs.attempts===ls.attempts&&rs.correct>ls.correct)||(rs.attempts===ls.attempts&&rs.correct===ls.correct&&rs.lastAt>ls.lastAt);
    return{attempts:Math.max(ls.attempts,rs.attempts),correct:Math.max(ls.correct,rs.correct),lastAt:useRemote?rs.lastAt||ls.lastAt:ls.lastAt||rs.lastAt};
  }
  const buckets={};
  if(lb)for(const [id,value] of Object.entries(lb))buckets[id]=bucketValue(value);
  if(rb)for(const [id,value] of Object.entries(rb)){
    const current=buckets[id];
    if(!current)buckets[id]=bucketValue(value);
    else{const next=bucketValue(value);buckets[id]={attempts:Math.max(current.attempts,next.attempts),correct:Math.max(current.correct,next.correct),lastAt:Math.max(current.lastAt,next.lastAt)};}
  }
  if(!lb||!rb){
    const legacySource=lb? r : l;
    if(legacySource&&!legacySource.byDevice){
      const legacy=bucketValue(legacySource);
      const current=buckets.legacy;
      if(!current)buckets.legacy=legacy;else buckets.legacy={attempts:Math.max(current.attempts,legacy.attempts),correct:Math.max(current.correct,legacy.correct),lastAt:Math.max(current.lastAt,legacy.lastAt)};
    }
  }
  const totals=totalsFromBuckets(buckets);
  return{...totals,byDevice:buckets};
}
export function mergeKnowledgeEntry(localEntry,remoteEntry){
  const l=localEntry&&typeof localEntry==='object'?localEntry:{},r=remoteEntry&&typeof remoteEntry==='object'?remoteEntry:{};
  const out={...l,...r,schemaVersion:SCHEMA_VERSION};
  for(const mode of MODES)out[mode]=mergeModeStats(l[mode],r[mode]);
  const ld=l.distractors||{},rd=r.distractors||{};out.distractors={...ld};for(const [key,value] of Object.entries(rd))out.distractors[key]=Math.max(Number(ld[key])||0,Number(value)||0);
  const timestampFields=['createdAt','exposedAt','learningAt','reinforcingAt','masteredAt','lastPromptAt'];
  for(const field of timestampFields){const a=String(l[field]||''),b=String(r[field]||'');if(a||b)out[field]=a>=b?(a||b):b;}
  const stageRank={new:0,exposed:1,learning:2,reinforcing:3,mastered:4};
  out.stage=stageRank[r.stage]>stageRank[l.stage]?r.stage:(l.stage||r.stage||'new');
  const le=l.educationEvidence&&typeof l.educationEvidence==='object'?l.educationEvidence:{},re=r.educationEvidence&&typeof r.educationEvidence==='object'?r.educationEvidence:{};
  const leAt=String(le.updatedAt||''),reAt=String(re.updatedAt||'');out.educationEvidence=reAt>leAt?{...le,...re}:{...re,...le};
  return out;
}
export function mergeKnowledge(local,remote){const out=structuredClone(local||{});for(const[ch,rv]of Object.entries(remote||{}))out[ch]=mergeKnowledgeEntry(out[ch],rv);return out;}
export {MODES,SCHEMA_VERSION};
