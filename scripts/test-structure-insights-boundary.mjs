import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync("v1.9-v2-boundary.js","utf8");
const componentData=JSON.parse(fs.readFileSync("kanji-components.json","utf8"));
const radicalData=JSON.parse(fs.readFileSync("kanji-radicals.json","utf8"));

const fullMastery=Object.fromEntries(["meaning","reading","production","vocabulary","context"].map(mode=>[mode,{attempts:4,mastery:1}]));
const deck=[
  {id:"水",character:"水",meaning:["water"],on:["スイ"],kun:["みず"],strokes:4,order:1,radical:{classical:85}},
  {id:"海",character:"海",meaning:["sea"],on:["カイ"],kun:["うみ"],strokes:9,order:2,radical:{classical:85}},
  {id:"胡",character:"胡",meaning:["barbarian"],on:["コ"],kun:[],strokes:9,order:3,radical:{classical:130}},
  {id:"湖",character:"湖",meaning:["lake"],on:["コ"],kun:["みずうみ"],strokes:12,order:4,radical:{classical:85}},
];
const knowledge={胡:{meaning:{attempts:4,correct:4},reading:{attempts:4,correct:4},production:{attempts:4,correct:4},vocabulary:{attempts:4,correct:4},context:{attempts:4,correct:4}}};
const sandboxData={components:componentData,radicals:radicalData};
let calls=0;
const sandbox={
  window:{
    __KANJI5_STATE__:{
      readDeck(){return deck},
      readKnowledge(){return knowledge},
    }
  },
  document:{addEventListener(){},dispatchEvent(){}},
  CustomEvent:class{},
  setTimeout(){},
  fetch:async url=>({ok:true,async json(){calls++; return String(url).includes("radicals")?sandboxData.radicals:sandboxData.components;}})
};
new Function("window","document","CustomEvent","setTimeout","fetch",source)(sandbox.window,sandbox.document,sandbox.CustomEvent,()=>{},sandbox.fetch);
const api=sandbox.window.__KANJI5_V19_V2_BOUNDARY__;
assert.equal(typeof api.getStructureInsights,"function");

const first=await api.getStructureInsights("湖");
assert.equal(first.available,true);
assert.equal(first.character,"湖");
assert.equal(first.radical.id,85);
assert.equal(first.radical.glyph,"水");
assert.equal(first.radical.familySize,3);
assert.equal(first.radical.studiedCount,3);
assert.equal(first.familiarity.directJoyoCount,1);
assert.equal(first.familiarity.familiarDirectCount,1);
assert.equal(first.familiarity.weakDirectCount,0);
assert.equal(first.familiarity.newDirectCount,0);
assert.equal(first.familiarity.fraction,1);
assert.equal(first.directComponents.length,2);
assert.equal(first.directComponents.find(x=>x.glyph==="胡")?.mastery,1);
assert.equal(first.directComponents.find(x=>x.glyph==="氵")?.isJoyoKanji,false);
assert.equal(first.recursiveComponents.some(x=>x.glyph==="胡"),true);

const before=JSON.stringify(knowledge);
const second=await api.getStructureInsights("湖");
assert.equal(JSON.stringify(knowledge),before);
assert.equal(JSON.stringify(first),JSON.stringify(second));
assert.equal(calls,4);
console.log("Kanji5 structure insight boundary contract passed.");
