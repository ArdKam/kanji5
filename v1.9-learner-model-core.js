export const LEARNER_MODEL_VERSION='1.9.0-learner-model';
export const ATTRIBUTES=['meaning','reading','production','vocabulary','context'];
export const STATES=['unseen','introduced','learning','weak','recovering','stable','mastered'];

const DEFAULTS=Object.freeze({recentWindow:3,weakAccuracy:0.6,recoveringAccuracy:0.75,stableAccuracy:0.85,masteryAccuracy:0.92,masteryMinAttempts:4,repeatFailureStreak:2,recoveryMinAttempts:2,confidenceFullAttempts:8});

function num(v){return Number.isFinite(Number(v))?Number(v):0}
function clamp(v,min=0,max=1){return Math.max(min,Math.min(max,num(v)))}
function normalizeAttempt(x){const attempts=Math.max(0,num(x?.attempts)),correct=Math.min(attempts,Math.max(0,num(x?.correct)));return{attempts,correct,accuracy:attempts?correct/attempts:0,lastAt:typeof x?.lastAt==='string'?x.lastAt:'',lastOutcome:typeof x?.lastOutcome==='string'?x.lastOutcome:null,lastCorrect:typeof x?.lastCorrect==='boolean'?x.lastCorrect:null}}
function orderRows(rows){return(Array.isArray(rows)?rows:[]).filter(x=>x&&typeof x==='object').slice().sort((a,b)=>String(a.endedAt||a.createdAt||'').localeCompare(String(b.endedAt||b.createdAt||'')))}
function modeSummary(rows,mode,now=Date.now(),options={}){
  const cfg={...DEFAULTS,...options};
  const source=orderRows(rows).map(r=>r.modeResults?.[mode]).filter(Boolean).map(normalizeAttempt);
  const lifetime=source.reduce((a,s)=>({attempts:a.attempts+s.attempts,correct:a.correct+s.correct}),{attempts:0,correct:0});
  const recent=source.slice(-Math.max(1,cfg.recentWindow)).reduce((a,s)=>({attempts:a.attempts+s.attempts,correct:a.correct+s.correct}),{attempts:0,correct:0});
  let errorStreak=0,successStreak=0;
  for(let i=source.length-1;i>=0;i--){const o=source[i];if(o.lastCorrect===false&&successStreak===0){errorStreak++;continue}if(o.lastCorrect===true&&errorStreak===0){successStreak++;continue}break}
  const last=source[source.length-1]||{};
  const lastMs=last.lastAt?Date.parse(last.lastAt):NaN;
  const recency=Number.isFinite(lastMs)?Math.max(0,(num(now)-lastMs)/86400000):Infinity;
  let recoveryCount=0;
  for(let i=1;i<source.length;i++)if(source[i-1].lastCorrect===false&&source[i].lastCorrect===true)recoveryCount++;
  const confidence=clamp(Math.min(1,lifetime.attempts/Math.max(1,cfg.confidenceFullAttempts))*(source.length?1:0));
  const accuracy=lifetime.attempts?lifetime.correct/lifetime.attempts:0;
  const recentAccuracy=recent.attempts?recent.correct/recent.attempts:0;
  const momentum=recent.attempts&&lifetime.attempts?clamp((recentAccuracy-accuracy)+.5,-1,1):0;
  let state='unseen';
  if(!lifetime.attempts)state=last.exposedAt?'introduced':'unseen';
  else if(errorStreak>=cfg.repeatFailureStreak||accuracy<cfg.weakAccuracy)state='weak';
  else if(recentAccuracy<cfg.recoveringAccuracy&&momentum>0)state='recovering';
  else if(lifetime.attempts>=cfg.masteryMinAttempts&&accuracy>=cfg.masteryAccuracy&&confidence>=.5)state='mastered';
  else if(accuracy>=cfg.stableAccuracy&&successStreak>=2)state='stable';
  else state='learning';
  return{attempts:lifetime.attempts,correct:lifetime.correct,accuracy,recentAttempts:recent.attempts,recentCorrect:recent.correct,recentAccuracy,errorStreak,successStreak,lastAt:last.lastAt||'',recencyDays:Number.isFinite(recency)?recency:null,momentum,recoveryCount,confidence,state,version:LEARNER_MODEL_VERSION};
}
export function buildLearnerModel(rows,options={}){
  const ordered=orderRows(rows),out={version:LEARNER_MODEL_VERSION,sessions:ordered.length,generatedAt:Date.now(),attributes:{}};
  for(const mode of ATTRIBUTES)out.attributes[mode]=modeSummary(ordered,mode,options.now??Date.now(),options);
  return out;
}
export function projectKanjiAttributes(knowledge,character,options={}){
  const entry=knowledge?.[character]||{};const out={character,version:LEARNER_MODEL_VERSION,attributes:{}};
  for(const mode of ATTRIBUTES){const raw=entry?.[mode];const s=normalizeAttempt(raw);const attempts=s.attempts,accuracy=s.accuracy;const confidence=clamp(attempts/(options.confidenceFullAttempts||DEFAULTS.confidenceFullAttempts));let state='unseen';if(!attempts)state=entry?.exposedAt?'introduced':'unseen';else if(s.lastOutcome==='unknown'||s.lastCorrect===false&&attempts>=2&&accuracy<DEFAULTS.weakAccuracy)state='weak';else if(accuracy>=DEFAULTS.masteryAccuracy&&attempts>=DEFAULTS.masteryMinAttempts)state='mastered';else if(accuracy>=DEFAULTS.stableAccuracy&&attempts>=3)state='stable';else state='learning';out.attributes[mode]={...s,confidence,state,version:LEARNER_MODEL_VERSION};}
  return out;
}
export function attributeWeakness(model,mode){const s=model?.attributes?.[mode];if(!s)return 1;return clamp((1-s.accuracy)*(1+Math.max(0,s.errorStreak-1)*0.25));}
export function rankAttributes(model){return ATTRIBUTES.map(mode=>({mode,score:attributeWeakness(model,mode),state:model?.attributes?.[mode]?.state||'unseen',confidence:model?.attributes?.[mode]?.confidence||0})).sort((a,b)=>b.score-a.score||a.mode.localeCompare(b.mode));}
