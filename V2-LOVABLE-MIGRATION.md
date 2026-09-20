# Kanji 5 — Lovable → React Presentation Migration

Lovable/Kanjis Bloom is a **visual and interaction reference**, not a learning-engine authority.

## Architecture decision

The migration target is:

`Lovable visual/interaction language → Kanji 5 React presentation`

while preserving:

`Kanji 5 v1.9 → grading → learner model → adaptive planner → recovery → FSRS → persistence/offline`

Lovable scheduling semantics are not imported.

## Current implementation

The production presentation is React/TypeScript under `frontend/`, with the static bundle under `react-dist/`.

The authoritative boundary remains:

- `v1.9-v2-contract-core.js`
- `v1.9-v2-boundary.js`

The former vanilla `v2-presentation.js`, `v2-components.js`, `v2-presentation.css`, and legacy presentation shell have been retired.

## Visual system

The migrated React design system uses the Sumi Play-derived semantic tokens:

`--washi`, `--paper`, `--sumi`, `--ink`, `--mute`, `--shu`, `--ai`, `--matcha`, `--line`.

It preserves the Japanese-paper identity, Noto Serif JP Kanji typography, restrained motion, responsive layout, and accessible interaction patterns.

## Product mapping

- Home/dashboard → React AppShell + DailySummary + DailyGoal
- Review → React learning/review surface backed by the review runtime
- Practice → React exercise surface backed by the education/session boundaries
- Progress/Stats → boundary-backed React stats surfaces
- Settings → boundary-backed React settings dialog
- Audio/feedback/accessibility → React components and semantic design tokens

## Non-negotiable rule

The React presentation may control visual state and dispatch user actions, but it must never become a second scheduler, grader, persistence layer, or learner model.
