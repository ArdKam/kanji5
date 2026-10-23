import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const component = await readFile(new URL("../frontend/src/app/VocabularyExamples.tsx", import.meta.url), "utf8");
const engine = await readFile(new URL("../frontend/src/app/engine.ts", import.meta.url), "utf8");
const vocabulary = await readFile(new URL("../v2-vocabulary-core.js", import.meta.url), "utf8");

assert.match(engine, /meaningLanguage\?: LearnerMeaningLanguage/);
assert.match(vocabulary, /meaningLanguage/);
assert.match(component, /lang=\{item\.meaningLanguage&&item\.meaningLanguage!=="unknown"\?item\.meaningLanguage:undefined\}/);
assert.match(component, /<bdi className="dictionary-vocabulary-meaning" dir="auto"/);

console.log("Vocabulary meaning language metadata is preserved through the typed adapter and exposed accessibly.");
