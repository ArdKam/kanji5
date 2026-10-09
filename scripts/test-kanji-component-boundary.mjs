import { readFile } from "node:fs/promises";
import vm from "node:vm";

const boundarySource = await readFile(new URL("../v1.9-v2-boundary.js", import.meta.url), "utf8");
let componentFetchCount = 0;
let structureFetchCount = 0;

const componentFixture = {
  coverage: { available: 2100, total: 2136, fraction: 0.983146 },
  source: {
    name: "TopoKanji",
    commit: "cd04afc2c4335336c9243b8aef01c0d2a69c3009",
    license: "MIT",
    semantics: "Learning dependencies; not canonical written-form structure or Kangxi radical classification."
  },
  missing: ["諮"],
  components: {
    "語": ["言", "吾"]
  }
};
const structureFixture = {
  schema: "kanji-visual-structure/v1",
  coverage: { available: 2136, total: 2136, fraction: 1 },
  source: { name: "KanjiVG", commit: "70a0b7ae0c18ceb5cb358274b029cce0234a43bc", license: "CC BY-SA 3.0" },
  missing: [],
  structures: {
    "語": {
      character: "語",
      components: [
        { character: "言", position: "left", components: [{ character: "口", components: [] }] },
        { character: "吾", position: "right", components: [{ character: "五", components: [] }, { character: "口", components: [] }] }
      ]
    }
  }
};

const sandbox = {
  window: {
    __KANJI5_STATE__: {
      readDeck() {
        return [
          {id:"学",character:"学",meaning:["study","learning"],on:["ガク"],kun:["まな.ぶ"],strokes:8,grade:1,jlpt:"N5",frequency:100,order:100},
          {id:"校",character:"校",meaning:["school"],on:["コウ"],kun:[],strokes:10,grade:1,jlpt:"N5",frequency:110,order:110},
          {id:"語",character:"語",meaning:["word","language"],on:["ゴ"],kun:["かた.る"],strokes:14,grade:2,jlpt:"N4",frequency:120,order:120}
        ];
      }
    }
  },
  document: {
    addEventListener() {},
    dispatchEvent() {}
  },
  CustomEvent: class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  },
  setTimeout() {},
  fetch: async url => {
    if (String(url).includes("kanji-visual-structure.json")) {
      structureFetchCount += 1;
      return { ok: true, async json() { return structureFixture; } };
    }
    if (String(url).includes("kanji-components.json")) {
      componentFetchCount += 1;
      return { ok: true, async json() { return componentFixture; } };
    }
    throw new Error("Unexpected test fetch URL: " + url);
  }
};

vm.runInNewContext(boundarySource, sandbox, { filename: "v1.9-v2-boundary.js" });

const api = sandbox.window.__KANJI5_V19_V2_BOUNDARY__;
if (!api?.getComponentInfo || !api?.getVisualStructureInfo) throw new Error("Component/visual structure boundary API was not published");

const [known, missing, visual] = await Promise.all([
  api.getComponentInfo("語"),
  api.getComponentInfo("諮"),
  api.getVisualStructureInfo("語")
]);

if (componentFetchCount !== 1) throw new Error(`Expected one learning-dependency data fetch, got ${componentFetchCount}`);
if (structureFetchCount !== 1) throw new Error(`Expected one canonical visual structure fetch, got ${structureFetchCount}`);
if (!known.available || JSON.stringify(known.components) !== JSON.stringify(["言", "吾"])) {
  throw new Error(`Learning dependency lookup failed: ${JSON.stringify(known)}`);
}
if (!missing.sourceGap || missing.available || missing.components.length !== 0) {
  throw new Error(`Learning dependency source-gap lookup failed: ${JSON.stringify(missing)}`);
}
if (known.coverage?.available !== 2100 || known.coverage?.total !== 2136) {
  throw new Error("Learning-dependency coverage metadata was not preserved");
}
if (!visual.available || !visual.root || visual.components.length !== 2) {
  throw new Error(`Canonical visual structure lookup failed: ${JSON.stringify(visual)}`);
}
if (visual.components[0].character !== "言" || visual.components[0].components[0]?.character !== "口") {
  throw new Error("Visual structure nesting was lost at the boundary");
}
if (visual.source?.name !== "KanjiVG" || visual.coverage?.available !== 2136) {
  throw new Error("Canonical source or coverage metadata was not preserved");
}

const exact=await api.searchKanji("学");
if (exact.results?.[0]?.character !== "学") throw new Error("Exact character dictionary search did not rank first");
if (exact.results?.[0]?.meanings?.[0] !== "study") throw new Error("Dictionary meaning payload missing");
if (exact.results?.[0]?.strokes !== 8 || exact.results?.[0]?.jlpt !== "N5") throw new Error("Dictionary metadata payload missing");

const reading=await api.searchKanji("がく");
if (reading.results?.[0]?.character !== "学") throw new Error("Hiragana reading normalization failed");

const meaning=await api.searchKanji("school");
if (meaning.results?.[0]?.character !== "校") throw new Error("Meaning search failed");

console.log("Kanji learning-dependency, visual-structure, and dictionary boundary contracts passed.");
