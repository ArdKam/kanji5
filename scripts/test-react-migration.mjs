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
assert.match(bootstrap, /IS_REACT/);
assert.match(bootstrap, /react-dist\/kanji5-react\.js/);
const presentation=fs.readFileSync("v2-presentation.js","utf8");
assert.match(presentation, /params\.get\('react'\) === '1'/);


console.log("Kanji 5 React migration boundary contract passed.");
