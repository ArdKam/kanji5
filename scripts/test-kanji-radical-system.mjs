import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const readJSON=async path=>JSON.parse(await readFile(new URL("../"+path,import.meta.url),"utf8"));
const catalog=await readJSON("kanji-radicals.json");
const map=await readJSON("kanji-radical-map.json");
const kanji=await readJSON("kanji-data.json");
const sw=await readFile(new URL("../sw.js",import.meta.url),"utf8");
const boundary=await readFile(new URL("../v1.9-v2-boundary.js",import.meta.url),"utf8");
const card=await readFile(new URL("../frontend/src/app/DictionaryKanjiCard.tsx",import.meta.url),"utf8");

assert.equal(catalog.schema,"kanji-radicals/v1");
assert.equal(catalog.radicals.length,214);
assert.equal(new Set(catalog.radicals.map(r=>r.id)).size,214);
assert.equal(new Set(catalog.radicals.map(r=>r.glyph)).size,214);
assert.equal(map.schema,"kanji-radical-map/v1");
assert.equal(Object.keys(map.kanji).length,2136);
assert.equal(map.coverage.available,2136);
assert.equal(map.coverage.total,2136);
assert.equal(kanji.kanji.length,2136);
assert.match(sw,/\.\/kanji-radicals\.json/);
assert.match(sw,/\.\/kanji-radical-map\.json/);
assert.match(boundary,/function getRadicalInfo\(character\)/);
assert.match(boundary,/getRadicalInfo,getComponentInfo|getComponentInfo,getRadicalInfo/);
assert.match(card,/TraditionalRadical/);
assert.match(card,/getRadicalInfo\(item\.character\)/);
assert.match(card,/Learning cue/);
assert.match(card,/سرنخ یادگیری/);

const byId=new Map(catalog.radicals.map(r=>[r.id,r]));
for(const [character,id] of Object.entries(map.kanji)){
  assert(Number.isInteger(id)&&id>=1&&id<=214,"Invalid radical id for "+character);
  const radical=byId.get(id);
  assert(radical,"Missing radical "+id+" for "+character);
  assert(Number.isInteger(radical.strokeCount)&&radical.strokeCount>0,"Invalid stroke count "+id);
}
const expect=(character,id,glyph)=>{
  assert.equal(map.kanji[character],id,"Unexpected radical for "+character);
  assert.equal(byId.get(id).glyph,glyph,"Unexpected radical glyph for "+character);
};
expect("語",149,"言");
expect("海",85,"水");
expect("学",39,"子");
expect("病",104,"疒");
expect("金",167,"金");
expect("亀",5,"乙");

const source=await readFile(new URL("../v1.9-v2-boundary.js",import.meta.url),"utf8");
const fixture={
  coverage:{available:2136,total:2136,fraction:1},
  source:{name:"fixture"},
  radicals:[{id:149,glyph:"言",strokeCount:7,meanings:["speech"]}],
};
const sandbox={
  window:{
    __KANJI5_STATE__:{readDeck(){return[{character:"語",id:"語",meaning:["language"],on:["ゴ"],kun:[],strokes:14,jlpt:"N4",frequency:1,order:1}]}},
    __KANJI5_V19_V2_BOUNDARY__:undefined
  },
  document:{addEventListener(){},dispatchEvent(){}},
  CustomEvent:class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail}},
  setTimeout(){},
  fetch:async url=>({ok:true,json:async()=>String(url).includes("kanji-radicals.json")?fixture:{kanji:{"語":149},coverage:fixture.coverage,source:fixture.source}}),
  console:{error(){}},
  performance:{now(){return 0}},
  sessionStorage:{removeItem(){}},
};
vm.runInNewContext(source,sandbox,{filename:"v1.9-v2-boundary.js"});
const info=await sandbox.window.__KANJI5_V19_V2_BOUNDARY__.getRadicalInfo("語");
assert.equal(info.available,true);
assert.equal(info.radicalId,149);
assert.equal(info.radical.glyph,"言");
assert.equal(info.coverage.total,2136);

console.log("Kanji 5 traditional radical dataset and boundary contract passed.");
