import fs from "node:fs";
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
const css=fs.readFileSync("frontend/src/styles.css","utf8");
for(const s of ["const toHiragana=","hiraganaReadings","displayedOn","displayedKun","aria-pressed={hiraganaReadings}","Show Hiragana","نمایش هیراگانا"])if(!app.includes(s))throw new Error("missing "+s);
if(!css.includes(".readings-header{")||!css.includes(".reading-toggle{"))throw new Error("reading toggle styles missing");
console.log("hiragana reading toggle contract: PASS");
