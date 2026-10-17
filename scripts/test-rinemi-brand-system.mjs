import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const shell = await read("startup-shell.css");
const cat = await read("assets/brand/rinemi-companion-cat.svg");
const guide = await read("docs/RINEMI-BRAND-GUIDE.md");
const designSystem = await read("frontend/src/design-system.css");
const themeBootstrap = await read("theme-bootstrap.js");

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

assert.match(shell,/font-family:\s*"Plus Jakarta Sans Variable",\s*"Plus Jakarta Sans",\s*system-ui,\s*-apple-system,\s*"Segoe UI",\s*sans-serif/,"Startup shell should use the English UI family");
assert.match(shell,/font-family:\s*"Vazirmatn",\s*"Plus Jakarta Sans",\s*system-ui,\s*sans-serif/,"Persian startup copy should use Vazirmatn");
assert.ok(shell.includes("background: var(--ds-color-canvas)") && shell.includes("color: var(--ds-color-text-primary)"), "Startup shell must use shared semantic surface and text tokens");
assert.ok(!shell.includes(':root[data-theme="dark"]') && !shell.includes("@media(prefers-color-scheme:dark)"), "Startup shell must consume shared tokens rather than duplicate theme palettes");
assert.ok(shell.includes("background: var(--ds-color-canvas)") && shell.includes("background: var(--ds-color-surface)"), "Startup shell must derive canvas and card surfaces from semantic tokens");
assert.ok(shell.includes("background: var(--ds-color-action-primary)") && shell.includes("color: var(--ds-color-action-primary-text)"), "Startup recovery action must use semantic indigo and its matching foreground");
assert.ok(shell.includes('@media(prefers-reduced-motion:reduce)'), "Startup shell must retain a reduced-motion path");

assert.ok(cat.includes('viewBox="0 0 240 240"'), "Companion art should use a scalable viewBox");
assert.ok(cat.includes('aria-labelledby="title desc"') && cat.includes('<title id="title">') && cat.includes('<desc id="desc">'), "Companion SVG needs accessible metadata");
for (const color of ["#F7F4EE", "#FDFBF7", "#292B2D", "#505F83", "#D6A1AA"]) {
  assert.ok(cat.includes(color), "Companion SVG is missing canonical palette color: " + color);
}
assert.ok(!/<image\b|(?:href|src)=["']https?:\/\//i.test(cat), "Companion asset must stay self-contained and work offline");
assert.ok(/cat is a/i.test(guide) && /not a teacher/i.test(guide) && /source[- ]audit/i.test(guide), "Brand guide must preserve the companion contract and source-audit record");
assert.ok(designSystem.includes("--ds-color-action-primary: light-dark(var(--ds-brand-indigo), #A8B5D8);"), "Semantic action token must match the established dark-logo indigo");
assert.ok(designSystem.includes("--ds-color-legacy-shu: var(--ds-color-action-primary);"), "Legacy action alias must resolve to semantic indigo in every theme");
assert.ok(themeBootstrap.includes("--indigo:var(--ds-color-action-primary);--shu:var(--ds-color-action-primary);"), "Pre-React onboarding must use the shared semantic action color");
assert.ok(!themeBootstrap.includes("--indigo:#e06a5f") && !themeBootstrap.includes("--shu:#e06a5f"), "Dark onboarding must not reuse coral error color as its brand action");
assert.ok(contrast("#62666A", "#FDFBF7") >= 4.5, "Startup muted copy must pass WCAG AA on paper");
assert.ok(contrast("#B8AFA2", "#23211E") >= 4.5, "Startup muted copy must pass WCAG AA on dark paper");
assert.ok(contrast("#171614", "#A8B5D8") >= 4.5, "Dark indigo recovery action must pass WCAG AA");

console.log("Rinemi brand-system startup contract passed.");
