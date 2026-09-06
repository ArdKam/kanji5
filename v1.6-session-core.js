const MODES=['meaning','reading','production','vocabulary','context'];
const LABELS={meaning:'معنی',reading:'خوانش',production:'تولید',vocabulary:'واژگان',context:'بافت'};
const MIN_SHARE=.08;
function safeStats(value){const s=value&&typeof value==='object'?value:{};const attempts=Math.max(0,Number(s.attempts)||0);const correct=Math.min(attempts,Math.max(0,Number(s.correct)||0));return{attempts,correct,mastery:(correct+1)/(attempts+2),lastAt:typeof s.lastAt==='string'?s.lastAt:''}}
function recencyBoost(lastAt,now=Date.now()){if(!lastAt)return 1.25;const time=Date.parse(lastAt);if(!Number.isFinite(time))return 1.25;const ageDays=Math.max(0,now-time)/86400000;return Math.min(1.5,1+ageDays/21)}
export function buildSessionPlan(knowledge={},options={}){
 const now=Number(options.now)||Date.now();
 const target=Math.max(1,Math.min(30,Number(options.count)||10));
 const entries=MODES.map(mode=>{let attempts=0,correct=0,lastAt='';for(const entry of Object.values(knowledge||{})){const s=safeStats(entry?.[mode]);attempts+=s.attempts;correct+=s.correct;if(s.lastAt>lastAt)lastAt=s.lastAt}const mastery=(correct+1)/(attempts+2),weakness=1-mastery,urgency=weakness*1.7+recencyBoost(lastAt,now)*.15+(attempts===0?.45:0);return{mode,label:LABELS[mode],attempts,correct,mastery,accuracy:attempts?correct/attempts*100:0,score:Math.max(.01,urgency)}});
 const total=entries.reduce((sum,item)=>sum+item.score,0)||1;
 let shares=entries.map(item=>({...item,share:item.score/total}));
 if(shares.length){const deficit=shares.reduce((sum,item)=>sum+Math.max(0,MIN_SHARE-item.share),0);if(deficit>0){const donors=shares.filter(item=>item.share>MIN_SHARE);const donorTotal=donors.reduce((sum,item)=>sum+(item.share-MIN_SHARE),0)||1;shares=shares.map(item=>item.share<MIN_SHARE?{...item,share:MIN_SHARE}:{...item,share:item.share-(deficit*(item.share-MIN_SHARE)/donorTotal)})}}
 const sum=shares.reduce((a,b)=>a+b.share,0)||1;shares=shares.map(item=>({...item,share:item.share/sum,plannedCount:Math.max(0,Math.round(target*item.share))}));
 let assigned=shares.reduce((sum,item)=>sum+item.plannedCount,0);while(assigned<target){const candidate=shares.slice().sort((a,b)=>(b.share*target-Math.floor(b.share*target))-(a.share*target-Math.floor(a.share*target)))[0];candidate.plannedCount+=1;assigned++}while(assigned>target){const candidate=shares.filter(item=>item.plannedCount>0).slice().sort((a,b)=>a.share-b.share)[0];candidate.plannedCount-=1;assigned--}
 shares.sort((a,b)=>b.score-a.score||a.mode.localeCompare(b.mode));
 return{version:1,target,generatedAt:new Date(now).toISOString(),modes:shares.map(item=>({mode:item.mode,label:item.label,plannedCount:item.plannedCount,share:item.share,mastery:item.mastery,accuracy:item.accuracy,attempts:item.attempts,score:item.score})),priority:shares.filter(item=>item.plannedCount>0).map(item=>item.mode)};
}
export function weakestMode(plan){return plan?.modes?.slice().sort((a,b)=>a.mastery-b.mastery||b.score-a.score)[0]?.mode||null}
export function nextPlannedMode(plan,remaining={},availableModes=MODES){
 const available=new Set(Array.isArray(availableModes)&&availableModes.length?availableModes:MODES);
 const candidates=(plan?.modes||[]).filter(item=>available.has(item.mode)&&Number(remaining[item.mode]??item.plannedCount)>0).sort((a,b)=>b.score-a.score||a.mode.localeCompare(b.mode));
 return candidates[0]?.mode||null;
}
