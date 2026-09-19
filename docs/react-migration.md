# React/TypeScript presentation migration

This slice introduces a real React 19 + TypeScript presentation package for Kanji 5, using the Sumi Play visual language extracted from Kanjis Bloom.

The React layer is presentation-only. Kanji 5 remains authoritative for scheduling, grading, learner modeling, recovery, persistence, offline behavior and session state.

Excluded from this slice: Supabase auth, Lovable persistence/server functions, Lovable known/review timing semantics, and Lovable's separate quiz scheduler.

Boundary rule: React components call the learning system through frontend/src/app/engine.ts and must not directly access browser persistence or FSRS/learner internals.

Stage 2 complete: the React bundle is built in CI, wired into the existing static shell, cached by the service worker, and verified through React E2E, authoritative snapshot parity, offline boot, and current-v2 compatibility gates. The root route now uses React by default; the former v2 DOM renderer remains available only through `?v2=1` or `?react=0` as an explicit rollback path. The legacy `?legacy=1` path remains available for the v1 runtime. Full removal of the duplicate v2 renderer is intentionally deferred until the remaining legacy release-suite regressions are cleared.