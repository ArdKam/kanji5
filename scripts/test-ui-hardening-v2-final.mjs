import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("frontend/src/styles.css","utf8");
const designSystem=fs.readFileSync("frontend/src/design-system.css","utf8");
const dictionaryCss=fs.readFileSync("frontend/src/app/dictionary.css","utf8");
const index=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");

const tokenAliases=[
  ["--text-xs","--ds-type-caption"],["--text-sm","--ds-type-small"],
  ["--text-base","--ds-type-body"],["--text-md","--ds-type-body-emphasis"],
  ["--text-lg","--ds-type-subtitle"],["--text-xl","--ds-type-heading-sm"],
  ["--text-2xl","--ds-type-heading-md"],
  ["--space-1","--ds-space-1"],["--space-8","--ds-space-8"],
  ["--radius-sm","--ds-radius-sm"],["--radius-md","--ds-radius-md"],
  ["--radius-lg","--ds-radius-lg"],["--radius-xl","--ds-radius-xl"],
  ["--radius-full","--ds-radius-full"]
];
for(const [legacy,semantic] of tokenAliases) {
  assert.ok(css.includes(`${legacy}:var(${semantic});`),`missing semantic token alias: ${legacy} -> ${semantic}`);
}
const semanticTokens=[
  "--ds-type-caption: 11px;","--ds-type-small: 13px;","--ds-type-body: 15px;",
  "--ds-type-body-emphasis: 17px;","--ds-type-subtitle: 19px;",
  "--ds-type-heading-sm: 22px;","--ds-type-heading-md: 28px;",
  "--ds-space-1: 4px;","--ds-space-8: 32px;",
  "--ds-radius-sm: 10px;","--ds-radius-md: 14px;","--ds-radius-lg: 20px;",
  "--ds-radius-xl: 28px;","--ds-radius-full: 999px;"
];
for(const token of semanticTokens) assert.ok(designSystem.includes(token),`missing semantic design token: ${token}`);
assert.match(css,/--text-display-sm:clamp\(25px,\s*4vw,\s*34px\)/);
assert.match(css,/--text-display-lg:clamp\(78px,\s*14vw,\s*150px\)/);
assert.ok(css.includes("--nav-bar-height:66px"),"navigation bar height contract missing");

assert.match(css,/\.button:active:not\(:disabled\)[\s\S]*?transform:scale\(\.97\)/);
for(const token of ['--motion-interaction:160ms;','--motion-hover:180ms;','--motion-tab:280ms;','--motion-pager:420ms;','--motion-flip:480ms;']) assert.ok(css.includes(token),`missing motion timing token: ${token}`);
assert.match(css,/\.experience-tab-indicator[\s\S]*?transition:transform \.28s cubic-bezier\(\.2,\.7,\.2,1\)/);
assert.match(css,/@keyframes kanji5-dialog-in/);
assert.match(css,/dialog\[open\][\s\S]*?animation:kanji5-dialog-in/);
assert.match(dictionaryCss,/@keyframes dictionary-panel-in/);
assert.match(dictionaryCss,/\.dictionary-tabpanel[\s\S]*?animation:dictionary-panel-in/);
assert.match(css,/@keyframes kanji5GoalCelebrate/);
assert.match(css,/kanji5ExerciseCorrectGlow/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/@media\(prefers-color-scheme:dark\)/);
assert.ok(designSystem.includes("--ds-color-canvas: #171614;"),"Dark canvas must be defined in the semantic layer");
assert.ok(designSystem.includes("--ds-color-surface: #23211E;"),"Dark surfaces must be defined in the semantic layer");
assert.ok(designSystem.includes("--ds-color-text-primary: #F4EFE3;"),"Dark primary text must be defined in the semantic layer");
assert.match(css,/html,body\{background:var\(--washi\);color:var\(--sumi\);\}/);

assert.ok(index.includes("name=\"theme-color\""),"theme-color metadata missing");
assert.ok(app.includes("experience-tab-indicator"),"experience nav indicator missing");
assert.ok(app.includes('data-celebrated={snapshot.dailyGoal.celebrated?"true":"false"}'),"goal celebration hook missing");

const cssSources=[
  "frontend/src/styles.css",
  "frontend/src/app/mnemonic-support.css",
  "frontend/src/app/dictionary.css",
  "frontend/src/app/component-breakdown.css",
  "frontend/src/app/traditional-radical.css",
  "frontend/src/experience-nav.css"
];
for(const file of cssSources){
  const source=fs.readFileSync(file,"utf8");
  const bad=[...source.matchAll(/font-size\s*:\s*([89](?:\.5)?px)/g)];
  assert.equal(bad.length,0,`8px/9px font-size remains in ${file}: ${bad.map(m=>m[1]).join(", ")}`);
}

assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.dictionary-view-button[\s\S]*?transition:background var\(--motion-interaction\) ease/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.dictionary-card\.is-navigation-next\{animation:dictionary-card-next-in var\(--motion-tab\)/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.dictionary-card\.is-navigation-previous\{animation:dictionary-card-previous-in var\(--motion-tab\)/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/@keyframes dictionary-card-next-in/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/@keyframes dictionary-card-previous-in/);

assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.kanji-catalog-tile[\s\S]*?transition:transform var\(--motion-interaction\) ease/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.reading-lab-reader-sentence[\s\S]*?transition:border-color var\(--motion-hover\) ease/);
assert.match(fs.readFileSync("frontend/src/app/reading-lab-playback.css","utf8"),/\.reading-lab-sentence-repeat[\s\S]*?transition:background var\(--motion-interaction\) ease/);

console.log("Kanji5 UI hardening final design/motion/dark-mode contract passed.");
