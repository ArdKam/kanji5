# Kanji 5 Architecture

## Scope

The educational intent and target pedagogy are defined in [`EDUCATIONAL-MODEL-2.0.md`](./EDUCATIONAL-MODEL-2.0.md). This document defines runtime ownership and dependency direction; it does not replace the educational specification.

This document is the living architecture reference for the current release line. It describes the React presentation over the v1.9 learning-engine boundaries.

## Runtime boundaries

The active browser runtime is intentionally split into narrow responsibilities:

- `index.html`: minimal application shell and runtime wiring.
- `react-entry.js`: production presentation bootstrap and React stylesheet loading.
- `frontend/src/app/App.tsx`: presentation components and interaction state.
- `frontend/src/app/engine.ts`: typed adapter over authoritative runtime boundaries.
- `review-runtime.js`: shared review/scheduling runtime; React consumes structured review snapshots/actions.
- `v1.4-education-core.js`: pure education rules, canonical grading, adaptive skill selection, and knowledge recording.
- `v1.5-education-ui.js`: headless education orchestration/bridge used by the React adapter; it does not own the production presentation.
- `v1.5-network.js`: data transport adapter for KanjiAPI and Tatoeba.
- `v1.5-state.js`: canonical persistence/state owner.
- `v1.6-session-core.js`, `v1.6-session-feedback.js`, `v1.6-session.js`: authoritative session planning and lifecycle.
- `v1.8-production-core.js`, `v1.8-vocabulary-core.js`, `v1.8-context-core.js`: deterministic grading for learner-facing recall modes.
- `v1.9-*-core.js`: pure outcome, learner-model, planner, recovery, evaluation, quality and integrity modules.
- `v1.9-v2-contract-core.js`: stable structured presentation contracts.
- `v1.9-v2-boundary.js`: browser orchestration boundary that translates authoritative runtime state into structured view models.
- `supabase-sync.js`: remote transport only.
- `sw.js`: offline shell/data/API caching and active runtime precaching.

The former v1/v2 DOM presentation files and compatibility stylesheet are no longer part of the production runtime.

## Dependency direction

The intended direction is:

`pure rules → orchestration → structured view-model boundary → React presentation`

with persistence and transport behind their adapters.

Pure cores must not depend on DOM, `window`, localStorage, sessionStorage, or network APIs. React consumes typed boundary data and dispatches typed actions; it does not implement scheduling, grading, learner modeling, recovery, or persistence semantics.

## Presentation contracts

`v1.9-v2-contract-core.js` defines stable contracts for session, exercise, feedback, learner-skill summary, session summary, and adaptive-reason view models.

`v1.9-v2-boundary.js` exposes `snapshot()`, `setExercise()`, `setFeedback()`, `setAdaptiveReason()`, and transient-state operations. The historical "v2" name is retained for the contract namespace; it is not a second presentation runtime.

## Session lifecycle

The active session boundary owns session identity, plan persistence, resume behavior, feedback consumption, and completion history. React consumes this state through the typed presentation adapter.

## Long-term skill profile

`v1.6-skill-profile.js` projects completed session history into independent Meaning, Reading, Production, Vocabulary, and Context skills. v1.9 augments those signals with the evidence-aware learner model while retaining FSRS as the authoritative scheduler.

## Adaptive recall

Adaptive planning treats recall attributes as independently learnable skills. Recovery can override the next attribute once for the bounded retry path; it never becomes a second scheduler.

## Educational integrity

Meaning, Reading, Production, Vocabulary, and Context grading remain deterministic and offline-capable. FSRS remains the authoritative card scheduler.

## Persistence

`v1.5-state.js` is the source of truth for application storage keys. Migration helpers transform persisted records without creating competing storage ownership.

## CI and release gates

`npm test` is the local entry point for active contract/unit tests. React-specific browser validation is performed by the React presentation workflow. Obsolete DOM-presentation compatibility suites are retired rather than treated as production gates.

A release should pass syntax validation, active contract/unit tests, React browser E2E, service-worker/runtime wiring, architecture boundaries, and release-contract checks.
