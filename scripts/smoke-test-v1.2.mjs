import fs from "node:fs";
const index=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");
const enhancer=fs.readFileSync("v1.2-enhancements.js","utf8");
const bootstrap=fs.readFileSync("scripts/apply-v1.2.mjs","utf8");
const shell=sw.match(/const SHELL = ([^;]+);/)?.[1]||"";
const checks=[
["runtime dataset URL",index.includes('const DATA_URL="./kanji-data.json";')],
["2136 runtime guard",index.includes("Runtime kanji dataset must contain 2136 entries")],
["v1.2 enhancement script",index.includes('<script src="./v1.2-enhancements.js"></script>')],
["dataset cache version",index.includes('DATA_VERSION = "v1.2-dataset-2136"')],
["separate data cache",sw.includes('const DATA_CACHE = "kanji5-data-v5";')&&!shell.includes("kanji-data.json")],
["shell cache version",sw.includes('const CACHE = "kanji5-shell-v7";')],
["adaptive prompt",enhancer.includes("function choosePrompt(character)")],
["meaning/reading tracking",enhancer.includes('getStats(character, "meaning")')&&enhancer.includes('getStats(character, "reading")')],
["attempt recording",enhancer.includes("function recordAttempt(character, mode, correct)")],
["dataset cache invalidation",bootstrap.includes('kanji5-deck-version')&&bootstrap.includes('v1.2-dataset-2136')],
["no legacy 2000 end-message",!index.includes("دورهٔ ۲۰۰۰ کانجی تمام شد")],
["mobile study-first layout",index.includes('id="v1.2-mobile-fix"')&&index.includes('#studyPanel{order:1')],
["startup failure recovery",bootstrap.includes('v1.2-loading-watchdog')&&bootstrap.includes('id="v12Retry"')],
["example translations",bootstrap.includes('meanings=(e.meanings||[])')&&bootstrap.includes('class="example-meaning"')],
["individual reading audio",index.includes("reading-list")&&index.includes("data-speak=\"${r}\"")]
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?"PASS":"FAIL"}: ${name}`);
if(failed.length)throw new Error(`${failed.length} smoke test(s) failed`);
console.log(`All ${checks.length} v1.2 smoke tests passed.`);
