import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const required = [
  "frontend/package.json","frontend/tsconfig.json","frontend/vite.config.ts","frontend/index.html",
  "frontend/src/main.tsx","frontend/src/app/engine.ts","frontend/src/app/App.tsx","frontend/src/styles.css",
  "docs/react-migration.md",".github/workflows/react-frontend.yml",
];
for (const file of required) assert.ok(fs.existsSync(path.resolve(file)), "Missing migration file: " + file);

const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
const engine=fs.readFileSync("frontend/src/app/engine.ts","utf8");
const docs=fs.readFileSync("docs/react-migration.md","utf8");
assert.match(app,/from "\.\/engine"/);
assert.match(engine,/type Boundary/);
assert.match(engine,/__KANJI5_V19_V2_BOUNDARY__/);
assert.match(engine,/rateLearning/);
assert.match(engine,/startExercise/);
assert.doesNotMatch(app,/localStorage/);
assert.doesNotMatch(app,/sessionStorage/);
assert.doesNotMatch(app,/FSRS/);
assert.match(docs,/learning system through/);
console.log("Kanji 5 React migration boundary contract passed.");