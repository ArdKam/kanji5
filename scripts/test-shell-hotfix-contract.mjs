import assert from "node:assert/strict";
import fs from "node:fs";

const index=fs.readFileSync("index.html","utf8");
const main=fs.readFileSync("frontend/src/main.tsx","utf8");
const layout=fs.readFileSync("frontend/src/app/practice-experience.css","utf8");
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");

assert.doesNotMatch(index,/kanji5-account-launcher-style|kanji5-exercise-density-fix|kanji5-exercise-viewport-fix/);
assert.doesNotMatch(index,/id="kanji5-account-launcher"/);
assert.doesNotMatch(main,/\.\/app\/exercise-layout\.css/,"Active Recall layout must stay out of the startup stylesheet bundle");
assert.match(app,/import\(["']\.\/practice-experience\.css["']\)/,"Practice route must load its stylesheet on demand");
assert.match(layout,/\.practice-home\{/,"Deferred Practice stylesheet must include Practice Home styles");
assert.match(layout,/\.content > \.exercise-card\{/);
assert.match(layout,/max-height:calc\(100dvh - 145px\)/);
assert.match(layout,/overflow-y:auto/);
assert.match(layout,/min-height:0/);
assert.match(app,/<AccountButton language=\{language\}/);
console.log("Shell hotfix cleanup contract passed.");