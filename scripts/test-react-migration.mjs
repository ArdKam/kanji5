import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const required = [
  "frontend/package.json",
  "frontend/tsconfig.json",
  "frontend/vite.config.ts",
  "frontend/index.html",
  "frontend/src/main.tsx",
  "frontend/src/app/engine.ts",
  "frontend/src/app/App.tsx",
  "frontend/src/styles.css",
  "docs/react-migration.md",
  ".github/workflows/react-frontend.yml",
];

for (const file of required) {
  assert.ok(fs.existsSync(path.resolve(file)), "Missing migration file: " + file);
}

const app = fs.readFileSync("frontend/src/app/App.tsx", "utf8");
const engine = fs.readFileSync("frontend/src/app/engine.ts", "utf8");
const docs = fs.readFileSync("docs/react-migration.md", "utf8");

assert.match(app, /from "\.\/engine"/);
assert.doesNotMatch(app, /__KANJI5_V19_V2_BOUNDARY__/);
assert.doesNotMatch(app, /localStorage|sessionStorage|FSRS/);
assert.match(engine, /type Boundary/);
assert.match(engine, /rateLearning/);
assert.match(engine, /startExercise/);
assert.match(engine, /updateSettings/);
assert.match(docs, /presentation-only/);
assert.match(engine, /__KANJI5_V19_V2_BOUNDARY__/);
assert.match(engine, /__KANJI5_EDU_BRIDGE__/);
assert.match(app, /<div className="app-shell"/);
const shell=fs.readFileSync("index.html","utf8");
assert.match(shell, /id="root"/);
assert.match(shell, /app-bootstrap\.js/);
const bootstrap=fs.readFileSync("app-bootstrap.js","utf8");
const reactEntry=fs.readFileSync("react-entry.js","utf8");
assert.match(reactEntry, /react-dist\/kanji5-react\.js/);
assert.match(reactEntry, /params\.get\('legacy'\)/);
assert.match(reactEntry, /params\.get\('v2'\)/);
assert.match(reactEntry, /params\.get\('react'\)/);
const presentation=fs.readFileSync("v2-presentation.js","utf8");
assert.match(presentation, /params\.get\('legacy'\) === '1'/);
assert.match(presentation, /params\.get\('react'\) !== '0'/);
assert.match(presentation, /params\.get\('v2'\) !== '1'/);
const sw=fs.readFileSync("sw.js","utf8");
assert.match(sw, /kanji5-shell-v100/);
assert.match(sw, /\.\/react-dist\/kanji5-react\.js/);
assert.match(sw, /\.\/react-dist\/kanji5-react\.css/);



assert.match(sw, /\.\/react-dist\/kanji5-react\.js/);
assert.match(sw, /\.\/react-dist\/kanji5-react\.css/);
for (const file of ["e2e/react-presentation-migration.spec.mjs","e2e/react-presentation-parity.spec.mjs","e2e/react-presentation-offline.spec.mjs"]) {
  assert.ok(fs.existsSync(file), "Missing React verification test: " + file);
}

console.log("Kanji 5 React migration boundary contract passed.");
