import assert from "node:assert/strict";
import fs from "node:fs";
const data=JSON.parse(fs.readFileSync("kanji-radicals.json","utf8"));
assert.equal(data.schema,"kanji-radicals/v1");
assert.equal(data.radicals.length,214);
assert.equal(data.coverage.kanjiMapped,2136);
assert.equal(new Set(data.radicals.map(r=>r.id)).size,214);
assert.equal(new Set(data.radicals.map(r=>r.canonicalGlyph)).size,214);
for(let i=0;i<214;i++){const r=data.radicals[i];assert.equal(r.id,i+1);assert.equal(r.radicalCharacter.codePointAt(0),0x2f00+i);assert.match(r.codePoint,/^U\\+2F[0-9A-F]+$/);assert.ok(typeof r.canonicalGlyph==="string"&&r.canonicalGlyph.length===1);assert.ok(Array.isArray(r.variants));}
for(const [character,row] of Object.entries(data.kanjiToRadical)){assert.equal(Array.from(character).length,1);assert.ok(Number.isInteger(row.radicalId)&&row.radicalId>=1&&row.radicalId<=214);}
assert.deepEqual(data.kanjiToRadical["学"].radicalId,39);
assert.deepEqual(data.kanjiToRadical["水"],{radicalId:85,source:"KANJIDIC2 classical radical",materializationSource:"jōyō radical extract"});
assert.ok(data.ambiguousSourceResolutions.some(x=>x.character==="期"&&x.resolved===74&&x.candidates.join(",")==="74,130"));
assert.ok(data.notes.some(x=>x.includes("Residual stroke counts")));
console.log("Kanji5 radical data contract passed.");
