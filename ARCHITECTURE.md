# Kanji 5 v1.5 Architecture

## Runtime boundaries

The active browser runtime is intentionally split into narrow responsibilities:

- `index.html`: application shell, markup, startup wiring, and the canonical application module.
- `v1.4-education-core.js`: pure education rules and canonical grading/adaptive selection.
- `v1.4-education-ui.js`: canonical education rendering and interaction.
- `v1.5-recall-core.js`: pure Active Recall/component-learning primitives. It must not access DOM, `window`, or `localStorage`.
- `v1.5-p0.js`: thin Active Recall UI/orchestration overlay. It may observe the study surface and persist compatibility data, but it must delegate pure recall calculations to the recall core.
- `v1.5-state.js`: persistence boundary and recovery/reconciliation layer.
- `v1.5-education-sync-core.js`, `v1.5-fsrs-sync-core.js`, `v1.5-sync-core.js`: deterministic sync/merge/replay layers.
- `supabase-sync.js`: network transport, lifecycle, locking, retries, and optimistic concurrency; merge semantics belong in sync core modules.
- `sw.js`: offline shell/data/API caching and precaching of all active runtime dependencies.

## Dependency direction

Pure logic must not depend on the browser UI. UI/orchestration depends on pure logic. Persistence and remote synchronization consume canonical state/merge primitives rather than reimplementing them.

Deprecated runtime files are not wired into the active shell and are not precached.

## Recall contract

Active Recall keeps its focus internally and exposes only an explicit browser refresh API. The `نمی‌دانم` control is an educational recall outcome, not an FSRS rating, and therefore never directly triggers the normal `Again/Hard/Good/Easy` rating path.

## CI requirement

Architecture boundaries are executable contracts. JavaScript syntax checks, pure-core unit tests, legacy/P0 behavior checks, persistence/sync checks, Playwright smoke tests, and committed-build verification must all pass before a refactor is considered complete.
