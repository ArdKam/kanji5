import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readJSON = async path => JSON.parse(await readFile(new URL("../" + path, import.meta.url), "utf8"));
const catalog = await readJSON("kanji-data.json");
const visual = await readJSON("kanji-visual-structure.json");

assert.equal(visual.schema, "kanji-visual-structure/v1");
assert.equal(visual.version, 1);
assert.equal(visual.target?.count, 2136);
assert.equal(visual.coverage?.available, 2136);
assert.equal(visual.coverage?.total, 2136);
assert.equal(visual.coverage?.fraction, 1);
assert.equal(visual.source?.name, "KanjiVG");
assert.equal(visual.source?.commit, "70a0b7ae0c18ceb5cb358274b029cce0234a43bc");
assert.equal(visual.source?.license, "CC BY-SA 3.0");
assert.deepEqual(visual.missing, []);

const characters = (catalog?.kanji || []).map(entry => String(entry?.character || ""));
assert.equal(characters.length, 2136);
assert.equal(new Set(characters).size, 2136);
const structures = visual.structures || {};
assert.equal(Object.keys(structures).length, 2136);

function validateNode(node, context) {
  assert.ok(node && typeof node.character === "string" && node.character.length > 0, `Missing component glyph: ${context}`);
  assert.ok(Array.isArray(node.components), `Component children must be arrays: ${context}/${node.character}`);
  if (node.position !== undefined) assert.equal(typeof node.position, "string");
  if (node.variant !== undefined) assert.equal(node.variant, true);
  if (node.radicalRole !== undefined) assert.equal(typeof node.radicalRole, "string");
  if (node.phoneticRole !== undefined) assert.equal(typeof node.phoneticRole, "string");
  if (node.part !== undefined) assert.equal(typeof node.part, "string");
  if (node.partial !== undefined) assert.equal(node.partial, true);
  if (node.original !== undefined) assert.equal(typeof node.original, "string");
  if (node.sourceParts !== undefined) {
    assert.ok(Array.isArray(node.sourceParts), `Source part IDs must be arrays: ${context}/${node.character}`);
    assert.ok(node.sourceParts.length > 1, `Only grouped source fragments should carry sourceParts: ${context}/${node.character}`);
    assert.equal(new Set(node.sourceParts).size, node.sourceParts.length, `Duplicate source fragment IDs: ${context}/${node.character}`);
  }
  for (const [index, child] of node.components.entries()) validateNode(child, `${context}/${node.character}[${index}]`);
}

for (const character of characters) {
  const root = structures[character];
  assert.ok(root, `Missing source structure for ${character}`);
  assert.equal(root.character, character, `Root glyph mismatch for ${character}`);
  validateNode(root, character);
}

const direct = character => (structures[character]?.components || []).map(node => node.character);
const expectDirect = (character, expected) => {
  assert.deepEqual(direct(character), expected, `Unexpected KanjiVG component hierarchy for ${character}`);
};
// These anchors validate source extraction, repeated nodes and nesting—not etymological decomposition.
expectDirect("林", ["木", "木"]);
expectDirect("森", ["木", "林"]);
expectDirect("品", ["口", "口", "口"]);
expectDirect("晶", ["日", "日", "日"]);
expectDirect("炎", ["火", "火"]);
expectDirect("多", ["夕", "夕"]);
expectDirect("三", ["一", "一", "一"]);
expectDirect("海", ["氵", "毎"]);
expectDirect("語", ["言", "吾"]);
expectDirect("明", ["日", "月"]);
expectDirect("時", ["日", "寺"]);
expectDirect("会", ["人", "云"]);
expectDirect("学", ["⺍", "冖", "子"]);
// SVG groups explicitly marked as parts of one component are normalized to one glyph node.
expectDirect("国", ["囗", "玉"]);
expectDirect("年", ["丿", "干"]);
assert.deepEqual(structures["国"].components[0].sourceParts, ["1", "2"], "Enclosing 囗 fragments must be rejoined and their source-part IDs preserved");
const jadeDot = structures["国"].components[1].components.find(node => node.character === "王");
assert.equal(jadeDot?.partial, true, "The 王 glyph inside 玉 must remain marked as partial");
assert.equal(jadeDot?.original, "玉", "The original component glyph must be preserved for partial forms");

console.log("KanjiVG visual structure contract passed (2,136/2,136 source trees; repeated glyphs, nested groups, partial forms, and split SVG groups validated).");
