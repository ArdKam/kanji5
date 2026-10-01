import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
const css=fs.readFileSync("frontend/src/styles.css","utf8");

assert.match(app,/const PAGER_AXIS_LOCK_DISTANCE=12;/);
assert.match(app,/const PAGER_AXIS_RATIO=2;/);
assert.match(app,/Math\.max\(absX,absY\)>=PAGER_AXIS_LOCK_DISTANCE/);
assert.match(app,/absX>PAGER_AXIS_RATIO\*absY|absX>absY\*PAGER_AXIS_RATIO/);
assert.match(app,/absY>PAGER_AXIS_RATIO\*absX|absY>absX\*PAGER_AXIS_RATIO/);
assert.doesNotMatch(app,/Math\.max\(absX,absY\)>=5/);
assert.doesNotMatch(app,/absX>absY\*1\.05|absY>absX\*1\.05/);
assert.match(css,/\.learning-back-pager-shell\{[^}]*touch-action:pan-y;/);
console.log("Learning pager gesture contract passed.");
