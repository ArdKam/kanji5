import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const boundarySource=fs.readFileSync("v1.9-v2-boundary.js","utf8");
const radicalData=JSON.parse(fs.readFileSync("kanji-radicals.json","utf8"));
let fetchCount=0;
const sandbox={
  window:{__KANJI5_STATE__:{readDeck(){return[{id:"学",character:"学",meaning:["study"],on:["ガク"],kun:["まな.ぶ"],strokes:8,grade:1,jlpt:"N5",frequency:1,order:1}]}}},
  document:{addEventListener(){},dispatchEvent(){}},
  CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}},
  setTimeout(){},
  fetch:async(url)=>{
    fetchCount++;
    return {ok:true,async json(){return radicalData}};
  }
};
vm.runInNewContext(boundarySource,sandbox,{filename:"v1.9-v2-boundary.js"});
const api=sandbox.window.__KANJI5_V19_V2_BOUNDARY__;
assert.equal(typeof api?.getRadicalInfo,"function");
const first=await api.getRadicalInfo("学");
const second=await api.getRadicalInfo("学");
assert.equal(first.available,true);
assert.equal(first.radicalId,39);
assert.equal(first.radical?.canonicalGlyph,"子");
assert.equal(first.radical?.codePoint,"U+2F26");
assert.equal(first.source?.version,"18.0.0");
assert.equal(first.mappingSource?.field,"radical.classical");
assert.equal(second.radicalId,39);
assert.equal(fetchCount,2);
const missing=await api.getRadicalInfo("㐀");
assert.equal(missing.available,false);
console.log("Kanji5 radical boundary contract passed.");
