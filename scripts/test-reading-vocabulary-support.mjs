import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async path => readFile(new URL("../" + path, import.meta.url), "utf8");
const helper = await read("frontend/src/app/learning-copy.ts");
const app = await read("frontend/src/app/App.tsx");
const css = await read("frontend/src/app/learning-card-enhancements.css");
const e2e = await read("e2e/react-learning-card-flip.spec.mjs");

assert.match(helper, /export function selectExamplesForReading/);
assert.match(helper, /meaningLanguage\?: "en" \| "fa" \| "ja" \| "unknown"/);
assert.match(helper, /meaningLanguage: example\.meaningLanguage/);
assert.match(helper, /\[\.\.\.word\]\[0\] !== target/);
assert.match(helper, /normalizeKana\(pronunciation\)\.startsWith\(expected\)/);
assert.match(helper, /Math\.min\(2, limit\)/);
assert.match(app, /selectExamplesForReading\(activeCharacter,displayedOn\[0\],displayExamples,1\)/);
assert.match(app, /selectExamplesForReading\(activeCharacter,displayedKun\[0\],displayExamples,1\)/);
assert.match(app, /reading-vocabulary-example/);
assert.match(app, /type LearnerMeaningLanguage/);
assert.match(app, /meaningLanguage\?:LearnerMeaningLanguage/);
assert.match(css, /\.reading-vocabulary-examples/);
assert.match(css, /\.reading-vocabulary-example/);
assert.match(e2e, /a priority reading only shows a word with matching recorded pronunciation/);
assert.match(e2e, /日曜日/);
assert.match(e2e, /にちようび/);

console.log("Conservative priority-reading/vocabulary-linkage contracts passed.");
