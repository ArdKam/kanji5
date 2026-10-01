import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");

assert.doesNotMatch(app,/from ["']\.\/prepared-mnemonic-core["']/,"Prepared mnemonic core must not be statically imported by App");
assert.doesNotMatch(app,/from ["']\.\/mnemonic-support["']/,"Mnemonic support must not be statically imported by App");
assert.match(app,/import\(["']\.\/prepared-mnemonic-core["']\)/,"Prepared mnemonic core must be deferred");
assert.match(app,/import\(["']\.\/mnemonic-support["']\)/,"Mnemonic support must be deferred");
assert.match(app,/setPreparedMnemonic\(prepared\.buildPreparedMnemonic/,"Prepared mnemonic must still be built after deferred load");
assert.match(app,/setMnemonicSupport\(support\.buildMnemonicSupport/,"Mnemonic support must still be built after deferred load");
assert.match(app,/support\.getMnemonicHintStage/,"Mnemonic hint stage must remain wired");
assert.match(app,/support\.getMnemonicHintPlan/,"Mnemonic hint plan must remain wired");

console.log("Mnemonic startup deferral contract passed.");
