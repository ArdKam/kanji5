import fs from "node:fs/promises";

const SOURCE = "kanji-joyo.json";
const OUT = "kanji-data.json";
const COUNT = 2136;

const source = JSON.parse(await fs.readFile(SOURCE, "utf8"));
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
  source: "KANJIDIC2 via jkindrix/japanese-language-data",
  selection: "All 2,136 Jōyō kanji by newspaper frequency rank",
  kanji: ranked
}), "utf8");

console.log(`Generated ${OUT} with ${ranked.length} kanji.`);
