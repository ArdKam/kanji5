import { readFile, writeFile } from "node:fs/promises";

const SOURCE_COMMIT = "cd04afc2c4335336c9243b8aef01c0d2a69c3009";
const SOURCE_URL = `https://raw.githubusercontent.com/scriptin/topokanji/${SOURCE_COMMIT}/dependencies/1-to-N.json`;
const DATA_PATH = new URL("../kanji-data.json", import.meta.url);
const OUT_PATH = new URL("../kanji-components.json", import.meta.url);

const current = JSON.parse(await readFile(DATA_PATH, "utf8"));
const joyo = Array.isArray(current?.kanji) ? current.kanji.map(entry => String(entry?.character || "")) : [];
if (joyo.length !== 2136 || joyo.some(Boolean) === false) {
  throw new Error(`Expected 2,136 Jōyō kanji in kanji-data.json, got ${joyo.length}`);
}

const response = await fetch(SOURCE_URL, { cache: "no-store" });
if (!response.ok) throw new Error(`Failed to fetch pinned TopoKanji source: HTTP ${response.status}`);
const source = await response.json();

const components = {};
const missing = [];
for (const character of joyo) {
  if (Object.prototype.hasOwnProperty.call(source, character)) {
    const values = Array.isArray(source[character]) ? source[character] : [];
    components[character] = [...new Set(values.filter(value => value && value !== "0").map(String))];
  } else {
    missing.push(character);
  }
}

const componentSet = new Set(Object.values(components).flat());
const joyoSet = new Set(joyo);

function expandComponent(glyph, ancestry = new Set()) {
  const children = components[glyph];
  if (!Array.isArray(children) || !children.length) return { glyph, relation: "leaf", sourceConfidence: "source-direct", children: [] };
  if (ancestry.has(glyph)) return { glyph, relation: "cycle", sourceConfidence: "derived-recursive", children: [] };
  const next = new Set(ancestry);
  next.add(glyph);
  return { glyph, relation: "nested", sourceConfidence: "derived-recursive", children: children.map(child => expandComponent(child, next)) };
}
const recursive = {};
const directIndex = {};
const recursiveIndex = {};
for (const character of Object.keys(components)) {
  recursive[character] = components[character].map(component => expandComponent(component));
  for (const component of components[character]) {
    (directIndex[component] ||= []).push(character);
  }
  const seen = new Set();
  const visit = node => {
    if (!node?.glyph || seen.has(node.glyph)) return;
    seen.add(node.glyph);
    (recursiveIndex[node.glyph] ||= []).push(character);
    for (const child of node.children || []) visit(child);
  };
  for (const node of recursive[character]) visit(node);
}
for (const map of [directIndex, recursiveIndex]) for (const key of Object.keys(map)) map[key].sort((a,b)=>String(a).localeCompare(String(b)));
const componentEntities = [...componentSet].sort((a,b)=>String(a).localeCompare(String(b))).map(glyph=>({glyph,isJoyoKanji:joyoSet.has(glyph),sourceConfidence:"source-direct"}));
const output = {
  version: 2,
  schema: "kanji-components/v2",
  target: { name: "Jōyō kanji", count: joyo.length },
  coverage: { available: Object.keys(components).length, total: joyo.length, fraction: Number((Object.keys(components).length / joyo.length).toFixed(6)) },
  source: {
    name: "TopoKanji", file: "dependencies/1-to-N.json", commit: SOURCE_COMMIT, license: "MIT",
    url: `https://github.com/scriptin/topokanji/blob/${SOURCE_COMMIT}/dependencies/1-to-N.json`,
    semantics: "Visual decomposition dependencies/components; not equivalent to Kangxi radical numbers."
  },
  missing,
  components,
  componentEntities,
  recursive,
  reverseIndex: { direct: directIndex, recursive: recursiveIndex },
  notes: [
    "Direct component relations are source-provided by TopoKanji.",
    "Recursive relations are mechanically derived from the direct dependency graph and do not add semantic, phonetic, or positional claims.",
    "Component roles, semantic/phonetic assignments, confidence beyond source-vs-derived provenance, and variant semantics are intentionally omitted unless supported by a dedicated source."
  ]
};
await writeFile(OUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Generated kanji-components.json: ${output.coverage.available}/${output.coverage.total} covered; ${missing.length} source gaps preserved explicitly.`);
