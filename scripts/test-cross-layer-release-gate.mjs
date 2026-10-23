import assert from "node:assert/strict";
import fs from "node:fs";

const reactWorkflow = fs.readFileSync(".github/workflows/react-frontend.yml", "utf8");
const pagesWorkflow = fs.readFileSync(".github/workflows/pages-deploy.yml", "utf8");
const performanceGate = fs.readFileSync("e2e/performance-baseline.spec.mjs", "utf8");
const boundaryGate = fs.readFileSync("e2e/react-engine-boundary-gate.spec.mjs", "utf8");

const pullRequestTrigger = reactWorkflow.split("  pull_request:")[1]?.split("\n  push:")[0] || "";
assert.ok(pullRequestTrigger.trim().length === 0, "React required checks must run on every pull request, without path filtering");

assert.match(
  reactWorkflow,
  /push:\s*\n\s+branches:\s*\n\s+- main\s*\n\s*\npermissions:/,
  "React release workflow must run unconditionally on main pushes",
);
assert.match(reactWorkflow, /pull_request:\s*\n\s*push:/, "React build must keep an unconditional pull_request trigger");
assert.match(reactWorkflow, /name: Run engine-to-React boundary gate/);
assert.match(reactWorkflow, /e2e\/react-engine-boundary-gate\.spec\.mjs/);

const chromiumGateIndex = pagesWorkflow.indexOf("Run engine-to-React boundary gate");
const stagingIndex = pagesWorkflow.indexOf("Stage production GitHub Pages site");
assert.ok(chromiumGateIndex >= 0, "Pages deploy must run the engine-to-React gate");
assert.ok(
  chromiumGateIndex < stagingIndex,
  "Pages deploy must pass the cross-layer gate before staging the release artifact",
);
assert.match(pagesWorkflow, /workflow_run:/, "Pages deployment must be triggered by the verified React workflow");
assert.match(pagesWorkflow, /React presentation build/, "Pages deployment must depend on the React presentation workflow");
assert.match(pagesWorkflow, /workflow_run\.head_sha/, "Pages deployment must deploy the exact verified workflow commit");
assert.match(pagesWorkflow, /A newer main commit exists/, "Pages deployment must refuse stale verified commits");
assert.match(pagesWorkflow, /npm ci --no-audit --no-fund/, "Pages deployment must use the frontend lockfile reproducibly");

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
