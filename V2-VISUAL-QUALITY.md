# Kanji 5 — v2 Professional Visual Quality Track

## Goal

Bring the current v2.0.x presentation and learner experience to the visual and interaction quality expected of polished consumer learning applications, without changing the authoritative v1.9 learning engine.

## Quality pillars

1. **Hierarchy:** instant understanding of what to do, what is being tested, and what happened.
2. **Visual system:** coherent tokens for type, spacing, radius, elevation, states, and responsive behavior.
3. **Interaction polish:** tactile button states, clear focus, hover/active feedback, stable layouts, and predictable dialogs.
4. **Learner focus:** the active Kanji and task should visually dominate secondary analytics.
5. **Responsive ergonomics:** touch-friendly controls, safe-area handling, compact headers, and readable Japanese/Persian text.
6. **Accessibility:** keyboard/focus semantics, reduced motion, contrast, and resilient empty/error states.
7. **Theme readiness:** light and system-dark presentation without changing learning behavior.

## Current implementation

### Phase A — Foundation ✅
- Professional visual token layer.
- Elevated app shell and header.
- Stronger exercise/learning cards.
- Refined buttons, inputs, progress, KPI cards, dialogs, and feedback.
- Mobile/tablet layout refinements.
- System dark-mode theme.
- Reduced-motion refinements.
- Removed the duplicate daily-summary renderer so the dashboard uses the v2 view-model data path.

### Phase B — Next
- Replace screenshot baselines with intentionally reviewed v2.0.x visual baselines after the visual pass.
- Add interaction-state regression coverage for hover/focus/pressed/disabled states.
- Add typography and long-string stress cases for Japanese/Persian/English mixed content.
- Add dedicated empty/loading/error visual states for session, learning, and review surfaces.

### Phase C — Next
- Navigation and information architecture refinement based on learner task frequency.
- Progressive disclosure for analytics and secondary details.
- Animation choreography for exercise transitions, feedback, and dialog entry/exit.
- Final accessibility audit at desktop, tablet, and mobile widths.
