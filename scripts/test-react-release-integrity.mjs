import assert from "node:assert/strict";
import fs from "node:fs";

const index=fs.readFileSync("index.html","utf8");
const entry=fs.readFileSync("react-entry.js","utf8");
const bootstrap=fs.readFileSync("app-bootstrap.js","utf8");
const sw=fs.readFileSync("sw.js","utf8");

assert.match(index, /<script src="\.\/app-bootstrap\.js"><\/script>/);
assert.match(index, /<script type="module" src="\.\/react-entry\.js"><\/script>/);
assert.match(index, /href="\.\/react-dist\/kanji5-react\.css\?v=__KANJI5_BUILD_HASH__" data-kanji5-react-styles/);
assert.match(index, /href="\.\/react-dist\/kanji5-react\.js">/);
assert.doesNotMatch(index, /release18|release19/);

assert.match(index, /<meta name="kanji5-build-hash" content="__KANJI5_BUILD_HASH__">/);
assert.match(entry, /buildHash=.*kanji5-build-hash/);
assert.match(entry, /assetVersion=\/\^\[0-9a-f\]/i);
assert.doesNotMatch(entry, /react-dist\/kanji5-react-release\d+/);

assert.match(bootstrap, /buildHash=.*kanji5-build-hash/);
assert.match(bootstrap, /serviceWorker\.register\(`\.\/sw\.js\$\{swVersion\}`\)/);
assert.doesNotMatch(bootstrap, /sw-release\d+/);

assert.match(sw, /\.\/react-dist\/kanji5-react\.js/);
assert.match(sw, /\.\/react-dist\/kanji5-react\.css/);
assert.match(sw, /\.\/app-bootstrap\.js/);
assert.match(sw, /\.\/react-entry\.js/);


console.log("Canonical React release wiring contract passed.");
