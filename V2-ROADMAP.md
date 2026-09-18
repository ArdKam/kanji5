# Kanji 5 v2 Roadmap

## Product goal

Replace the v1 presentation layer with a modern, responsive, accessible interface while keeping the v1.9 learning engine authoritative.

## Architecture rule

The v2 presentation layer consumes only the stable v1.9 view-model boundary. It must not read or write localStorage/sessionStorage directly, call planner/learner-model internals, or become a second learning engine.

## Priority order

### P0 — Presentation Shell & Contract Consumer ✅
- Add an opt-in v2 presentation shell without changing the default v1 experience.
- Consume `kanji5:v1.9-v2-view-models` snapshots from `v1.9-v2-boundary.js`.
- Render session, exercise, feedback, learner-skill, session-summary, and adaptive-reason view models without importing persistence or planner internals.
- Add browser and contract coverage for the presentation boundary.
- Keep the shell accessible, responsive, semantic, and free of presentation-side business logic.

### P1 — Exercise Flow Migration ✅
- Move the learner-facing exercise presentation from the v1 DOM handlers to v2.
- Wire all five supported skills through the existing v1.9 exercise/feedback contracts.
- Preserve grading, FSRS scheduling, session persistence, recovery, and offline semantics.

### P2 — Session & Learner Information Architecture
- Build the v2 session dashboard from stable session and learner view models.
- Expose progress, adaptive reason, recent outcomes, and learner-skill summaries without duplicating planner logic.

### P3 — Accessibility & Responsive Completion
- Keyboard-first interaction.
- Screen-reader semantics and focus management.
- Responsive layouts for mobile/tablet/desktop.
- Reduced-motion support.

### P4 — Visual System & Polish
- Establish the final v2 visual hierarchy, typography, spacing, component system, and interaction polish.
- Keep visual decisions independent from learning-engine contracts.

### P5 — v2 Release Readiness
- Remove the v1 presentation path when v2 parity is proven.
- Run complete regression, offline, accessibility, and browser gates.
- Publish the v2 release contract and documentation.

## Out of scope unless required for parity

- New learning attributes.
- Replacement of FSRS.
- New grading authority.
- Rewriting the v1.9 learning engine.
- Social/gamification features.
