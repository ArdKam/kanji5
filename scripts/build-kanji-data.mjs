import fs from "node:fs/promises";

const SOURCE_URL = "https://raw.githubusercontent.com/jkindrix/japanese-language-data/main/data/core/kanji-joyo.json";
const SOURCE_SHA = "b1bad3d556d0a8509a0c15093c4052eafce374ff";
const OUT = "kanji-data.json";
const COUNT = 2136;

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Failed to fetch Jōyō source: HTTP ${response.status}`);
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
  .map((x, i) => ({
    id: x.character,
    character: x.character,
    meaning: (x.meanings?.en || []).slice(0, 3),
    on: (x.readings?.on || []).slice(0, 4),
    kun: (x.readings?.kun || []).slice(0, 4),
    strokes: x.stroke_count,
    grade: x.grade,
    jlpt: x.jlpt_waller || null,
    frequency: x.frequency,
    order: i + 1
  }));

if (ranked.length !== COUNT) throw new Error(`Expected ${COUNT} kanji, got ${ranked.length}`);

await fs.writeFile(OUT, JSON.stringify({
  version: 1,
  count: COUNT,
  source: `KANJIDIC2 via jkindrix/japanese-language-data (pinned source blob ${SOURCE_SHA})`,
  selection: "All 2,136 Jōyō kanji by newspaper frequency rank",
  kanji: ranked
}), "utf8");

console.log(`Generated ${OUT} with ${ranked.length} kanji from pinned Jōyō source ${SOURCE_SHA}.`);
