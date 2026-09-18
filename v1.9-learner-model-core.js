export const LEARNER_MODEL_VERSION='1.9.0-learner-model';
export const ATTRIBUTES=['meaning','reading','production','vocabulary','context'];
export const STATES=['unseen','introduced','learning','weak','recovering','stable','mastered'];

const DEFAULTS=Object.freeze({recentWindow:4,weakAccuracy:0.6,recoveringAccuracy:0.75,stableAccuracy:0.85,masteryAccuracy:0.92,masteryMinAttempts:4,repeatFailureStreak:2,recoveryMinAttempts:2,confidenceFullAttempts:8,sparseAttempts:2});
const STATE_PRIORITY=Object.freeze({weak:1.5,recovering:1.25,learning:1,introduced:.8,unseen:.6,stable:.2,mastered:.05});
const STATE_ORDER=Object.freeze({weak:0,recovering:1,learning:2,unseen:3,introduced:4,stable:5,mastered:6});
function num(v){return Number.isFinite(Number(v))?Number(v):0}
function clamp(v,min=0,max=1){return Math.max(min,Math.min(max,num(v)))}
function normalizeAttempt(x){const attempts=Math.max(0,num(x?.attempts)),correct=Math.min(attempts,Math.max(0,num(x?.correct)));return{attempts,correct,accuracy:attempts?correct/attempts:0,lastAt:typeof x?.lastAt==='string'?x.lastAt:'',lastOutcome:typeof x?.lastOutcome==='string'?x.lastOutcome:null,lastCorrect:typeof x?.lastCorrect==='boolean'?x.lastCorrect:null}}
function normalizeEvidence(source){return(Array.isArray(source)?source:[]).filter(x=>x&&typeof x==='object').map(x=>({at:typeof x.at==='string'?x.at:'',outcome:String(x.outcome||''),mode:String(x.mode||'')})).filter(x=>x.at&&['correct','wrong','unknown','empty','invalid'].includes(x.outcome)).sort((a,b)=>a.at.localeCompare(b.at))}
function deriveEvidence(evidence,now=Date.now(),windowSize=DEFAULTS.recentWindow){const source=normalizeEvidence(evidence),recent=source.slice(-Math.max(1,windowSize));let errorStreak=0,successStreak=0,recoveries=0;for(let i=source.length-1;i>=0;i--){const o=source[i]?.outcome;if(o==='wrong'||o==='unknown'){if(successStreak===0)errorStreak++;else break}else if(o==='correct'){if(errorStreak===0)successStreak++;else break}else break}for(let i=1;i<source.length;i++)if((source[i-1].outcome==='wrong'||source[i-1].outcome==='unknown')&&source[i].outcome==='correct')recoveries++;const attempts=recent.length,correct=recent.filter(x=>x.outcome==='correct').length,recentAccuracy=attempts?correct/attempts:0,l=source[source.length-1],lastMs=l?.at?Date.parse(l.at):NaN,recencyDays=Number.isFinite(lastMs)?Math.max(0,(now-lastMs)/86400000):null;const older=source.length>recent.length?source.slice(0,source.length-recent.length):[];const olderCorrect=older.filter(x=>x.outcome==='correct').length,olderAccuracy=older.length?olderCorrect/older.length:null;const momentum=olderAccuracy===null?0:recentAccuracy-olderAccuracy;const repeatedFailure=errorStreak>=DEFAULTS.repeatFailureStreak;const uncertaintyState=attempts<DEFAULTS.sparseAttempts?'high':attempts<4?'moderate':'low';return{recentAttempts:attempts,recentAccuracy,errorStreak,successStreak,recoveryCount:recoveries,lastAt:l?.at||'',recencyDays,momentum,repeatedFailure,uncertaintyState}}
function orderRows(rows){return(Array.isArray(rows)?rows:[]).filter(x=>x&&typeof x==='object').slice().sort((a,b)=>String(a.endedAt||a.createdAt||'').localeCompare(String(b.endedAt||b.createdAt||'')))}
function deriveMomentum(recentAccuracy,baselineAccuracy){return baselineAccuracy===null?0:clamp(recentAccuracy-baselineAccuracy,-1,1)}
function deriveState({attempts,accuracy,confidence,errorStreak,successStreak=0,recentAccuracy,momentum,exposed=false},cfg=DEFAULTS){
  if(!attempts)return exposed?'introduced':'unseen';
  if(errorStreak>=cfg.repeatFailureStreak||accuracy<cfg.weakAccuracy)return'weak';
  if(momentum>0&&recentAccuracy<cfg.recoveringAccuracy&&attempts>=cfg.recoveryMinAttempts)return'recovering';
  if(attempts>=cfg.masteryMinAttempts&&accuracy>=cfg.masteryAccuracy&&confidence>=.5)return'mastered';
  if(accuracy>=cfg.stableAccuracy&&attempts>=3&&successStreakForState>=2&&confidence>=.375&&successStreak>=2)return'stable';
  return'learning';
}
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
  const older=source.length>recent.attempts?source.slice(0,source.length-recent.attempts):[];
  const olderAttempts=older.reduce((n,s)=>n+s.attempts,0),olderCorrect=older.reduce((n,s)=>n+s.correct,0);
  const olderAccuracy=olderAttempts?olderCorrect/olderAttempts:null;
  const momentum=deriveMomentum(recentAccuracy,olderAccuracy);
  const successStreakForState=successStreak;
  const state=deriveState({attempts:lifetime.attempts,accuracy,confidence,errorStreak,successStreak,recentAccuracy,momentum},cfg);
  return{attempts:lifetime.attempts,correct:lifetime.correct,accuracy,recentAttempts:recent.attempts,recentCorrect:recent.correct,recentAccuracy,errorStreak,successStreak,lastAt:last.lastAt||'',recencyDays:Number.isFinite(recency)?recency:null,momentum,recoveryCount,confidence,state,version:LEARNER_MODEL_VERSION}
}
export function buildLearnerModel(rows,options={}){const ordered=orderRows(rows),out={version:LEARNER_MODEL_VERSION,sessions:ordered.length,generatedAt:Date.now(),attributes:{}};for(const mode of ATTRIBUTES)out.attributes[mode]=modeSummary(ordered,mode,options.now??Date.now(),options);return out}
export function projectKanjiAttributes(knowledge,character,options={}){
  const entry=knowledge?.[character]||{},out={character,version:LEARNER_MODEL_VERSION,attributes:{}};
  for(const mode of ATTRIBUTES){
    const raw=entry?.[mode],s=normalizeAttempt(raw),attempts=s.attempts,accuracy=s.accuracy;
    const confidence=clamp(attempts/(options.confidenceFullAttempts||DEFAULTS.confidenceFullAttempts));
    const evidence=deriveEvidence(options.evidenceByMode?.[mode],options.now??Date.now(),options.recentWindow||DEFAULTS.recentWindow);
    const state=deriveState({
      attempts,
      accuracy,
      confidence,
      errorStreak:evidence.errorStreak,
      recentAccuracy:evidence.recentAccuracy,
      momentum:evidence.momentum,
      exposed:Boolean(entry?.exposedAt)
    },DEFAULTS);
    out.attributes[mode]={...s,...evidence,confidence,state,version:LEARNER_MODEL_VERSION};
  }
  return out;
}
export function attributeWeakness(model,mode){const s=model?.attributes?.[mode];if(!s)return 1;const stateMultiplier=STATE_PRIORITY[s.state]??1;return clamp((1-s.accuracy)*stateMultiplier*(1+Math.max(0,s.errorStreak-1)*0.25))}
export function rankAttributes(model){return ATTRIBUTES.map(mode=>({mode,score:attributeWeakness(model,mode),state:model?.attributes?.[mode]?.state||'unseen',confidence:model?.attributes?.[mode]?.confidence||0})).sort((a,b)=>(STATE_ORDER[a.state]??99)-(STATE_ORDER[b.state]??99)||b.score-a.score||a.mode.localeCompare(b.mode))}
