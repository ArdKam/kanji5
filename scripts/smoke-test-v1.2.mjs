import fs from "node:fs";
const index=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");
const enhancer=fs.readFileSync("v1.2-enhancements.js","utf8");
const bootstrap=fs.readFileSync("scripts/apply-v1.2.mjs","utf8");
const runtimeFix=fs.readFileSync("v1.2-runtime-fixes.js","utf8");
const runtimePatch=fs.readFileSync("scripts/apply-runtime-fixes.mjs","utf8");
const startupPatch=fs.readFileSync("scripts/apply-startup-guard.mjs","utf8");
const manifest=JSON.parse(fs.readFileSync("manifest.webmanifest","utf8"));
const shell=sw.match(/const SHELL = ([^;]+);/)?.[1]||"";
const checks=[
["runtime dataset URL",index.includes('const DATA_URL="./kanji-data.json";')],
["2136 runtime guard",index.includes("Runtime kanji dataset must contain 2136 entries")],
["v1.2 enhancement script",index.includes('<script src="./v1.2-enhancements.js"></script>')],
["dataset cache version",index.includes('DATA_VERSION = "v1.2-dataset-2136"')],
["separate data cache",sw.includes('const DATA_CACHE = "kanji5-data-v5";')&&!shell.includes("kanji-data.json")],
["shell cache version",sw.includes('const CACHE = "kanji5-shell-v9";')],
["adaptive prompt",enhancer.includes("function choosePrompt(character)")],
["meaning/reading tracking",enhancer.includes('getStats(character, "meaning")')&&enhancer.includes('getStats(character, "reading")')],
["attempt recording",enhancer.includes("function recordAttempt(character, mode, correct)")],
["dataset cache invalidation",bootstrap.includes('kanji5-deck-version')&&bootstrap.includes('v1.2-dataset-2136')],
["no legacy 2000 end-message",!index.includes("دورهٔ ۲۰۰۰ کانجی تمام شد")],
["mobile study-first layout",index.includes('id="v1.2-mobile-fix"')&&index.includes('#studyPanel{order:1')],
["pre-module startup guard",index.includes('id="v1.2-startup-guard"')&&index.indexOf('id="v1.2-startup-guard"') < index.indexOf('<script type="module">')],
["startup guard build step",startupPatch.includes("clearRuntimeCaches")&&startupPatch.includes("getRegistrations")&&startupPatch.includes("caches.keys")&&startupPatch.includes("v12StartupRetry")],
["FSRS bounded startup",runtimePatch.includes("FSRS_LOAD_TIMEOUT")&&runtimePatch.includes("import(FSRS_URL)")],
["example translation retry",runtimeFix.includes("entry.meanings")&&runtimeFix.includes("flatMap(m => m.glosses || [])")&&runtimeFix.includes("data-v12-translations")&&runtimeFix.includes("retryCount < 4")],
["romaji reading support",enhancer.includes("function kanaToRomaji(value)")&&enhancer.includes("function normalizeRomaji(value)")&&enhancer.includes("canonicalRomaji")&&enhancer.includes("kana or romaji")],
["runtime fixes injected",index.includes('<script src="./v1.2-runtime-fixes.js"></script>')],
["runtime fixes cached",shell.includes("./v1.2-runtime-fixes.js")],
["individual reading audio",index.includes("reading-list")&&index.includes("data-speak=\"${r}\"")],
["PWA icon exists",fs.existsSync("icon.svg")],
["manifest icon",Array.isArray(manifest.icons)&&manifest.icons.some(x=>x.src==="icon.svg")]
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?"PASS":"FAIL"}: ${name}`);
if(failed.length)throw new Error(`${failed.length} smoke test(s) failed`);
console.log(`All ${checks.length} v1.2 smoke tests passed.`);
