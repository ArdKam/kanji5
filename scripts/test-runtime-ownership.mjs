import assert from "node:assert/strict";
import fs from "node:fs";

const read=p=>fs.readFileSync(p,"utf8");
const index=read("index.html");
const bootstrap=read("app-bootstrap.js");
const boundary=read("v1.9-v2-boundary.js");
const architecture=read("ARCHITECTURE.md");
const inventory=read("docs/RUNTIME-DEPENDENCY-INVENTORY.md");
const sw=read("sw.js");

assert.ok(index.includes('<script src="./v1.5-state.js"></script>'));
assert.ok(index.includes('<script src="./v1.3-p0.js"></script>'));
assert.ok(index.includes('<script type="module" src="./review-runtime.js"></script>'));
assert.ok(index.includes('<script src="./v1.9-v2-boundary.js"></script>'));
assert.ok(index.includes('<script src="./app-bootstrap.js"></script>'));
assert.ok(index.includes('<script type="module" src="./react-entry.js"></script>'));

assert.ok(bootstrap.includes("serviceWorker.register('./sw.js?v="));
assert.ok(bootstrap.includes("import('./v1.6-session.js')"));
assert.ok(boundary.includes("import('./v1.4-education-migration.js')"));
assert.ok(boundary.includes("import('./v1.4-education-core.js')"));
assert.ok(boundary.includes("import('./v1.9-recovery.js')"));
assert.ok(boundary.includes("import('./v1.5-education-ui.js')"));
assert.ok(boundary.includes("import('./v1.9-v2-contract-core.js')"));
assert.ok(sw.includes("const SHELL="));
assert.ok(!sw.includes("sw-release18.js")&&!sw.includes("sw-release19.js"));

for(const retired of [
  "app-bootstrap-release18.js",
  "app-bootstrap-release19.js",
  "react-entry-release18.js",
  "sw-release18.js",
  "sw-release19.js"
]){
  assert.equal(fs.existsSync(retired),false,"retired runtime artifact exists: "+retired);
}

assert.ok(architecture.includes("React build provenance"));
assert.ok(inventory.includes("## Production browser path"));
assert.ok(inventory.includes("## Retired artifacts"));
console.log("Runtime ownership inventory and boundary contract passed.");
