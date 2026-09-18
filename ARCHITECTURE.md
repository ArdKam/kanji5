# Kanji 5 Architecture

## Scope

This document is the living architecture reference for the current release line. It describes the active v2 presentation over the v1.9 learning-engine boundaries. Release-specific history belongs in `CHANGELOG.md` and the roadmap, not in this file.

## Runtime boundaries

The active browser runtime is intentionally split into narrow responsibilities:

- `index.html`: application shell, markup, route bootstrap, and runtime wiring.
- `review-runtime.js`: shared review/scheduling runtime; v2 consumes its structured review snapshot/actions, while legacy DOM rendering remains compatibility-only.
- `legacy.css`: legacy presentation styles loaded only for `?legacy=1`.
- `v1.4-education-core.js`: pure education rules, canonical grading, adaptive skill selection, and knowledge recording.
- `v1.5-education-ui.js`: education rendering and interaction. It owns no browser storage or remote API endpoints.
- `v1.5-network.js`: data transport adapter for KanjiAPI and Tatoeba; browser caching/coalescing remains in the service worker.
- `v1.5-recall-core.js`: pure Active Recall/component-learning primitives; no DOM, `window`, or `localStorage` access.
- `v1.5-p0.js`: Active Recall UI/orchestration overlay; delegates pure calculations to recall core.
- `v1.5-state.js`: persistence, recovery/reconciliation, education settings, component storage, and session history. It is the canonical owner of storage-key constants consumed by compatibility code.
- `v1.5-education-sync-core.js`, `v1.5-fsrs-sync-core.js`, `v1.5-sync-core.js`: deterministic sync/merge/replay primitives.
- `v1.6-session-core.js`: pure session planning.
- `v1.6-session-feedback.js`: authoritative session feedback boundary.
- `v1.6-session.js`: session lifecycle, resume state, plan consumption, and orchestration; the legacy dashboard renderer is suppressed on the v2 route, but the authoritative session API remains available.
- `v1.6-session-analytics.js`: session aggregation and trend/summary primitives.
- `v1.6-skill-profile.js`: long-term skill projection from completed session history.
- `v1.6-sync-core.js`: deterministic v1.6 merge/replay primitives.
- `v1.7-adaptive-recall-core.js`: pure adaptive attribute-recall planning.
- `v1.7-evaluation-core.js`, `v1.7-baseline-evaluation-core.js`, `v1.7-tuning-core.js`: pure evaluation, baseline comparison, and tuning primitives.
- `v1.8-production-core.js`, `v1.8-vocabulary-core.js`, `v1.8-context-core.js`: pure deterministic grading for the learner-facing recall modes.
- `v1.9-outcome-core.js`: versioned shared educational outcome contract.
- `v1.9-learner-model-core.js`: pure evidence-aware learner model calculations.
- `v1.9-adaptive-planner-core.js`: pure adaptive planner.
- `v1.9-recovery-core.js`: pure recovery state machine.
- `v1.9-learning-evaluation-core.js`: pure evaluation/baseline metrics.
- `v1.9-data-quality-core.js`: pure content validation, deduplication, deterministic selection, and fallback helpers.
- `v1.9-data-integrity-core.js`: pure deterministic migration helpers for persisted learner/session records.
- `v1.9-v2-contract-core.js`: pure contracts for the future presentation layer: session, exercise, feedback, learner summary, session summary, and adaptive-reason view models.
- `v1.9-v2-boundary.js`: browser orchestration boundary that reads authoritative runtime state and emits only structured v2 view-model data, including daily summary, daily goal, upcoming reviews, stats, and settings. It does not render DOM or expose storage primitives.
- `v2-presentation.js`, `v2-presentation.css`: default presentation layer consuming only the v1.9 view-model boundary; the legacy presentation is compatibility-only behind `?legacy=1`.
- `supabase-sync.js`: remote transport, locking, retries, and optimistic concurrency. It does not define planning semantics.
- `sw.js`: offline shell/data/API caching, request coalescing, and precaching of active runtime dependencies.

## Dependency direction

The intended direction is:

`pure rules → orchestration → structured view-model boundary → presentation`

with persistence and transport kept behind their adapters:

`orchestration → v1.5-state / sync adapters → remote transport`

Pure cores must not depend on DOM, `window`, localStorage, sessionStorage, or network APIs. UI/orchestration consumes pure modules and routes durable state through `v1.5-state.js`. Supabase owns transport only.

The v2 presentation layer must depend on `v1.9-v2-contract-core.js`-shaped data, not on persistence details or internal planner/learner-model objects. Stats, settings, daily-goal, and upcoming-review surfaces are boundary-owned; v2 must not scrape the legacy DOM. `v1.9-v2-boundary.js` is the adapter that translates those internal runtime snapshots into stable view models.

Compatibility shims are migration boundaries, not permanent homes for business logic. A shim may remain only while an active consumer depends on it; once migration is verified by tests and runtime wiring, it should be retired.

## V2 presentation contracts

`v1.9-v2-contract-core.js` defines `V2_BOUNDARY_VERSION=1.9.0-v2-boundary-contract` and the following stable contracts:

- `session`: identity, lifecycle status, remaining skill budget, mode-result summaries, resume state, and plan revision.
- `exercise`: selected skill, prompt, Kanji target, content identity/version, and provenance.
- `feedback`: outcome, correctness, score/quality, grader version, recovery state, and retry count.
- `learner-skill-summary`: independent five-skill state, recent accuracy, confidence, momentum, and repeated-failure signal.
- `session-summary`: aggregate attempt/correct/accuracy and completion status.
- `adaptive-reason`: selected skill, planner action, bounded reason strings, and score.

These contracts deliberately avoid DOM nodes, storage keys, network response objects, CSS assumptions, and internal planner data structures. They are data contracts, not visual designs.

The runtime boundary exposes `snapshot()`, `setExercise()`, `setFeedback()`, `setAdaptiveReason()`, and `clearTransient()`, and emits `kanji5:v1.9-v2-view-models` whenever view-model state changes. This gives v2 a stable integration point without importing the current visual layer.

## Session lifecycle

The active session boundary owns session identity, plan persistence, resume behavior, feedback consumption, and completion history. The lifecycle is:

1. Load the persisted active session, if present.
2. Otherwise build a deterministic adaptive plan from knowledge and the long-term skill profile.
3. Persist the session identity, plan snapshot, and remaining work before user-facing work begins.
4. Request the next planned mode from the authoritative feedback boundary.
5. Consume a planned mode only after the associated educational content resolves successfully.
6. Record the mode outcome as session-scoped feedback.
7. Rebalance only remaining work from fresh feedback; completed work is not rewritten.
8. On completion, append an immutable session-history record.
9. On reload, resume the active session rather than starting a competing session.

## Long-term skill profile

`v1.6-skill-profile.js` projects completed session history into independent Meaning, Reading, Production, Vocabulary, and Context skills. v1.9 augments those signals with the evidence-aware learner model while retaining FSRS as the authoritative card scheduler.

## Adaptive recall

Adaptive planning treats recall attributes as independently learnable skills. The planner receives deterministic learner evidence and supported attributes and chooses among the existing five skills. Recovery can override the next attribute once for the bounded retry path; it never becomes a second scheduler.

## Educational integrity

Meaning, Reading, Production, Vocabulary, and Context grading remain deterministic and offline-capable. v1.9 standardizes their recorded outcome shape without making the shared outcome contract a replacement for mode-specific grading rules.

## Persistence and storage keys

`v1.5-state.js` is the source of truth for application storage keys. v1.9 migration helpers may transform persisted records but do not create competing storage-key ownership. Learner evidence remains bounded per Kanji and receives explicit schema/default migrations.

## Data build

Runtime consumes the derived `kanji-data.json`. The large upstream Jōyō source is not committed to this application repository. `scripts/build-kanji-data.mjs` fetches the pinned upstream Jōyō dataset from the documented source and deterministically derives the runtime dataset. Source provenance and license information must remain documented alongside the build script.

## CI and release gates

`npm test` is the single local entry point for every `scripts/test-*.mjs` contract/unit test. CI may add targeted subsets and browser E2E tests, but it must not require contributors to reconstruct the test list from workflow YAML.

Architecture tests enforce browser-free pure cores and validate that the v2 boundary is presentation-agnostic. Browser smoke tests verify the boundary can be loaded and consumed without exposing persistence internals.

A release should pass:

1. JavaScript syntax validation for active runtime and test modules.
2. All contract/unit tests through `npm test`.
3. Browser E2E coverage for the active release features and compatibility regressions.
4. Service-worker/runtime wiring checks.
5. Architecture/dependency boundary checks.
6. Release-contract checks for package version, documentation, and required runtime files.
7. A clean working tree after validation; CI must not generate or commit application changes.

These contracts make the architecture executable rather than aspirational.

## V2 release mode

The default browser route is the v2 presentation. The shared review runtime remains available to provide authoritative scheduling/actions, but its legacy renderer is route-gated. `legacy.css`, the legacy storage bridge, and the legacy session dashboard are compatibility-only on `?legacy=1`.

`?legacy=1` is retained only as an explicit compatibility/test path for regression and migration verification. It is not the production default and must not be used by the v2 presentation.

A v2 release must pass the full existing learning-engine regression suite plus the v2 presentation, accessibility, visual, default-route, offline, and architecture gates. The v1.9 engine remains authoritative for grading, adaptive planning, recovery, persistence, and FSRS scheduling.
