import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("frontend/src/styles.css","utf8");
const mainSource=fs.readFileSync("frontend/src/main.tsx","utf8");
const appSource=fs.readFileSync("frontend/src/app/App.tsx","utf8");
const designSystem=fs.readFileSync("frontend/src/design-system.css","utf8");
const dictionaryCss=fs.readFileSync("frontend/src/app/dictionary.css","utf8")+"\n"+fs.readFileSync("frontend/src/app/dictionary-catalog.css","utf8");
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
assert.match(designSystem,/--ds-type-display-sm: clamp\(25px,\s*4vw,\s*34px\)/);
assert.match(designSystem,/--ds-type-display-lg: clamp\(78px,\s*14vw,\s*150px\)/);
assert.ok(designSystem.includes("--ds-layout-nav-height: 66px;"),"semantic navigation height token missing");

assert.match(css,/\.button:active:not\(:disabled\)[\s\S]*?transform:scale\(\.97\)/);
for(const token of ['--ds-motion-interaction: 160ms;','--ds-motion-tab: 280ms;','--ds-motion-pager: 420ms;']) assert.ok(designSystem.includes(token),`missing semantic motion timing token: ${token}`);
for(const [legacy,semantic] of [['--motion-hover','--ds-motion-hover'],['--motion-flip','--ds-motion-flip']]) {
  assert.ok(css.includes(`${legacy}:var(${semantic});`),`missing semantic motion alias: ${legacy}`);
}
for(const token of ['--ds-motion-hover: 180ms;','--ds-motion-flip: 480ms;']) assert.ok(designSystem.includes(token),`missing semantic motion timing token: ${token}`);
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
  "frontend/src/app/dictionary-catalog.css",
  "frontend/src/app/component-breakdown.css",
  "frontend/src/app/traditional-radical.css",
  "frontend/src/experience-nav.css"
];
for(const file of cssSources){
  const source=fs.readFileSync(file,"utf8");
  const bad=[...source.matchAll(/font-size\s*:\s*([89](?:\.5)?px)/g)];
  assert.equal(bad.length,0,`8px/9px font-size remains in ${file}: ${bad.map(m=>m[1]).join(", ")}`);
}

assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.dictionary-view-button[\s\S]*?transition:background var\(--ds-motion-interaction\) ease/);
assert.match(dictionaryCss,/\.dictionary-card\.is-navigation-next\{animation:dictionary-card-next-in var\(--ds-motion-tab\)/);
assert.match(dictionaryCss,/\.dictionary-card\.is-navigation-previous\{animation:dictionary-card-previous-in var\(--ds-motion-tab\)/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/@keyframes dictionary-card-next-in/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/@keyframes dictionary-card-previous-in/);

assert.match(dictionaryCss,/\.kanji-catalog-tile[\s\S]*?transition:transform var\(--ds-motion-interaction\) ease/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.reading-lab-reader-sentence[\s\S]*?transition:border-color var\(--ds-motion-hover\) ease/);
assert.match(fs.readFileSync("frontend/src/app/reading-lab-playback.css","utf8"),/\.reading-lab-sentence-repeat[\s\S]*?transition:background var\(--ds-motion-interaction\) ease/);


const migratedTokenCssFiles=["frontend/src/app/StatsAdvanced.css","frontend/src/app/component-breakdown.css","frontend/src/app/dictionary.css","frontend/src/app/dictionary-catalog.css","frontend/src/app/exercise-layout.css","frontend/src/app/handwriting-layout.css","frontend/src/app/handwriting-practice.css","frontend/src/app/learning-card-enhancements.css","frontend/src/app/learning-surface.css","frontend/src/app/mnemonic-support.css","frontend/src/app/practice-home.css","frontend/src/app/reading-lab-focus.css","frontend/src/app/reading-lab-playback.css","frontend/src/app/topic-learning.css","frontend/src/app/traditional-radical.css","frontend/src/experience-nav.css","frontend/src/styles.css"];
const migratedLegacyTokenNames=["text-xs","text-sm","text-base","text-md","text-lg","text-xl","text-2xl","text-heading","text-title","text-display-sm","text-display-lg","text-display-md","text-display-xl","text-display-kanji","text-stimulus-kanji","text-display-compact","text-display-wide","text-display-tall","space-1","space-2","space-3","space-4","space-5","space-6","space-7","space-8","space-9","space-10","space-11","space-12","radius-sm","radius-md","radius-lg","radius-xl","radius-full","motion-instant","motion-fast","motion-normal","motion-slow","motion-hover","motion-flip","motion-feedback","motion-interaction","motion-tab","motion-pager","motion-feedback-in","motion-stroke","motion-progress","motion-menu","motion-scrim","motion-popover","motion-dialog-open","z-base","z-content","z-nav","z-overlay","z-modal","nav-bar-height"];
for(const file of migratedTokenCssFiles){
  const source=fs.readFileSync(file,"utf8");
  for(const token of migratedLegacyTokenNames){
    assert.ok(!source.includes(`var(--${token})`) && !source.includes(`var(--${token},`), `legacy type/space/radius/motion/layer token is still consumed: ${token} in ${file}`);
  }
}

assert.doesNotMatch(mainSource,/import\s+["']\.\/app\/dictionary-catalog\.css["']/,"Dictionary catalog styles must not enter the startup bundle");
assert.match(appSource,/import\(["']\.\/dictionary-catalog\.css["']\)/,"Dictionary catalog CSS must be loaded on demand");
assert.match(appSource,/dictionaryCatalogStylesReady/,"Dictionary screen must wait until its CSS chunk is ready");
console.log("Kanji5 UI hardening final design/motion/dark-mode contract passed.");
