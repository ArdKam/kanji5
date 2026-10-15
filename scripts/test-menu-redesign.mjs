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

assert.match(css,/\.header\.menu-open \.account-button\{visibility:visible!important;pointer-events:none!important;z-index:5!important;\}/, "account button must remain visible, non-interactive, and below the scrim while the menu is open");
assert.match(css,/\.header\.menu-open \.header-actions\{z-index:1000!important;\}/, "open-menu stack must cover page content and persistent navigation");
assert.match(css,/\.header-actions \.header-tools\{inset-inline-start:0;inset-inline-end:0;width:100%;height:44px;min-width:100%;min-height:44px;z-index:101;\}/, "menu/scrim/account controls must share a stacking context spanning the header");
assert.doesNotMatch(css,/\.header\.menu-open \.account-button\{[^}]*visibility:\s*hidden/i, "the menu-open state must not hide the account button");

assert.match(css,/@media\(min-width:761px\)[\s\S]*?\.header-tools-menu\{[\s\S]*?position:absolute!important;[\s\S]*?max-height:min\(640px/);
assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.header-tools-menu\{[\s\S]*?position:fixed!important;[\s\S]*?inset-inline-start:0!important;[\s\S]*?inset-inline-end:auto!important;/);
assert.doesNotMatch(css,/\.header-menu-scrim\{display:none;\}/, "desktop must retain the scrim so the account control stays below it");
assert.ok(app.includes(`</aside></>:null}<AccountButton language={language} onClick={()=>{setAccountOpen(true);setSecondaryPage(null)}}/></div></div>`), "AccountButton must share the menu/scrim stacking parent");
assert.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.header-tools-menu\{animation:none!important;\}/);

for(const label of [
  "menuLearningTools","menuProgress","menuPreferences","appearance","themeLight","themeDark","themeSystem"
]) assert.ok(i18n.includes(`| "${label}"`),`missing translation key: ${label}`);

for(const label of ["menuGrammarHint","menuReadingHint","menuMnemonicHint","menuStatsHint","menuSettingsHint"]) {
  assert.ok(!i18n.includes(`"${label}"`),`redundant menu hint translation remains: ${label}`);
  assert.ok(!app.includes(`t("${label}"`),`redundant menu hint is still rendered: ${label}`);
}

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
