import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read=(file)=>fs.readFileSync(path.resolve(file),"utf8");
const app=read("frontend/src/app/App.tsx");
const engine=read("frontend/src/app/engine.ts");
const entry=read("react-entry.js");
const shell=read("index.html");
const bootstrap=read("app-bootstrap.js");
const architecture=read("ARCHITECTURE.md");

assert.doesNotMatch(app,/localStorage|sessionStorage|__KANJI5_|FSRS|fetch\s*\(/,
  "React App must stay presentation-only and must not own runtime/storage/network semantics.");
assert.doesNotMatch(app,/document\.|window\./,
  "React App should not reach into browser globals directly.");
assert.match(engine,/__KANJI5_V19_V2_BOUNDARY__/,
  "The typed engine adapter must remain the only React-facing authoritative boundary.");
assert.doesNotMatch(entry,/localStorage|sessionStorage|FSRS/,
  "React bootstrap must not become a second persistence/scheduling layer.");
assert.match(shell,/id="root"/);
assert.match(shell,/react-entry\.js/);
assert.match(bootstrap,/serviceWorker\.register/);
assert.match(architecture,/pure rules → orchestration → structured view-model boundary → React presentation/);

console.log("Kanji 5 architecture hygiene boundary passed.");
