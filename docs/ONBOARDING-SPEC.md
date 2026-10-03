# Kanji5 First-Run Onboarding

Status: implemented on branch; pending CI and merge verification.

## Product contract

Kanji5's first-open experience is a dedicated full-page entry journey rather than a card inside Learning. It explains the learning loop, establishes a kanji starting point, optionally checks kanji knowledge, sets the new-kanji daily rhythm, and ends with an optional account choice.

The flow is intentionally guest-first. Account creation and sign-in reuse the existing account surface; onboarding does not create a second authentication system.

Placement is a kanji-knowledge check only. It must not be described as an assessment of overall Japanese proficiency.

## Flow

1. Welcome
2. How Kanji5 works
3. Starting point
4. Optional kanji placement
5. Placement result
6. Daily rhythm
7. Account / guest

The mobile interaction supports horizontal swipe between steps while retaining explicit buttons. Progress is visible throughout.

## State boundaries

OnboardingFlow is a presentation component. It owns only transient UI state and never reads learner state, schedules cards, grades answers, or writes browser storage directly.

OnboardingEntry is the host/orchestration layer. It calls the canonical engine APIs for updateSettings, startLearningExperience, startCustomStudy, and clearTransient.

The engine remains authoritative for FSRS, learner model, adaptive planning, grading, and learning-state persistence.

Resumable onboarding state is kept behind onboarding-persistence.ts using kanji5-onboarding-progress-v2 and kanji5-onboarding-v2. This adapter is deliberately separate so the persistence mechanism can change later without changing the presentation component.

## Placement boundary

placement-logic.ts contains the shared deterministic question construction and scoring threshold used by the new entry flow. The existing PlacementDiagnostic consumes the same question builder, so the application does not carry two independent placement algorithms.

The current scoring contract is three selected kanji per level for N5 through N2 when available, maximum twelve questions, first meaning as the correct answer, and a suggested level checked N2 to N5 with at least two answered questions and at least 67% accuracy.

This is a starting heuristic, not a claim about general Japanese ability.

## Completion

Completing onboarding applies the selected dailyNew value through the engine, clears a transient custom-study context, starts a normal or starting-range study session through the engine, completes the account-or-guest hand-off, marks onboarding complete, removes the resumable onboarding record, and returns to the existing application shell.

Skipping onboarding does not partially apply placement or rhythm choices.

A legacy kanji5-public-onboarding-v1=seen value is recognized as completed so existing users are not forced through the new journey.

## Startup

The existing runtime startup is allowed to prepare in the background while the full-page onboarding surface is shown. The main application chrome is not rendered behind onboarding.

## Verification

Required acceptance coverage includes the dedicated first-open entry surface, beginner guest completion, optional placement path and result, resumable progress after reload, optional account hand-off, legacy completion compatibility, mobile/accessibility behavior, existing React regression suites, and production/live smoke after deployment.
