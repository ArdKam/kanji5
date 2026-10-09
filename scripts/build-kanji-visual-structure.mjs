import { readFile, writeFile } from "node:fs/promises";

const SOURCE_COMMIT = "70a0b7ae0c18ceb5cb358274b029cce0234a43bc";
const SOURCE_ROOT = `https://raw.githubusercontent.com/KanjiVG/kanjivg/${SOURCE_COMMIT}/kanji`;
const INPUT_PATH = new URL("../kanji-data.json", import.meta.url);
const OUTPUT_PATH = new URL("../kanji-visual-structure.json", import.meta.url);
const CONCURRENCY = 10;
const MAX_ATTEMPTS = 4;

const input = JSON.parse(await readFile(INPUT_PATH, "utf8"));
const characters = (Array.isArray(input?.kanji) ? input.kanji : [])
  .map(entry => String(entry?.character || "").trim())
  .filter(Boolean);

if (characters.length !== 2136 || new Set(characters).size !== 2136) {
  throw new Error(`Expected 2,136 unique Jōyō kanji, got ${characters.length}`);
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^\u0024{}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*["']([^"']*)["']`));
  return match ? match[1].replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") : "";
}

function parseKanjiVG(svg, expectedCharacter) {
  const pathsStart = svg.indexOf("<g id=\"kvg:StrokePaths_");
  if (pathsStart < 0) throw new Error(`Stroke paths group not found for ${expectedCharacter}`);
  const numbersStart = svg.indexOf("<g id=\"kvg:StrokeNumbers_", pathsStart);
  const pathSection = svg.slice(pathsStart, numbersStart > pathsStart ? numbersStart : svg.length);
  const tokens = /<g\b[^>]*>|<\/g\s*>/g;
  const stack = [];
  const roots = [];
  let token;

  while ((token = tokens.exec(pathSection))) {
    const tag = token[0];
    if (/^<\/g/i.test(tag)) {
      if (!stack.length) throw new Error(`Unbalanced group close in ${expectedCharacter}`);
      stack.pop();
      continue;
    }

    const element = attribute(tag, "kvg:element");
    let node = null;
    if (element) {
      node = { character: element };
      const position = attribute(tag, "kvg:position");
      const variant = attribute(tag, "kvg:variant");
      const radical = attribute(tag, "kvg:radical");
      const phonetic = attribute(tag, "kvg:phon");
      const part = attribute(tag, "kvg:part");
      const partial = attribute(tag, "kvg:partial");
      const original = attribute(tag, "kvg:original");
      if (position) node.position = position;
      if (variant === "true") node.variant = true;
      if (radical) node.radicalRole = radical;
      if (phonetic) node.phoneticRole = phonetic;
      if (part) node.part = part;
      if (partial === "true") node.partial = true;
      if (original) node.original = original;
      node.components = [];

      let parent = null;
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].node) {
          parent = stack[index].node;
          break;
        }
      }
      if (parent) parent.components.push(node);
      else roots.push(node);
    }

    if (!/\/\s*>$/.test(tag)) stack.push({ node });
  }

  const root = roots.find(node => node.character === expectedCharacter);
  if (!root) {
    const rootNames = roots.map(node => node.character).join(", ");
    throw new Error(`Expected root ${expectedCharacter}; found [${rootNames}]`);
  }

  const metadataKey = node => JSON.stringify([
    node.character, node.position || "", Boolean(node.variant), node.radicalRole || "",
    node.phoneticRole || "", Boolean(node.partial), node.original || ""
  ]);

  // KanjiVG sometimes splits one logical glyph component into several SVG groups
  // marked kvg:part="1", "2", etc. Rejoin those sibling fragments as one logical
  // component while keeping the source part identifiers. Do not merge ordinary
  // repeated components such as the two 木 in 林, which have no kvg:part marker.
  const mergeSourceParts = children => {
    const groups = new Map();
    for (const child of children) {
      if (!child.part) continue;
      const key = metadataKey(child);
      const group = groups.get(key) || [];
      group.push(child);
      groups.set(key, group);
    }

    const mergeAt = new Map();
    const consumed = new Set();
    for (const group of groups.values()) {
      const uniqueParts = new Set(group.map(node => node.part));
      if (group.length < 2 || uniqueParts.size !== group.length) continue;
      const first = children.indexOf(group[0]);
      const merged = {
        ...group[0],
        sourceParts: group.map(node => node.part),
        components: group.flatMap(node => node.components)
      };
      delete merged.part;
      mergeAt.set(first, merged);
      for (const node of group.slice(1)) consumed.add(node);
    }

    const result = [];
    for (let index = 0; index < children.length; index += 1) {
      if (consumed.has(children[index])) continue;
      result.push(mergeAt.get(index) || children[index]);
    }
    return result;
  };

  const prune = node => {
    const clean = { character: node.character };
    if (node.position) clean.position = node.position;
    if (node.variant) clean.variant = true;
    if (node.radicalRole) clean.radicalRole = node.radicalRole;
    if (node.phoneticRole) clean.phoneticRole = node.phoneticRole;
    if (node.part) clean.part = node.part;
    if (node.partial) clean.partial = true;
    if (node.original) clean.original = node.original;
    clean.components = mergeSourceParts(node.components.map(prune));
    if (node.sourceParts) clean.sourceParts = [...node.sourceParts];
    return clean;
  };
  return prune(root);
}

async function fetchSvg(character) {
  const codepoint = character.codePointAt(0).toString(16).toLowerCase().padStart(5, "0");
  const url = `${SOURCE_ROOT}/${codepoint}.svg`;
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.status === 404) throw new Error(`KanjiVG SVG not found for ${character} (${codepoint})`);
      if (!response.ok) throw new Error(`KanjiVG HTTP ${response.status} for ${character}`);
      const svg = await response.text();
      return { character, tree: parseKanjiVG(svg, character), url };
    } catch (error) {
      lastError = error;
      if (String(error?.message || error).includes("not found")) throw error;
      if (attempt < MAX_ATTEMPTS) await new Promise(resolve => setTimeout(resolve, attempt * 350));
    }
  }
  throw lastError || new Error(`Could not load KanjiVG data for ${character}`);
}

const entries = [];
const failures = [];
for (let start = 0; start < characters.length; start += CONCURRENCY) {
  const batch = characters.slice(start, start + CONCURRENCY);
  const results = await Promise.allSettled(batch.map(fetchSvg));
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (result.status === "fulfilled") entries.push(result.value);
    else failures.push({ character: batch[index], error: String(result.reason?.message || result.reason) });
  }
  console.log(`KanjiVG structure import: ${Math.min(start + batch.length, characters.length)}/${characters.length}`);
  if (failures.length && start + batch.length === characters.length) {
    throw new Error(`KanjiVG source gaps: ${JSON.stringify(failures)}`);
  }
}

const structures = Object.fromEntries(entries.map(({ character, tree }) => [character, tree]));
const missing = characters.filter(character => !Object.prototype.hasOwnProperty.call(structures, character));
if (missing.length || entries.length !== 2136) {
  throw new Error(`Expected complete 2,136 structure trees; got ${entries.length}, missing ${missing.join("")}`);
}

const output = {
  version: 1,
  schema: "kanji-visual-structure/v1",
  target: { name: "Jōyō kanji", count: 2136 },
  coverage: { available: Object.keys(structures).length, total: 2136, fraction: 1 },
  source: {
    name: "KanjiVG",
    commit: SOURCE_COMMIT,
    filePattern: "kanji/{lowercase-unicode-codepoint-padded-to-5}.svg",
    license: "CC BY-SA 3.0",
    attribution: "KanjiVG, copyright Ulrich Apel; structural group hierarchy extracted from SVG kvg:element metadata.",
    url: `https://github.com/KanjiVG/kanjivg/tree/${SOURCE_COMMIT}/kanji`,
    semantics: "Source-authored visual component hierarchy; preserves nesting, repeated components, order, position, and partial/original annotations. Sibling SVG groups explicitly marked as parts of the same component are rejoined and their source part IDs are retained. Traditional radical classification is provided separately."
  },
  missing: [],
  structures
};

await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Generated kanji-visual-structure.json: ${output.coverage.available}/${output.coverage.total} structures from pinned KanjiVG ${SOURCE_COMMIT}.`);
