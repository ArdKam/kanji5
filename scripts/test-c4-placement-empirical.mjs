import assert from "node:assert/strict";
import fs from "node:fs";

const catalog=JSON.parse(fs.readFileSync("kanji-data.json","utf8")).kanji;
const placementSource=fs.readFileSync("frontend/src/app/placement-logic.ts","utf8");

assert.match(placementSource,/const BLUEPRINT_QUANTILES = \[0\.05, 0\.35, 0\.65, 0\.95\]/);
assert.match(placementSource,/let x = stableHash\(String\(seed\) \+ ":" \+ salt\)/);
assert.match(placementSource,/0x85ebca6b/);
assert.match(placementSource,/0xc2b2ae35/);

const LEVELS=["N5","N4","N3","N2"];
const QUANTILES=[0.05,0.35,0.65,0.95];
const PER_LEVEL=4;

function stableHash(value){
  let hash=2166136261;
  for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
function seededUnit(seed,salt){
  let x=stableHash(String(seed)+":"+salt);
  x^=x>>>16;
  x=Math.imul(x,0x85ebca6b);
  x^=x>>>13;
  x=Math.imul(x,0xc2b2ae35);
  x^=x>>>16;
  return (x>>>0)/4294967296;
}
function shuffleWithSeed(values,seed,salt){
  const result=values.slice();
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(seededUnit(seed,salt+":"+i)*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
function meaningTokens(value){
  return String(value??"").normalize("NFKC").toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9\\s]/g," ").split(/\\s+/).filter(Boolean).map(token=>token.replace(/(?:ing|ed|es|s)$/i,"")).filter(token=>token.length>1);
}
function overlap(left,right){
  const a=meaningTokens(left),b=new Set(meaningTokens(right));
  if(!a.length||!b.size)return 0;
  return a.filter(token=>b.has(token)).length/Math.max(1,Math.min(a.length,b.size));
}
function ambiguous(character,targetMeanings,candidateMeanings){
  const fixtures={会:["meet","meeting"],学:["study","learning"],生:["life","birth"],行:["go"]};
  const equivalent=fixtures[character]||[];
  if(equivalent.some(target=>candidateMeanings.some(candidate=>overlap(target,candidate)>=0.8)))return true;
  return targetMeanings.some(target=>candidateMeanings.some(candidate=>overlap(target,candidate)>=0.8));
}
function pickBlueprintItems(pool){
  if(!pool.length)return [];
  const selected=[],used=new Set();
  for(const quantile of QUANTILES){
    const index=Math.min(pool.length-1,Math.max(0,Math.round(quantile*(pool.length-1))));
    const item=pool[index];
    if(item&&!used.has(item)){used.add(item);selected.push(item);}
  }
  for(const item of pool){
    if(selected.length>=PER_LEVEL||used.has(item))continue;
    used.add(item);selected.push(item);
  }
  return selected.slice(0,PER_LEVEL);
}

const byLevel=new Map();
for(const item of catalog){
  if(!item.meaning?.length||!LEVELS.includes(item.jlpt))continue;
  const list=byLevel.get(item.jlpt)??[];
  list.push(item);
  byLevel.set(item.jlpt,list);
}
for(const level of LEVELS)byLevel.get(level)?.sort((a,b)=>Number(a.order??Infinity)-Number(b.order??Infinity));
const selected=LEVELS.flatMap(level=>pickBlueprintItems(byLevel.get(level)??[]));
assert.equal(selected.length,16,"actual catalog must support the full 16-question contract");

const questions=selected.map((item,index)=>{
  const correct=item.meaning[0];
  const distractors=catalog
    .filter(candidate=>candidate.character!==item.character&&candidate.meaning?.[0]&&candidate.meaning[0]!==correct&&!ambiguous(item.character,item.meaning,candidate.meaning))
    .slice()
    .sort((a,b)=>Number(a.order??Infinity)-Number(b.order??Infinity))
    .map(candidate=>candidate.meaning[0])
    .filter((value,i,values)=>values.indexOf(value)===i)
    .slice(index%7,index%7+6);
  const pool=[correct,...distractors].slice(0,4);
  assert.equal(pool.length,4,`question ${index} must have four options`);
  return {character:item.character,index,correct,pool};
});

const positionCounts=[0,0,0,0];
const layouts=new Set();
for(let seed=0;seed<10000;seed++){
  const layout=[];
  for(const question of questions){
    const options=shuffleWithSeed(question.pool,seed,"placement-options:"+question.character+":"+question.index);
    positionCounts[options.indexOf(question.correct)]++;
    layout.push(options.join("|"));
  }
  layouts.add(layout.join(";;"));
}

const total=10000*questions.length;
const expected=total/4;
const chiSquare=positionCounts.reduce((sum,observed)=>sum+(observed-expected)**2/expected,0);
const maxRelativeDeviation=Math.max(...positionCounts.map(observed=>Math.abs(observed-expected)/expected));
assert.ok(chiSquare<7.815,`answer-position chi-square too high: ${chiSquare}`);
assert.ok(maxRelativeDeviation<0.03,`answer-position deviation too high: ${maxRelativeDeviation}`);
assert.ok(layouts.size>9000,`retake layouts are not sufficiently varied: ${layouts.size}`);

console.log(JSON.stringify({
  questions:questions.length,
  runs:10000,
  positionCounts,
  proportions:positionCounts.map(value=>value/total),
  chiSquare,
  maxRelativeDeviation,
  uniqueLayouts:layouts.size,
  selected:questions.map(q=>q.character)
},null,2));
console.log("C4 placement empirical stability screen passed.");
