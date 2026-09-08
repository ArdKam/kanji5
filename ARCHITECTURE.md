# Kanji 5 Architecture

## Scope

This document is the living architecture reference for the current release line. It describes the active v1.7 runtime and the boundaries that new work must preserve. Release-specific history belongs in `CHANGELOG.md` and the roadmap, not in this file.

## Runtime boundaries

The active browser runtime is intentionally split into narrow responsibilities:

- `index.html`: application shell, markup, startup wiring, and canonical application module.
- `v1.4-education-core.js`: pure education rules, canonical grading, adaptive skill selection, and knowledge recording.
- `v1.4-education-ui.js`: compatibility shim only; active education UI lives in `v1.5-education-ui.js`.
- `v1.5-education-ui.js`: education rendering and interaction. It owns no browser storage or remote API endpoints.
- `v1.5-education-ui.css`: education-specific presentation.
- `v1.5-network.js`: data transport adapter for KanjiAPI and Tatoeba; browser caching/coalescing remains in the service worker.
- `v1.5-recall-core.js`: pure Active Recall/component-learning primitives; no DOM, `window`, or `localStorage` access.
- `v1.5-p0.js`: Active Recall UI/orchestration overlay; delegates pure calculations to recall core.
- `v1.5-state.js`: persistence, recovery/reconciliation, education settings, component storage, and session history. It is the canonical owner of storage-key constants consumed by compatibility code.
- `v1.5-education-sync-core.js`, `v1.5-fsrs-sync-core.js`, `v1.5-sync-core.js`: deterministic sync/merge/replay primitives.
- `v1.6-session-core.js`: pure session planning.
- `v1.6-session-feedback.js`: authoritative session feedback boundary.
- `v1.6-session.js`: session lifecycle, resume state, plan consumption, summary/history rendering, and orchestration.
- `v1.6-session-analytics.js`: session aggregation and trend/summary primitives.
- `v1.6-skill-profile.js`: long-term skill projection from completed session history.
- `v1.6-sync-core.js`: deterministic v1.6 merge/replay primitives.
- `v1.7-adaptive-recall-core.js`: pure adaptive attribute-recall planning. It selects recall attributes from long-term weakness and supported modes without touching persistence or UI.
- `v1.7-evaluation-core.js`, `v1.7-baseline-evaluation-core.js`, `v1.7-tuning-core.js`: pure evaluation, baseline comparison, and tuning primitives. They consume data and return deterministic results.
- `supabase-sync.js`: remote transport, locking, retries, and optimistic concurrency. It does not define planning semantics.
- `sw.js`: offline shell/data/API caching, request coalescing, and precaching of active runtime dependencies.

## Dependency direction

The intended direction is:

`pure rules → orchestration/UI → persistence/sync adapters → remote transport`

Pure cores must not depend on DOM, `window`, localStorage, or network APIs. UI/orchestration consumes pure modules and routes durable state through `v1.5-state.js`. Supabase owns transport only.

Compatibility shims are migration boundaries, not permanent homes for business logic. A shim may remain only while an active consumer depends on it; once migration is verified by tests and runtime wiring, it should be retired.

## Adaptive recall

v1.7 adds an adaptive-recall layer that treats recall attributes as independently learnable skills. The adaptive planner receives a knowledge snapshot, supported attributes, and a maximum attribute budget, then deterministically prioritizes weak or unseen attributes. It does not persist its own state and does not bypass the authoritative education/session boundaries.

The v1.7 evaluation and tuning modules are analysis layers over recorded outcomes. They must not mutate learner state or become a second grading engine.

## Educational integrity

Meaning grading has one canonical implementation in `v1.4-education-core.js`. Exact normalized matches remain exact; partial matches are accepted only when the token-overlap score reaches the defined F1 threshold. A single-token guess no longer receives an automatic pass merely because it is a subset of a multi-token canonical meaning.

This rule is intentionally conservative: the grading system must reward recall of the meaning rather than teach users to exploit answer-token shortcuts.

## Persistence and storage keys

`v1.5-state.js` is the source of truth for application storage keys such as `STORAGE` and `DECK_KEY`. Compatibility layers consume those exported runtime constants instead of duplicating string literals. This prevents silent desynchronization when a key changes.

Persistence uses bounded review/session history and graceful degradation when browser quota is exhausted. Snapshot validation and reconciliation remain deterministic.

## Data build

Runtime consumes the derived `kanji-data.json`. The large upstream Jōyō source is not committed to this application repository. `scripts/build-kanji-data.mjs` fetches the pinned upstream Jōyō dataset from the documented source and deterministically derives the runtime dataset. Source provenance and license information must remain documented alongside the build script.

## Testing and release gates

`npm test` is the single local entry point for every `scripts/test-*.mjs` contract/unit test. CI may add targeted subsets and browser E2E tests, but it must not require contributors to reconstruct the test list from workflow YAML.

A release should pass:

1. JavaScript syntax validation for active runtime and test modules.
2. All `scripts/test-*.mjs` contract/unit tests through `npm test`.
3. Browser E2E coverage for the active release features.
4. Service-worker/runtime wiring checks.
5. Release-contract checks for package version, documentation, and required runtime files.
6. A clean working tree after validation; CI must not generate or commit application changes.

These contracts make the architecture executable rather than aspirational.
