# Kanji5 — Unified Product, Engineering & Public-Release Roadmap

> **Canonical roadmap:** this document is the forward-looking source of truth for Kanji5 product, engineering, public-release readiness, and the staged expansion from Kanji → Vocabulary → Context/Reading → Grammar.
>
> **Implementation baseline reviewed:** `main` at the current documentation baseline `f0c75285f4cee2e3df5ab1d419b8d43dc04dd0b9` (2026-10-06). This baseline includes merged R4–R6 Data Trust (#467), C4 educational-validity work (#469), R11 observability hardening (#463), final Kanji public UX/accessibility work (#464), and the A1 account/Production Recall fixes (#471/#472). The release-candidate process itself has already been exercised repeatedly; it must not be re-added to the backlog merely because the documentation baseline advanced.

> **Important status rule:** only work present on the current \`main\` baseline counts as complete. Open PRs and stale branches are never completion evidence by themselves; they must be compared with current \`main\` and either superseded, rebuilt, or explicitly closed. Never re-open a roadmap item marked DONE unless current-main evidence shows a regression or missing acceptance criterion.

---

## 0. Product direction

Kanji5 started as a personal PWA for learning essential Japanese kanji. The project is now being prepared for broader public distribution.

The product must therefore satisfy two goals at the same time:

1. Preserve the strengths of the original personal tool:
   - local-first behavior
   - deterministic learning behavior
   - FSRS-based scheduling
   - adaptive learning
   - offline operation
   - lightweight daily practice
   - a calm, focused learning experience

2. Become robust enough for users who have never seen Kanji5 before:
   - clear product positioning
   - understandable onboarding
   - trustworthy data persistence and recovery
   - predictable account/sync behavior
   - installable and reliable PWA behavior
   - accessibility
   - responsive/mobile quality
   - performance
   - security and privacy
   - support and feedback paths
   - observable production failures
   - controlled release and migration processes

The product should expand in layers rather than turning into an all-in-one Japanese-learning platform prematurely.

### Product learning loop

**Learn → Recall → Review → Recover → Improve**

Vocabulary, Context/Reading, and Grammar must reinforce that loop rather than compete with it.

---

# 1. Architecture and product guardrails

These rules remain authoritative throughout the roadmap.

### 1.1 Learning-engine authority

- FSRS remains the scheduling authority.
- The v1.9 Learner Model remains the learner-state authority.
- Adaptive Planner remains the content-selection/planning authority.
- Recovery remains the recovery authority.
- Evaluation/grading remains the learning-engine authority.
- Persistence remains an engine concern, not a React concern.
- React remains presentation-only.
- Do not duplicate authoritative learner state inside React.
- Do not introduce a second scheduler for Vocabulary, Context, or Grammar.
- Domain-specific planning may influence practice selection but must feed through the existing scheduling/evidence seams.
- Do not rewrite the learning engine merely to make a new UI possible.
- Only verified defects justify reopening or rewriting authoritative engine behavior.

### 1.2 Cross-domain identity

Use stable domain-scoped Content IDs and separate Card IDs.

Examples:

- \`kanji:日\`
- \`vocabulary:jmdict:12345\`
- \`context:tatoeba:12345\`
- \`grammar:pattern:te-form\`

Card identity must remain separate from content identity and incorporate the learning skill/exercise identity where needed.

Do not use display strings as long-term identity.

### 1.3 Evidence

All learning domains should eventually emit a shared evidence envelope preserving:

- domain
- contentId
- mode/skill
- exercise
- outcome
- attempt type
- modality
- independent/recovery semantics
- grader/model/planner version metadata
- provenance/source version where relevant

Raw learner input should not be persisted unless the educational product explicitly requires it.

### 1.4 Offline-first

All core learning behavior must remain deterministic and usable offline.

External APIs are content providers or optional fallbacks, never authorities for learner state or learning logic.

### 1.5 Minimal-diff rule

Prefer targeted seams and adapters over wholesale rewrites.

Especially avoid:

- replacing FSRS
- replacing the Learner Model
- replacing the planner because of presentation needs
- large persistence migrations without measured need
- broad file restructuring during active feature work

---

# 2. Status legend

- **DONE** — verified as implemented on the current \`main\` baseline.
- **PARTIAL** — meaningful implementation exists but the complete product behavior is not finished.
- **PENDING** — required but not yet complete on current \`main\`.
- **BLOCKER** — must be completed before the dependent phase can be considered production-ready.
- **LATER** — intentionally deferred until evidence or scale justifies it.
- **DO NOT REOPEN** — completed foundational behavior that should not be rewritten without a verified defect.

## 2.0 Pre-Beta Hard Gate

The following are release blockers, not merely roadmap work items. Public beta invitation requires evidence on one frozen/tagged candidate SHA for each applicable item:

- **Release integrity:** green CI, successful Pages deployment, exact live artifact/hash equality, production smoke, cache/stale-client recovery, and offline smoke.
- **Trust/data safety:** production auth lifecycle, RLS verification, canonical Supabase schema path, account/local deletion, export, and backup/restore including rollback/version-mismatch evidence.
- **Security:** CSP, classified unsafe `innerHTML` sinks, reviewed/vendored security-sensitive runtime dependencies, dependency audit, secret/source-map review, and third-party runtime inventory.
- **Failure containment:** global render/runtime recovery with actionable reload/backup/report behavior plus controlled diagnostics.
- **Public UX:** onboarding/placement completion on representative mobile and desktop environments, with no blocking navigation/data-loss defects.
- **Accessibility/device:** Tier 1/Tier 2 matrix evidence, manual VoiceOver/TalkBack/keyboard/zoom checks, and representative performance measurements.
- **Content trust:** documented Kanji QA sampling, provenance labels, correction/reporting flow, and placement/content-match edge-case review.
- **Governance/docs:** final Privacy/Terms, deletion/export semantics, third-party disclosure, LICENSE, release procedure, and reconciled product metadata.

Configured workflows, open PRs, and prior-release evidence do not satisfy this gate by themselves.

### 2.0.1 Educational Content & Assessment Hard Gate

The 2026-10-06 educational/content audit is recorded in `docs/EDUCATIONAL-CONTENT-AUDIT.md`. C4 PR #469 is merged into current `main` at `81957a6065c7b271a3a697e0f41fd25f8bb048d8`. It is counted as implemented on `main`, but remains **PARTIAL for educational acceptance** until the remaining educational acceptance gates are independently satisfied. It identifies gaps between educational architecture, learner-facing content, assessment validity, and feature claims.

Before Public Beta, the following educational gates are release blockers:

- **Placement validity:** randomize answer position; use a documented item blueprint; remove level decisions based on tiny samples; define boundary/uncertainty handling; keep the diagnostic explicitly limited to Kanji starting-point knowledge rather than overall Japanese proficiency.
- **Production fidelity:** make independent Kanji production the primary path; keep reveal/self-report and multiple choice as lower-evidence hint/recovery paths; preserve independent/assisted/revealed evidence semantics.
- **Vocabulary/Context fidelity:** distinguish recognition/cued recall from independent production; provide an explicit progression toward typed/free recall where the feature name claims production or retrieval.
- **Learner-content layer:** separate learner-priority meanings/readings/examples from raw dictionary/reference glosses without deleting source data; tier readings into core vs secondary/reference targets.
- **Example/context quality:** validate not only structure and provenance but learner level, usefulness, naturalness, translation quality, and pedagogical value for sampled content.
- **Mnemonic quality:** retain the curated/generated/personal distinction; treat 100% coverage as insufficient evidence of 100% quality; expand human-reviewed curated coverage over time.
- **Learning-evidence validity:** do not present coverage, self-report, recognition, or geometric handwriting similarity as stronger evidence than the underlying modality supports.
- **Educational efficacy:** distinguish implementation/test success from demonstrated learning benefit; use delayed/independent evidence before claiming adaptive superiority or tuning the planner from observational data.

A feature may remain technically implemented while its educational validity remains PARTIAL. Such a feature is not considered fully public-beta-ready until the applicable educational acceptance criteria are met.

---

## 2.0.0 Agent-safe completion register — 2026-10-06

This register is intentionally explicit so future contributors and agents do not restart completed work from historical roadmap text.

### R12 — repository implementation COMPLETE; acceptance OPEN

- **Implementation status:** **DONE / LANDED** on `main` through PR **#468**, merged at `fa37b536a50cf120b8f20062adcab57fc50d4bf2`.
- **Do not reimplement, re-audit from scratch, or reopen R12 repository hardening** unless a concrete regression or newly introduced security finding is demonstrated on current `main`.
- R12 hardening already landed includes the audited unsafe-DOM/XSS cleanup, restrictive CSP/remote-runtime hardening, pinned/vendored Supabase client, backup integrity and payload bounds, dependency/source-map/security gates, and production RLS/non-owner denial verification.
- **What remains is acceptance evidence only:** current-main security gate execution, same-SHA deployed artifact/header/live-smoke evidence, and clearance of the production `auth_leaked_password_protection` finding.
- The leaked-password-protection finding is an **external Supabase configuration/plan blocker**, not missing R12 repository implementation. Do not attempt to solve it by duplicating R12 code in the repository.
- Historical R12 PR CI is evidence of the PR branch only; it must not be presented as current-main CI evidence.
- If no R12 regression is demonstrated, **skip R12 implementation and proceed to the next roadmap item** while carrying these acceptance items as release evidence work.

### Documentation rule for future work

For every major task/stream, once implementation lands, record **(1) implementation status, (2) exact merge/commit evidence, (3) remaining acceptance-only items, (4) explicit blockers/ownership, and (5) a DO-NOT-REOPEN instruction** in the canonical roadmap and the relevant evidence document. Historical PR sections must never override the current-main status ledger.

### 2.1 Verified current status ledger — 2026-10-06

Only work present on current `main` counts as implemented. PRs that are open or stale are not completion evidence.

**DONE on current `main`:**
- Bootstrap/runtime and React artifact hygiene.
- Guest-first account safeguards and learner-state preservation/boot recovery.
- Product positioning foundation, public Help/Browser/Privacy/Feedback surface.
- R11 runtime failure diagnostics/observability implementation and React render-failure recovery are present on current `main` (merged #463 plus the earlier merged render-containment work); final production/release verification remains part of the release lock.
- R2 onboarding implementation is present on current `main` (merged #451/#453/#454/#456); representative device/release evidence and educational validity evidence remain separate gates.
- Final Kanji public UX/accessibility pass is present on current `main` via merged #464, covering concrete Learning, Active Recall, Stats, Settings, Dictionary, Reading Lab, Mnemonics, and Handwriting defects. Representative-device and assistive-technology evidence remains a release gate.
- D1/D2/D3/D4/D5 cross-domain foundations.
- Stats/Advanced Stats/learning-efficacy foundations.
- Learning vs Active Recall, Learning Card pager/swipe/rating, keyboard/mobile contracts.
- Reading Lab session/lookup/navigation/audio/speech/translation/annotation foundation.
- Dictionary mobile/personal-mnemonic behavior.
- Settings exercise toggles, Placement ownership, Data Backup/Restore foundation, reset separation.
- Mnemonic information architecture, provenance, prepared coverage and current structural QA; educational-quality gaps remain tracked under C4.
- PR #396 release-path hardening: explicit PWA install metadata/assets, public-doc staging, compatibility CI environment fixes, and support-link CSS budget fix.

**PARTIAL / remaining before Public Product Readiness:**
- A1 release integrity / RC execution: **DONE as a release-candidate process**. The project has already gone through repeated exact-SHA RC/CI/Pages verification cycles, including the A1 account-dialog and Production Recall keyboard fixes (#471/#472). Do **not** treat “run the release candidate again” as an implementation backlog item. A final release lock is a promotion/evidence action only when a new release candidate is intentionally frozen.
- R2 onboarding redesign is **DONE on current `main`**: dedicated first-open value/setup/placement/account flow is implemented, guest-first, and covered by desktop/mobile E2E. Remaining work is release/real-device evidence plus the C4 educational validity gate for placement.
- R4/R5/R6 implementation is **DONE on current `main`** via merged #467: domain-neutral storage adapter, bounded operational review history with cumulative aggregates, and versioned/integrity-checked backup with rollback journal. Remaining work is external acceptance evidence only: authenticated production sync/conflict verification and physical real-device Backup/Restore success/failure/rollback evidence.
- R7 install/update/reinstall behavior needs Tier 1/Tier 2 device evidence.
- R8/R9 offline and browser policy exist, but current-main/live/real-device evidence remains.
- R10 full i18n audit remains.
- R11 is **DONE as implementation on current `main`**: merged #463 closes runtime diagnostic gaps across service-worker, dynamic-import, network, migration, sync, and asset failure paths, while the previously merged React render-failure containment provides actionable recovery. Final production failure-injection/release evidence remains required.
- R12 implementation is **DONE on current `main`** via merged #468 at `fa37b536a50cf120b8f20062adcab57fc50d4bf2`. Production RLS/non-owner denial is verified and the repository security hardening is landed. R12 remains **OPEN for external acceptance only**: the production Supabase Security Advisor still reports `auth_leaked_password_protection`, and the exact post-merge CI/Pages artifact evidence must be recorded before security sign-off.
- R13 Terms, exact production-service disclosure, account/local deletion semantics, retention/export behavior, and target-market legal review remain.
- R14 docs are now staged in the release path; production smoke verification remains.
- R16 public Vocabulary/Context provenance rules remain to be finalized.
- R17 complete new-user-to-recovery journey is not yet demonstrated on real target environments, including production account lifecycle, recovery UI, backup/restore, and failure containment.
- **Educational validity audit:** placement, Production/Vocabulary/Context modality fidelity, learner-facing meaning/reading prioritization, example/context curation, mnemonic quality, and evidence-interpretation gaps are documented in docs/EDUCATIONAL-CONTENT-AUDIT.md. PR #469 is merged into current `main` at `81957a6065c7b271a3a697e0f41fd25f8bb048d8`. Its final pre-merge React presentation verification was green (40/40 gates). C4 remains PARTIAL only for the remaining educational acceptance gates: representative psychometric/placement validation and independent human/content QA against the final release candidate.

**PENDING:**
- R18 Public Beta.
- R19 Public Release Gate.
- E Vocabulary MVP.
- F Context/Reading integration.
- G Grammar foundation.

**DO NOT REOPEN without a verified regression:**
- A2, A3, A5, A6.

**Implementation complete, educational-quality follow-up remains active:**
- A7 mnemonic infrastructure/provenance/coverage.
- D1, D2, D3, D4, D5.

**Current release-critical open PRs not yet counted as complete:**
- #468: R12 security hardening — **MERGED** into `main` at `fa37b536a50cf120b8f20062adcab57fc50d4bf2`; production security acceptance remains open for the verified leaked-password-protection finding and exact post-merge release evidence.
- #465: R13 privacy/legal reconciliation (governance/legal work remains off `main` until reviewed/merged).

**Recently merged and present on `main`:**
- #467: R4–R6 Data Trust implementation.
- #469: C4 educational content/assessment implementation; educational acceptance remains PARTIAL.
- #471/#472: A1 account-dialog and Production Recall keyboard fixes.

**Merged and now present on current `main`:**
- #467: R4–R6 Data Trust implementation.
- #469: C4 educational content and assessment validity; educational acceptance remains PARTIAL.
- #471/#472: A1 release-gate fixes.

**Documentation reconciliation:**
- The current roadmap/release ledger has been updated to distinguish completed RC execution from the final promotion lock and to avoid counting merged R4–R6 as pending implementation.

**Superseded/stale PRs that must not be treated as pending implementation:**
- #392: superseded by merged R11 work in #463.
- #398: superseded by current-main roadmap reconciliation.
---


### 2.2 Canonical pre-Vocabulary execution sequence — 2026-10-03

All work before Vocabulary must follow this order. Work may overlap only when it does not compete for the same authoritative boundary or shared files.

**Stage 1 — Release Lock**
- Establish one current-main release candidate.
- Finish CI for that SHA.
- Freeze one release-candidate SHA/tag.
- Record green CI for that exact SHA.
- Verify GitHub Pages deployment, exact live artifact/hash equality, live core smoke, cache invalidation, stale-client recovery, and offline smoke.
- Record all release evidence against that exact SHA in `docs/RELEASE-EVIDENCE.md`.
- No unrelated feature work should enter the release-critical path until the candidate is trustworthy.

**Stage 2 — Trust Layer**
- Complete account lifecycle: guest → account → sync → logout → return.
- Verify Google, Email, Magic Link, and reset flows in production configuration.
- Complete Supabase/RLS review against the production project and consolidate duplicate schemas into one canonical migration path.
- Verify production auth flows (Google, email, magic link, reset) end-to-end.
- Make backup/restore versioned, integrity-checked, migration-aware, corruption-resistant, and safe; prove real-device restore, version mismatch, rollback, and non-destructive/atomic behavior.
- Define and implement account deletion, local-data deletion, export, retention, and third-party data semantics, then verify the deletion path in production.
- Harden the security supply chain: CSP, `innerHTML`/unsafe-DOM audit, vendor/pin the Supabase client, and add dependency audit/maintenance controls.
- Complete Privacy/Terms/legal review against actual production services and target markets.

**Stage 3 — Public UX**
- Finish onboarding redesign without making account creation mandatory.
- Complete final UX passes for Learning, Active Recall, Stats, Settings, Dictionary, Reading Lab, Mnemonics, and Handwriting.
- Close responsive, RTL/LTR, typography, loading/error/empty-state, keyboard, focus, touch-target, modal, safe-area, and mobile-keyboard defects.
- Keep Learning and Stats information architecture separate.
- Add only small high-value reliability UX that reduces user failure or confusion.

**Stage 4 — Real Device / Accessibility / Performance**
- Validate the Tier-1 and Tier-2 browser/device matrix.
- Test installation, update, reinstall, offline/reconnect, persistence, sync, backup/restore, and accessibility on representative hardware.
- Run manual VoiceOver, TalkBack, keyboard-only, focus, zoom, and mixed RTL/LTR checks.
- Record LCP, INP, CLS, startup, long tasks, bundle/font cost, and slow-device behavior.
- Optimize only where evidence identifies a meaningful product bottleneck.

**Stage 5 — Content Quality**
- Establish recurring QA for all 2,136 Kanji with a documented sampling protocol and recorded results.
- Audit readings, meanings, examples, stroke data, radicals/components, pronunciation fallback, and mnemonic quality; explicitly recheck known grading/meaning-match edge cases.
- Treat coverage as necessary but not sufficient.
- Add provenance labels and clear distinction between curated, generated/guided, and personal memory aids.
- Establish context-aware content-report and correction workflow for readings, meanings, examples, strokes, radicals/components, and mnemonics.
- Validate placement-test ambiguity/synonym handling before public beta.

**Stage 6 — Reliability / Security / Governance**
- Add production-grade error recovery and global failure containment.
- Add global failure containment and actionable recovery for React/render failures, including reload, backup export, and reporting.
- Finish observability for runtime, asset, sync, migration, service-worker, and dynamic-import failures.
- Complete dependency/security/supply-chain review, CSP policy, secret/source-map checks, third-party runtime review, and dependency automation/audit.
- Add/complete public repository governance: LICENSE, SECURITY, CONTRIBUTING, CODE_OF_CONDUCT where appropriate, issue/PR templates, stale-branch/PR cleanup, and release procedure.
- Reconcile README, CHANGELOG, ROADMAP, product naming, manifest, title/metadata, and user documentation with actual behavior.

**Stage 7 — Public Beta → Public Kanji Release**
- Run a small real-user cohort across target devices.
- Observe onboarding, first-session completion, placement quality, return behavior, offline use, sync, backup/restore, error recovery/reporting, content reports, and accessibility.
- Fix high-frequency/high-severity issues and add regression tests for accepted defects.
- Pass the final Public Release Gate before beginning Vocabulary implementation.

**Only after Stage 7 is complete:** start the real Vocabulary runtime/content integration. Existing cross-domain foundations may be prepared in parallel when they do not change the public Kanji release surface.
# 3. Current baseline and already-completed foundations

The current \`main\` baseline is commit \`c8ad297efc7718f6da55dc94b847b53b12f28fc7\`. Its implementation history immediately before the roadmap documentation includes:

- \`0a0df45\` — D5 context migration and offline cross-domain dependency precaching.
- \`75b9cb4\` — Stats learning-efficacy evidence surface.
- \`6a21c08\` — D3 deterministic cross-domain relationships.
- Earlier D1/D2 foundations remain on the same ancestry.

For Kanji UX status, the current \`main\` also contains the equivalent of older open work represented by recent commits such as:

- \`a2862e5\` — exposure-based Stats correction/hydration refresh.
- \`75073f9\` — compact Learning session feedback.
- \`be9a5d4\` — Reading Lab occurrence coverage/hardest-sentence focus.
- \`547e4ad\` — narrow-mobile Dictionary section tabs.
- \`5fe001bd\` — mnemonic generated-quality scaffolding/coverage work.

These are not hypothetical contracts anymore; concrete source modules and behavioral tests exist on \`main\`.

Current cross-domain files include:

- \`v2-domain-core.js\`
- \`v2-evidence-core.js\`
- \`v2-relationship-core.js\`
- \`v2-vocabulary-core.js\`
- \`v2-vocabulary-learning-core.js\`
- \`v2-vocabulary-view-core.js\`
- \`v2-vocabulary-contract-core.js\`
- \`v2-vocabulary-ui-adapter.js\`

Vocabulary already has foundation tests covering:

- identity
- normalization
- validation
- evidence
- recovery
- view models
- page contracts
- UI adapter behavior
- network normalization

Therefore, the next task is **not** to invent the Vocabulary foundation from scratch. The next task is to connect the existing foundation to a real runtime, stable local content, and the public product surface.

---

# 4. Phase 0 — Release Integrity & Real Baseline

## Goal

Establish a trustworthy production baseline before product expansion.

### 0.1 Runtime/bootstrap integrity — DONE / KEEP VERIFIED

- Ensure \`app-bootstrap.js\` is present and loaded by the production entry path.
- Preserve the correct runtime chain:
  \`index.html → app-bootstrap.js → v1.9-v2-boundary.js → react-entry.js → React presentation\`.
- Keep legacy runtime explicitly behind \`?legacy=1\`.
- Do not allow accidental legacy/default presentation fallback.

### 0.2 React artifact hygiene — DONE

- Keep \`react-dist/\` out of git.
- Generate shipped React artifacts during deployment.
- Build from source during CI/deploy.
- Verify the exact artifact that is shipped.

### 0.3 Deployment gates — CONFIGURED; same-SHA release evidence still required

Current deployment workflow contains gates for:

- frontend typecheck
- frontend build
- shipped-artifact validation
- performance/font-loading contract
- service-worker shell contract
- release-integrity contract
- root contract/unit tests
- Playwright engine↔React boundary gate
- staged site verification
- live GitHub Pages artifact verification

PR #396 evidence: the complete React release matrix and engine build passed on head \`2bb01e010f791320eed0d80852b79234789a3330\`. After merge to \`c8ad297efc7718f6da55dc94b847b53b12f28fc7\`, React push run **2488** is still in progress; engine push run **2324** has passed.

A workflow definition is not evidence that a particular commit succeeded. Release records must distinguish:
- workflow configured
- workflow executed
- workflow passed
- live production verified
- release candidate frozen/tagged
- live artifact/hash equality recorded

### 0.4 Cache and stale-client handling — current deployment green; candidate evidence must still be frozen and recorded

- Verify cache invalidation across HTML, JS, CSS, service worker, and dynamically imported assets.
- Verify stale-client recovery.
- Verify no previous release can trap a user in a broken asset graph.
- Treat dynamic-import failures as release blockers.
- Keep service-worker shell and runtime asset lists synchronized.

Evidence: PR #376 verified stale-release cache eviction and offline shell recovery; PR #396 re-verified the updated release path. The current `main` Pages deployment is green, but the release ledger must still tie live artifact/hash, cache, offline, and smoke evidence to the frozen candidate SHA.

### 0.5 Production smoke test

For every release candidate:

- cold load
- repeat load
- hard refresh
- offline after first successful visit
- offline cold start where supported
- app restart
- learning session start
- card reveal
- answer/rating
- session completion
- stats refresh
- settings read/write
- backup export
- account state
- PWA update path

---

# 5. Phase A — Finish the Kanji Foundation

This phase makes the existing Kanji product trustworthy before new learning domains become first-class.

---

## A1. Release/runtime integrity

### DONE — 2026-10-05

The release/runtime integrity gate is verified through the exact promoted main candidate and production deployment.

- React presentation workflow passed all 43 release steps on the candidate SHA.
- GitHub Pages deployed the same candidate SHA and recorded the same `pages_build_version`.
- Staged/live SHA-256 equality passed for `index.html`, `react-entry.js`, `sw.js`, React JS, and React CSS.
- Live production smoke passed first open, React shell/bootstrap, Learning reveal/rating, review persistence across reload, Active Recall, Dictionary, Reading Lab persistence, Stats, Settings/backup, Account, cache checks, and uncaught-error detection.
- Offline and stale-client PWA gates passed.
- Firefox, WebKit, accessibility, final release matrix, onboarding, account, mnemonic, Learning/Review, and Production Recall release gates passed.
- Startup performance budgets passed for desktop and the 390×844 mobile profile.
- Release evidence is recorded in `docs/RELEASE-EVIDENCE.md`, bound to the exact immutable candidate commit.

No Vocabulary, Grammar, R4 persistence migration, R11 observability, R12 security redesign, C4 educational-content work, or unrelated product changes are included in A1.

## A2. Learning / Active Recall

### DONE on current \`main\`; DO NOT REOPEN without a verified regression

The current implementation and browser contracts cover the defined Learning/Active Recall separation, Learning Card hierarchy, pager/swipe/rating flow, compact session feedback, keyboard behavior, and exercise-toggle boundary.

### Remaining verification only

- Keep Learning and Active Recall conceptually separate.
- Learning Card must remain focused on:
  1. meaning/readings
  2. examples
  3. mnemonic
  4. stroke order
- Four card-page shortcuts must be real keyboard-accessible controls.
- Correct left-to-right shortcut ordering for the reversed conceptual sequence already defined by the product.
- Reliable next/previous navigation.
- Reliable swipe behavior.
- Rating/feedback stays in normal document flow above fixed-navigation clearance.
- Prevent answer/reveal UI clipping on mobile and with keyboard open.
- Preserve distinct Learning vs Active Recall information architecture.
- Keep first exposure, recall, guided practice, and recovery behavior understandable.
- Verify Production, Vocabulary, and Context exercise toggles reach the authoritative Active Recall engine.

### Session Details

The Learning page should **not** become a second Stats page.

Keep session feedback compact.

Do not restore analytics-heavy:
- mastery distribution
- seven-day analytics
- detailed session breakdown
- redundant skill analytics

to the Learning page.

Detailed analytics belong in Stats / Advanced Stats.

---

## A3. Stats correctness and information architecture

### DONE on current \`main\`; DO NOT REOPEN without a verified regression

Exposure-based studied/unseen/mastery corrections, first-read hydration, Advanced Stats, and deterministic learning-efficacy evidence are implemented on current \`main\`.

### Source-of-truth rules

- persisted learner exposure = source of truth for studied/seen/unseen
- learner-model states = source of truth for mastery buckets
- session aggregates = derived from authoritative session records
- React must not recompute authoritative learning state

### Fix and verify

- studied count
- unseen count
- mastery distribution
- skill percentages
- recent activity
- session aggregates
- first-open hydration
- refresh after underlying state mutation

Specifically prevent false states such as:
- previously studied users showing all skills at 0%
- 2,136 unseen after exposure exists
- mastery info not ready after normal startup

### Stats IA

Primary Stats should stay simple.

Add an explicit **Advanced Stats** layer for:

- attribute accuracy and attempt count
- recent vs lifetime performance
- recovery/repetition signal
- repeated-failure signal
- retention/progression when evidence exists
- attribute coverage
- mode distribution
- session completion
- average recalls
- trend

Do not create a dashboard maze.

Show insufficient evidence instead of misleading percentages.

---

## A4. Reading Lab

### Status — 2026-10-02

**DONE for current public-readiness scope.** Core session/navigation/audio work plus lightweight translation/annotation and optional Japanese voice selection are implemented and covered by E2E. Reading Library remains a later post-foundation feature.

### Core bug/UX requirements

- Preserve entered text when scrolling.
- Preserve selected words.
- Preserve scroll position.
- Preserve analysis state.
- Dictionary lookup must be an in-place auxiliary action.
- Do not destructively navigate away from Reading Lab.
- Returning from lookup must preserve all progress.
- Do not require the user to redo word-by-word inspection.

### Navigation

- Focus Next / Next Unknown
- Next Unfamiliar
- unique coverage
- occurrence-weighted coverage
- hardest / most attention-demanding sentence

All must use authoritative mastery state where applicable.

### Audio / context roadmap

- sentence autoplay
- repeat sentence
- manual previous/next
- SRT/VTT synchronization
- clear active cue
- optional voice selection where browser support exists

### Support layer

- lightweight sentence translation/annotation
- contextual word support
- compact mastery micro-popover

### Boundaries

Reading Lab must not:
- become a scheduler
- mutate SRS
- mutate authoritative grading
- maintain a competing mastery model
- become a generic AI chat or all-in-one language tutor

### Reading library

Later:

- saved readings
- source/title metadata
- resume state
- sentence mining
- Vocabulary/SRS integration only after Vocabulary identity/content/learning foundations are mature

---

## A5. Dictionary

### DONE on current \`main\`; remaining work is release verification only

Narrow-mobile tabs and dictionary personal-mnemonic draft preservation are implemented.

### Requirements

- Kanji tabs fit at 360/375/390px without overflow.
- preserve personal-mnemonic drafts through remounts/async loads
- predictable lookup/navigation state
- factual dictionary content separate from learner-state indicators
- readings, meaning, examples, stroke information prioritized
- avoid excessive density
- avoid navigation patterns that destroy Reading Lab state
- keep dictionary browsing distinct from active learning

---

## A6. Settings

### DONE on current \`main\`; remaining work is release verification only

Exercise toggles, Placement/Test ownership, Data Backup/Restore, and reset separation are implemented and contract-tested.

### Requirements

- active-learning exercise toggles remain authoritative and test-backed
- Production/Vocabulary/Context toggles reach the engine
- stable Save Changes positioning
- remove duplicate Placement Test entry points
- document canonical Personal Mnemonics location
- Data Backup / Restore
- deterministic safe restore semantics
- destructive/reset actions secondary and clearly separated
- settings persist through reload/offline
- settings do not accidentally reset navigation/session state

---

## A7. Mnemonics / memory aids

### Status — 2026-10-03

**PARTIAL for educational quality; infrastructure is implemented.** Prepared coverage remains 2,136/2,136 with 259 curated + 1,877 generated scaffolds. Provenance, persistence, structural checks, duplicate guards, and representative semantic sentinels are implemented. The audit now explicitly treats the large generated/scaffolded majority as a quality workstream rather than equating coverage with learner-tested quality.

### Information architecture

Clearly distinguish:

- curated prepared mnemonics
- generated/guided scaffolds
- personal mnemonics

### Requirements

- explain what each type is for
- ensure actual mnemonic content renders
- show provenance/type labels where needed
- do not imply generated material is curated
- adaptive disclosure
- preserve personal-mnemonic editing/persistence
- audit quality, not only coverage

Current milestone principle:

**100% coverage ≠ 100% quality.**

Continue auditing:
- semantic usefulness
- reading relevance
- ambiguity
- memorability
- malformed/missing entries

---

## A8. Responsive/accessibility/performance polish — DONE for current Kanji UX implementation; release/device evidence pending

### Responsive widths

Explicitly audit:

- 360px
- 375px
- 390px
- tablet
- desktop

### Accessibility

Target WCAG 2.2 AA-compatible behavior.

Audit:

- keyboard navigation
- focus visibility
- focus management
- screen-reader semantics
- live regions
- touch targets
- dialogs
- fixed bottom navigation clearance
- safe-area handling
- reduced-motion
- form/input semantics
- Japanese language tagging
- IME behavior
- error announcements

### Performance

Track:

- LCP
- INP
- CLS
- first interaction
- long tasks
- JS cost
- CSS cost
- font loading
- dynamic imports
- repeat startup
- offline startup

The previously observed poor startup/LCP behavior must be treated as a product issue, not a cosmetic issue.

Existing/open performance work must be rebased against current \`main\` before integration.

---

# 6. Phase B — Measurement and Learning Evidence

## B1. Core metrics

### Status — 2026-10-02

**DONE on current `main`.** Stats distinguish exposure, attempts, cards, mastery, and completion and reconcile with authoritative learner data.

Every metric must clearly distinguish:

- exposure
- attempt
- card
- mastery
- completion

Metrics must reconcile with authoritative data.

## B2. Advanced Stats

### Status — 2026-10-02

**DONE on current `main`.** Advanced Stats is optional, evidence-aware, read-only, and separate from the primary Stats surface.

Secondary and explicitly optional.

Expose:

- attribute accuracy
- attempt count
- recent vs lifetime
- recovery
- repeated failures
- retention/progression where evidence exists
- attribute coverage
- mode distribution
- session completion
- average recalls
- trend

Keep sample-size/evidence thresholds visible where interpretation is unstable.

Stats remain read-only.

## B3. Learning efficacy

### Status — 2026-10-02

**DONE on current `main`.** Deterministic learning-efficacy evidence is implemented without automatically tuning the planner from observational metrics.

Use deterministic evaluation to distinguish:

- product/runtime failures
- learner outcomes
- planner/recovery behavior

Do not automatically tune the planner from observational metrics.

---

# 7. Phase C — Content Quality

## C1. Kanji and mnemonic QA

### Status — 2026-10-03

**PARTIAL for learner-facing quality.** Coverage/provenance/structural QA are implemented, but learner-priority meanings/readings, example usefulness, ambiguous answer handling, and mnemonic quality still require the acceptance work documented in C4.

Audit:

- missing content
- malformed content
- semantic usefulness
- reading relevance
- ambiguity
- generated mnemonic quality
- prepared-vs-generated provenance

## C4. Educational content & assessment validity — BLOCKER for Public Beta

### Status — 2026-10-05

**PARTIAL — implementation gates materially advanced; Public Beta acceptance still blocked.** The C4 implementation now corrects the Production default, exposes conservative Vocabulary/Context modality labels, adds learner-priority meaning/reading projection, and surfaces placement uncertainty. The implementation-level placement position-bias screen now passes on the actual 2,136-item dataset; remaining Public Beta blockers are psychometric/representative response validation and independent human/content QA.

See docs/EDUCATIONAL-CONTENT-AUDIT.md for the full evidence and rationale.

### C4.1 Placement validity

**PARTIAL — core implementation complete; broader validity evidence remains.**

Implemented in the C4 release candidate:
- randomized answer order with stable option IDs;
- documented 4-item-per-level blueprint across N5–N2, sampling the beginning/middle/end of each level;
- 16-question onboarding diagnostic contract;
- stronger 3/4 per-level threshold instead of tiny-sample level decisions;
- retake reshuffling;
- explicit **Kanji starting-point diagnostic** wording rather than overall Japanese proficiency;
- regression coverage for answer-position assumptions and the 16-question contract.

Remaining before Public Beta:
- representative-response validation of placement stability/bias beyond the implementation-level shuffle screen;
- broader high-risk synonym/ambiguous-meaning fixture coverage;
- independent human/content QA recorded against the frozen release SHA;


### C4.2 Exercise-modality fidelity

**Updated on 2026-10-05.**

- Production: typed independent Kanji production is now the default; reveal/self-report and choice-hint paths are lower-evidence alternatives.
- Vocabulary: current UI is explicitly labeled cued Kanji completion.
- Context: current UI is explicitly labeled cued sentence completion.
- Evidence preserves modality, independence, recovery, and reveal metadata; hint-assisted production is recorded as `cued_production` rather than independent production.
- Preserve modality, independence, recovery, and reveal metadata in evidence and Stats.
- Ensure UI copy describes the modality actually being tested.

### C4.3 Learner-facing Kanji content model

**Implementation added on 2026-10-05; human QA still pending.**

The learner-facing projection now defines:

- primary meanings
- secondary/common meanings
- reference/dictionary meanings
- core readings
- vocabulary-supported readings
- reference readings
- learner-priority example words
- provenance/source version

Do not delete source meanings; reclassify their learner priority.

### C4.4 Vocabulary and Context content QA

**Implementation/fixture layer added on 2026-10-05; independent human QA remains required.**

For sampled and high-priority content, review:

- learner level
- frequency/usefulness
- naturalness
- translation quality
- target usage
- grammar burden
- unknown-vocabulary burden
- duplicate/near-duplicate examples
- rare/obsolete/unsuitable entries

Structural validation alone is not sufficient for public-beta content acceptance.

### C4.5 Mnemonic quality

**Provenance checks retained and regression-covered on 2026-10-05; human review remains pending.**

- Keep curated, generated/scaffolded, and personal mnemonics explicitly distinct.
- Grow curated coverage for high-frequency, high-confusion, irregular-reading, and visually deceptive Kanji.
- Add human review alongside structural/regex checks.
- Track usefulness/memorability samples rather than only coverage.

### C4.6 Learning-efficacy interpretation

- Do not equate exposure with mastery.
- Do not equate recognition with production.
- Do not equate self-report after reveal with independent retrieval.
- Do not equate Kanji coverage with reading comprehension.
- Do not equate handwriting geometric similarity with overall handwriting proficiency.
- Do not claim adaptive superiority until a baseline/delayed-evidence comparison exists.

### C4.7 Acceptance evidence

**Current status: PARTIAL.** C4 is not marked DONE. It is complete only when applicable:

- the Educational Content Audit has no unresolved P0 issue;
- placement bias/validity tests pass;
- modality labels match actual interaction;
- learner-facing meanings/readings have a documented prioritization model;
- sampled examples/context pass human/content QA;
- mnemonic provenance and quality reporting are current;
- evidence semantics remain conservative and interpretable;
- the release candidate records the educational QA result against the exact frozen SHA.

### C4.8 Non-goals

C4 does not authorize:

- rewriting FSRS;
- creating a second scheduler;
- duplicating learner state in React;
- turning Reading Lab into a grammar/AI tutor;
- broad Vocabulary runtime integration before the Public Kanji Release gate.

## C2. Vocabulary QA policy

### Status — 2026-10-02

**DONE as a foundation policy.** Current Vocabulary contracts define deterministic normalization/validation and provenance expectations; full dataset acceptance remains part of E2.

Before public Vocabulary release, define deterministic validation for:

- spelling
- reading
- glosses
- duplicates
- source/provenance
- source version
- linked Kanji
- frequency
- JLPT metadata where available
- POS
- rare/obsolete/unsuitable entries
- empty examples
- fallback selection

## C3. Context QA policy

### Status — 2026-10-02

**DONE as a foundation policy.** Current context ingestion validates sentence/translation presence, target containment, provenance, and network fallback behavior; full content-source acceptance remains part of F.

Validate:

- Japanese sentence
- translation
- target-kanji placement
- malformed/empty content
- source provenance
- offline cache/fallback

---

# 8. Phase R — Public Product Readiness

This phase is the major addition caused by the transition from a personal project to a public product.

It sits **before broad Vocabulary/Grammar expansion**.

---

## R1. Product positioning — DONE ON CURRENT MAIN

Define and expose:

- what Kanji5 is
- who it is for
- what the daily learning loop is
- what FSRS does
- what Learning vs Active Recall means
- expected daily commitment
- what requires an account
- what works offline

The first-open experience must not assume personal knowledge of the project.

---

## R2. Onboarding — DONE on current `main`; release/device/C4 evidence pending

### New user

Target flow:

**First Open → understand value → set daily goal → optionally create account → start first learning session**

### Returning user

Target flow:

**Open → today's work → learn/review → finish**

Onboarding must not repeatedly interrupt returning users.

Placement-test acceptance:
- validate ambiguous meanings and synonym-equivalent answers
- document scoring/threshold behavior
- verify that answer-key wording does not create obvious false confidence or obvious misplacement

---

## R3. Guest-first account model — DONE ON CURRENT MAIN

Prefer:

- local use without mandatory sign-up
- optional account creation later
- explicit explanation of account benefits

Account benefits may include:

- cross-device sync
- recovery
- persistence beyond a single installation
- future cross-device features

Do not make account creation an unnecessary barrier to first learning.

---

## R4. Data safety / persistence

### Required public behavior

Verify:

- save
- reload
- browser restart
- tab close/reopen
- offline use
- account login
- account logout
- account return
- sync retry
- conflict handling
- backup restore
- migration from existing user state
- failure recovery

### Storage strategy

Do **not** start with a full IndexedDB rewrite just because public users are coming.

Domain-neutral persistence is now implemented on current `main` via the Data Trust R4 stream (PR #467). R4 remains open only for final external evidence: live authenticated production sync/conflict verification and post-merge re-verification.

Conceptually:

- LearningStore
  - Kanji cards
  - Vocabulary cards
  - Evidence
  - Reviews
  - Sessions
  - settings

Then measure actual user-state size and write frequency.

Move to IndexedDB only when:
- volume
- browser quota
- write performance
- history retention
- cross-domain scale

justify it.

---

## R5. Review-history scalability

Current state is bounded/compacted rather than an unlimited event store. R5 is implemented on current `main` with a 2,000-event operational cap, separate cumulative review aggregates, and a 90-day daily rollup; final completion still requires post-merge verification.

Do not assume an obsolete numeric cap from older audits.

Required work:

- preserve a bounded operational review history
- preserve long-term aggregates separately
- prevent Stats degradation when raw history is compacted
- ensure analytics remain explainable after compaction
- later consider event/rollup storage in IndexedDB if usage warrants it

---

## R6. Backup / Restore

Backup/Restore is implemented on current `main` as a versioned v2 envelope with v1 migration, integrity validation, and journaled rollback/startup recovery. R6 remains open only for physical real-device success/failure/rollback evidence and post-merge verification.

Backup must be:

- versioned
- deterministic
- integrity-checked
- migration-aware
- corruption-resistant
- safe against accidental overwrite

Restore must:
- validate before applying
- explain what will be changed
- avoid silent destructive replacement
- preserve compatibility with existing learner state
- snapshot or otherwise protect the prior state before applying
- behave atomically on failure and support rollback/version-mismatch handling

Release evidence must include at least one representative real-device restore and failure/rollback case.

---

## R7. PWA installability

Audit the PWA across major supported platforms.

At minimum:

- Chrome Android
- Safari iOS
- Chrome desktop
- Edge desktop
- Safari macOS
- Firefox desktop

Verify:

- installability
- icon
- launch behavior
- standalone mode
- theme
- splash/start experience
- offline
- update behavior
- reinstall behavior

Explicit install metadata/assets are now present on current `main`; remaining work is cross-platform install/update/reinstall evidence.

---

## R8. Offline reliability

Define an explicit offline matrix.

Offline should support the core learning loop:

- learning
- Active Recall
- FSRS scheduling
- learner state
- prepared mnemonics
- local content
- essential dictionary/content already available locally

Network-only operations should degrade gracefully:

- account sync
- remote content fetch
- optional external APIs

On reconnect:

**local learning state → sync → conflict resolution → reconciled state**

No reconnect action may silently reset navigation or learning progress.

---

## R9. Browser compatibility policy

Define browser support tiers.

### Tier 1

- Chrome Android
- Safari iOS
- Chrome Windows/macOS
- Edge Windows

### Tier 2

- Safari macOS
- Firefox desktop
- other modern evergreen browsers where practical

Document:

- supported
- best effort
- unsupported

Do not promise unsupported platform behavior.

---

## R10. Internationalization

Separate:

**UI language** from **learning content language**.

Japanese content remains Japanese.

Internationalize:

- UI labels
- errors
- empty states
- dates
- numbers
- pluralization
- settings
- onboarding
- accessibility labels
- notifications

Keep engine behavior independent from presentation language.

---

## R11. Error handling and observability — DONE on current `main`; final release verification pending

Public users need actionable failure states.

Capture/handle:

- uncaught JS errors
- unhandled promise rejections
- sync failures
- data migration failures
- asset load failures
- service worker failures
- dynamic import failures

At minimum retain enough diagnostics to answer:

- what failed
- where
- which release/version
- browser/platform
- whether user data was affected

Add a global React/render-failure containment boundary with an actionable recovery screen. Recovery should provide, as applicable:
- reload/retry
- export backup
- report the problem

Controlled-failure diagnostics may remain local/opt-in; do not introduce invasive analytics merely for observability.

---

## R12. Security

Perform a dedicated public-release security review.

Audit:

- XSS
- unsafe DOM injection
- \`innerHTML\` boundaries
- Content Security Policy
- auth/session handling
- Supabase RLS
- unauthorized read/write paths
- backup tampering
- sync abuse
- rate limiting where needed
- dependency vulnerabilities
- accidental secret exposure
- production source-map/data exposure
- third-party CDN dependencies
- runtime loading of security-sensitive libraries
- dependency audit/maintenance policy

For security-sensitive browser dependencies such as the Supabase client:
- pin a reviewed version
- prefer a vendored/local build over runtime CDN loading
- precache the shipped dependency for offline/auth resilience

CSP must be an explicit release control, not merely a documentation item. Every legacy `innerHTML` sink must be classified, and provider/user-controlled content must not reach unsafe HTML sinks without an explicit trusted transformation.

Any externally supplied text must be treated as untrusted content.

In particular, existing runtime \`innerHTML\` paths must be reviewed before external Vocabulary/Context text enters them.

---

## R13. Privacy and legal surface — PARTIAL / release blocker

- Product-accurate Privacy & Data draft reconciled with current runtime.
- Terms remain a legal-review draft and do not claim unimplemented capabilities.
- Account deletion: **NOT IMPLEMENTED** in the current browser account API/UI.
- Local-data deletion: learning-progress reset exists, but complete browser-data erasure is **NOT IMPLEMENTED**.
- Export/backup scope and exclusions are documented.
- Retention periods are intentionally **UNDEFINED** until owner/counsel approval; no fixed period is invented.
- Supabase/Auth, Google OAuth, KanjiAPI/EDRDG, Tatoeba, KanjiVG, GitHub Pages/Issues, and the vendored Supabase runtime are disclosed at repository level.
- No application-level product analytics/advertising SDK or analytics-cookie implementation was found in the audited surface.
- Security/public feedback channels are documented; a dedicated private privacy/account request channel is **NOT OPERATIONAL**.
- Age/child-user treatment and final target markets are **UNDECIDED** and remain owner/legal decisions.
- Project-level LICENSE is **NOT APPROVED**; the repository placeholder is not a license grant.
- Final owner/counsel approval remains required before Public Beta.

Legal requirements must be reviewed against actual production configuration, target markets, and business model. Do not infer legal rights, retention periods, deletion capabilities, age restrictions, or license grants from repository documentation alone.

- **R13 repository-side status:** documentation/governance reconciliation complete on the R13 branch; non-engineering blockers remain explicit.

---

## R14. User help/documentation — IMPLEMENTED; PRODUCTION VERIFICATION REMAINS

Provide user-facing documentation for:

- How Kanji5 works
- How FSRS works at a user-appropriate level
- Learning vs Active Recall
- rating meanings
- what happens to data
- account/sync behavior
- backup/restore
- offline mode
- PWA installation
- common recovery steps

Documentation should be separate from developer architecture documents.

---

## R15. Feedback and support — DONE ON CURRENT MAIN

Provide simple paths for:

- report a problem
- send feedback
- request a feature

Do not build a full community/social system.

Use feedback to identify:
- onboarding confusion
- recurring UX defects
- device/browser-specific issues
- content problems
- learning-flow problems

General feedback is not sufficient for content QA. Provide a context-aware content correction/report path so a user can identify a wrong reading, meaning, example, stroke/radical/component entry, or mnemonic.

---

## R16. Content/data provenance for public users

Whenever relevant, expose provenance without overwhelming users.

Examples:

- source
- source version
- curated/generated status
- dictionary/provider origin

External providers must never silently become learning authorities.

---

## R17. Public product quality bar

A new user should be able to:

- open Kanji5
- understand what it does
- start without help
- complete a session
- understand the feedback
- close/reopen the app
- continue later
- use core learning offline
- recover from a failed sync
- backup/restore their progress
- install the PWA

without developer intervention.

---

## R18. Public Beta

Before broad release:

- recruit a small real-user cohort
- collect structured feedback with severity/category fields
- test different device/browser combinations
- use the beta to validate real-user onboarding and placement behavior, not merely automated flow completion
- observe onboarding
- observe first session completion
- inspect sync/offline failures
- inspect content reports
- inspect performance
- inspect accessibility problems
- fix high-frequency/high-severity public issues

Do not interpret automated test success as proof of public usability.

---

## R19. Public Release Gate

Do not publicly promote Kanji5 beyond beta until:

- no known critical data-loss path
- no known critical asset/deploy path
- offline core learning works
- account/sync behavior is explainable
- backup/restore is reliable
- security pass is complete, including production RLS, CSP, unsafe-DOM, and dependency/supply-chain checks
- privacy/legal surface exists and matches implemented deletion/export/third-party behavior
- accessibility baseline is met through both automated checks and manual representative assistive-technology testing
- major target browsers/devices are validated
- the candidate is frozen/tagged and release evidence is recorded against the exact promoted SHA
- onboarding is understandable
- public error reporting exists
- user documentation exists
- production smoke test passes
- public failure recovery is available for render/runtime failures
- content correction/reporting is available

---

## R20. Scale Gate — intentionally later

Only after real usage justifies it:

- IndexedDB migration
- record/event-level sync
- more advanced telemetry
- backend scaling
- sync conflict tooling
- larger content indexes
- deeper performance optimizations

Scale work must be evidence-driven.

---

# 9. Phase D — Cross-domain Foundation

D1–D3 are already implemented on current \`main\`.

---

## D1. Canonical identity — DONE

Implemented:

- domain validation
- canonical Content IDs
- separate Card IDs
- identity schema version
- compatibility with existing Kanji identities

Covered domains:

- kanji
- vocabulary
- context
- grammar

---

## D2. Shared evidence envelope — DONE

Implemented/shared:

- cross-domain evidence shape
- outcomes
- content identity
- provenance/version metadata where available

---

## D3. Relationships — DONE

Implemented deterministic relationships.

At minimum support:

- vocabulary ↔ kanji
- vocabulary ↔ context
- room for grammar ↔ vocabulary/context

Relationships must remain deterministic and versionable.

---

## D4. Scheduling boundary — DONE / BLOCKER FOR FULL VOCABULARY LEARNING

This is the correct interpretation of the earlier SRS concern.

Do not rewrite FSRS.

Do not build separate Vocabulary/Grammar schedulers.

Instead:

- define how domain/skill planning selects content
- create distinct card identities
- feed cards into the same authoritative scheduling authority
- allow planner priorities to influence selection
- preserve existing review semantics
- preserve daily-goal and session semantics
- preserve recovery behavior
- keep domain-specific evidence separate from scheduler mechanics

Target architecture:

**Domain content → skill/evidence → planner/session selection → Card identity → FSRS**

not:

**Kanji Scheduler + Vocabulary Scheduler + Grammar Scheduler**

---

## D5. Persistence/offline seam — DONE

The initial D5 migration/offline seam is implemented on current \`main\` via the context identity migration and cross-domain dependency precaching. This is distinct from the still-pending Phase R storage abstraction.

Completed minimum foundation:

- cross-domain identity migration for persisted Context data
- offline precaching of cross-domain identity dependencies
- migration and dependency contract coverage
- compatibility with existing Kanji state

Remaining persistence scalability work belongs to Phase R (public data safety/review-history scalability) and the later scale gate. Do not restart D5 as a full storage-backend rewrite without measured need.

---

# 10. Phase E — Vocabulary MVP

Vocabulary is the first major learning-domain expansion.

The foundation is already substantially implemented.

---

## E1. Content model — FOUNDATION DONE / PIPELINE PENDING

Current foundation supports:

- domain
- contentId
- written form
- reading
- lemma
- glosses
- POS
- linked Kanji
- source/provenance
- source version
- normalization/validation

### Remaining

Build a public-quality local dataset pipeline.

Requirements:

- versioned source input
- deterministic build script
- deterministic normalization
- deterministic deduplication
- deterministic filtering
- provenance retention
- reproducible output
- attribution/license compliance
- sharded/local lazy-loadable content

JMdict is an appropriate candidate source, subject to current licensing/attribution review.

Do not make live \`kanjiapi.dev\` requests the core Vocabulary content authority.

---

## E2. Vocabulary content coverage

Vocabulary must include more than “words attached to a Kanji”.

Include:

- common multi-Kanji words
- kana-only words where pedagogically appropriate
- words whose identity cannot be derived merely from a single character lookup
- readings
- glosses
- POS
- frequency where available
- JLPT/level metadata where reliable
- source/provenance

The current per-Kanji API strategy is acceptable as a legacy/example fallback, not as the final Vocabulary database.

---

## E3. Vocabulary learning state — FOUNDATION DONE

Existing Vocabulary evidence model supports:

- unseen
- introduced
- retrievable
- stable
- exposure
- practice
- correct/wrong
- independent practice
- recovery
- mistake selection
- accuracy/error rate

Do not replace this state model unnecessarily.

---

## E4. Vocabulary learning modes — PENDING

Start with a small deterministic set.

Recommended initial learning loop:

1. introduction
2. guided recognition
3. reading/retrieval
4. contextual/word-completion practice
5. independent recall
6. recovery when needed
7. scheduled review

Prioritize:

- recognition
- reading
- word completion
- contextual use

Avoid over-relying on unrestricted English/Persian free-text meaning grading.

Any free-text meaning grading must use explicit accepted-answer sets/rules rather than a fuzzy external authority.

---

## E5. Vocabulary scheduler integration — BLOCKER

- reuse existing FSRS authority
- reuse session planning seams
- reuse recovery
- reuse evidence
- prevent a single global “Kanji new-card quota” from accidentally controlling the entire product
- define deterministic domain-aware selection without creating a second scheduler
- make user-visible daily counts understandable

The important distinction is:

**domain-aware card/content selection** versus **a new domain-specific scheduler**.

Only the former is allowed.

---

## E6. Vocabulary React UX

A React Vocabulary page shell already exists on an open branch, but the open PR is not current \`main\`.

When integrating, build from the current main baseline.

The final Vocabulary page should support:

- search
- status/stage filtering
- vocabulary detail
- linked Kanji
- evidence summary
- focused learning action
- mobile-friendly layout
- predictable navigation
- clear distinction between browsing and learning

Do not merge stale PR state without rebasing/rebuilding.

---

## E7. Vocabulary ↔ Dictionary relationship

Dictionary browsing:

**reference-first**

Vocabulary learning:

**learning-first**

A dictionary lookup should not silently mutate Vocabulary SRS state.

---

## E8. Vocabulary ↔ Reading Lab

Reading Lab should be able to provide a path:

**sentence → word → vocabulary identity**

but only after:

- stable vocabulary identity
- stable content metadata
- stable learner state
- reliable persistence

Reading Lab remains a workbench, not a competing scheduler.

---

## E9. Vocabulary stats

Add Vocabulary information into existing Stats architecture.

Do not create a separate vocabulary dashboard.

Only show detailed evidence when sample size is meaningful.

---

## E10. Vocabulary offline

Vocabulary core content should be locally available in versioned/sharded assets.

Offline learning must not depend on querying an external API.

External providers can be optional update/build sources.

---

## E11. Vocabulary acceptance gate

Complete only when all are true:

- stable identity
- validated dataset
- provenance/versioning
- deterministic grader
- evidence integration
- FSRS scheduling integration
- recovery integration
- session integration
- persistence/migration
- offline fallback
- browser E2E
- responsive/accessibility coverage
- public-facing UX
- content QA
- no accidental Kanji-only assumptions remain

---

# 11. Phase F — Context and Reading Integration

After Vocabulary is mature.

## F1. Context model

Define stable Context content identity.

Example:

\`context:tatoeba:12345\`

Keep:

- source
- source version
- Japanese sentence
- translation
- target placement
- linked Vocabulary
- linked Kanji

---

## F2. Context evidence

Use context as evidence for:

- comprehension
- recognition
- retrieval
- reading
- contextual use

Do not make context another duplicate SRS system.

---

## F3. Reading Lab integration

Target product chain:

**Text → Sentence → Word → Kanji → Mastery → Audio → Next focus**

Keep existing Reading Lab boundaries.

Do not let sentence analysis silently alter authoritative learner state unless the learning flow explicitly records an educational outcome.

---

## F4. Sentence mining

Add only after Vocabulary identity and persistence are stable.

Support:

- saved sentence
- source/title
- resume
- selected word
- linked vocabulary
- optional learning action

Maintain separation between:
- Reading Lab workbench state
- authoritative SRS learner state

---

# 12. Phase G — Grammar Foundation

Grammar follows Vocabulary and Context foundations.

---

## G1. Grammar content model

Replace hardcoded lesson content with versioned data.

Minimum schema:

- stable contentId
- grammar pattern
- explanation
- level
- prerequisites
- examples
- linked Vocabulary
- linked Context
- exercises
- provenance/source
- source version

---

## G2. GrammarGuide current state

Current GrammarGuide is still primarily a hardcoded reference/learning demo with progress held in \`sessionStorage\`.

This is acceptable as an interim reference surface.

The progress model should not be treated as authoritative learning state.

---

## G3. Grammar learning model

When learning flows are introduced:

- deterministic grammar evidence
- shared outcome/evidence contracts
- shared recovery semantics
- no independent scheduler
- grammar-specific exercise types
- explicit prerequisites
- content versioning

---

## G4. Grammar UX

Start with reference-first.

Then incrementally introduce:

- guided grammar understanding
- controlled practice
- contextual examples
- retrieval
- evidence-backed progression

Do not mix Grammar into the core Kanji Learning Card.

---

# 13. Phase H — Public Product Maturity after Vocabulary/Grammar

After public release foundations and initial domain expansion:

## H1. Content operations

- reproducible content builds
- dataset diffs
- content QA reports
- provenance checks
- license checks
- regression detection

## H2. Production quality

- error monitoring
- support triage
- browser-specific regression tracking
- sync reliability metrics
- performance regression tracking

## H3. Product iteration

Use real-user evidence to determine whether to invest in:

- deeper Vocabulary
- richer Context
- Grammar learning
- better Reading Lab
- better mnemonic quality
- accessibility
- mobile ergonomics

Do not expand breadth automatically.

---

# 14. Repository / architecture cleanup

These are important but should be scheduled carefully around active feature work.

## 14.1 Versioned filename cleanup — PENDING / LATER

There are many \`v1.x-*\` and \`v2-*\` files in the repository.

Long-term direction:

- engine/
- domain/
- learning/
- persistence/
- presentation/

Prefer names based on responsibility rather than historical version.

However:

- do not perform a broad rename while many feature branches are active
- do not invalidate current runtime contracts unnecessarily
- clean legacy incrementally after stable public seams exist

## 14.2 Global bridge cleanup — PENDING / LATER

Current React↔engine integration still relies on numerous \`window.__KANJI5_*\` globals.

Long-term:

- one typed ESM-facing bridge
- explicit API boundaries
- domain-aware typed contracts

But do not rewrite the boundary merely because it is aesthetically imperfect.

The existing boundary is useful and protective during the migration.

## 14.3 Test architecture — PENDING / LATER

Current suite is large and includes both source/contract tests and presentation/browser tests.

There are many source-text contract tests; they are useful historical guards but are more brittle than behavior-level module tests.

Long-term:

- Vitest or equivalent for reusable domain modules
- behavioral tests instead of source-string assertions where possible
- keep E2E for user-visible cross-layer behavior
- keep release-integrity contracts
- preserve historical migration tests only where they provide actual compatibility value

Do not stop feature work to rewrite the whole test suite.

## 14.4 Scripts organization — LATER

Move toward:

- scripts/ = build/release tooling
- tests/ = tests

Only perform this when it can be done without creating merge conflicts or losing historical verification.

---

# 15. Documentation cleanup

## Current problem

There are many historical roadmap/version documents.

Long-term:

- this \`ROADMAP.md\` is the canonical active roadmap
- historical plans/status documents may remain for auditability
- move obsolete historical docs to \`docs/archive/\` only when safe
- do not delete historical engineering evidence

## Version consistency

Unify version source between:

- package.json
- frontend/package.json
- release metadata
- UI display where used

Avoid manually synchronized version strings.

## Changelog

Move from an indefinitely empty “Unreleased” section to real release entries.

---

# 16. Competitive/product-quality guardrails

Kanji5 should remain differentiated through its actual learning behavior rather than feature count.

Keep these product boundaries:

- calm, focused Japanese-learning UX
- adaptive learning
- evidence-backed learner model
- deterministic offline behavior
- useful Kanji foundations
- Vocabulary and Context added as learning layers, not as unrelated utilities
- Grammar added after the earlier layers are trustworthy

Do not optimize for parity by copying every feature from WaniKani, Renshuu, Duolingo, Skritter, Ringotan, Kanji Study, or Anki.

Use other products as UX/content references, not as architecture authorities.

---

# 17. Current open work and merge hygiene

As of this roadmap baseline, several relevant PRs remain open and are based on older commits.

Examples include:

- Reading Lab coverage/focus work
- Vocabulary React page shell
- Learning session analytics separation
- startup/stroke-order performance work
- Stats exposure corrections
- Settings skill-toggle verification
- several earlier responsive/dictionary/learning-card branches

### Rule

An open PR is **not complete**, and an open PR matching a roadmap bullet is **not evidence that the work is still pending on \`main\`**.

Before integration:

1. rebase or rebuild against current \`main\`
2. re-run relevant tests
3. resolve any architecture drift
4. verify the implementation still matches the current roadmap
5. merge only after current-main verification

Do not merge merely because a PR title matches a roadmap bullet.

---

# 18. Detailed execution order

The roadmap has one active pre-Vocabulary release sequence. Historical A/B/C/R/D sections remain as reference and acceptance criteria; they do not override this execution order.

### Current execution order — 2026-10-03

**1. Release Lock**
→ current-main green CI → same-SHA Pages deploy → live artifact equality → live core smoke → cache/stale-client/offline verification

**2. Trust Layer**
→ account lifecycle and production OAuth verification → persistence seam → Supabase migration/RLS consolidation → backup/restore → deletion/export semantics → privacy/terms/legal

**3. Public UX**
→ onboarding R2 release evidence → final Learning/Active Recall/Stats/Settings/Dictionary/Reading Lab/Mnemonic/Handwriting polish → RTL/i18n → loading/error/empty states → small reliability UX

**4. Real Device / Accessibility / Performance**
→ Tier-1/Tier-2 device matrix → PWA install/update/reinstall → offline/reconnect → manual accessibility → representative performance evidence

**5. Content Quality**
→ Kanji/readings/examples/stroke/radical-component/mnemonic QA → provenance → content reporting/correction workflow

**6. Reliability / Security / Governance**
→ error containment → observability → security/CSP/dependency/third-party review → repository governance → documentation/branding/release-process reconciliation

**7. Public Beta**
→ real-user cohort → structured evidence → severity-based fixes → regression coverage

**8. Public Kanji Release**
→ final release gate passes

**9. Vocabulary**
→ only after the Public Kanji Release gate passes; then connect the existing domain foundations to local versioned content, learning state, scheduler, offline runtime, UX, and QA

**10. Context/Reading expansion**

**11. Grammar foundation**

**12. Post-domain product maturity**

### Parallelism rule

Parallel work is allowed only inside the current stage when it does not bypass an authoritative seam or create conflicting edits.

Safe examples:
- content QA while accessibility work is underway
- security review while onboarding polish is underway
- device testing while documentation is being reconciled
- Vocabulary content-policy preparation while public Kanji release work is underway

Unsafe examples:
- two branches changing the same engine boundary
- feature work that changes production behavior while the release candidate is being verified
- Vocabulary runtime integration before the public Kanji release gate is green

### Explicitly complete and removed from the active queue

Do not restart A2, A3, A5, A6, D1, D2, D3, or D5 unless a new current-main regression is demonstrated.

An old/open PR that implements one of those areas should first be diffed against current `main`; the correct action may be to supersede or close it rather than merge it.

# 19. What is explicitly NOT required before public release

Do not block the public Kanji release on:

- complete learning-engine rewrite
- replacing FSRS
- creating a second scheduler
- full IndexedDB migration without measured need
- complete ESM/runtime-file renaming project
- full event-sourcing architecture
- social/community/gamification systems
- huge analytics dashboard
- AI grading authority
- Vocabulary runtime integration
- complete Grammar learning system
- Reading Library at full scale
- broad repository renaming

These are deliberately deferred because they add complexity without being required to make the current Kanji product trustworthy.

Small improvements that directly reduce user failure remain in scope before release, including stronger error recovery, clearer offline/sync states, safer backup/restore, accessibility fixes, and targeted UI/UX corrections.
# 20. Definition of Done

A roadmap phase is complete only when applicable:

1. implementation exists on current \`main\`
2. contract/unit tests pass
3. relevant browser E2E passes
4. typecheck/build passes
5. offline behavior is verified where relevant
6. no authoritative engine contract is bypassed
7. migration/persistence compatibility is verified
8. documentation reflects actual behavior
9. no stale PR is being treated as completed
10. public-facing UX is usable without developer knowledge for public phases

For public-release blockers, “implemented in code” is insufficient; the behavior must be exercised in the supported release environment.

---

# 21. Final release milestones

## Milestone M0 — Engineering baseline
**Result:** one current-main release candidate with green automated gates and a reproducible build/deploy chain.

## Milestone M1 — Trust Layer
**Result:** account, persistence, sync, backup/restore, deletion/export semantics, privacy/legal, and Supabase/RLS behavior are production-defined and verified.

## Milestone M2 — Public Kanji UX
**Result:** onboarding and the existing Kanji learning surfaces are coherent, accessible, responsive, recoverable, and understandable without developer knowledge.

## Milestone M3 — Real Environment Validation
**Result:** target devices/browsers, PWA install/update/reinstall, offline/reconnect, accessibility, and representative performance have real-environment evidence.

## Milestone M4 — Content Quality
**Result:** Kanji learning content has a repeatable QA/provenance/correction process and critical content defects are addressed.

## Milestone M5 — Reliability & Governance
**Result:** production error containment, observability, security/supply-chain controls, repository governance, branding, documentation, and release procedure are aligned.

## Milestone M6 — Public Beta
**Result:** a real-user cohort completes onboarding and learning, returns later, uses offline mode, can recover data, and can report problems; high-severity issues are fixed and regression-tested.

## Milestone M7 — Public Kanji Release
**Result:** the Public Release Gate in R19 passes and Kanji5 can be promoted as a public Kanji-learning product.

## Milestone M8 — Vocabulary MVP
**Result:** Vocabulary becomes a real learning domain using the existing cross-domain identity/evidence/scheduling architecture, with local content, deterministic learning behavior, persistence, offline support, UX, and QA.

## Milestone M9 — Context/Reading Integration
**Result:** Reading Lab connects context, words, Kanji, evidence, and audio without creating a competing scheduler.

## Milestone M10 — Grammar Foundation
**Result:** Grammar becomes a structured, versioned, reference-first domain with incremental evidence-backed learning.

# 22. Decision record from the pre-Vocabulary architecture review

The earlier architecture review identified five broad concerns:

1. SRS was still too Kanji-centric.
2. Review history was bounded.
3. Persistence remained localStorage/blob-oriented.
4. Vocabulary content was too dependent on a live third-party API.
5. Grammar content was still hardcoded.

The unified roadmap retains all five findings, but changes their priority:

### Finding 1 — retain as D4 Scheduling Boundary

Fix through a domain-neutral scheduling seam without rewriting FSRS or creating per-domain schedulers.

### Finding 2 — retain as persistence/analytics scalability

Preserve bounded operational history while separating long-term aggregates.

### Finding 3 — retain as D5 Persistence/Offline Seam

Introduce an abstraction first; migrate to IndexedDB/record-level sync only when actual scale requires it.

### Finding 4 — promote to Vocabulary content-pipeline blocker

Build a local versioned dataset and deterministic build process before public Vocabulary learning.

### Finding 5 — keep Grammar after Vocabulary/Context

Grammar reference can remain interim, but its authoritative learning model should come after the earlier domain seams are proven.

---

# 23. Current strategic conclusion

Kanji5 must reach a trustworthy public Kanji release before major domain expansion.

The canonical transition is:

**Current Kanji main**
→
**Release Lock**
→
**Trust Layer**
→
**Public UX**
→
**Real Device / Accessibility / Performance**
→
**Content Quality**
→
**Reliability / Security / Governance**
→
**Public Beta**
→
**Public Kanji Release**
→
**Vocabulary**
→
**Context/Reading**
→
**Grammar**

The architectural rule remains:

**Do not rewrite the learning engine merely to enable presentation or new-domain work. Strengthen the current Kanji product first, prove the public operating model second, then expand through the existing cross-domain seams.**

This ordering is the canonical pre-Vocabulary execution sequence.
