import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../frontend/src/app/stroke-order-core.ts", import.meta.url), "utf8");
const executable = source
  .replace(/^export type StrokePath = .*$/m, "")
  .replace(/^export /gm, "");
const core = new Function(executable + "\nreturn { STROKE_ORDER_VERSION, KANJIVG_BASE_URL, normalizeStrokeOrderCharacter, kanjiSvgUrl, parseStrokePaths };")();

if (core.STROKE_ORDER_VERSION !== "1.0.0") throw new Error("Unexpected stroke-order core version");
if (core.normalizeStrokeOrderCharacter(" 学 extra ") !== "学") throw new Error("Character normalization failed");
if (!core.kanjiSvgUrl("学").endsWith("/05b66.svg")) throw new Error("KanjiVG codepoint URL failed");
if (!core.kanjiSvgUrl("学").includes("/422b5538595676da918c288a4230cb5e22a1ee7e/")) throw new Error("KanjiVG source is not pinned");

const svg = `
<svg><g id="kvg:StrokePaths_05b66">
  <path id="kvg:05b66-s2" kvg:type="㇔" d="M2,2c1,1,2,2,3,3"/>
  <path id="kvg:05b66-s1" kvg:type="㇔" d="M1,1c1,1,2,2,3,3"/>
  <path id="kvg:05b66-s4" kvg:type="㇔" d="M4,4c1,1,2,2,3,3"/>
  <path id="kvg:05b66-s3" kvg:type="㇒" d="M3,3c1,1,2,2,3,3"/>
</g></svg>`;
const paths = core.parseStrokePaths(svg);
if (JSON.stringify(paths.map(row => row.strokeNumber)) !== JSON.stringify([1,2,3,4])) {
  throw new Error(`Stroke order parsing failed: ${JSON.stringify(paths)}`);
}
if (paths.some(row => !row.d)) throw new Error("Stroke path data missing");

const sw = await readFile(new URL("../sw.js", import.meta.url), "utf8");
if (!sw.includes("KANJIVG_ORIGIN") || !sw.includes("KANJIVG_PATH")) throw new Error("KanjiVG service-worker route missing");
if (!sw.includes("422b5538595676da918c288a4230cb5e22a1ee7e")) throw new Error("Service worker does not use the pinned KanjiVG source");
const notices = await readFile(new URL("../THIRD_PARTY_NOTICES.md", import.meta.url), "utf8");
if (!notices.includes("KanjiVG") || !notices.includes("CC BY-SA 3.0")) throw new Error("KanjiVG attribution notice missing");

console.log("Stroke-order core, asset URL, parsing, offline route, and attribution contracts passed.");
