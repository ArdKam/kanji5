import fs from "node:fs/promises";

const FILE = "index.html";
const TAG = '<script src="./v1.2-enhancements.js"></script>';
const BOOTSTRAP = `<script>
(() => {
  const DATA_VERSION = "v1.2-dataset-2136";
  const DECK_KEY = "kanji5-deck";
  const VERSION_KEY = "kanji5-deck-version";
  try {
    if (localStorage.getItem(VERSION_KEY) !== DATA_VERSION) {
      localStorage.removeItem(DECK_KEY);
      localStorage.setItem(VERSION_KEY, DATA_VERSION);
    }
  } catch (_) {}
})();
</script>`;

let html = await fs.readFile(FILE, "utf8");

if (!html.includes(TAG)) {
  const marker = "</body>";
  if (!html.includes(marker)) throw new Error(`Could not find ${marker} in ${FILE}`);
  html = html.replace(marker, `${TAG}${marker}`);
}

const BOOTSTRAP_PATTERN = /<script>\s*\(\(\) => \{\s*const DATA_VERSION = "v1\.2-dataset-2136";[\s\S]*?<\/script>/;
if (!BOOTSTRAP_PATTERN.test(html)) {
  const moduleMarker = '<script type="module">';
  if (!html.includes(moduleMarker)) throw new Error(`Could not find ${moduleMarker} in ${FILE}`);
  html = html.replace(moduleMarker, `${BOOTSTRAP}${moduleMarker}`);
}

await fs.writeFile(FILE, html, "utf8");
console.log(`Applied v1.2 educational build to ${FILE}.`);
