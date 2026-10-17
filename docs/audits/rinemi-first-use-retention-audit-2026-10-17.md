# Rinemi first-use and sustainable-study audit — 2026-10-17

## Executive finding

Rinemi already has a substantial guest-first onboarding flow, a short daily-new-card default, a placement option, an authoritative spaced-repetition engine, and Stats surfaces. The highest-value gap is not a missing onboarding wizard: it is the distance between “I have just opened this app” and “I have learned or reviewed one card.”

The first screen currently leads with an explainer-step CTA. The direct-to-learning path is only a low-emphasis footer action labeled “Skip setup,” which can make the useful path look like a bypass or a lesser experience. At the end of the guided path, account creation is the primary button even though registration is optional. The implementation in this branch corrects those two hierarchies and tells learners what the quick start does to their daily new-card limit.

**Evidence boundary:** this audit is grounded in the source and E2E contracts on `main` at `085524dc58547e33e42fcaff75784b0c6d3fe6b3`, plus the onboarding specification and roadmap. Browser screenshot capture was not available in this run, so findings below are not represented as a screenshot-based live visual audit. The exact quick-start and guest-order changes are covered by new Playwright assertions, but they still need to run against the PR head and be verified after deployment. Return-after-absence behavior and exact rating consequences are also runtime-validation items, not claims proven by source inspection alone.

## Journey audit

| Step | Current behavior and health | Friction / recommendation |
|---|---|---|
| 1. First open and value proposition | A dedicated, bilingual welcome page establishes Rinemi as a Kanji-learning product. **Mixed.** | The first prominent action previously advanced to another explanation instead of starting learning. Replace the forced linear introduction with two clear paths: start now, or set up the first session. |
| 2. Explain the learning loop | A separate step explains learning, recall, and scheduled review. **Useful but optional.** | Keep it in guided setup; do not make it a mandatory prerequisite for a curious learner to try one card. The learning card itself should teach the reveal → recall → rate interaction in context. |
| 3. Choose a starting point | Learners can start from the beginning, indicate prior Kanji knowledge, or opt into placement. **Useful.** | Keep self-selection light. The suggested range is a starting aid, not a permanent level or an overall Japanese-proficiency claim. |
| 4. Placement | A 20-item assessment covers isolated Kanji-to-English-meaning recognition across N5–N2. **Useful for some, expensive for activation.** | Keep optional and accurately describe what it measures. Its per-band cutoff is an implementation heuristic, not a validated psychometric threshold. Do not force it before the first learning task. |
| 5. Daily workload | Guided setup offers 5/10/15 new Kanji per day and notes that new-card count is distinct from reviews. **Reasonable default.** | Explain the unit before a learner commits. Avoid promising a fixed number of minutes because the time cost depends on current due reviews and recall. The new quick-start also explains the default of five new Kanji per day and that reviews are scheduled separately. |
| 6. Account decision | Guest mode exists and account creation is optional. **Functional, but hierarchy was misleading.** | Make “Continue as a guest” the primary action and “Create account” secondary. Explain sync as the benefit of an account, not as a requirement to learn. |
| 7. First learning task | Completion invokes the existing engine session start; React does not need its own scheduler. **Strong foundation; activation path was buried.** | Make the first useful learning session one tap from welcome, and keep FSRS, learner-state, planner, grading, and persistence authority in the existing engine. |
| 8. Review ratings | Learning exposes Again, Hard, Good, and Easy. **Needs comprehension validation.** | Near the choices, explain them in learner terms (could not recall / effortful recall / recalled / recalled easily) only where those labels match the engine contract. Explain that the rating informs future scheduling; do not promise a fixed next interval unless the engine gives that exact interval. Keep buttons distinguishable without color alone. |
| 9. Progress after a session | Stats already includes daily reviews, seven-day activity, mastery distribution, and related evidence. **Good raw material.** | Start with meaningful evidence: items recalled independently, due reviews completed, skills needing more practice, and change over time. Do not equate studied-card count, self-report, or streak with proficiency. Keep detailed analytics in Stats, not on every Learning card. |
| 10. Return after missed days | Persistence and review scheduling exist, but this audit did not capture a real returning-user journey. **Validation pending.** | Test a return after 3, 7, and 14 days. Welcome with “Continue where you left off,” make due work clear, offer a manageable session and a smaller chunk, and avoid guilt, broken-streak warnings, or punitive resets. Do not erase due items or alter FSRS schedules merely to make the backlog look smaller. |
| 11. Dictionary, handwriting, Reading Lab | These experiences exist as secondary destinations; the menu uses a “More” surface. **Discoverability risk.** | After the first completed learning task, offer one dismissible, contextual next step: look up a character in Dictionary, try writing one character, or read a short Japanese text. Do not put three feature tours in the mandatory onboarding. Also add concise task-oriented empty-state entry points inside each feature. |
| 12. Ongoing weekly use | The product can display activity and mastery-like signals. **Metric semantics need discipline.** | Measure return sessions on distinct days and meaningful task completion. Treat streak as optional context, never as a moral score or the single definition of success. |

## Implemented in this branch

1. The welcome copy now explicitly offers an immediate small start or guided setup.
2. A prominent **Start learning now** action calls the existing guest completion path. That path applies the existing default of 5 new Kanji/day, clears onboarding's transient context, starts the normal learning experience, and marks onboarding complete. It does not add registration, a diagnostic, or a new scheduling implementation.
3. **Set up my first session** leads to the unchanged guided path for learners who want a chosen starting point or placement.
4. The quick-start helper says the default is five new Kanji per day, reviews are scheduled separately, and the limit can be changed later. Copy is provided in English and Persian.
5. At the final choice, **Continue as a guest** is the primary action; **Create account** and **Sign in** remain available as secondary choices.
6. Added E2E assertions for direct guest activation, completion-state cleanup, workload disclosure, and the primary/secondary account hierarchy.

No engine code, review rating semantics, card identity, learner model, planner, FSRS state, persistence schema, or sync path was changed.

## Recommended onboarding and retention design

### First minute

- Give learners two clear, equally honest choices: **Start learning now** and **Set up my first session**.
- Fast start immediately opens the normal Learning experience in guest mode with a clearly stated default of five new Kanji/day. Existing review scheduling still applies.
- Guided setup keeps the existing self-selected start and optional placement path. Keep the placement claim limited to isolated Kanji-meaning recognition.
- Make registration optional and secondary to learning. Present account creation when it solves a real need, such as syncing across devices, rather than asking first.

### First session to first week

- Make card actions teachable in context: recall first, reveal when ready, then rate how recall felt. Do not require prior tutorial completion.
- At session completion, show a compact reflection: reviews/new items completed, which items need another retrieval attempt, and the next sensible action. Avoid an analytics-heavy dashboard or exaggerated proficiency claims.
- When the learner first completes a meaningful task, reveal feature breadth progressively: one useful Dictionary entry point, then handwriting, then Reading Lab as context makes each relevant.
- For returning learners, show due reviews and a controllable session size. A missed day is normal; do not use alarmist copy or hide the option to do a smaller session.
- Encourage a sustainable cadence using weekly activity and learning signals, not a perfect daily streak. Allow learners to disable streak display if it distracts from learning.

### Meaningful progress

Prioritize: independent-recall outcomes with their modality stated; due reviews completed; performance on cards that have actually reached a later review; skill-specific next steps; and distinct days studied in a week. Label small samples as limited evidence. Do not treat handwriting path similarity, reading coverage, recognition-only answers, or a “Good” self-rating as direct proof of general Japanese proficiency.

## Minimal product metrics: definitions and data requirements

These definitions are designed to avoid ambiguous denominators. They are not yet computed because the product does not currently send a justified cross-user analytics stream.

| Metric | Exact definition | Minimum data required | Caveat |
|---|---|---|---|
| **Activation within 24 hours** | Numerator: first-time learners who commit at least one completed learning answer/rating within 24 hours of first open. Denominator: first-time learners whose full 24-hour window has elapsed. Report numerator/denominator and rate. A page load, reveal, or account creation alone is not activation. | First-open timestamp, first-run vs returning classification, committed learning result with timestamp. | Anonymous per-install measurement can miss cross-device identity and cannot by itself establish a new human learner. |
| **Time to first meaningful result** | Median elapsed time from first open to first committed learning answer/rating among activated learners; also report the unactivated share separately. | First-open timestamp and first committed task timestamp. | Report median and a percentile (e.g., p75); do not hide people who never activate by reporting only this metric. |
| **Review completion** | For each review session, due items completed / due items in the queue when the session began. Report both the distribution of session completion ratios and the share of sessions that reach 100% of their starting due queue. New-card introductions are a separate denominator. | Session start, due queue size at start, completed due-review count, session end/abandonment. | Define whether skipped/suspended cards count consistently; do not make sessions appear complete by changing the denominator after start. |
| **Week-one retention (W1)** | Among first-time learners whose first-open date is at least 13 full days ago, share with one or more meaningful study sessions during local days 7–13 after first open. A meaningful session has at least one committed learning answer/rating. | Stable, pseudonymous cohort key (only with consent), first-open date, dated meaningful-session records. | Show the cohort size and use one timezone policy; do not infer retention from notification opens. |
| **Week-four retention (W4)** | Same construction, with a matured denominator at least 34 days after first open and a meaningful session on any local day 28–34. | Same as W1, retained for at least 35 days. | Delayed cohorts must not be counted as failures before their window closes. |
| **Successful task completion by feature** | Per feature: completed tasks / tasks started, where completion is feature-specific: a review is committed; a handwriting attempt receives feedback; a Dictionary task opens a matched result/detail (not merely keystrokes); Reading Lab analysis runs and the learner performs a defined reading action, such as opening a contextual word or moving through a sentence. | Coarse task-start/task-complete events with feature name and timestamps. | Keep each feature's denominator separate; “opened” is not equivalent to “learned.” |
| **Weekly study consistency** | Mean and distribution of distinct local days per 7-day window with at least one meaningful study session. Report alongside W1/W4 retention, not as a replacement for it. | Date of meaningful sessions. | Does not punish learners for choosing a non-daily schedule. |
| **Delayed recall evidence (later-stage)** | For items that become due again, proportion with an independent successful recall, segmented by exercise modality and sample size. The exact outcome must be the authoritative engine's evidence—not inferred from a “Good” button alone if that button can also follow a reveal. | Due-review outcome, modality/assisted-vs-independent evidence, due status and timestamps. | Observational data does not prove causal improvement; stratify by modality and maturity rather than mixing recognition and production. |

### Privacy boundary and instrumentation decision

**No new remote analytics or event-level telemetry is added in this change.** The app is local-first, and the roadmap explicitly discourages invasive analytics when a controlled diagnostic or product contract would suffice. Source-level review shows existing session/review/state foundations that can support local aggregate reflection, but cross-user W1/W4 cohort analysis requires additional privacy and consent decisions.

If product research later justifies cohort telemetry, begin with an explicit opt-in and a small first-party event schema: `first_open`, `onboarding_path_chosen` (quick/guided/placement), `session_started` (coarse due/new counts), `task_started`/`task_completed` (feature only), and `review_committed` (rating family plus independent/assisted modality). Use coarse timestamps and a random first-party cohort key with a documented 35-day retention period, opt-out, and deletion. Do **not** collect typed answers, raw drawings/stroke paths, personal mnemonics, pasted Reading Lab text, exact Dictionary search queries, emails, third-party advertising IDs, or cross-site identifiers. Aggregate locally wherever the question can be answered on a single installation.

Before building telemetry, first verify whether current session aggregates can answer product questions locally and run moderated first-use/usability sessions. A metric is not sufficient justification for collecting data: the decision it will change must be stated in advance.

## Evidence and research context

- **Repository contract:** `docs/ONBOARDING-SPEC.md`, `frontend/src/app/onboarding/OnboardingFlow.tsx`, `frontend/src/app/onboarding/OnboardingEntry.tsx`, `frontend/src/app/onboarding/onboarding-model.ts`, `frontend/src/app/onboarding/onboarding-persistence.ts`, `e2e/react-onboarding.spec.mjs`, and `ROADMAP.md`. Starting point and daily-new settings go through existing engine APIs; this change does not create another scheduler.
- Trumble et al., *Systematic review of distributed practice and retrieval practice in health professions education* (2024): https://link.springer.com/article/10.1007/s10459-023-10274-3. Across 63 experiments, 43 reported significant benefits of distributed practice and/or retrieval practice over controls/comparisons; the authors also note study heterogeneity and the need for valid outcome measures. This supports building around retrieval and distributed review, not time spent in the app alone.
- Inter-American Development Bank, *Streaking Towards Success: The Effects of Highlighting Streaks on Student Effort and Achievement* (randomized field experiment with approximately 60,000 primary-school learners in Peru): https://publications.iadb.org/en/streaking-success-effects-highlighting-streaks-student-effort-and-achievement. This is evidence that streak cues can alter engagement in a specific setting—not a mandate to use streaks in every product, nor justification for guilt, urgency, or treating continuity as learning mastery.

## Verification still required

- Run the new and existing onboarding Playwright tests on this PR head, alongside TypeScript/frontend build and required release workflows.
- Check English and Persian at mobile and desktop sizes, keyboard focus/order, screen-reader names, reduced motion, and short landscape. This source review did not replace that device/accessibility acceptance.
- Verify a learner who completes quick start sees an actual first learning card and can commit a rating without a registration prompt; verify the guided path retains its placement and settings semantics.
- Run return-after-absence scenarios (3/7/14 days) and validate the exact effects of Again/Hard/Good/Easy with the engine's scheduling contract.
- After merge/deploy only, smoke the published app and verify that the live artifact matches the approved commit. An open PR is not deployment evidence.


## Implementation and verification handoff — 2026-10-17

### Change record

- **PR:** [#562 — feat(onboarding): shorten time to first learning session](https://github.com/ArdKam/kanji5/pull/562)
- **Working branch:** `fix/onboarding-first-session-20261017`
- **Code-bearing head verified in this handoff:** `c5a97c74f6d303e1588190ab5ce83fc3f34f3a10`
- **Status:** open, draft, not merged; no production deployment is claimed.
- **Scope:** welcome copy/actions, bilingual copy, onboarding E2E selectors/coverage, this audit, and its additive roadmap handoff. Learning-engine authority and persistence contracts are unchanged.

### Regression found and fixed

The first React presentation E2E attempt failed because `e2e/react-presentation-migration.spec.mjs` still expected the previous Persian welcome CTA `شروع کنیم`. The new UI's guided CTA is `تنظیم جلسهٔ اول`; both stale assertions were updated. Other guided-path selectors in onboarding/account/theme/design-coverage and live-smoke script coverage were aligned with the new CTA.

**Rerun evidence on the code-bearing head `c5a97c7`:**
- React presentation E2E: **passed**.
- React accessibility gate: **passed**.
- React PWA release gate and final release matrix: **passed**.
- WebKit compatibility workflow: **passed** (11/11 steps).
- Automated UI visual audit: **passed** (14/14 steps).
- React presentation build workflow run [#3821](https://github.com/ArdKam/kanji5/actions/runs/39014636590): still **in progress** at the last check, with 42/53 main-job steps completed and the Data Trust tab-persistence gate active; no failures were reported in the inspected state.

These checks are evidence for the listed PR head only. A documentation-only follow-up commit and base-branch reconciliation may trigger a newer run; refresh the PR and verify the exact latest head before treating CI as complete.

### Safe next actions

1. Confirm all required workflows finish successfully on the exact latest PR head. If a new failure appears, diagnose it before updating status.
2. Keep PR #562 draft until the full build, required E2E/accessibility/PWA/release gates, and visual audit are green.
3. Review the merge-base/current-main state. Other contributors appended a runtime-initialization handoff in `ROADMAP.md` after this branch was started; preserve it verbatim and merge/reconcile the latest main rather than overwriting that work.
4. After merge, record the merge SHA, rerun applicable current-main gates, then verify deployed artifact parity and production smoke. Do not describe an open-PR check as merge, current-main, or deployment evidence.

### Explicitly not done

- No user-level or remote analytics instrumentation was added.
- Return-after-absence behavior for 3/7/14-day gaps has not been validated in a real runtime session.
- Rating explanations have not been changed; validate them against the authoritative scheduler contract before editing.
- Dictionary/handwriting/Reading Lab contextual discovery changes remain recommendations, not implementation in PR #562.
- Activation and W1/W4 retention are metric specifications, not measured results; use a consent/purpose review before adding cross-device cohort telemetry.


## Concurrent-document reconciliation — 2026-10-17

The stale branch was reconciled without editing or removing another contributor's audit content.

- Latest main included during reconciliation: `e6cd4c120a7faece53c1e1bba9846a4c6d043004`.
- Reconciliation commit on the PR branch: `b3038115c62369d579169b2dc9d0df3fa345ed27`, with both the current-main commit and previous PR branch head `46b249bde713482d420317c21d7dbc7944f0152d` as parents.
- The merge tree is based on current main, then overlays only the PR's own changed paths. The current-main additions for product strategy, learning-effectiveness planning, and the runtime-initialization audit were preserved. `ROADMAP.md` contains those latest main contents verbatim plus the new section 29 handoff.
- A direct compare of current main against the reconciled branch reports **0 commits behind** and changes in only these 10 intended files: `ROADMAP.md`, this audit, the four onboarding/visual E2E files, `frontend/src/app/i18n.ts`, `frontend/src/app/onboarding/OnboardingFlow.tsx`, and `scripts/verify-live-pages-e2e.mjs`. No runtime-initialization implementation files are part of this PR's current diff.

### CI refresh after reconciliation

Because the reconciliation creates a new PR head, earlier successes on `c5a97c7` remain historical evidence for that code-bearing head; the latest head must be checked independently.

- New React presentation workflow: [#3841](https://github.com/ArdKam/kanji5/actions/runs/39015336529) — **in progress** at last inspection; `npm run typecheck` and `npm run build` passed, the root contract/unit suite was active at 20/53 main-job steps, with no failures reported in the inspected state.
- New automated UI visual audit: [#670](https://github.com/ArdKam/kanji5/actions/runs/39015336453) — **in progress** at last inspection, with 8/13 steps complete and no failures reported.
- WebKit compatibility for workflow #3841 was completing its final cleanup step after the smoke itself passed; confirm the overall run conclusion.

**Next action:** inspect the exact current PR HEAD and poll the React presentation and visual-audit workflows attached to that exact commit. Immediately before this note was refreshed, a documentation-only follow-up had advanced the PR head to `10fc48a39f4e87c9f7ce6784c52151562c712091`; its new React presentation run [#3843](https://github.com/ArdKam/kanji5/actions/runs/39015402752) was queued and visual audit [#672](https://github.com/ArdKam/kanji5/actions/runs/39015402875) was pending. **This audit-file update itself may advance the PR head and retrigger checks**, so those run numbers are historical snapshots, not a substitute for checking the current PR page. Keep PR #562 in draft until the complete required CI set is green. Do not update the main roadmap directly from a stale branch copy; future edits should fetch the current main version and append narrowly, or use a new evidence file if another author is editing the same section.
