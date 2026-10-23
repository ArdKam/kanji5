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

### P2 — Session & Learner Information Architecture ✅
- Build the v2 session dashboard from stable session and learner view models.
- Expose progress, adaptive reason, recent outcomes, and learner-skill summaries without duplicating planner logic.

### P3 — Accessibility & Responsive Completion ✅
- Keyboard-first interaction.
- Screen-reader semantics and focus management.
- Responsive layouts for mobile/tablet/desktop.
- Reduced-motion support.

### P4 — Visual System & Polish ✅
- Establish the final v2 visual hierarchy, typography, spacing, component system, and interaction polish.
- Keep visual decisions independent from learning-engine contracts.

### P6 — Reading Lab Maturity (Planned)
The Reading Lab remains a focused contextual-reading workbench rather than a general-purpose language-learning suite.

#### P0 — Next-focus navigation
- Add **Focus Next / Next Unknown** to jump directly to the next non-familiar or attention-state kanji in the current sentence/text.
- Keep the action aligned with the authoritative mastery state; do not create a second mastery model.

#### P1 — Sentence playback & synchronization
- Add **sentence autoplay** with smooth advance and **Repeat sentence**.
- Keep manual previous/next sentence navigation.
- Extend the existing SRT/VTT cue model into a polished synchronized listening mode with clear active-cue state.

#### P1 — Reading Coverage refinement
- Keep the current unique-kanji coverage metric, but label it explicitly as unique coverage.
- Add an **occurrence-weighted coverage** metric so repeated exposure in the text is represented.
- Surface the hardest / most attention-demanding sentence as a quick focus target without changing learning state.

#### P2 — Contextual reading support
- Add **sentence translation / annotation** as a lightweight support layer, not an AI chat or generic translator.
- Add **voice selection** for browser TTS where supported.
- Replace heavy persistent mastery decoration with a compact **mastery micro-popover** on interaction when useful.

#### P3 — Reading library & vocabulary learning
- Add **saved readings** with source/title metadata and resume state.
- Add **sentence mining** and vocabulary-SRS only after the vocabulary layer is mature enough to provide stable word identity, readings, meanings, and learning state.
- Export/import or cross-device persistence must preserve the distinction between reading-workbench data and authoritative learning progress.

#### Product boundary
- Reading Lab should follow the product chain:
  **Text → Sentence → Word → Kanji → Mastery → Audio → Next focus**
- Avoid turning the Lab into an all-in-one grammar tutor, AI chat, or generic content platform.
- Any future reading-session persistence must remain clearly scoped to the Reading Lab context and must not become a competing source of truth for SRS/FSRS state.

### P5 — v2 Release Readiness ✅
- Remove the v1 presentation path from the default user-facing runtime; retain only an explicit `?legacy=1` compatibility path for regression/migration verification.
- Run complete regression, offline, accessibility, and browser gates.
- Publish the v2 release contract and documentation.

## Out of scope unless required for parity

- New learning attributes.
- Replacement of FSRS.
- New grading authority.
- Rewriting the v1.9 learning engine.
- Social/gamification features.
