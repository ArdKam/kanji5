import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("frontend/src/styles.css","utf8");
const index=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");

for(const token of [
  "--text-xs:11px","--text-sm:13px","--text-base:15px","--text-md:17px",
  "--text-lg:19px","--text-xl:22px","--text-2xl:28px",
  "--text-display-sm:clamp(25px,4vw,34px)",
  "--text-display-lg:clamp(78px,14vw,150px)",
  "--space-1:4px","--space-8:32px",
  "--radius-sm:10px","--radius-md:14px","--radius-lg:20px","--radius-xl:28px",
  "--radius-full:999px","--nav-bar-height:66px"
]) assert.ok(css.includes(token),`missing design token: ${token}`);

assert.match(css,/\.button:active:not\(:disabled\)[\s\S]*?transform:scale\(\.97\)/);
for(const token of ['--motion-interaction:160ms;','--motion-hover:180ms;','--motion-tab:280ms;','--motion-pager:420ms;','--motion-flip:480ms;']) assert.ok(css.includes(token),`missing motion timing token: ${token}`);
assert.match(css,/\.experience-tab-indicator[\s\S]*?transition:transform \.28s cubic-bezier\(\.2,\.7,\.2,1\)/);
assert.match(css,/@keyframes kanji5-dialog-in/);
assert.match(css,/\.dialog\[open\][\s\S]*?animation:kanji5-dialog-in/);
assert.match(css,/@keyframes dictionary-panel-in/);
assert.match(css,/\.dictionary-tabpanel[\\s\\S]*?animation:dictionary-panel-in/);
assert.match(css,/@keyframes kanji5GoalCelebrate/);
assert.match(css,/kanji5ExerciseCorrectGlow/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/@media\(prefers-color-scheme:dark\)/);
assert.match(css,/--washi:#171614/);
assert.match(css,/--paper:#23211e/);
assert.match(css,/--sumi:#f4efe3/);
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
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.dictionary-card\.is-navigation-next\{animation:dictionary-card-next-in var\(--motion-tab\)/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.dictionary-card\.is-navigation-previous\{animation:dictionary-card-previous-in var\(--motion-tab\)/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/@keyframes dictionary-card-next-in/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/@keyframes dictionary-card-previous-in/);

assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.kanji-catalog-tile[\s\S]*?transition:transform var\(--motion-interaction\) ease/);
assert.match(fs.readFileSync("frontend/src/app/dictionary.css","utf8"),/\.reading-lab-reader-sentence[\s\S]*?transition:border-color var\(--motion-hover\) ease/);
assert.match(fs.readFileSync("frontend/src/app/reading-lab-playback.css","utf8"),/\.reading-lab-sentence-repeat[\s\S]*?transition:background var\(--motion-interaction\) ease/);

console.log("Kanji5 UI hardening final design/motion/dark-mode contract passed.");
