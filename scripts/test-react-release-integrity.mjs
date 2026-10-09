import assert from "node:assert/strict";
import fs from "node:fs";

const index=fs.readFileSync("index.html","utf8");
const entry=fs.readFileSync("react-entry.js","utf8");
const bootstrap=fs.readFileSync("app-bootstrap.js","utf8");
const sw=fs.readFileSync("sw.js","utf8");

assert.match(index, /<script src="\.\/app-bootstrap\.js"><\/script>/);
assert.match(index, /<script type="module" src="\.\/react-entry\.js"><\/script>/);
assert.match(index, /href="\.\/react-dist\/kanji5-react\.css\?v=dev" data-kanji5-react-styles/);
// Keep the entry module URL stable so lazy chunks resolve to the same ESM instance.
assert.match(index, /href="\.\/react-dist\/kanji5-react\.js">/);
assert.doesNotMatch(index, /modulepreload" href="\.\/react-dist\/kanji5-react\.js\?v=/);
assert.doesNotMatch(index, /release18|release19/);
assert.match(index, /<meta name="kanji5-build-id" content="[^"]+">/);

assert.match(entry, /const buildId=\(document\.querySelector\('meta\[name="kanji5-build-id"\]'\).*\|\|'dev'\)/);
assert.match(entry, /const assetVersion='\?v='\+encodeURIComponent\(buildId\)/);
assert.match(entry, /import\('\.\/react-dist\/kanji5-react\.js'\)/);
assert.doesNotMatch(entry, /react-dist\/kanji5-react\.js'\+assetVersion/);
assert.match(entry, /react-dist\/kanji5-react\.css'\+assetVersion/);
assert.doesNotMatch(entry, /react-dist\/kanji5-react-release\d+/);

assert.match(bootstrap, /const buildId=\(document\.querySelector\('meta\[name="kanji5-build-id"\]'\)/);
assert.match(bootstrap, /serviceWorker\.register\('\.\/sw\.js\?v='\+encodeURIComponent\(buildId\)\)/);
assert.doesNotMatch(bootstrap, /sw-release\d+/);

assert.match(sw, /\.\/react-dist\/kanji5-react\.js/);
assert.match(sw, /\.\/react-dist\/kanji5-react\.css/);
assert.match(sw, /const BUILD_ID='__KANJI5_BUILD_ID__';/);
assert.match(sw, /const CACHE='kanji5-shell-v'\+BUILD_ID/);
assert.match(sw, /\.\/app-bootstrap\.js/);
assert.match(sw, /\.\/react-entry\.js/);


console.log("Canonical React release wiring contract passed.");
