import assert from "node:assert/strict";
import fs from "node:fs";

const logic = fs.readFileSync("frontend/src/app/placement-logic.ts", "utf8");
const diagnostic = fs.readFileSync("frontend/src/app/PlacementDiagnostic.tsx", "utf8");
const entry = fs.readFileSync("frontend/src/app/OnboardingEntry.tsx", "utf8");
const flow = fs.readFileSync("frontend/src/app/onboarding/OnboardingFlow.tsx", "utf8");
const integration = fs.readFileSync("scripts/test-onboarding-integration.mjs", "utf8");

assert.match(logic, /PLACEMENT_ITEMS_PER_LEVEL = 4/);
assert.match(logic, /BLUEPRINT_QUANTILES = \[0\.05, 0\.35, 0\.65, 0\.95\]/);
assert.match(logic, /shuffleWithSeed/);
assert.match(logic, /correct: label === correct/);
assert.match(logic, /total >= 3/);
assert.match(logic, />= 0\.75/);
assert.doesNotMatch(logic, /const labels = \[correct, \...distractors\]/);
assert.match(diagnostic, /diagnosticSeed/);
assert.match(diagnostic, /setDiagnosticSeed/);
assert.match(entry, /placementSeed/);
assert.match(entry, /buildPlacementQuestions\([sS]*placementSeed/);
assert.match(entry, /onPlacementRestart/);
assert.match(flow, /onPlacementRestart\?\./);
assert.ok(integration.includes("buildPlacementQuestions"));

console.log("Kanji 5 placement-validity contract passed.");
