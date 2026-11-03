# Kanji Flow (Base44) — UI/UX Extraction Notes for Rinemi

**Assessment date:** 2026-10-23  
**Source project:** Base44 app “Kanji Flow” (app ID `6adb96c8905a8651ca14ba48`)  
**Target project:** `ArdKam/kanji5` — Rinemi  
**Status:** Design and product recommendations; not a claim that the Base44 live UI has been independently reproduced or that Rinemi’s changes are deployed.  
**Repository status rechecked:** PR [#611](https://github.com/ArdKam/kanji5/pull/611) merged on 2026-10-23 at `4fa42f1c12c4ab4aff6fd684df64a2d4d87c21a0`; PR [#616](https://github.com/ArdKam/kanji5/pull/616) merged on 2026-10-23 at `766f85c4633ee5d2699509c981bb4cfc456d26f9`. These merges establish source-control status, not current production deployment.  
**Canonical implementation/release status:** [`ROADMAP.md`](../ROADMAP.md)

## 1. Decision

Treat Kanji Flow as a **useful mobile UX reference, not a code or learning-engine template**. The valuable lesson is the clarity of its daily-study framing and task-focused presentation. Rinemi should borrow interaction and information-hierarchy patterns only where they improve real study tasks, then implement them with Rinemi’s design tokens, Persian-first learning needs, accessibility standards, and existing authoritative learning engine.

Do not replace Rinemi's Learning Card or create a competing redesign branch: the compact-hybrid changes were merged through PR #611. Instead, verify the reviewed implementation on current `main` and in the actual deployed application, especially the revealed back—not just the front—and inspect browser artifacts from the merged/deployed SHA.

## 2. Evidence and confidence

This review combines a source-level reading of the Base44 implementation and a review of Rinemi source/CI artifacts available for this assessment. It is **not** a completed side-by-side visual audit of both live applications.

- The Kanji Flow public preview could not be inspected reliably in the browser during the review. The user’s report that its UI feels substantially better on mobile is valid product feedback, but no pixel-level claim about the live page should be inferred from it.
- Base44 source paths reviewed include `src/pages/Study.jsx`, `src/lib/srs.js`, `src/lib/session.js`, `src/pages/ImportKanji.jsx`, and `base44/functions/importKanji/entry.ts`. Component files such as `StudyFront.jsx`, `StudyBack.jsx`, and `RatingBar.jsx` were not all fully available in the captured output; detailed styling conclusions about them remain provisional.
- Rinemi's current architecture is documented in [`ARCHITECTURE.md`](../ARCHITECTURE.md). The front-end implementation is in [`frontend/src/app/App.tsx`](https://github.com/ArdKam/kanji5/blob/main/frontend/src/app/App.tsx), [`learning-surface.css`](https://github.com/ArdKam/kanji5/blob/main/frontend/src/app/learning-surface.css), and [`styles.css`](https://github.com/ArdKam/kanji5/blob/main/frontend/src/styles.css).
- At the first assessment snapshot, the roadmap described PR #611 as a candidate. Status was rechecked on 2026-10-23: PR #611 merged at `4fa42f1c12c4ab4aff6fd684df64a2d4d87c21a0`, and PR #616 subsequently merged at `766f85c4633ee5d2699509c981bb4cfc456d26f9`. Re-check current `main`, passing exact-head checks, and deployment SHA before concluding the behavior is live.

### Provisional diagnosis of the reveal issue

Base44’s `Study.jsx` conditionally renders the back after the front, rather than relying on a 3D flip. The study card is a normal flowing container; answer content is rendered before the rating footer, and the app also has fixed mobile bottom navigation. A long answer can therefore expand the page and push rating controls below the first viewport. This is a **plausible source-level explanation**, not a confirmed reproduction of the exact defect the user saw. Reproduce it on the actual app before selecting a fix.

## 3. What to extract

### Priority A — focused mobile study flow

**1. Make the next action obvious.**  
Give the learner one dominant next step: start or resume study, reveal the answer, then choose a rating. Secondary navigation and progress information should support—not compete with—the study action.

**2. Keep the first answer view compact.**  
After reveal, prioritize the information needed to judge recall: kanji, core meaning, key readings, and one useful vocabulary example. Move longer vocabulary lists, mnemonic detail, and stroke order to separate, explicitly labelled views when those sections exist. The first view should be useful without forcing an inner-panel scroll or hiding the rating controls.

**3. Keep ratings close to the answer.**  
The rating action is the completion point of a review. Keep Again / Hard / Good / Easy visible and reachable after reveal, ideally above the fixed bottom navigation. Preserve readable interval previews where they are already available. Respect safe-area insets, short screens, landscape orientation, and keyboard/screen-reader focus.

**4. Make daily workload legible.**  
A Today/Study entry point can clarify due work, new work, completed progress, and the recommended next action. Adopt this only if the values come from Rinemi’s actual session/engine state. Do not add a second source of truth or promise precise forecasts the data cannot support.

**5. Optimize density, not just whitespace.**  
A premium UI is not merely an airy one. Align kanji, reading, meaning, context, and review actions into a clear hierarchy. On mobile, remove dead vertical space while preserving legibility and touch comfort. Avoid shrinking type or touch targets to force everything onto one screen.

### Priority B — navigation and state communication

- Use clear active navigation, localized labels, and counts only when the counts are accurate and actionable.
- Distinguish **loading**, **offline/unavailable**, **empty**, and **error** states. An offline vocabulary request must not be presented as proof that no vocabulary exists.
- Keep deeper controls secondary to the current learning task. Menus and scrims must cover the controls they are meant to disable.
- Reuse the current design-token system for surfaces, typography, focus, states, spacing, and touch targets. Do not create a parallel collection of one-off colors or CSS patches.
- Test Persian RTL and English LTR independently; translation alone does not guarantee a sound RTL composition.

### Priority C — future experiments, not automatic scope

- Compare direct state change/crossfade against the current 3D flip using task completion, perceived clarity, focus management, and motion preferences. Do not remove the existing flip solely because Base44 appears to use a different reveal treatment.
- Consider a compact study summary or lightweight seven-day workload view only after verifying that it does not add cognitive overhead.
- Consider small navigation and content-density experiments behind a reviewable branch/flag where practical; retain a clear rollback path.

## 4. What not to port

### Do not port Base44's scheduler

Base44’s `src/lib/srs.js` describes an SM-2 variant with its own ease/interval behavior; it is not FSRS. Rinemi must retain FSRS as the only review-scheduling authority. Do not copy Base44's rating-to-interval logic, its repeat state, or any second scheduler into React.

### Do not replace Rinemi's learning architecture

Preserve these existing authority boundaries:

- FSRS: scheduling authority.
- v1.9 Learner Model: learner-state authority.
- Adaptive Planner: practice-selection authority.
- Recovery, grading, evidence, session lifecycle, and persistence: existing engine/runtime boundaries.
- React: presentation and interaction only.

Do not introduce a second review runtime, duplicate learner model, broad persistence migration, or changed card identity to imitate the Base44 flow. See [`ARCHITECTURE.md`](../ARCHITECTURE.md).

### Do not import Base44's current content corpus as production data

The sampled Base44 data snapshot contained 79 Kanji records with empty mnemonic fields, 235 Vocabulary records (7 lacking Japanese examples and 7 lacking English examples), and 70 Radical records. Its sampled content is English-first rather than Persian-first. This is not a production-ready substitute for Rinemi’s curated/reviewed content.

A source-level sort in `groupVocabByChar` uses `priority_rank || 9999`, which treats rank `0` as if the field were missing. Do not copy that behavior. If any Base44 data is later evaluated for migration, validate source, attribution/license, naturalness, examples, stable identity, duplicates, field completeness, and language suitability before import.

### Do not copy the navigation or visual styling wholesale

Base44’s observed code patterns suggest a five-item mobile navigation (Today, Study, Library, Progress, Settings) and warm surfaces with a coral/red accent. Those choices are references to test, not requirements. Rinemi should keep its “Sumi Play” design direction—warm paper, sumi charcoal, muted indigo, restrained sakura and matcha—and refine spacing, hierarchy, and information density within its semantic tokens. The user’s strong positive response to Kanji Flow’s mobile UI warrants direct comparison and usability testing; it is not a reason to discard Rinemi’s product identity.

## 5. Rinemi implementation alignment

The core ideas above overlap with the compact-hybrid Learning Card implementation merged in [PR #611](https://github.com/ArdKam/kanji5/pull/611). Its implementation includes:

- a compact first back page with meaning/readings and one useful example;
- separate vocabulary, mnemonic, and stroke-order views;
- compact behavior on short/landscape screens;
- honest offline/unavailable versus confirmed-empty vocabulary states;
- deferral of the prepared-mnemonic payload until the mnemonic view is opened; and
- responsive browser tests across Persian/English, light/dark, portrait and landscape sizes.

**Merge status is confirmed; production behavior is a separate gate.** PR #611 merged into `main`, and PR #616 later merged on top of that state. This does not by itself prove the deployed site contains those changes or that every target device behaves correctly. Verify current-main CI, the same-SHA deployment, the actual revealed back-face screenshots, and the startup-transfer budget. The documented guardrail is 2,202 KB; never relax it to force a pass.

Relevant candidate test source: [`react-learning-card-flip.spec.mjs`](https://github.com/ArdKam/kanji5/blob/67155809adedf5a2bbe64599e0649d4a8d6738d2/e2e/react-learning-card-flip.spec.mjs#L524) (the linked SHA is the reviewed candidate snapshot; check the current PR head for later changes).

## 6. Validation plan

Do not approve the redesign based on aesthetic preference alone. Compare real tasks in the current interface and the candidate.

| Area | Minimum validation | Pass condition |
|---|---|---|
| Reveal and answer comprehension | Start review, reveal, identify meaning/readings, then rate without coaching | Learner can understand the answer state and find a rating without hunting or accidental scroll |
| Mobile fit | 360×640, 390×844, and 844×390 | No clipped answer, hidden ratings, horizontal overflow, or inaccessible content |
| Localization/theme | Persian RTL and English LTR; light and dark | Correct reading order, alignment, contrast, and no mixed-direction overflow |
| Touch/accessibility | Keyboard, focus after reveal, reduced motion, screen-reader state, touch targets | Correct focus, inactive face hidden/inert, rating targets at least 44×44 CSS px, visible focus and labels |
| Long and variable content | Short/long readings, missing/large vocabulary, mnemonic, unavailable and empty response states | Stable layout, no false “empty” claim while offline, recoverable errors |
| Performance | Exact-head build and transfer-budget workflow | Remains within the 2,202 KB constraint; no budget relaxation |
| Runtime integrity | Review snapshots before/after UI interaction | Existing engine remains the source of review, card identity, evidence, learner state and scheduling |
| Deployment | Same-SHA deployment and live smoke after merge | Public application runs the reviewed source; no assumption that branch screenshots equal production |

Use screenshots from the tested candidate to examine the **revealed back**, not only the front. Include at least one content-heavy example and one unavailable/offline case. If Base44’s actual reveal defect can be reproduced, add a small, explicit reproduction test before implementing a fix.

## 7. Decision sequence

1. Verify current `main` includes the merged PR #611 implementation and review any subsequent Learning Card changes; do not start a duplicate redesign.
2. Inspect screenshots and test evidence for the revealed back across responsive/localization combinations; confirm the evidence matches the current-main/deployed SHA and add regression coverage for gaps.
3. Verify the matching deployment and actual mobile behavior. If any defect remains, make a focused follow-up change through the normal branch/PR and CI process rather than treating the original merge as proof of usability.
4. Run a small task-based comparison of Kanji Flow and Rinemi with the same study tasks. Record observed errors, completion time, scrolling/hunting, and user preference rather than inferring outcomes from looks alone.
5. Adopt only the patterns that improve task completion and learner confidence without harming readability, accessibility, performance, Persian-first teaching, or engine boundaries.
6. Revisit daily-workload and navigation ideas after release-critical security, privacy/legal, educational-validation, and physical-device acceptance work remains on track.

## 8. Source links

- [Rinemi execution/release roadmap](../ROADMAP.md)
- [Rinemi architecture boundaries](../ARCHITECTURE.md)
- [Product strategy and competitive positioning](PRODUCT-STRATEGY-AND-COMPETITIVE-POSITIONING-2026-10-17.md)
- [Learning Card implementation PR #611 (merged)](https://github.com/ArdKam/kanji5/pull/611)
- [Saved Kanji bookmarks PR #616 (merged)](https://github.com/ArdKam/kanji5/pull/616)
- [Responsive card tests from the reviewed PR #611 snapshot](https://github.com/ArdKam/kanji5/blob/67155809adedf5a2bbe64599e0649d4a8d6738d2/e2e/react-learning-card-flip.spec.mjs#L524)

---

**Bottom line:** borrow Kanji Flow’s apparent strength in mobile clarity and focused task flow, not its scheduler, architecture, or unreviewed data. The compact-hybrid Learning Card is already merged to `main`; the next step is to verify its actual deployed behavior with back-face screenshots and same-SHA release evidence, then test broader Today/navigation patterns separately.