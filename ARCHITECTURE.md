# Kanji 5 v1.5 Architecture

## Runtime boundaries

The active browser runtime is intentionally split into narrow responsibilities:

- `index.html`: application shell, markup, startup wiring, and the canonical application module.
- `v1.4-education-core.js`: pure education rules and canonical grading/adaptive selection.
- `v1.4-education-ui.js`: compatibility shim only; the active education UI lives in `v1.5-education-ui.js`.
- `v1.5-education-ui.js`: education rendering and interaction. It owns no browser storage and no remote API endpoints.
- `v1.5-education-ui.css`: education-specific presentation, loaded by the education UI boundary.
- `v1.5-network.js`: education data transport adapter for KanjiAPI and Tatoeba. It owns no browser storage; caching/coalescing remains in the service worker.
- `v1.5-recall-core.js`: pure Active Recall/component-learning primitives. It must not access DOM, `window`, or `localStorage`.
- `v1.5-p0.js`: thin Active Recall UI/orchestration overlay. It may observe the study surface and persist compatibility data, but it must delegate pure recall calculations to the recall core.
- `v1.5-state.js`: persistence boundary and recovery/reconciliation layer, including education settings/app-state access.
- `v1.5-education-sync-core.js`, `v1.5-fsrs-sync-core.js`, `v1.5-sync-core.js`: deterministic sync/merge/replay layers.
- `supabase-sync.js`: network transport, lifecycle, locking, retries, and optimistic concurrency; merge semantics belong in sync core modules.
- `sw.js`: offline shell/data/API caching, request coalescing, and precaching of all active runtime dependencies.

## Dependency direction

Pure logic must not depend on the browser UI. UI/orchestration depends on pure logic. Persistence and remote synchronization consume canonical state/merge primitives rather than reimplementing them. Education UI consumes state through `window.__KANJI5_STATE__` and remote data through `v1.5-network.js`; API caching and concurrent-request coalescing remain a service-worker concern.

The legacy `v1.4-education-ui.js` filename remains in the shell for compatibility, but contains no education state, storage, or endpoint implementation. `v1.4-education-migration.js` explicitly hands control to the v1.5 education UI.

Deprecated runtime files are not wired into the active shell and are not precached.

## Recall contract

Active Recall keeps its focus internally and exposes only an explicit browser refresh API. The `نمی‌دانم` control is an educational recall outcome, not an FSRS rating, and therefore never directly triggers the normal `Again/Hard/Good/Easy` rating path.

## CI requirement

Architecture boundaries are executable contracts. JavaScript syntax checks, pure-core unit tests, legacy/P0 behavior checks, persistence/sync checks, Playwright smoke tests, and committed-build verification must all pass before a refactor is considered complete.

CI itself is source-immutable: validation must inspect the committed checkout and must never mutate, commit, or push application files during the test run.
