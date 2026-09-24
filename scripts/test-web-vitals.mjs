import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const index = read("index.html");
const app = read("frontend/src/app/App.tsx");
const css = read("frontend/src/styles.css");

assert.match(index, /rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/, "Google Fonts origin should be preconnected");
assert.match(index, /rel="preconnect" href="https:\/\/fonts\.gstatic\.com"/, "Google Fonts static origin should be preconnected");
assert.match(index, /rel="preload" as="fetch" href="\.\/kanji-data\.json"/, "Kanji data should be preloaded");
assert.match(index, /rel="modulepreload" href="\.\/vendor\/ts-fsrs-5\.4\.1\.mjs"/, "FSRS should be module-preloaded");
assert.match(index, /rel="preload" as="style" href="\.\/react-dist\/kanji5-react\.css/, "React CSS should be preloaded");
assert.match(app, /useState<Snapshot\|null>\(\(\)=>getInitialSnapshot\(\)\)/, "App should consume a ready snapshot on first render when available");
assert.match(app, /function LoadingSummary\(\)/, "Review loading state must reserve summary geometry");
assert.match(app, /function LoadingGoal\(\)/, "Review loading state must reserve goal geometry");
assert.match(app, /function LoadingLearning\(\)/, "Review loading state must reserve learning-card geometry");
assert.match(app, /function LoadingInsights\(\)/, "Review loading state must reserve insights geometry");
assert.match(css, /\.kanji-display\{display:inline-block;width:1\.15em;height:1\.15em/, "Critical kanji box must have stable geometry");
assert.match(css, /\.loading-learning/, "Loading learning card styles must exist");
assert.match(css, /\.loading-insights/, "Loading insights styles must exist");

console.log("Kanji 5 LCP/CLS regression contract passed.");
