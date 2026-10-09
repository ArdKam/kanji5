# Rinemi First-Run Onboarding

Status: assessment v2 implemented in the placement blueprint candidate; final CI, merge, and live verification remain separate acceptance steps.

## Product contract

Rinemi's first-open experience is a dedicated full-page entry journey rather than a card inside Learning. It explains the learning loop, establishes a Kanji starting point, optionally runs a short placement diagnostic, sets the new-Kanji daily rhythm, and ends with an optional account choice.

The flow is guest-first. Account creation and sign-in reuse the existing account surface; onboarding does not create a second authentication system.

The diagnostic is a **Kanji starting-point estimate**, not a JLPT examination and not a measure of overall Japanese proficiency. It currently evaluates English-gloss recognition of isolated Kanji only.

## Flow

1. Welcome
2. How Rinemi works
3. Starting point
4. Optional Kanji placement
5. Placement result and per-band profile
6. Daily rhythm
7. Account / guest

The mobile interaction supports horizontal swipe between steps while retaining explicit controls. Progress is visible throughout.

## State boundaries

OnboardingFlow owns transient UI state only. It does not read learner state, schedule cards, grade answers, or write browser storage directly.

OnboardingEntry calls the canonical engine APIs for updateSettings, startLearningExperience, startCustomStudy, and clearTransient.

The engine remains authoritative for FSRS, learner model, adaptive planning, grading, and learning-state persistence.

Resumable onboarding state is kept behind onboarding-persistence.ts. The assessment seed and answer IDs are persisted with progress so a reload reconstructs the same questionnaire and does not silently attach old answers to a new randomized sample.

## Placement assessment v2

The shared implementation lives in `placement-assessment-core.js` and is consumed by both `placement-logic.ts` / onboarding and the existing Placement Diagnostic.

- 20 scored items: five each from N5, N4, N3, and N2 Kanji pools.
- Within each band, items are sampled across five frequency-order strata; each retake can select a new item from each stratum.
- Only items tagged to supported bands are counted toward level scores. Missing items are not replaced with unrelated levels.
- Each item provides four unique English meaning options and exactly one correct key.
- The answer key uses the shared learner-priority meaning layer rather than blindly scoring the first raw dictionary gloss.
- Strongly overlapping alternative glosses for the target are excluded from distractors.
- Item sampling and answer-position shuffling use a persisted seed, allowing exact resume after reload and different item samples on retake.
- A band is provisionally demonstrated at 4/5 (80%).
- The recommendation is contiguous from N5 upward: a strong N2 result cannot jump over an un-demonstrated N4 or N5 band.
- Per-band scores and confidence warnings appear in the onboarding result.
- Complete results are still provisional. Scores of 3/5 or 4/5 mark a boundary case; incomplete item/band coverage or unanswered items mark the result limited.
- Passing every band through N2 explicitly states that N1 is outside the assessment range.

The item count and cutoff are conservative implementation heuristics, not validated psychometric standards. The diagnostic only measures recognition of English glosses for isolated Kanji; it does not evaluate reading recall, vocabulary production, sentence comprehension, handwriting, listening, or grammar.

## Completion

Completing onboarding applies the selected dailyNew value through the engine, clears a transient custom-study context, starts a normal or starting-range study session through the engine, completes the account-or-guest hand-off, marks onboarding complete, removes the resumable onboarding record, and returns to the existing application shell.

Skipping onboarding does not partially apply placement or rhythm choices.

A legacy `kanji5-public-onboarding-v1=seen` value is recognized as completed so existing users are not forced through the new journey.

## Verification and open acceptance

Required verification includes the 20-item sampling and scoring contracts, reload/resume preserving seed and answer mapping, new-sample retakes, representative onboarding E2E, keyboard/mobile/accessibility behavior, existing React regression suites, and production/live smoke after deployment.

Before Public Beta, independently review a frozen sample of production question sets and gather representative repeated-attempt data to estimate recommendation stability and response-position bias. Passing code tests alone does not establish placement validity.
