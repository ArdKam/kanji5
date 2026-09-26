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
assert.match(dictionary,/HandwritingPractice/,"Dictionary must retain handwriting utility integration.");
assert.doesNotMatch(dictionary,/gradeHandwriting|handwriting-grader/,"DictionaryPage must not own handwriting grading logic.");

console.log("Handwriting architecture boundary contract passed.");
