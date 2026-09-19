# React/TypeScript presentation migration

This slice introduces a real React 19 + TypeScript presentation package for Kanji 5, using the Sumi Play visual language extracted from Kanjis Bloom.

The React layer is presentation-only. Kanji 5 remains authoritative for scheduling, grading, learner modeling, recovery, persistence, offline behavior and session state.

Excluded from this slice: Supabase auth, Lovable persistence/server functions, Lovable known/review timing semantics, and Lovable's separate quiz scheduler.

Boundary rule: React components call the learning system through frontend/src/app/engine.ts and must not directly access browser persistence or FSRS/learner internals.

Next: build the bundle in CI, wire it into the existing static shell without changing engine load order, then run full browser/release gates before removing the duplicate DOM renderer.