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

assert.match(css,/\.header\.menu-open \.account-button\{visibility:hidden!important;pointer-events:none!important;\}/, "account button must be hidden and non-interactive while the menu is open");
assert.doesNotMatch(css,/\.header\.menu-open \.account-button\{[^}]*visibility:\s*visible/i, "no later rule may reactivate the account button while the menu is open");

assert.match(css,/@media\(min-width:761px\)[\s\S]*?\.header-tools-menu\{[\s\S]*?position:absolute!important;[\s\S]*?max-height:min\(640px/);
assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.header-tools-menu\{[\s\S]*?position:fixed!important;[\s\S]*?inset-inline-start:0!important;[\s\S]*?inset-inline-end:auto!important;/);
assert.match(css,/@media\(min-width:761px\)[\s\S]*?\.header-menu-scrim\{display:none;\}/);
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
