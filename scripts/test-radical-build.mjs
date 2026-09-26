import assert from "node:assert/strict";
import fs from "node:fs";
const src=fs.readFileSync("scripts/build-kanji-data.mjs","utf8");
assert.match(src,/x\.radical\?\.classical/);
assert.match(src,/missingClassicalRadicals/);
assert.match(src,/x\.radical\.classical < 1/);
assert.match(src,/x\.radical\.classical > 214/);
console.log("Kanji5 canonical radical build contract passed.");
