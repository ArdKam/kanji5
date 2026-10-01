import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const index = read("index.html");
const app = read("frontend/src/app/App.tsx");
const css = read("frontend/src/styles.css");

assert.match(index, /rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/, "Google Fonts origin should be preconnected");
assert.match(index, /rel="preconnect" href="https:\/\/fonts\.gstatic\.com"/, "Google Fonts static origin should be preconnected");
const interUrl="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap";
assert.ok(index.includes('<link rel="preload" href="'+interUrl+'" as="style" fetchpriority="high"'), "Inter stylesheet should be discoverable as a non-blocking preload");
assert.ok(index.includes('<noscript><link rel="stylesheet" href="'+interUrl+'"></noscript>'), "Inter stylesheet should retain a noscript fallback");
assert.doesNotMatch(index, /rel="preload"[^>]+kanji-data\.json/, "Kanji data must not use an unused preload hint");
assert.match(index, /rel="modulepreload" href="\.\/vendor\/ts-fsrs-5\.4\.1\.mjs"/, "FSRS should be module-preloaded");
assert.match(index, /rel="stylesheet" href="\.\/react-dist\/kanji5-react\.css\?v=dev"[^>]*data-kanji5-react-styles/, "React CSS should use the canonical versioned shipped asset");
assert.match(app, /useState<Snapshot\|null>\(\(\)=>getInitialSnapshot\(\)\)/, "App should consume a ready snapshot on first render when available");
assert.match(app, /function LoadingSummary\(\)/, "Review loading state must reserve summary geometry");
assert.match(app, /function LoadingGoal\(\)/, "Review loading state must reserve goal geometry");
assert.match(app, /function LoadingLearning\(\)/, "Review loading state must reserve learning-card geometry");
assert.doesNotMatch(app, /function LoadingInsights\(\)/, "Learning no longer reserves analytics geometry");
assert.match(css, /\.kanji-display\{display:inline-block;width:1\.15em;height:1\.15em/, "Critical kanji box must have stable geometry");
assert.match(css, /\.loading-learning/, "Loading learning card styles must exist");
assert.match(css, /\.session-feedback/, "Compact session feedback styles must exist");

console.log("Kanji 5 LCP/CLS regression contract passed.");
