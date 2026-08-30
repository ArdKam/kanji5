import fs from "node:fs/promises";

const SOURCE = "https://raw.githubusercontent.com/jkindrix/japanese-language-data/main/data/core/kanji-joyo.json";
const OUT = "kanji-data.json";
const INDEX = "index.html";

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Kanji source request failed: ${res.status}`);
const source = await res.json();

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
}, null, 2) + "\n", "utf8");

let html = await fs.readFile(INDEX, "utf8");
html = html.replace(
  /const DATA_URL = "[^"]+";/,
  'const DATA_URL = "./kanji-data.json";'
);

const oldLoad = /async function loadDeck\(\)\{[\s\S]*?\n    \}\n\n    function loadDeckFromCache/;
const newLoad = `async function loadDeck(){
      $("loadStatus").textContent="در حال بارگذاری دادهٔ محلی...";
      const res=await fetch(DATA_URL, {cache:"no-cache"});
      if(!res.ok) throw new Error("Could not load local kanji dataset");
      const data=await res.json();
      state.deck=data.kanji || [];
      if(state.deck.length!==2000) throw new Error("Invalid local kanji dataset");
      localStorage.setItem("kanji5-deck", JSON.stringify(state.deck));
    }

    function loadDeckFromCache`;

if (!oldLoad.test(html)) throw new Error("Could not find loadDeck() in index.html");
html = html.replace(oldLoad, newLoad);

await fs.writeFile(INDEX, html, "utf8");
console.log(`Generated ${OUT} with ${ranked.length} kanji and switched index.html to local data.`);
