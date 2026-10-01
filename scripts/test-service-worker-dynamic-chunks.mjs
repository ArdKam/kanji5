import assert from "node:assert/strict";
import fs from "node:fs";

const sw=fs.readFileSync("sw.js","utf8");

assert.match(sw,/async function precacheReactEntryDependencies\(cache\)/);
assert.match(sw,/await precacheReactEntryDependencies\(c\)/);
assert.match(sw,/from\s*["'](\.\/assets\/[^"']+\.js)["']/);
assert.match(sw,/cache\.put\(new URL\(assetRelative,self\.location\.href\)/);

console.log("Service-worker dynamic React dependency cache contract passed.");
