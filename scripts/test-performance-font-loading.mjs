import { access, readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const index=await readFile("index.html","utf8");
const css=await readFile("frontend/src/styles.css","utf8");
const jpCss=await readFile("frontend/src/noto-serif-jp.css","utf8");

const jpPreload="./react-dist/assets/NotoSerifJP-Regular.subset.woff2";
await access("frontend/src/assets/NotoSerifJP-Regular.subset.woff2");
await access(jpPreload.slice(2));
assert.ok(index.includes('<link rel="preload" href="'+jpPreload+'" as="font" type="font/woff2" crossorigin fetchpriority="high">'),"Bundled Noto Serif JP preload is missing");
assert.ok(index.indexOf('rel="preload" href="'+jpPreload) < index.indexOf('data-kanji5-react-styles'),"Noto Serif JP preload must be discoverable before the app stylesheet");
assert.ok(jpCss.includes('font-family:"Noto Serif JP";'),"Local Noto Serif JP @font-face is missing");
assert.ok(stylesHasImport(css),"Noto Serif JP stylesheet must be imported by the main stylesheet");
assert.doesNotMatch(index,/fonts\.googleapis\.com\/css2\?[^"]*Noto\+Serif\+JP/,"Noto Serif JP must not depend on Google Fonts CSS");

const vazirPreloadMatch=index.match(/<link rel="preload" href="(\.\/react-dist\/assets\/[^"?#]+\.woff2)" as="font" type="font\/woff2" crossorigin fetchpriority="high">/);
assert.ok(vazirPreloadMatch,"Bundled Vazirmatn font preload is missing");
const bundledFontPath=vazirPreloadMatch[1].slice(2);
await access(bundledFontPath);
assert.match(bundledFontPath,/^react-dist\/assets\/Vazirmatn_[^/]+\.woff2$/,"Bundled Vazirmatn preload must target the shipped local asset");

const interUrl="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap";
assert.ok(index.includes('<link rel="stylesheet" href="'+interUrl+'">'),"Inter stylesheet link is missing");
assert.doesNotMatch(css,/^\s*@import\s+url\(["']https:\/\/fonts\.googleapis\.com\//m);

function stylesHasImport(value){ return value.includes('@import "./noto-serif-jp.css";'); }

console.log("Kanji 5 web-font loading contract passed.");
