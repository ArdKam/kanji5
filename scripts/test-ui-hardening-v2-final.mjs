import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("frontend/src/styles.css","utf8");
const designSystem=fs.readFileSync("frontend/src/design-system.css","utf8");
const dictionaryCss=fs.readFileSync("frontend/src/app/dictionary.css","utf8");
const dictionaryPageCss=fs.readFileSync("frontend/src/app/dictionary-page.css","utf8");
const index=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");

for(const token of [
  "--text-xs:var(--ds-type-caption)","--text-sm:var(--ds-type-small)","--text-base:var(--ds-type-body)","--text-md:var(--ds-type-body-emphasis)",
  "--text-lg:var(--ds-type-subtitle)","--text-xl:var(--ds-type-heading-sm)","--text-2xl:var(--ds-type-heading-md)",
  "--text-display-sm:var(--ds-type-display-sm)",
  "--text-display-lg:var(--ds-type-display-lg)",
  "--space-1:var(--ds-space-1)","--space-8:var(--ds-space-8)",
  "--radius-sm:var(--ds-radius-sm)","--radius-md:var(--ds-radius-md)","--radius-lg:var(--ds-radius-lg)","--radius-xl:var(--ds-radius-xl)",
  "--radius-full:999px","--nav-bar-height:66px"
]) assert.ok(css.includes(token),`missing design token: ${token}`);

assert.match(css,/\.button:active:not\(:disabled\)[\s\S]*?transform:scale\(\.97\)/);
for(const token of ['--motion-interaction:var(--ds-motion-interaction);','--motion-hover:var(--ds-motion-hover);','--motion-tab:var(--ds-motion-tab);','--motion-pager:var(--ds-motion-pager);','--motion-flip:var(--ds-motion-flip);']) assert.ok(css.includes(token),`missing motion timing token: ${token}`);
assert.match(css,/\.experience-tab-indicator[\s\S]*?transition:transform \.28s cubic-bezier\(\.2,\.7,\.2,1\)/);
assert.match(css,/@keyframes kanji5-dialog-in/);
assert.match(css,/dialog\[open\][\s\S]*?animation:kanji5-dialog-in/);
assert.match(dictionaryCss,/@keyframes dictionary-panel-in/);
assert.match(dictionaryCss,/\.dictionary-tabpanel[\s\S]*?animation:dictionary-panel-in/);
assert.match(css,/@keyframes kanji5GoalCelebrate/);
assert.match(css,/kanji5ExerciseCorrectGlow/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/@media\(prefers-color-scheme:dark\)/);
assert.match(css,/--washi:var\(--ds-color-canvas\)/);
assert.match(css,/--paper:var\(--ds-color-surface\)/);
assert.match(css,/--sumi:var\(--ds-color-text-primary\)/);
assert.match(designSystem,/--ds-color-canvas: light-dark\(var\(--ds-brand-rice-paper\), #171614\)/);
assert.match(designSystem,/--ds-color-action-primary: light-dark\(var\(--ds-brand-indigo\), #A8B5D8\)/);
assert.match(designSystem,/--ds-review-again-text: var\(--ds-state-danger-text\)/);
assert.match(designSystem,/--ds-review-hard-text: var\(--ds-state-warning-text\)/);
assert.match(designSystem,/--ds-review-good-text: var\(--ds-state-success-text\)/);
assert.match(designSystem,/--ds-review-easy-text: var\(--ds-state-info-text\)/);
assert.match(designSystem,/--ds-type-caption: 12px/);
assert.match(css,/html,body\{background:var\(--washi\);color:var\(--sumi\);\}/);

assert.ok(index.includes("name=\"theme-color\""),"theme-color metadata missing");
assert.ok(app.includes("experience-tab-indicator"),"experience nav indicator missing");
assert.ok(app.includes('data-celebrated={snapshot.dailyGoal.celebrated?"true":"false"}'),"goal celebration hook missing");

const cssSources=[
  "frontend/src/styles.css",
  "frontend/src/app/mnemonic-support.css",
  "frontend/src/app/dictionary.css",
  "frontend/src/app/dictionary-page.css",
  "frontend/src/app/component-breakdown.css",
  "frontend/src/app/traditional-radical.css",
  "frontend/src/experience-nav.css"
];
for(const file of cssSources){
  const source=fs.readFileSync(file,"utf8");
  const bad=[...source.matchAll(/font-size\s*:\s*([89](?:\.5)?px)/g)];
  assert.equal(bad.length,0,`8px/9px font-size remains in ${file}: ${bad.map(m=>m[1]).join(", ")}`);
}


const semanticConsumerCssFiles=[
  "frontend/src/experience-nav.css",
  "frontend/src/app/component-breakdown.css",
  "frontend/src/app/dictionary.css",
  "frontend/src/app/dictionary-page.css",
  "frontend/src/app/exercise-layout.css",
  "frontend/src/app/handwriting-practice.css",
  "frontend/src/app/learning-card-enhancements.css",
  "frontend/src/app/learning-surface.css",
  "frontend/src/app/mnemonic-support.css",
  "frontend/src/app/practice-home.css",
  "frontend/src/app/reading-lab-playback.css",
  "frontend/src/app/topic-learning.css",
  "frontend/src/app/traditional-radical.css"
];
for(const file of semanticConsumerCssFiles){
  const source=fs.readFileSync(file,"utf8");
  assert.match(source,/var\(--ds-(?:color|brand|state|type|font|space|radius|motion|layout|z)-[a-z0-9-]+/i,"missing direct semantic token in "+file);
  assert.doesNotMatch(source,/var\(--(?:washi|paper|sumi|ink|mute|shu|ai|matcha|sakura|line|line-soft|line-interactive|surface-soft|surface-panel|color-surface-elevated|color-success|color-warning|color-danger|color-background|color-text|color-text-muted|color-primary|color-border|color-border-subtle|color-focus|jp-font|ui-font|fa-font|text-xs|text-sm|text-base|text-md|text-lg|text-xl|text-2xl|text-heading|text-title|text-display-md|text-display-xl|text-display-sm|text-display-lg|text-display-kanji|text-stimulus-kanji|text-display-compact|text-display-wide|text-display-tall|space-[0-9]+|radius-(?:sm|md|lg|xl|full)|motion-[a-z-]+|nav-bar-height|z-(?:base|content|nav|overlay|modal)|progress-track|skeleton-(?:base|highlight|track|fill))\b/,"legacy token remains in migrated consumer "+file);
}

assert.match(dictionaryPageCss,/\.dictionary-view-button[\s\S]*?transition:background var\(--ds-motion-interaction\) ease/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.dictionary-card\.is-navigation-next\{animation:dictionary-card-next-in var\(--ds-motion-tab\)/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.dictionary-card\.is-navigation-previous\{animation:dictionary-card-previous-in var\(--motion-tab\)/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/@keyframes dictionary-card-next-in/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/@keyframes dictionary-card-previous-in/);

assert.match(dictionaryPageCss,/\.kanji-catalog-tile[\s\S]*?transition:transform var\(--ds-motion-interaction\) ease/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.reading-lab-reader-sentence[\s\S]*?transition:border-color var\(--ds-motion-hover\) ease/);
assert.match(fs.readFileSync("frontend/src/app/reading-lab-playback.css","utf8"),/\.reading-lab-sentence-repeat[\s\S]*?transition:background var\(--motion-interaction\) ease/);

console.log("Kanji5 UI hardening final design/motion/dark-mode contract passed.");
