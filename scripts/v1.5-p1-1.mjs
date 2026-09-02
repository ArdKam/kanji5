import fs from 'node:fs';
const stage=fs.readFileSync('scripts/v1.5-maintenance-stage.txt','utf8').trim();
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const patchCore=()=>{
  const path='v1.4-education-core.js';let source=fs.readFileSync(path,'utf8');
  const oldNormalize="function normalizeKnowledgeEntry(entry){const source=entry&&typeof entry==='object'?entry:{},out={...source};for(const mode of MODES)if(out[mode])out[mode]=safeStats(out[mode]);out.distractors={...(source.distractors||{})};return out}";
  const newNormalize="function normalizeKnowledgeEntry(entry){const source=entry&&typeof entry==='object'?entry:{},out={...source};for(const mode of MODES)if(out[mode]){const raw=out[mode],stats=safeStats(raw),byDevice=raw?.byDevice&&typeof raw.byDevice==='object'?Object.fromEntries(Object.entries(raw.byDevice).map(([id,v])=>[id,safeStats(v)])):{};out[mode]=Object.keys(byDevice).length?{...stats,byDevice}:stats}out.distractors={...(source.distractors||{})};return out}";
  assert(source.includes(oldNormalize),'Education core normalization function changed; refusing unsafe P1-1 patch');source=source.replace(oldNormalize,newNormalize);
  const pattern=/function recordKnowledge\(knowledge,ch,mode,correct,wrong=''\)\{[\s\S]*?return out\}/;
  assert(pattern.test(source),'Education recordKnowledge function not found; refusing unsafe P1-1 patch');
  const replacement="function recordKnowledge(knowledge,ch,mode,correct,wrong='',deviceId='legacy'){const out=structuredClone(knowledge&&typeof knowledge==='object'?knowledge:{}),now=new Date().toISOString(),entry=normalizeKnowledgeEntry(out[ch]),existing=safeStats(entry[mode]),buckets=entry[mode]?.byDevice&&typeof entry[mode].byDevice==='object'?Object.fromEntries(Object.entries(entry[mode].byDevice).map(([id,v])=>[id,safeStats(v)])):{};if(!Object.keys(buckets).length&&(existing.attempts||existing.correct||existing.lastAt))buckets.legacy=existing;const id=String(deviceId||'legacy');const bucketStats=buckets[id]||{attempts:0,correct:0,lastAt:''};bucketStats.attempts+=1;if(correct)bucketStats.correct+=1;bucketStats.lastAt=now;buckets[id]=bucketStats;let attempts=0,correctCount=0,lastAt='';for(const value of Object.values(buckets)){const s=safeStats(value);attempts+=s.attempts;correctCount+=s.correct;if(s.lastAt>lastAt)lastAt=s.lastAt}entry[mode]={attempts,correct:correctCount,lastAt,byDevice:buckets};if(!entry.createdAt)entry.createdAt=now;if(!entry.exposedAt)entry.exposedAt=now;entry.stage=getStage(entry);const stageAt=`${entry.stage}At`;if(!entry[stageAt])entry[stageAt]=now;if(!entry.educationEvidence)entry.educationEvidence={};entry.educationEvidence.lastMode=mode;entry.educationEvidence.lastCorrect=!!correct;entry.educationEvidence.updatedAt=now;entry.educationEvidence.scheduler=educationSchedulerSignal(entry);if(wrong)entry.distractors[wrong]=(Number(entry.distractors[wrong])||0)+1;out[ch]=entry;return out}";
  source=source.replace(pattern,replacement);fs.writeFileSync(path,source)
};
const patchUI=()=>{
  const path='v1.4-education-ui.js';let source=fs.readFileSync(path,'utf8');
  const marker="function record(mode,result,wrong=''){const next=CORE.recordKnowledge(readKnowledge(),edu.item.character,mode,result.correct,wrong);writeKnowledge(next);return next[edu.item.character]}";
  const replacement="function getDeviceId(){try{const key='kanji5-device-id',existing=localStorage.getItem(key);if(existing)return existing;const id=(crypto?.randomUUID?.()||`device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);localStorage.setItem(key,id);return id}catch(_){return 'legacy'}}function record(mode,result,wrong=''){const next=CORE.recordKnowledge(readKnowledge(),edu.item.character,mode,result.correct,wrong,getDeviceId());writeKnowledge(next);return next[edu.item.character]}";
  assert(source.includes(marker),'Education UI record function changed; refusing unsafe P1-1 patch');source=source.replace(marker,replacement);fs.writeFileSync(path,source)
};
const patchSync=()=>{
  const path='supabase-sync.js';let source=fs.readFileSync(path,'utf8');
  if(!source.includes("from './v1.5-education-sync-core.js'"))source="import { mergeModeStats as mergeEducationModeStats, mergeKnowledgeEntry as mergeEducationKnowledgeEntry, mergeKnowledge as mergeEducationKnowledge } from './v1.5-education-sync-core.js';\n"+source;
  const pattern=/  const mergeModeStats = \(local, remote\) => \{[\s\S]*?  const mergeKnowledge = \(local, remote\) => \{[\s\S]*?  \};\n/;
  const match=source.match(pattern);assert(match,'Supabase education merge functions not found; refusing unsafe P1-1 patch');
  const replacement="  const mergeModeStats = (local, remote) => mergeEducationModeStats(local, remote);\n  const mergeKnowledgeEntry = (localEntry, remoteEntry) => mergeEducationKnowledgeEntry(localEntry, remoteEntry);\n  const mergeKnowledge = (local, remote) => mergeEducationKnowledge(local, remote);\n";
  source=source.replace(pattern,replacement);fs.writeFileSync(path,source)
};
if(stage==='p1-1'){patchCore();patchUI();patchSync()}
console.log(`P1-1 patch stage ${stage} applied.`);
