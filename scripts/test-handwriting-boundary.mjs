import assert from "node:assert/strict";
import fs from "node:fs";

const files=[
  "frontend/src/app/HandwritingPractice.tsx",
  "frontend/src/app/handwriting-grader.js",
  "frontend/src/app/handwriting-reference.ts",
];

for(const file of files){
  const source=fs.readFileSync(file,"utf8");
  assert.doesNotMatch(source,/from\s+["'][^"']*(?:engine|v1\.9)[^"']*["']/i,`Handwriting must not import learning engine directly: ${file}`);
  assert.doesNotMatch(source,/__KANJI5_V19|FSRS|learnerModel|adaptivePlanner|recovery/i,`Handwriting must remain outside v1.9 internals: ${file}`);
}

const dictionary=fs.readFileSync("frontend/src/app/DictionaryPage.tsx","utf8");
const dictionaryCard=fs.readFileSync("frontend/src/app/DictionaryKanjiCard.tsx","utf8");
assert.match(dictionary,/DictionaryKanjiCard/,"Dictionary must retain the handwriting-capable card integration.");
assert.doesNotMatch(dictionary,/gradeHandwriting|handwriting-grader/,"DictionaryPage must not own handwriting grading logic.");
assert.match(dictionaryCard,/HandwritingPractice/,"Dictionary card must retain handwriting practice integration.");
assert.match(dictionaryCard,/getHandwritingSkill/,"Dictionary card must resolve handwriting learner skill through the presentation adapter.");
assert.match(dictionaryCard,/recordHandwritingGrade/,"Dictionary card must record handwriting grading through the presentation adapter.");

console.log("Handwriting architecture boundary contract passed.");
