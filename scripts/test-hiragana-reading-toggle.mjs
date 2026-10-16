import fs from "node:fs";
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
const css=fs.readFileSync("frontend/src/styles.css","utf8");
const i18n=fs.readFileSync("frontend/src/app/i18n.ts","utf8");
for(const s of ["const toHiragana=","hiraganaReadings","displayedOn","displayedKun","aria-pressed={hiraganaReadings}",'t("showAllReadingsInHiragana")','t("useNormalReadingNotation")']) {
  if(!app.includes(s)) throw new Error("missing "+s);
}
if(!i18n.includes('showAllReadingsInHiragana:"Show all readings in Hiragana"')) throw new Error("English action label missing");
if(!i18n.includes('useNormalReadingNotation:"Use normal reading notation"')) throw new Error("English return label missing");
if(!i18n.includes('showAllReadingsInHiragana:"نمایش همهٔ خوانش‌ها به هیراگانا"')) throw new Error("Persian action label missing");
if(!i18n.includes('useNormalReadingNotation:"استفاده از شیوهٔ معمول نمایش خوانش‌ها"')) throw new Error("Persian return label missing");
if(!css.includes(".readings-header{")||!css.includes(".reading-toggle{")) throw new Error("reading toggle styles missing");
console.log("hiragana reading toggle behavior and action-label contract: PASS");
