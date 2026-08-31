import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const INDEX = "index.html";
const ENHANCEMENTS = "v1.2-enhancements.js";
const RUNTIME = "v1.2-runtime-fixes.js";
const SW = "sw.js";
const VENDOR_DIR = "vendor";
const VENDOR = `${VENDOR_DIR}/ts-fsrs.js`;
const FSRS_PACKAGE = "ts-fsrs@6.0.0-beta.7";

async function read(path) { return fs.readFile(path, "utf8"); }
async function write(path, content) { await fs.writeFile(path, content, "utf8"); }

const index = await read(INDEX);
const enhancements = await read(ENHANCEMENTS);
let runtime = await read(RUNTIME);
let sw = await read(SW);

await fs.mkdir(VENDOR_DIR, { recursive: true });
const vendorDir = ".runtime-vendor";
await fs.rm(vendorDir, { recursive: true, force: true });
await fs.mkdir(vendorDir, { recursive: true });

console.log(`Installing ${FSRS_PACKAGE} from npm registry...`);
await exec("npm", ["install", "--no-save", "--ignore-scripts", `--prefix=${vendorDir}`, FSRS_PACKAGE], {
  env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false" }
});

const packageRoot = `${vendorDir}/node_modules/ts-fsrs`;
const packageJson = JSON.parse(await read(`${packageRoot}/package.json`));
const moduleEntry = packageJson.module || packageJson.exports?.["."]?.import || "dist/index.mjs";
const entry = moduleEntry.startsWith("./") ? moduleEntry.slice(2) : moduleEntry;
const sourcePath = `${packageRoot}/${entry}`;
const fsrsSource = await read(sourcePath);

const distDir = `${packageRoot}/dist`;
const distEntries = await fs.readdir(distDir, { withFileTypes: true });
await fs.rm(VENDOR_DIR, { recursive: true, force: true });
await fs.mkdir(VENDOR_DIR, { recursive: true });
for (const entry of distEntries) {
  if (!entry.isFile()) continue;
  await fs.copyFile(`${distDir}/${entry.name}`, `${VENDOR_DIR}/${entry.name}`);
}
await write(VENDOR, fsrsSource);

let nextIndex = index;
const externalImport = 'import { createEmptyCard, fsrs, Rating } from "https://esm.sh/ts-fsrs@6.0.0-beta.7";';
const localImport = 'import { createEmptyCard, fsrs, Rating } from "./vendor/ts-fsrs.js";';
if (nextIndex.includes(externalImport)) nextIndex = nextIndex.replace(externalImport, localImport);

const duplicateBootstrap = /<script>\n\(\(\) => \{\n  const DATA_VERSION = "v1\.2-dataset-2136";\n  const DECK_KEY = "kanji5-deck";\n  const VERSION_KEY = "kanji5-deck-version";\n  try \{\n    if \(localStorage\.getItem\(VERSION_KEY\) !== DATA_VERSION\) \{\n      localStorage\.removeItem\(DECK_KEY\);\n      localStorage\.setItem\(VERSION_KEY, DATA_VERSION\);\n    \}\n  \} catch \(_\) \{\}\n\}\)\(\);\n<\/script><script id="v1\.2-dataset-bootstrap">/;
if (duplicateBootstrap.test(nextIndex)) nextIndex = nextIndex.replace(duplicateBootstrap, '<script id="v1.2-dataset-bootstrap">');

const oldUpdateStats = /function updateStats\(\)\{[\s\S]*?\n\}\nfunction resetAll/;
const newUpdateStats = [
  "function updateStats(){",
  "  let due=0, mastered=0, studied=0;",
  "  const now=Date.now();",
  "  for(const k of state.deck){",
  "    const c=state.cards[k.id]?.card;",
  "    if(!c) continue;",
  "    studied++;",
  "    if(c.due && new Date(c.due).getTime()<=now) due++;",
  "    if(c.state===2&&(c.scheduled_days||0)>=21) mastered++;",
  "  }",
  "  $(\"dueCount\").textContent=due;",
  "  $(\"newCount\").textContent=Math.min(state.todayNew,state.settings.dailyNew);",
  "  $(\"masteredCount\").textContent=mastered;",
  "  $(\"bar\").style.width=(state.deck.length?Math.round(studied/state.deck.length*100):0)+\"%\";",
  "  $(\"streakCount\").textContent=(state.streak.current||0)+\"🔥\";",
  "  const goalDone=Math.min(state.todayReviewCount||0,state.settings.dailyGoal);",
  "  $(\"goalLabel\").textContent=\"هدف روزانه: \"+(state.todayReviewCount||0)+\"/\"+state.settings.dailyGoal;",
  "  $(\"goalBar\").style.width=Math.round(goalDone/state.settings.dailyGoal*100)+\"%\";",
  "  $(\"goalDone\").style.display=(state.todayReviewCount||0)>=state.settings.dailyGoal?\"inline\":\"none\";",
  "}",
  "function resetAll"
].join("\n");
if (!oldUpdateStats.test(nextIndex)) throw new Error("Could not locate updateStats() for optimization");
nextIndex = nextIndex.replace(oldUpdateStats, newUpdateStats);
if (nextIndex === index) throw new Error("index.html was not changed");
await write(INDEX, nextIndex);

let nextEnhancements = enhancements;
const oldKnowledge = `  function loadKnowledge() {\n    try {\n      const raw = localStorage.getItem(KNOWLEDGE_KEY);\n      const value = raw ? JSON.parse(raw) : {};\n      return value && typeof value === "object" ? value : {};\n    } catch (_) { return {}; }\n  }\n\n  function saveKnowledge(value) {\n    try { localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(value)); } catch (_) {}\n  }`;
const newKnowledge = `  let knowledgeCache = null;\n\n  function loadKnowledge() {\n    if (knowledgeCache !== null) return knowledgeCache;\n    try {\n      const raw = localStorage.getItem(KNOWLEDGE_KEY);\n      const value = raw ? JSON.parse(raw) : {};\n      knowledgeCache = value && typeof value === "object" ? value : {};\n    } catch (_) {\n      knowledgeCache = {};\n    }\n    return knowledgeCache;\n  }\n\n  function saveKnowledge(value) {\n    knowledgeCache = value;\n    try { localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(value)); } catch (_) {}\n  }`;
if (!nextEnhancements.includes(oldKnowledge)) throw new Error("Could not locate loadKnowledge/saveKnowledge block");
nextEnhancements = nextEnhancements.replace(oldKnowledge, newKnowledge);
await write(ENHANCEMENTS, nextEnhancements);

const oldObserver = `  const observer = new MutationObserver(() => {\n    if (document.querySelector(EXAMPLE_SELECTOR)) scheduleExamples();\n  });\n  observer.observe(document.body, { childList: true, subtree: true });`;
const newObserver = `  const observer = new MutationObserver(() => {\n    if (document.querySelector(EXAMPLE_SELECTOR)) scheduleExamples();\n  });\n\n  function observeStudy() {\n    const study = document.getElementById("study");\n    if (study) observer.observe(study, { childList: true, subtree: true });\n  }\n  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observeStudy, { once: true });\n  else observeStudy();`;
if (runtime.includes(oldObserver)) runtime = runtime.replace(oldObserver, newObserver);
runtime = runtime.replace(/retryCount < 4/g, "retryCount < 1");
await write(RUNTIME, runtime);

if (!sw.includes("./vendor/ts-fsrs.js")) {
  sw = sw.replace('"./supabase-sync.js"]', '"./supabase-sync.js", "./vendor/ts-fsrs.js"]');
}
sw = sw.replace(
  'event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));',
  'event.waitUntil(caches.open(CACHE).then(async cache => { await Promise.allSettled(SHELL.map(url => cache.add(url))); }).then(() => self.skipWaiting()));'
);
await write(SW, sw);
await fs.rm(vendorDir, { recursive: true, force: true });

console.log("Optimized v1.2 runtime successfully.");
