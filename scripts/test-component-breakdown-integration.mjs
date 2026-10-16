import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../frontend/src/app/App.tsx", import.meta.url), "utf8");
const dictionary = await readFile(new URL("../frontend/src/app/DictionaryKanjiCard.tsx", import.meta.url), "utf8");
const engine = await readFile(new URL("../frontend/src/app/engine.ts", import.meta.url), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(app.includes('import { KanjiStructurePreview } from "./KanjiStructurePreview";'), "Learning card must use the compact visual-structure preview");
assert(app.includes("getVisualStructureInfo(card.character)"), "Learning card must request the canonical visual structure");
assert(app.includes("VisualStructureInfo|null"), "Learning card must use the typed visual structure contract");
assert(app.includes("<KanjiStructurePreview"), "Learning card must show a preview rather than the full tree inline");
assert(app.includes("await ensureLearningCardEnhancementStyles()"), "Card-specific presentation styles must be ready before the reveal action changes the visible face");
assert(app.includes('import("./learning-card-enhancements.css?inline")'), "Card enhancement styles must remain lazily loaded to preserve startup performance");
const structurePreview = await readFile(new URL("../frontend/src/app/KanjiStructurePreview.tsx", import.meta.url), "utf8");
assert(!structurePreview.includes("learning-card-enhancements.css"), "The structure preview must not inject card styles after reveal");
assert(/No finer components recorded/.test(structurePreview), "Atomic preview must use a concise English empty state");
assert(/جزء دیداری ریزتری ثبت نشده/.test(structurePreview), "Atomic preview must use a concise Persian empty state");
assert(/className="kanji-structure-preview-empty"/.test(structurePreview), "Atomic preview must use its compact empty-state style");
assert(!/kanji-structure-preview-atomic.*character/.test(structurePreview), "Preview must not repeat the target kanji as a fake component");
const structureDialog = await readFile(new URL("../frontend/src/app/KanjiStructureDialog.tsx", import.meta.url), "utf8");
assert(structureDialog.includes("<ComponentBreakdown"), "Full visual structure must remain available in the detail dialog");
assert(structureDialog.includes("<TraditionalRadical"), "Traditional radical classification must remain distinct from visual components");
assert(app.includes("setVisualStructureInfo(null)"), "Visual structure must be cleared when the card changes or is empty");
assert(app.includes('if(!revealed||!card.character)'), "Structure requests must remain gated until the learning card is revealed");
assert(dictionary.includes("getVisualStructureInfo(item.character)"), "Dictionary must request the same visual structure source");
assert(dictionary.includes("<ComponentBreakdown"), "Dictionary must render the shared visual structure component");
assert(dictionary.includes("components={componentInfo.components}"), "Legacy learning dependencies must remain separate for the optional learning path");
assert(engine.includes("getVisualStructureInfo: (character: string) => Promise<VisualStructureInfo>"), "Typed engine boundary must expose visual structure access");

console.log("Kanji visual-structure integration contract passed for the Learning Card and Dictionary.");
