# Rinemi — Product Priorities & Audit Handoff

**Review date:** 2026-10-23  
**Repository:** `ArdKam/kanji5`  
**Baseline:** latest observed mainline commit `e14cff37ec69c3e0b49c6e14fa44a46d65063d37` (documentation refresh after the live-security-audit harness merge).  
**Purpose:** retain the current synthesis of the ten highest-value product priorities from the product/UX review, map each to its authoritative project documents, and prevent future audits from treating planned work or open PRs as shipped.

## Authority and status rules

This is a short cross-document handoff, not a replacement for the canonical implementation records:

- [`ROADMAP.md`](../ROADMAP.md) is authoritative for current execution order, release blockers, PR dispositions, architecture, and completion status.
- [Product strategy and competitive positioning](PRODUCT-STRATEGY-AND-COMPETITIVE-POSITIONING-2026-10-17.md) owns product positioning, opportunity ranking, and scope restraint.
- [Learning effectiveness roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md) owns instructional sequence, measurable learning outcomes, and educational experiments.
- [Educational content audit](EDUCATIONAL-CONTENT-AUDIT.md) owns content-quality and placement-validity findings.
- [Kanji bookmarks and Anki feature roadmap](FEATURE-ROADMAP-ANKI-IMPORT-AND-KANJI-BOOKMARKS.md) owns the scope and acceptance criteria for those deferred features.
- [Release evidence](RELEASE-EVIDENCE.md) and [issue #603](https://github.com/ArdKam/kanji5/issues/603) own release/security/privacy acceptance evidence; [issue #609](https://github.com/ArdKam/kanji5/issues/609) owns the fixed startup-transfer gate.

**Never use this document alone to infer current status.** Refresh the latest `main`, open PR heads, exact-head required checks, current deployment, and live evidence before coding or changing a status. An open PR, passing tests on a stale branch, a prior successful deployment, or a feature existing in source is not by itself proof of release acceptance or educational effectiveness.

## Ranked ten-priority synthesis

| Rank | Priority | Status at this review | Recommended decision / acceptance |
|---:|---|---|---|
| 1 | **Public-beta trust: security, privacy, data safety, and release integrity** | **BLOCKED / acceptance open** | Resolve the current gates tracked by [#603](https://github.com/ArdKam/kanji5/issues/603): production leaked-password protection, an appropriate verified response-header/CSP solution, live-security-audit evidence against the deployed SHA, end-user account deletion, complete local-data erasure, privacy-request handling, approved legal/governance decisions, and real-device/accessibility evidence. Keep the public-beta gate closed until the required evidence is attached to one frozen candidate. |
| 2 | **Finish the Learning Card and premium visual system** | **Open candidates; not complete** | Preserve the compact hybrid back-page order: (1) kanji, primary meaning/core readings and one useful vocabulary example; (2) more examples; (3) mnemonic; (4) stroke order. Verify unclipped content, readable controls, keyboard/focus behavior, and touch targets at 360×640, 390×844, and 844×390, in Persian RTL/English LTR and light/dark modes. Integrate the semantic token system once, not through parallel CSS patches. See [#611](https://github.com/ArdKam/kanji5/pull/611), [#610](https://github.com/ArdKam/kanji5/pull/610), and [#612](https://github.com/ArdKam/kanji5/pull/612); refresh their exact-head check status before deciding. |
| 3 | **Protect startup speed and honest offline behavior** | **Acceptance open** | Keep the 2,202 KB startup-transfer budget and existing FCP/LCP/CLS/long-task thresholds unchanged. Measure marginal transfer and the actual first-render dependency path before deferring code. A failed offline fetch must not appear as a successful empty result. Verify build, learning engine, WebKit, browser/visual, offline/recovery, and same-SHA deployment checks. See [#609](https://github.com/ArdKam/kanji5/issues/609) and the current Learning Card candidate [#611](https://github.com/ArdKam/kanji5/pull/611). |
| 4 | **Make kanji instruction genuinely Persian-first** | **Content acceptance pending** | Add/review natural Persian learner meanings and semantic distinctions without replacing or corrupting authoritative source glosses. Prioritize common meanings, readings in useful words, high-frequency characters, irregular readings, examples, and confusing pairs. Track provenance, correction/reporting, and human editorial approval. A Persian interface alone is not evidence of Persian-first teaching quality. |
| 5 | **Validate onboarding placement and actual learning outcomes** | **Implementation exists; validity acceptance remains open** | The post-assessment bilingual answer review from [PR #596](https://github.com/ArdKam/kanji5/pull/596) is merged, but it does not validate the placement instrument. Independently review items/distractors and assess stability across representative repeated attempts. Test delayed independent recall and transfer to unfamiliar words/text; do not claim overall Japanese proficiency from isolated-kanji gloss recognition. See [#603](https://github.com/ArdKam/kanji5/issues/603) and the educational-content audit. |
| 6 | **Make the Learning Card an explicit active-recall task** | **Ongoing product/educational requirement; verify current UI** | State what the learner should retrieve before reveal: meaning, reading, production, vocabulary, or context. Distinguish independent typed/free recall from choice, cued completion, hint-assisted work, revealed self-report, and recovery. Correct errors concisely and offer another attempt. Use current engine evidence contracts; do not add a second scheduler or duplicate learner state. See LE-0/LE-1 in the [learning effectiveness roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md). |
| 7 | **Progress from isolated kanji to useful word reading** | **Educational roadmap item; do not infer completion from examples alone** | Teach a small number of valuable words with form, reading, and meaning connected. Progress from explanation to supported completion to independent recall when appropriate. Distinguish selected-option success from free recall and studied-word performance from transfer to an unfamiliar word. See LE-2 in the [learning effectiveness roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md). |
| 8 | **Turn Reading Lab into a guided reading-comprehension pathway** | **UI candidate open; broader guided progression remains planned** | Keep text/audio import, word lookup, and session restoration. Add an optional path from controlled sentence to comprehension attempt, on-demand word/grammar support, short passages, and less-supported/authentic text. Ask for comprehension before showing translation and clearly distinguish verified translations from missing support. UI refinements in [#606](https://github.com/ArdKam/kanji5/pull/606) do not by themselves complete the curriculum. See LE-3 in the [learning effectiveness roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md). |
| 9 | **Repair recurrent confusions and improve mnemonic specificity** | **Incremental content/learning work; human QA required** | Start with a reviewed set of high-value confusing kanji; offer targeted visual/semantic contrast when evidence justifies it, then test again later and in words. Prioritize distinctive, human-reviewed mnemonics for high-frequency, deceptive, confusing, or irregular-reading characters and fade hints as recall improves. Keep curated, generated/scaffolded, and personal aids clearly distinct. Current full scaffold coverage must not be described as full authored or learner-validated mnemonic quality. See LE-4/LE-5 and the [educational content audit](EDUCATIONAL-CONTENT-AUDIT.md). |
| 10 | **Add learner-owned bookmarks first, then research-gated Anki import** | **Planned; not implemented or release-ready** | Bookmarks should save/unsave kanji and provide a useful saved list without changing FSRS, review history, learner state, or card/content identity; verify local persistence and backup/restore. Consider `.apkg` import only after user research, with a bounded support contract, preview, unsupported-content warnings, safe media handling, and duplicate handling through existing review authority. Do not imply full Anki history/template/media compatibility. Follow [the dedicated feature roadmap](FEATURE-ROADMAP-ANKI-IMPORT-AND-KANJI-BOOKMARKS.md). |

## Execution sequence

1. **First: release blockers and integrity.** Resolve and evidence the release gates in `ROADMAP.md`, #603, and #609. Continue to treat production configuration, legal/privacy decisions, independent content review, and physical-device checks as separate from CI.
2. **Then: complete current experience candidates.** Reconcile #611, #612, #606, and #610 against current `main`; port only unique, still-reproduced fixes. Do not merge the entire PR queue, weaken the fixed transfer budget, or treat an unverified rendered design as complete.
3. **Then: educational trust and progression.** Prioritize reviewed Persian content, valid placement claims, explicit active recall, useful word-level reading, and a guided Reading Lab pathway. Define an observable acceptance criterion before each implementation.
4. **Later: learner-owned features.** Implement bookmarks after release-critical gates, then validate demand and feasibility before Anki import. Avoid premature expansion into a full grammar curriculum, AI tutor, community, or heavy gamification.

## Architectural and product guardrails

- FSRS remains the authority for review intervals and due dates.
- The v1.9 Learner Model owns learner-state estimates; the Adaptive Planner owns exercise/skill selection.
- Grading, recovery, evidence interpretation, and persistence remain within their established engine boundaries. React stays presentation/interaction-only.
- Preserve stable content IDs, card IDs, historical review data, backup/restore behavior, offline-first deterministic learning, and the current persistence contracts.
- Do not turn a bookmark into a review queue, add a parallel scheduler, migrate broad learner data, or treat coverage, streaks, lookup counts, or immediate accuracy as proof of mastery.
- Review actual rendered screenshots and interaction paths on supported devices/locales/themes. Verify the deployed artifact on the exact promoted SHA before claiming live completion.
- Keep the calm, premium Japanese-editorial **Sumi Play** direction: warm paper/sumi surfaces, restrained indigo/sakura/green accents, consistent semantic tokens, appropriate Persian/English/Japanese typography, generous but purposeful spacing, strong contrast, and no generic dashboard or patchwork styling.

## Instructions for future Rinemi reviews

When asked to review or continue the project:

1. Read the latest `ROADMAP.md` and current product/educational documents; use this file as an index to their relevant decisions, not as a competing backlog.
2. Inspect current `main`, PR heads and changed files, failed required checks, and the deployed/live release before reporting what is complete.
3. For UI changes, inspect actual Playwright/browser screenshots and flows in Persian/English, light/dark, and representative mobile/desktop/landscape sizes. Do not call a fix live without matching deployment evidence.
4. Prefer the smallest isolated change that closes a demonstrated gap; add measurable acceptance criteria, tests, and exact-SHA evidence.
5. Update the authoritative detailed document for status changes rather than maintaining duplicate task checklists here. Keep this handoff concise and refresh or supersede its baseline as needed.
