import fs from "node:fs/promises";

const SOURCE_URL = "https://raw.githubusercontent.com/jkindrix/japanese-language-data/f79c68c9e35c6f8269a6b66e86c63c3713db06a0/data/core/kanji-joyo.json";
const SOURCE_COMMIT = "f79c68c9e35c6f8269a6b66e86c63c3713db06a0";
const OUT = "kanji-data.json";
const COUNT = 2136;

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Failed to fetch pinned Jōyō source: HTTP ${response.status}`);
const source = await response.json();
const allKanji = source.kanji || [];

if (allKanji.length !== COUNT) {
  throw new Error(`Expected ${COUNT} Jōyō kanji, got ${allKanji.length}`);
}

const ranked = allKanji
  .slice()
  .sort((a, b) => {
    const af = a.frequency == null ? Infinity : Number(a.frequency);
    const bf = b.frequency == null ? Infinity : Number(b.frequency);
    return af - bf;
  })
  .map((x, i) => {
    const radicalClassical = (Array.isArray(x.radicals) ? x.radicals : [])
      .find(radical => radical?.type === "classical")?.value;
    const radicalNelson = (Array.isArray(x.radicals) ? x.radicals : [])
      .find(radical => radical?.type === "nelson_c")?.value;
    return {
    id: x.character,
    character: x.character,
    meaning: (x.meanings?.en || []).slice(0, 3),
    on: (x.readings?.on || []).slice(0, 4),
    kun: (x.readings?.kun || []).slice(0, 4),
    strokes: x.stroke_count,
    grade: x.grade,
    jlpt: x.jlpt_waller || null,
    frequency: x.frequency,
    order: i + 1,
    radical: {
      classical: Number.isFinite(Number(radicalClassical)) ? Number(radicalClassical) : null,
      nelson: Number.isFinite(Number(radicalNelson)) ? Number(radicalNelson) : null
    }
    };
  });

if (ranked.length !== COUNT) throw new Error(`Expected ${COUNT} kanji, got ${ranked.length}`);

await fs.writeFile(OUT, JSON.stringify({
  version: 1,
  count: COUNT,
  source: `KANJIDIC2 via jkindrix/japanese-language-data @ ${SOURCE_COMMIT}`,
  selection: "All 2,136 Jōyō kanji by newspaper frequency rank",
  radicalSource: "KANJIDIC2 radicals.type=classical (KangXi Zidian reference); Nelson retained separately when present",
  kanji: ranked
}), "utf8");

console.log(`Generated ${OUT} with ${ranked.length} kanji from pinned source ${SOURCE_COMMIT}.`);
