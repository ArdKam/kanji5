import { readFile } from "node:fs/promises";
import vm from "node:vm";

const boundarySource = await readFile(new URL("../v1.9-v2-boundary.js", import.meta.url), "utf8");
let fetchCount = 0;

const fixture = {
  coverage: { available: 2100, total: 2136, fraction: 0.983146 },
  source: {
    name: "TopoKanji",
    commit: "cd04afc2c4335336c9243b8aef01c0d2a69c3009",
    license: "MIT",
    semantics: "Visual decomposition dependencies/components; not equivalent to Kangxi radical numbers."
  },
  missing: ["諮"],
  components: {
    "語": ["言", "吾"]
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
  fetch: async () => {
    fetchCount += 1;
    return {
      ok: true,
      async json() {
        return fixture;
      }
    };
  }
};

vm.runInNewContext(boundarySource, sandbox, { filename: "v1.9-v2-boundary.js" });

const api = sandbox.window.__KANJI5_V19_V2_BOUNDARY__;
if (!api?.getComponentInfo) throw new Error("Component boundary API was not published");

const [known, missing] = await Promise.all([
  api.getComponentInfo("語"),
  api.getComponentInfo("諮")
]);

if (fetchCount !== 1) throw new Error(`Expected one component data fetch, got ${fetchCount}`);
if (!known.available || JSON.stringify(known.components) !== JSON.stringify(["言", "吾"])) {
  throw new Error(`Known component lookup failed: ${JSON.stringify(known)}`);
}
if (!missing.sourceGap || missing.available || missing.components.length !== 0) {
  throw new Error(`Missing component lookup failed: ${JSON.stringify(missing)}`);
}
if (known.coverage?.available !== 2100 || known.coverage?.total !== 2136) {
  throw new Error("Coverage metadata was not preserved");
}

const exact=await api.searchKanji("学");
if (exact.results?.[0]?.character !== "学") throw new Error("Exact character dictionary search did not rank first");
if (exact.results?.[0]?.meanings?.[0] !== "study") throw new Error("Dictionary meaning payload missing");
if (exact.results?.[0]?.strokes !== 8 || exact.results?.[0]?.jlpt !== "N5") throw new Error("Dictionary metadata payload missing");

const reading=await api.searchKanji("がく");
if (reading.results?.[0]?.character !== "学") throw new Error("Hiragana reading normalization failed");

const meaning=await api.searchKanji("school");
if (meaning.results?.[0]?.character !== "校") throw new Error("Meaning search failed");

console.log("Kanji component and dictionary boundary contracts passed.");
