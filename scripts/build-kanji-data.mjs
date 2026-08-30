import fs from "node:fs/promises";

const SOURCE = "kanji-joyo.json";
const OUT = "kanji-data.json";

const source = JSON.parse(await fs.readFile(SOURCE, "utf8"));

const ranked = (source.kanji || [])
  .filter(x => x.frequency != null)
  .sort((a, b) => a.frequency - b.frequency)
  .slice(0, 2000)
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

if (ranked.length !== 2000) throw new Error(`Expected 2000 kanji, got ${ranked.length}`);

await fs.writeFile(OUT, JSON.stringify({
  version: 1,
  count: ranked.length,
  source: "KANJIDIC2 via jkindrix/japanese-language-data",
  selection: "Top 2000 Jōyō kanji by newspaper frequency rank",
  kanji: ranked
}), "utf8");

console.log(`Generated ${OUT} with ${ranked.length} kanji.`);
