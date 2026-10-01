import assert from "node:assert/strict";
import fs from "node:fs";

const reactWorkflow = fs.readFileSync(".github/workflows/react-frontend.yml", "utf8");
const pagesWorkflow = fs.readFileSync(".github/workflows/pages-deploy.yml", "utf8");
const performanceGate = fs.readFileSync("e2e/performance-baseline.spec.mjs", "utf8");
const boundaryGate = fs.readFileSync("e2e/react-engine-boundary-gate.spec.mjs", "utf8");

for (const pattern of [
  '      - "v1.3-*.js"',
  '      - "v1.4-*.js"',
  '      - "v1.5-*.js"',
  '      - "v1.6-*.js"',
  '      - "v1.7-*.js"',
  '      - "v1.8-*.js"',
  '      - "v1.9-*.js"',
  '      - "review-runtime.js"',
  '      - "supabase-sync.js"',
  '      - "vendor/**"',
  '      - "kanji-data.json"',
  '      - "kanji-components.json"',
]) {
  assert.equal(
    reactWorkflow.split(pattern).length - 1,
    2,
    `React release workflow must trigger on runtime/data change in both PR and push filters: ${pattern}`,
  );
}

assert.equal(
  reactWorkflow.split('      - "e2e/react-engine-boundary-gate.spec.mjs"').length - 1,
  2,
  "React boundary gate must be part of both PR and push path filters",
);
assert.match(reactWorkflow, /name: Run engine-to-React boundary gate/);
assert.match(reactWorkflow, /e2e\/react-engine-boundary-gate\.spec\.mjs/);

const chromiumGateIndex = pagesWorkflow.indexOf("Run engine-to-React boundary gate");
const stagingIndex = pagesWorkflow.indexOf("Stage production GitHub Pages site");
assert.ok(chromiumGateIndex >= 0, "Pages deploy must run the engine-to-React gate");
assert.ok(
  chromiumGateIndex < stagingIndex,
  "Pages deploy must pass the cross-layer gate before staging the release artifact",
);

for (const key of [
  "fcpMs",
  "lcpMs",
  "cls",
  "longTaskTotalMs",
  "longTaskMaxMs",
  "appTransferKB",
  "interactionMs",
]) {
  assert.match(performanceGate, new RegExp(key), `Performance budget is missing ${key}`);
}
assert.match(performanceGate, /FCP budget exceeded/);
assert.match(performanceGate, /LCP budget exceeded/);
assert.match(performanceGate, /CLS budget exceeded/);
assert.match(performanceGate, /application transfer budget exceeded/);
assert.match(boundaryGate, /__KANJI5_V19_V2_BOUNDARY__/);
assert.match(boundaryGate, /\.learning-card/);
assert.match(boundaryGate, /#exercise/);

console.log("Cross-layer release gate contract passed.");
