import { readFile } from "node:fs/promises";

const readJSON = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const kanjiData = await readJSON("kanji-data.json");
const componentData = await readJSON("kanji-components.json");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const joyo = (kanjiData?.kanji || []).map(entry => String(entry?.character || ""));
const map = componentData?.components || {};
const missing = componentData?.missing || [];
const expectedMissing = ["諮","弔","款","迭","陪","酪","劾","摯","衷","詔","蚕","頒","謄","恣","畝","訃","緻","倹","繭","謁","舷","墾","璽","遵","塑","朕","痘","氾","沃","憬","楷","錮","塡","頰","𠮟","剝"];

assert(joyo.length === 2136, "Expected 2,136 Jōyō kanji");
assert(componentData.schema === "kanji-components/v2", "Component dataset schema must be v2");
assert(componentData.coverage?.available === 2100 && componentData.coverage?.total === 2136, "Component coverage changed");
assert(componentData.source?.name === "TopoKanji", "Unexpected component source");
assert(componentData.source?.commit === "cd04afc2c4335336c9243b8aef01c0d2a69c3009", "TopoKanji source pin changed");
assert(JSON.stringify(missing) === JSON.stringify(expectedMissing), "Unexpected source-gap list");
assert(new Set(joyo).size === joyo.length && Object.keys(map).length === 2100, "Jōyō/component key integrity failed");
const entitySet=new Set((componentData.componentEntities||[]).map(x=>x.glyph));
assert(entitySet.size===componentData.componentEntities.length, "Duplicate component entities");
assert(entitySet.size===new Set(Object.values(map).flat()).size, "Component entity catalog mismatch");
assert(componentData.recursive?.["語"]?.map(x=>x.glyph).join("")==="言吾", "Recursive root mismatch for 語");
assert(componentData.recursive?.["湖"]?.[0]?.glyph==="氵", "Recursive root mismatch for 湖");
assert(componentData.reverseIndex?.direct?.["言"]?.includes("語"), "Direct reverse index missing 語");
assert(componentData.reverseIndex?.recursive?.["言"]?.includes("議"), "Recursive reverse index missing 議");
assert(componentData.componentEntities.some(x=>x.glyph==="氵"&&x.isJoyoKanji===false), "Non-Jōyō component entity missing");
assert(componentData.notes.some(x=>x.includes("semantic/phonetic")), "Unsupported linguistic role policy missing");

for (const [character, values] of Object.entries(map)) {
  assert(joyo.includes(character), `Unexpected non-Jōyō key: ${character}`);
  assert(Array.isArray(values) && values.length === new Set(values).size, `Invalid components for ${character}`);
}
for (const [component, users] of Object.entries(componentData.reverseIndex.direct || {})) {
  assert(users.every(character => Object.prototype.hasOwnProperty.call(map, character)), `Invalid direct reverse user for ${component}`);
}
console.log("Kanji component dataset v2 contract passed.");
