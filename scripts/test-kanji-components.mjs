import { readFile } from "node:fs/promises";

const readJSON = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const kanjiData = await readJSON("kanji-data.json");
const componentData = await readJSON("kanji-components.json");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const joyo = (kanjiData?.kanji || []).map(entry => String(entry?.character || ""));
const map = componentData?.components || {};
const missing = componentData?.missing || [];

const expectedMissing = [
  "諮","弔","款","迭","陪","酪","劾","摯","衷","詔","蚕","頒","謄","恣","畝","訃",
  "緻","倹","繭","謁","舷","墾","璽","遵","塑","朕","痘","氾","沃","憬","楷","錮",
  "塡","頰","𠮟","剝"
];

assert(joyo.length === 2136, `Expected 2,136 Jōyō kanji, got ${joyo.length}`);
assert(componentData?.target?.count === 2136, "Component dataset target count mismatch");
assert(componentData?.coverage?.available === 2100, `Expected 2,100 covered kanji, got ${componentData?.coverage?.available}`);
assert(componentData?.coverage?.total === 2136, "Component dataset coverage total mismatch");
assert(componentData?.source?.name === "TopoKanji", "Unexpected component source");
assert(componentData?.source?.commit === "cd04afc2c4335336c9243b8aef01c0d2a69c3009", "Source pin changed unexpectedly");
assert(JSON.stringify(missing) === JSON.stringify(expectedMissing), "Unexpected source-gap list");
assert(missing.length === 36, "Expected exactly 36 source gaps");
assert(new Set(joyo).size === joyo.length, "Jōyō source contains duplicate characters");
assert(Object.keys(map).length === 2100, "Component map size mismatch");

const joyoSet = new Set(joyo);
for (const [character, values] of Object.entries(map)) {
  assert(joyoSet.has(character), `Unexpected non-Jōyō key: ${character}`);
  assert(Array.isArray(values), `Components must be arrays: ${character}`);
  assert(new Set(values).size === values.length, `Duplicate component in ${character}`);
  assert(!values.includes("0"), `Invalid sentinel component in ${character}`);
  assert(values.every(value => typeof value === "string" && value.length > 0), `Invalid component in ${character}`);
}
for (const character of missing) {
  assert(!Object.prototype.hasOwnProperty.call(map, character), `Missing character unexpectedly has data: ${character}`);
}

const expectExact = (character, expected) => {
  assert(JSON.stringify(map[character]) === JSON.stringify(expected), `Unexpected decomposition for ${character}: ${JSON.stringify(map[character])}`);
};
expectExact("語", ["言","吾"]);
expectExact("湖", ["氵","胡"]);
expectExact("食", ["人","良"]);
expectExact("会", ["人","云"]);
expectExact("明", ["日","月"]);
expectExact("議", ["言","義"]);

console.log("Kanji component dataset contract passed.");
