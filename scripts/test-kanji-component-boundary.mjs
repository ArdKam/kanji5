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
    __KANJI5_STATE__: {}
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

console.log("Kanji component boundary contract passed.");
