import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("frontend/src/styles.css","utf8");
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
const i18n=fs.readFileSync("frontend/src/app/i18n.ts","utf8");

for(const token of [
  "header-tools-menu-section",
  "menu-nav-item",
  "menu-preference-row",
  "menu-segmented",
  "menu-theme-segmented",
  "menu-settings-item",
  "headerMenuPopoverIn"
]) assert.ok(css.includes(token),`menu redesign contract missing: ${token}`);

assert.match(css,/\.header\.menu-open \.account-button\{visibility:visible!important;pointer-events:none!important;z-index:5!important;\}/, "account button must remain visible, inactive, and below the open-menu scrim");
assert.doesNotMatch(css,/\.header\.menu-open \.account-button\{[^}]*visibility:\s*hidden/i, "the menu-open state must not hide the account button");
assert.match(css,/\.header-actions \.header-tools\{inset-inline-start:0;inset-inline-end:0;width:100%;height:44px;min-width:100%;min-height:44px;z-index:101;\}/, "menu stacking context must span both header controls");
assert.match(css,/\.header-menu-scrim\{[^}]*position:fixed[^}]*z-index:110[^}]*background:transparent!important/, "the scrim button must be a transparent full-page hit target");
assert.match(css,/\.header-menu-scrim::before\{[^}]*background:rgba\(16,24,40,\.30\)[^}]*backdrop-filter:blur\(4px\)!important[^}]*-webkit-backdrop-filter:blur\(4px\)!important/, "the dedicated scrim surface must dim and blur the page");
assert.match(css,/\.header\.menu-open \.header-tools \.header-menu-scrim::before\{backdrop-filter:blur\(4px\)!important;-webkit-backdrop-filter:blur\(4px\)!important;\}/, "active scrim overlay must retain blur in the open menu state");
assert.doesNotMatch(css,/\.header-menu-scrim\{display:none;\}/, "the page scrim must not be disabled on desktop");
assert.ok(app.includes('</aside></>:null}<AccountButton language={language} onClick={()=>{setAccountOpen(true);setSecondaryPage(null)}}/></div></div>'), "AccountButton must share the menu stacking context so the scrim can cover it");
assert.ok(!app.includes('</aside></>:null}</div><AccountButton language={language}'), "AccountButton must not be a higher-layer sibling outside the menu stacking context");

assert.match(css,/@media\(min-width:761px\)[\s\S]*?\.header-tools-menu\{[\s\S]*?position:absolute!important;[\s\S]*?max-height:min\(640px/);
assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.header-tools-menu\{[\s\S]*?position:fixed!important;[\s\S]*?inset-inline-start:0!important;[\s\S]*?inset-inline-end:auto!important;/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.header-tools-menu\{animation:none!important;\}/);

for(const label of [
  "menuLearningTools","menuProgress","menuPreferences","menuGrammarHint","menuReadingHint",
  "menuMnemonicHint","menuStatsHint","menuSettingsHint","appearance","themeLight","themeDark","themeSystem"
]) assert.ok(i18n.includes(`| "${label}"`),`missing translation key: ${label}`);

for(const marker of [
  'aria-label={t("grammarGuide",language)}',
  'aria-label={t("readingLab",language)}',
  'aria-label={t("preparedMnemonics",language)}',
  'aria-label={t("stats",language)}',
  'aria-label={t("settings",language)}',
  'changeLanguage("fa")',
  'changeLanguage("en")',
  'changeTheme("light")',
  'changeTheme("dark")',
  'changeTheme("system")'
]) assert.ok(app.includes(marker),`missing App menu interaction: ${marker}`);

assert.ok(app.includes('setHeaderMenuOpen(false);window.requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(".header-menu-trigger")?.focus())'),"Escape focus restoration missing");
assert.ok(app.includes('document.addEventListener("pointerdown",onPointerDown,true)'),"outside-click handling missing");

console.log("Kanji5 menu redesign contract passed.");
