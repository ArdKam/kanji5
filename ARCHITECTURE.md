# Kanji 5 v1.6 Architecture

## Scope

v1.6 adds a session-intelligence layer above the v1.5 education, persistence, recall, and sync foundations. Its responsibility is to plan, persist, observe, rebalance, analyze, and synchronize a learning session without moving business rules into UI or network transport.

## Runtime boundaries

The active browser runtime is intentionally split into narrow responsibilities:

- `index.html`: application shell, markup, startup wiring, and the canonical application module.
- `v1.4-education-core.js`: pure education rules and canonical grading/adaptive selection.
- `v1.4-education-ui.js`: compatibility shim only; the active education UI lives in `v1.5-education-ui.js`.
- `v1.5-education-ui.js`: education rendering and interaction. It owns no browser storage and no remote API endpoints; v1.6 session APIs are consumed at this boundary.
- `v1.5-education-ui.css`: education-specific presentation, loaded by the education UI boundary.
- `v1.5-network.js`: education data transport adapter for KanjiAPI and Tatoeba. It owns no browser storage; caching/coalescing remains in the service worker.
- `v1.5-recall-core.js`: pure Active Recall/component-learning primitives. It must not access DOM, `window`, or `localStorage`.
- `v1.5-p0.js`: thin Active Recall UI/orchestration overlay. It may observe the study surface and persist compatibility data, but it must delegate pure recall calculations to the recall core and load the v1.6 session runtime.
- `v1.5-state.js`: persistence boundary and recovery/reconciliation layer, including education settings/app-state access and session-history/component storage used by v1.6.
- `v1.5-education-sync-core.js`, `v1.5-fsrs-sync-core.js`, `v1.5-sync-core.js`: deterministic sync/merge/replay layers inherited by v1.6.
- `v1.6-session-core.js`: pure session-planning primitives. It builds the initial plan, chooses the next planned mode, computes weakest modes, and rebalances remaining work from current session feedback and the long-term profile.
- `v1.6-session-feedback.js`: authoritative session feedback boundary. It receives education outcomes, keeps session-scoped accounting, and exposes the authoritative session API used by the education UI.
- `v1.6-session.js`: session dashboard/orchestration. It owns active-session lifecycle, resume state, plan consumption, summary/history rendering, and coordination with analytics/profile modules.
- `v1.6-session-analytics.js`: session-level aggregation and trend/summary primitives; it does not own transport.
- `v1.6-skill-profile.js`: long-term profile projection from completed session history. It stores five mode-level skills plus recent-window accuracy and momentum and publishes profile data for planning.
- `v1.6-sync-core.js`: pure v1.6 merge/replay primitives for durable session/profile/component synchronization. Merge semantics remain here rather than in Supabase transport.
- `supabase-sync.js`: remote transport, lifecycle, locking, retries, and optimistic concurrency. It consumes deterministic v1.6 sync primitives and does not define their semantics.
- `sw.js`: offline shell/data/API caching, request coalescing, and precaching of all active runtime dependencies, including every v1.6 module.

## Dependency direction

The dependency direction is:

`pure rules → orchestration/UI → persistence/sync adapters → remote transport`

Pure v1.6 planning/analytics/sync logic must not depend on DOM, `window`, localStorage, or network APIs. UI/orchestration consumes the pure modules and routes state through the established state boundary. Persistence owns snapshots/history; Supabase owns transport only.

The legacy `v1.4-education-ui.js` filename remains in the shell for compatibility, but contains no education state, storage, or endpoint implementation. `v1.4-education-migration.js` explicitly hands control to the v1.5 education UI.

Deprecated runtime files are not wired into the active shell and are not precached.

## Session lifecycle

A v1.6 session follows this lifecycle:

1. Read the persisted active-session record, if any.
2. Otherwise build a new adaptive plan from current knowledge and the persisted long-term profile.
3. Persist session id, plan snapshot, status, and remaining modes before user-facing work begins.
4. Request the planned mode from the authoritative session boundary.
5. Consume a planned mode only after the corresponding educational content is successfully resolved.
6. Record mode outcome as session-scoped feedback.
7. Rebalance only the remaining plan from fresh feedback and profile data; never rewrite completed work.
8. On completion, write an immutable session-history record that becomes the input to analytics and long-term skill-profile aggregation.
9. On reload, restore the active session instead of starting a competing session.

## Long-term skill profile

`v1.6-skill-profile.js` projects completed session history into five independent skills:

- Meaning
- Reading
- Production
- Vocabulary
- Context

Each skill tracks lifetime attempts/correctness plus a recent three-session window. `momentum` is derived from the difference between recent and lifetime accuracy and is bounded to a stable range. The profile is persisted as a versioned component and is consumed by `v1.6-session-core.js` as a planning signal.

The profile therefore influences planning in a deterministic direction: weaker accuracy, weaker recent accuracy, and negative momentum raise a mode's priority; improving recent performance reduces the additional trend pressure. The planner remains pure and testable because the profile is passed in as data rather than read from browser storage directly.

## Feedback contract

Educational results are session-scoped. `نمی‌دانم` is an educational recall outcome, not an FSRS rating, and therefore never directly invokes the normal `Again/Hard/Good/Easy` rating path. The authoritative session API is separated from the compatibility API so that duplicate feedback wiring cannot silently create competing session state.

## Persistence and synchronization

The active session is persisted as a versioned record containing stable identity, lifecycle status, plan snapshot, and remaining work. Completed sessions are retained as history and are the sole source for long-term profile reconstruction.

v1.6 sync is deterministic: merge/replay behavior lives in `v1.6-sync-core.js`, while Supabase transport is responsible only for delivery, locking, retries, and concurrency handling. A sync operation must not mutate planning semantics.

## Offline contract

Every v1.6 runtime dependency is precached by the service worker. The cache version advances with the v1.6 runtime, and CI verifies the required module wiring. A release must leave the checked-out source tree clean after validation; CI must not generate, commit, or push application changes.

## CI and release gates

A v1.6 release is complete only when all of the following pass:

1. JavaScript syntax validation for active runtime and test modules.
2. v1.4/v1.5 regression contracts.
3. v1.6 session, adaptive-core, feedback, analytics, profile, planning, and durable-sync contracts.
4. Browser E2E coverage, including session persistence/resume and profile rendering.
5. Service-worker/runtime wiring and immutable committed-tree verification.
6. The explicit v1.6 release contract checking package version, documentation markers, workflow naming/wiring, and required runtime files.

These contracts are intended to make architectural boundaries executable rather than aspirational.
