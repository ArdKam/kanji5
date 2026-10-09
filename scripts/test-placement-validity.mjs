import assert from "node:assert/strict";
import fs from "node:fs";

const logic = fs.readFileSync("frontend/src/app/placement-logic.ts", "utf8");
const diagnostic = fs.readFileSync("frontend/src/app/PlacementDiagnostic.tsx", "utf8");
const entry = fs.readFileSync("frontend/src/app/OnboardingEntry.tsx", "utf8");
const flow = fs.readFileSync("frontend/src/app/onboarding/OnboardingFlow.tsx", "utf8");
const model = fs.readFileSync("frontend/src/app/onboarding/onboarding-model.ts", "utf8");
const integration = fs.readFileSync("scripts/test-onboarding-integration.mjs", "utf8");
const spec = fs.readFileSync("docs/ONBOARDING-SPEC.md", "utf8");

assert.ok(logic.includes("PLACEMENT_ITEMS_PER_LEVEL = ITEMS_PER_LEVEL"));
assert.ok(logic.includes("PLACEMENT_PASS_CORRECT = PASS_CORRECT"));
assert.ok(logic.includes("buildPlacementQuestionsCore"));
assert.ok(logic.includes("scorePlacementAnswersCore"));
assert.ok(diagnostic.includes("diagnosticSeed") && diagnostic.includes("setDiagnosticSeed"));
assert.ok(entry.includes("initialProgress?.placementSeed"));
assert.ok(entry.includes("buildPlacementQuestions") && entry.includes("placementSeed"));
assert.ok(entry.includes("scorePlacementAnswers(placementRecords, map)"));
assert.ok(entry.includes("setPlacementRecords([])"));
assert.ok(flow.includes("placementSummary") && flow.includes("placementSeed"));
assert.ok(flow.includes("onPlacementRestart?."));
assert.ok(model.includes("placementSeed: number"));
assert.ok(model.includes("placementSummary: PlacementSummary | null"));
assert.ok(model.includes("sanitizePlacementSummary"));
assert.ok(integration.includes("scorePlacementAnswers"));
assert.ok(spec.includes("20 scored items") || spec.includes("20 items total"));
assert.ok(spec.includes("four unique English meaning options"));

console.log("Placement validity and onboarding integration contract: PASS");
