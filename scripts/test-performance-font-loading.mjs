import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const index=await readFile("index.html","utf8");
const css=await readFile("frontend/src/styles.css","utf8");

const fontUrl="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Serif+JP:wght@500;600;700&display=swap";
assert.ok(index.includes('<link rel="stylesheet" href="'+fontUrl+'">'),"Web font stylesheet link is missing");
assert.doesNotMatch(css,/^\s*@import\s+url\(["']https:\/\/fonts\.googleapis\.com\//m);
assert.ok(index.indexOf('rel="stylesheet" href="'+fontUrl) < index.indexOf('data-kanji5-react-styles'),"Web font stylesheet must be discoverable before the app stylesheet");

console.log("Kanji 5 web-font loading contract passed.");
