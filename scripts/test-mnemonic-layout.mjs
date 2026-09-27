import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("frontend/src/styles.css","utf8");
const block=css.slice(css.indexOf(".mnemonic-tool{"), css.indexOf("/* Account / Google sign-in */"));
assert.match(block,/grid-template-areas:"trigger saved" "prepared prepared" "editor editor"/);
assert.match(block,/\.mnemonic-trigger\{grid-area:trigger/);
assert.match(block,/\.mnemonic-tool \.mnemonic-saved\{grid-area:saved/);
assert.match(block,/\.mnemonic-tool\s*>\s*\.mnemonic-prepared\{grid-area:prepared/);
assert.match(block,/\.mnemonic-editor\{grid-area:editor/);
assert.match(block,/overflow:hidden/);
console.log("Mnemonic tool grid layout contract: PASS");
