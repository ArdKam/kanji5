import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const index = read("index.html");
const entry = read("react-entry.js");
const sw = read("sw.js");

assert.match(index, /id="kanji5-startup-shell"/, "index must ship an immediate startup shell");
assert.match(index, /href="\.\/startup-shell\.css"/, "startup shell stylesheet must be linked from the HTML shell");
assert.match(index, /rel="modulepreload"[^>]+react-dist\/kanji5-react\.js/, "React bundle should be hinted before dynamic import");
assert.match(index, /<div id="root"><\/div>/, "React root must remain available");
assert.match(entry, /new MutationObserver\(\(\)=>\{/, "React entry must observe the root for first committed UI");
assert.match(entry, /#root \.app-shell/, "startup shell must wait for the real app shell");
assert.match(entry, /startupRoot\.classList\.add\('is-ready'\)/, "startup shell should fade out after React mounts");
assert.match(entry, /startupRoot\.remove\(\)/, "startup shell should be removed after the transition");
assert.match(sw, /const CACHE='kanji5-shell-v[0-9A-Za-z._-]+'/, "shell cache version must be declared structurally");
assert.match(sw, /"\.\/startup-shell\.css"/, "startup shell stylesheet must be precached for offline startup");

console.log("Kanji 5 first-paint shell contract passed.");
