import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../frontend/src/app/App.tsx", import.meta.url), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(source.includes('import { ComponentBreakdown } from "./ComponentBreakdown";'), "Learning card must import ComponentBreakdown");
assert(source.includes('getComponentInfo(card.character)'), "Learning card must load component data for the revealed character");
assert(source.includes("ComponentInfo|null"), "Component data state must use the typed ComponentInfo contract");
assert(source.includes("<ComponentBreakdown info={componentInfo}"), "Learning card must render ComponentBreakdown when data is available");
assert(source.includes('if(!revealed||!card.character)'), "Component data must not be requested before reveal or without a character");
assert(source.includes("setComponentInfo(null)"), "Component data must be cleared when the card changes or is unrevealed");

console.log("Kanji component breakdown integration contract passed.");
