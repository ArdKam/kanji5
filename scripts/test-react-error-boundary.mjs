import assert from "node:assert/strict";
import fs from "node:fs";

const main = fs.readFileSync("frontend/src/main.tsx", "utf8");
const boundary = fs.readFileSync("frontend/src/app/ReactErrorBoundary.tsx", "utf8");
const obs = fs.readFileSync("v2-observability.js", "utf8");

assert.match(main, /ReactErrorBoundary/);
assert.match(main, /<ReactErrorBoundary>\s*<App \/>\s*<\/ReactErrorBoundary>/);
assert.match(boundary, /componentDidCatch/);
assert.match(boundary, /react-render-error/);
assert.match(boundary, /createBackup/);
assert.match(boundary, /runtimeFailureBackup/);
assert.match(boundary, /runtimeFailureReport/);
assert.match(boundary, /location\.reload/);
assert.match(obs, /addEventListener\('error'/);
assert.match(obs, /addEventListener\('unhandledrejection'/);

console.log("Kanji 5 React failure-containment contract passed.");
