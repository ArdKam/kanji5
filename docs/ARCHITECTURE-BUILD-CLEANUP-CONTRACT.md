# Kanji5 — Architecture, Build & Runtime Cleanup Contract

Repository: ArdKam/kanji5
Default production branch: main

## Mission

Simplify Kanji5 without changing educational authority, FSRS behavior, persistence semantics, offline guarantees, or learner-facing functionality.

The target architecture is:

index.html
→ app-bootstrap.js
→ v1.9-v2-boundary.js
→ react-entry.js
→ React presentation

with the learning engine remaining authoritative outside React.

## Non-negotiable rules

1. Never delete a versioned runtime merely because its filename starts with v1.x.
2. Before deleting any file, prove whether it is:
   - active production runtime,
   - lazy runtime dependency,
   - compatibility-only,
   - test/maintenance-only,
   - or dead.
3. React must remain presentation-only. It must not become the owner of FSRS, grading, learner modeling, recovery, persistence, session semantics, or offline authority.
4. Do not duplicate state ownership across React and the engine.
5. Do not change educational grading behavior unless the change is explicitly intended, contract-tested, and verified.
6. Treat service-worker retirement as a migration problem, not a file deletion problem.
7. Prefer source changes under frontend/ over generated output changes.
8. Never claim a change is fixed or complete without real verification.
9. Each risky change must be followed by syntax/unit/contract/browser verification appropriate to its scope.
10. Avoid unrelated visual or product changes while performing architecture cleanup.

## Phase 0 — Inventory before deletion

Build and maintain an explicit runtime dependency inventory covering:

- index.html
- app-bootstrap.js
- react-entry.js
- v1.9-v2-boundary.js
- review-runtime.js
- v1.5-state.js
- v1.6-session*.js
- v1.9-* runtime modules
- v1.8-* grading modules
- education runtime modules
- sw.js
- supabase/account integration
- React source and tests
- generated artifacts
- compatibility/release artifacts

Classify every candidate cleanup file by actual runtime usage.

## Phase 1 — Build provenance

Make source code the only canonical React UI source.

The deployment pipeline must:

- install frontend dependencies,
- typecheck,
- build React,
- validate the freshly generated artifact,
- run the required contract/unit/browser gates,
- package the generated build directly into the GitHub Pages artifact.

Do not create commits that merely sync generated React output back into the source branch.

Do not maintain duplicate release18/release19 React artifacts unless an active production or compatibility path demonstrably requires them.

## Phase 2 — Cache/version integrity

Replace hand-maintained cache-busting where practical with deterministic build/release provenance.

For Pages releases, the exact source commit SHA is the canonical release key and is materialized into build-time placeholders before staging.

Do not introduce cache changes that can serve stale HTML, JS, CSS, fonts, or service-worker manifests.

Verify:

- entry references,
- CSS references,
- font preload paths,
- service-worker precache,
- cache version transitions,
- offline reload behavior.

## Phase 3 — Runtime retirement

Retire only proven-dead bootstrap, presentation, release, and service-worker artifacts.

For service workers:

- identify whether older registrations can still exist,
- preserve a safe migration/unregister path when required,
- verify new installs and existing-client upgrades,
- keep the current SW as the single production SW.

For versioned learning-engine files, migrate ownership only when their semantics are fully represented by an equivalent authoritative module and covered by tests.

## Phase 4 — Educational integrity

Preserve the existing authority hierarchy:

FSRS scheduler
→ learning/session planner
→ deterministic grading
→ learner model/recovery
→ structured boundary
→ React

Strengthen verification around:

- meaning matching and the retired subset auto-pass,
- reading/production/vocabulary/context grading,
- adaptive attribute selection,
- recovery behavior,
- FSRS outcome persistence,
- session completion,
- offline capability.

Then add analytics for observed learning quality where the data already exists:

- accuracy,
- Again rate,
- Hard/Good/Easy distribution,
- skill-level performance,
- interval performance,
- leech/failure concentration,
- predicted vs observed recall where valid.

Do not alter scheduler or grading policy just to make metrics look better.

## Phase 5 — Learning expansion

Use a skill matrix rather than simply adding exercise count.

Support:

- meaning,
- reading,
- recognition,
- production,
- vocabulary,
- context,
- handwriting,
- component/radical support.

Components and radicals are support structures unless evidence shows a prerequisite relationship. Do not make radical knowledge an artificial gate for kanji progression.

## Phase 6 — Presentation and accessibility cleanup

Only after runtime/build boundaries are stable:

- reduce index.html to a minimal shell,
- move inline UI patches into the normal CSS architecture,
- remove unnecessary !important rules,
- maintain responsive centering,
- preserve the fixed bottom experience navigation,
- maintain keyboard/focus behavior,
- maintain touch-target sizing,
- maintain reduced-motion behavior,
- eliminate avoidable CLS/font swaps,
- preserve the Japanese visual identity.

UI polish must not leak business logic back into React.

## Verification gates

A meaningful change is not complete until the relevant gates pass:

- Node syntax checks,
- npm test / authoritative contract suite,
- frontend typecheck,
- React build,
- shipped-artifact validation,
- targeted Playwright tests,
- PWA/offline tests,
- accessibility tests,
- release/live verification where the workflow supports it.

When a gate cannot be run, state exactly which gate was unavailable and do not imply full verification.

## Change discipline

Prefer small, reversible commits.

Use one concern per commit where practical:
- build/deploy cleanup,
- runtime retirement,
- cache/version cleanup,
- education-contract changes,
- UI cleanup.

Never mix a risky runtime migration with unrelated visual redesign.

## Definition of done

The repository should end with:

- one clearly documented production presentation path,
- one clearly identified current service worker,
- no build-generated commit churn,
- no unproven dead-code deletions,
- explicit runtime ownership,
- React remaining presentation-only,
- educational behavior covered by authoritative tests,
- deployment building from source,
- reproducible cache/version behavior,
- and real verification evidence for every completed change.
