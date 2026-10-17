import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const shell = await read("startup-shell.css");
const cat = await read("assets/brand/rinemi-companion-cat.svg");
const guide = await read("docs/RINEMI-BRAND-GUIDE.md");

function channel(hex) {
  const value = Number.parseInt(hex, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const values = hex.slice(1).match(/.{2}/g).map(channel);
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

assert.ok(shell.includes('font-family:"Plus Jakarta Sans Variable","Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif'), "Startup shell should use the English UI family");
assert.ok(shell.includes('font-family:"Vazirmatn","Plus Jakarta Sans",system-ui,sans-serif'), "Persian startup copy should use Vazirmatn");
assert.ok(shell.includes(':root[data-theme="dark"] #kanji5-startup-shell'), "Explicit dark mode must theme the startup shell");
assert.ok(shell.includes('@media(prefers-color-scheme:dark){') && shell.includes(':root[data-theme="system"] #kanji5-startup-shell'), "System dark mode must theme the startup shell only under the OS dark query");
assert.ok(shell.includes('background:#171614;color:#F4EFE3'), "Dark startup shell must use Sumi Play dark canvas and text");
assert.ok(shell.includes('background:#A8B5D8;color:#171614'), "Dark startup recovery action must use high-contrast indigo");
assert.ok(shell.includes('@media(prefers-reduced-motion:reduce)'), "Startup shell must retain a reduced-motion path");

assert.ok(cat.includes('viewBox="0 0 240 240"'), "Companion art should use a scalable viewBox");
assert.ok(cat.includes('aria-labelledby="title desc"') && cat.includes('<title id="title">') && cat.includes('<desc id="desc">'), "Companion SVG needs accessible metadata");
for (const color of ["#F7F4EE", "#FDFBF7", "#292B2D", "#505F83", "#D6A1AA"]) {
  assert.ok(cat.includes(color), "Companion SVG is missing canonical palette color: " + color);
}
assert.ok(!/<image\b|(?:href|src)=["']https?:\/\//i.test(cat), "Companion asset must stay self-contained and work offline");
assert.ok(guide.includes("cat is a") && guide.includes("not a teacher") && guide.includes("source audit"), "Brand guide must preserve the companion contract and source-audit record");
assert.ok(contrast("#62666A", "#FDFBF7") >= 4.5, "Startup muted copy must pass WCAG AA on paper");
assert.ok(contrast("#B8AFA2", "#23211E") >= 4.5, "Startup muted copy must pass WCAG AA on dark paper");
assert.ok(contrast("#171614", "#A8B5D8") >= 4.5, "Dark indigo recovery action must pass WCAG AA");

console.log("Rinemi brand-system startup contract passed.");
