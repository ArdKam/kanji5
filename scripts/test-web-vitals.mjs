import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const index = read("index.html");
const app = read("frontend/src/app/App.tsx");
const css = read("frontend/src/styles.css");

assert.doesNotMatch(index, /fonts\.googleapis\.com/, "External Google Fonts requests must stay off the startup critical path");
assert.doesNotMatch(index, /fonts\.gstatic\.com/, "Google Fonts static origin must stay off the startup critical path");
assert.match(index, /rel="preload" href="\.\/react-dist\/assets\/Vazirmatn_wght_-BeciDpKm\.woff2" as="font"/, "Primary local UI font should remain preloaded");
assert.doesNotMatch(index, /rel="preload"[^>]+kanji-data\.json/, "Kanji data must not use an unused preload hint");
assert.match(index, /rel="modulepreload" href="\.\/vendor\/ts-fsrs-5\.4\.1\.mjs"/, "FSRS should be module-preloaded");
assert.match(index, /rel="stylesheet" href="\.\/react-dist\/kanji5-react\.css\?v=dev"[^>]*data-kanji5-react-styles/, "React CSS should use the canonical versioned shipped asset");
assert.match(app, /useState<Snapshot\|null>\(\(\)=>getInitialSnapshot\(\)\)/, "App should consume a ready snapshot on first render when available");
assert.match(app, /function LoadingSummary\(\)/, "Review loading state must reserve summary geometry");
assert.match(app, /function LoadingGoal\(\)/, "Review loading state must reserve goal geometry");
assert.match(app, /function LoadingLearning\(\)/, "Review loading state must reserve learning-card geometry");
assert.doesNotMatch(app, /function LoadingInsights\(\)/, "Learning should not render an analytics loading panel");
assert.match(css, /\.kanji-display\{display:inline-block;width:1\.15em;height:1\.15em/, "Critical kanji box must have stable geometry");
assert.match(css, /\.loading-learning/, "Loading learning card styles must exist");
assert.match(css, /\.session-feedback\{/, "Compact session feedback styles must exist");

console.log("Kanji 5 LCP/CLS regression contract passed.");
