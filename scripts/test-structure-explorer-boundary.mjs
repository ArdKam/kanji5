import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync("v1.9-v2-boundary.js","utf8");
const radicalData=JSON.parse(fs.readFileSync("kanji-radicals.json","utf8"));
const componentData=JSON.parse(fs.readFileSync("kanji-components.json","utf8"));
const deck=[
 {id:"学",character:"学",meaning:["study"],on:["ガク"],kun:["まな.ぶ"],strokes:8,grade:1,jlpt:"N5",frequency:1,order:1,radical:{classical:39}},
 {id:"語",character:"語",meaning:["language"],on:["ゴ"],kun:["かた.る"],strokes:14,grade:2,jlpt:"N4",frequency:2,order:2,radical:{classical:149}},
 {id:"議",character:"議",meaning:["discussion"],on:["ギ"],kun:[""],strokes:20,grade:4,jlpt:"N3",frequency:3,order:3,radical:{classical:149}},
 {id:"海",character:"海",meaning:["sea"],on:["カイ"],kun:["うみ"],strokes:9,grade:2,jlpt:"N4",frequency:4,order:4,radical:{classical:85}}
];
let fetchCount=0;
const sandbox={
 window:{__KANJI5_STATE__:{readDeck(){return deck;}}},
 document:{addEventListener(){},dispatchEvent(){}},
 CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}},
 setTimeout(){},
 fetch:async url=>{fetchCount++;return{ok:true,async json(){return String(url).includes("radicals")?radicalData:componentData;}}}
};
vm.runInNewContext(source,sandbox,{filename:"v1.9-v2-boundary.js"});
const api=sandbox.window.__KANJI5_V19_V2_BOUNDARY__;
const info=await api.getComponentInfo("語");
assert.equal(info.available,true);
assert.equal(JSON.stringify(info.components),'["言","吾"]');
assert.equal(info.recursive?.[0]?.glyph,"言");
assert.equal(info.recursive?.[0]?.sourceConfidence,"derived-recursive");
assert.ok(info.recursive?.[0]?.children?.length > 0);
const radical=await api.getRadicalInfo("学");
assert.equal(radical.radicalId,39);
assert.equal(radical.radical?.canonicalGlyph,"子");
const radicals=await api.listRadicals();
assert.equal(radicals.results.length,214);
const byRadical=await api.getKanjiByRadical(149,20);
assert.equal(JSON.stringify(byRadical.results.map(x=>x.character)),'["語","議"]');
const direct=await api.getKanjiByComponent("言",false,20);
assert.equal(JSON.stringify(direct.results.map(x=>x.character)),'["語","議"]');
const recursive=await api.getKanjiByComponent("言",true,20);
assert.equal(JSON.stringify(recursive.results.map(x=>x.character)),'["語","議"]');
const intersection=await api.getKanjiByComponents(["言","義"],true,20);
assert.equal(JSON.stringify(intersection.results.map(x=>x.character)),'["議"]');
assert.equal(fetchCount,2);
console.log("Kanji5 radical/component explorer boundary contract passed.");
