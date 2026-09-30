import { access, readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const index=await readFile("index.html","utf8");
const css=await readFile("frontend/src/styles.css","utf8");

const fontUrl="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Serif+JP:wght@500;600;700&display=swap";
const preloadMatch=index.match(/<link rel="preload" href="(\.\/react-dist\/assets\/[^"?#]+\.woff2)" as="font" type="font\/woff2" crossorigin fetchpriority="high">/);
assert.ok(preloadMatch,"Bundled Vazirmatn font preload is missing");
const bundledFontHref=preloadMatch[1];
const bundledFontPath=bundledFontHref.slice(2);
await access(bundledFontPath);
assert.match(bundledFontPath,/^react-dist\/assets\/Vazirmatn_[^/]+\.woff2$/,"Bundled Vazirmatn preload must target the shipped local asset");
assert.ok(index.indexOf('rel="preload" href="'+bundledFontHref) < index.indexOf('data-kanji5-react-styles'),"Bundled Vazirmatn preload must be discoverable before the app stylesheet");

assert.ok(index.includes('<link rel="stylesheet" href="'+fontUrl+'">'),"Web font stylesheet link is missing");
assert.doesNotMatch(css,/^\s*@import\s+url\(["']https:\/\/fonts\.googleapis\.com\//m);
assert.ok(index.indexOf('rel="stylesheet" href="'+fontUrl) < index.indexOf('data-kanji5-react-styles'),"Web font stylesheet must be discoverable before the app stylesheet");

console.log("Kanji 5 web-font loading contract passed.");
