import assert from "node:assert/strict";
import fs from "node:fs";

const index=fs.readFileSync("index.html","utf8");
const bootstrap=fs.readFileSync("app-bootstrap.js","utf8");
const sw=fs.readFileSync("sw.js","utf8");

assert.equal((index.match(/<script src="\.\/app-bootstrap\.js"><\/script>/g)||[]).length,1);
assert.equal((index.match(/<script src="\.\/app-bootstrap-release\d+\.js"><\/script>/g)||[]).length,0);
assert.doesNotMatch(index,/sw-release\d+\.js/);
assert.doesNotMatch(index,/legacyScripts|new URLSearchParams\(location\.search\).*legacy/);

for(const file of ["app-bootstrap-release18.js","app-bootstrap-release19.js","sw-release18.js","sw-release19.js"]){
  assert.equal(fs.existsSync(file),false,`retired runtime singleton still exists: ${file}`);
}

assert.match(bootstrap,/serviceWorker\.register\('\.\/sw\.js\?v=/);
assert.doesNotMatch(bootstrap,/sw-release\d+/);
assert.match(sw,/const CACHE='kanji5-shell-v\d+'/);
assert.doesNotMatch(sw,/react-dist\/kanji5-react-release\d+/);

console.log("Canonical bootstrap/service-worker singleton contract passed.");
