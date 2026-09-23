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

const output = {
  version: 1,
  schema: "kanji-components/v1",
  target: { name: "Jōyō kanji", count: joyo.length },
  coverage: {
    available: Object.keys(components).length,
    total: joyo.length,
    fraction: Number((Object.keys(components).length / joyo.length).toFixed(6)),
  },
  source: {
    name: "TopoKanji",
    file: "dependencies/1-to-N.json",
    commit: SOURCE_COMMIT,
    license: "MIT",
    url: `https://github.com/scriptin/topokanji/blob/${SOURCE_COMMIT}/dependencies/1-to-N.json`,
    semantics: "Visual decomposition dependencies/components; not equivalent to Kangxi radical numbers.",
  },
  missing,
  components,
};

await writeFile(OUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Generated kanji-components.json: ${output.coverage.available}/${output.coverage.total} covered; ${missing.length} source gaps preserved explicitly.`);
