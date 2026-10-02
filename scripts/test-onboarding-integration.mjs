import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const flow = read("frontend/src/app/onboarding/OnboardingFlow.tsx");
const model = read("frontend/src/app/onboarding/onboarding-model.ts");
const persistence = read("frontend/src/app/onboarding/onboarding-persistence.ts");
const host = read("frontend/src/app/OnboardingEntry.tsx");
const placement = read("frontend/src/app/placement-logic.ts");
const diagnostic = read("frontend/src/app/PlacementDiagnostic.tsx");
const app = read("frontend/src/app/App.tsx");
const account = read("frontend/src/app/AccountDialog.tsx");

for (const step of ["welcome","learning-loop","starting-point","placement","placement-result","daily-rhythm","account"]) {
  assert.ok(model.includes('"' + step + '"'), "missing onboarding step: " + step);
}
assert.ok(model.includes("sanitizeOnboardingProgress"));
assert.ok(model.includes("normalizeDailyNew"));
assert.ok(persistence.includes("kanji5-onboarding-progress-v2"));
assert.ok(persistence.includes("kanji5-onboarding-v2"));
assert.ok(!flow.includes("localStorage") && !flow.includes("sessionStorage"));
assert.ok(!flow.includes("from '../engine'") && !flow.includes('from "../engine"'));
assert.ok(flow.includes("onPointerDown") && flow.includes("onPointerUp"));
assert.ok(flow.includes("onboardingContinueGuest"));
assert.ok(flow.includes("onCreateAccount"));
assert.ok(host.includes("buildPlacementQuestions"));
assert.ok(host.includes("scorePlacementAnswers"));
assert.ok(host.includes("updateSettings"));
assert.ok(host.includes("startCustomStudy"));
assert.ok(host.includes("completeOnboarding"));
assert.ok(placement.includes("scorePlacementAnswers"));
assert.ok(diagnostic.includes("buildPlacementQuestions"));
assert.ok(app.includes("OnboardingEntry"));
assert.ok(!app.includes("PublicOnboarding"));
assert.ok(account.includes("onAuthenticated"));
assert.ok(account.includes("initialEmailIntent"));
console.log("Onboarding integration contract: PASS");
