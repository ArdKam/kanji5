# React/TypeScript presentation migration

This is the first code-level migration slice from Kanjis Bloom into Kanji 5. It introduces a real React 19 + TypeScript presentation package while keeping the existing Kanji 5 v1.9/v2 boundary authoritative.

Visual language imported: 880px frame, Sumi Play washi/paper/sumi/shu/ai/matcha/line palette, 28px cards, Noto Serif JP, responsive learning/exercise/feedback/insights/dialog patterns, keyboard-friendly focus, reduced-motion and high-contrast support.

Explicitly not migrated: Lovable/Supabase authentication, Lovable server functions, Lovable known/review scheduler semantics, Lovable test-session persistence, and direct persistence access from React components.

Boundary rule: React code talks to the learning system through frontend/src/app/engine.ts. Components must not directly read or mutate localStorage, sessionStorage, FSRS objects, learner-model internals, or service-worker caches.

Next slice: wire the built React bundle into the existing static shell, keep engine script order unchanged, run the complete browser/release gates, then retire the duplicate DOM presentation only after parity is verified.