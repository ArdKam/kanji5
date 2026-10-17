# Learning-engine runtime initialization audit — 2026-10-17

**Purpose:** supplemental engineering record for the 2026-10-17 principal-architect audit. This file records the specific runtime-initialization defect and the follow-up PR without editing the concurrent [Product & Engineering Audit](PRODUCT-ENGINEERING-AUDIT-2026-10-17.md) or replacing the canonical roadmap handoff.

## Status at the time of this record

- **Current `main`:** `827fefa4cdfe0bb65e73e3951247b96bca1f3082` (documentation handoff PR #560).
- **Last verified deployed application/runtime baseline:** `085524dc58547e33e42fcaff75784b0c6d3fe6b3`; React build [run 38964130926](https://github.com/ArdKam/kanji5/actions/runs/38964130926) and Pages deployment [run 38965141947](https://github.com/ArdKam/kanji5/actions/runs/38965141947) succeeded on that SHA. The later main commit is documentation-only; do not represent the runtime-init fix as deployed.
- **Runtime fix PR:** [#559 — Avoid adaptive planner busy-wait and report runtime import failures](https://github.com/ArdKam/kanji5/pull/559), head `f1e398dfc6dedfece22f9944e95f018a1e5c1b16`, based on `085524dc58547e33e42fcaff75784b0c6d3fe6b3`. It is open, unmerged, and GitHub currently reports it as mergeable.
- **PR verification:** engine workflow [39014128916](https://github.com/ArdKam/kanji5/actions/runs/39014128916) passed. React presentation workflow [39014128937](https://github.com/ArdKam/kanji5/actions/runs/39014128937) passed, including its build and WebKit compatibility jobs. The root suite reported **164 scripts passed**, including the new runtime-initialization contract test. React browser gates for boundary/migration, primary and secondary presentation, theme/mobile, performance, Active Recall, mnemonics, parity, offline/stale client, session isolation, accessibility, Firefox, PWA/release matrix, navigation, Data Trust, account, onboarding, Stats, card flip, topic learning, personal mnemonics, Review/Practice and Production Recall keyboard all completed successfully on the PR head.
- A passing PR workflow is not merge/deployment evidence. At the time of this record, the fix has not landed on current `main`, and no post-merge deployment verifies it.

## Runtime execution path inspected

The entry sequence in `index.html` loads the classic state/runtime scripts in this order: `v2-storage-core.js`, `v1.5-state.js`, `v1.3-p0.js`, `v1.9-learner-model.js`, `v2-observability.js`, lazy `review-runtime.js`, `legacy-loader.js`, `v1.9-v2-boundary.js`, `app-bootstrap.js`, `supabase-config.js`, then module `react-entry.js`.

Important ordering details:

1. `v1.9-v2-boundary.js` is included **before** `app-bootstrap.js`; future documentation/tests should preserve the actual HTML order rather than assume the boundary loads after bootstrap.
2. `app-bootstrap.js` installs startup/service-worker coordination and imports `v1.6-session.js`.
3. `v1.6-session-feedback.js` exposes the authoritative `__KANJI5_V16_SESSION_AUTH__` API with `nextMode` and `consumeMode` methods.
4. `v1.9-adaptive-planner.js` wraps the authoritative `nextMode` choice for adaptive mode selection while retaining the original `consumeMode`.
5. `react-entry.js` loads the generated `react-dist/kanji5-react.js`; `frontend/src/app/engine.ts` adapts the browser-facing boundary for `frontend/src/app/App.tsx`.

The UI remains presentation-only. Preserve the authority boundaries: FSRS schedules cards; the v1.9 Learner Model owns learner state; Adaptive Planner selects modes/tasks; grading and recovery remain engine-owned; `v1.5-state.js` owns persisted application state; React does not reimplement these responsibilities.

## Confirmed defect RI-01 — Adaptive Planner busy polling

**Root cause:** `v1.9-adaptive-planner.js` attempted to install its wrapper with a zero-delay recursive `setTimeout(install, 0)` while `__KANJI5_V16_SESSION_AUTH__` was not yet available. The planner is loaded asynchronously, so its startup can precede session-feedback API exposure. That creates an unnecessary repeated task queue during initialization.

**Change in PR #559:**

- `v1.6-session-feedback.js` dispatches `kanji5:v1.6-session-auth-ready` immediately after publishing the authoritative API.
- `v1.9-adaptive-planner.js` listens once for that event if the API is not yet available, then installs its wrapper.
- The wrapper retains the existing session authority's `consumeMode`; it does not become a session store or card scheduler.

**Acceptance:** keep the patch unless current-main evidence shows a regression. After merge, verify the event order on cold startup, ensure planner installation occurs once when the authority loads both before and after the listener is registered, and verify no zero-delay polling remains.

## Confirmed defect RI-02 — Silent v1.9 supporting-module load failures

**Root cause:** `v1.9-learner-model.js` used `.catch(()=>{})` for imports of the adaptive planner, recovery runtime, learning evaluation runtime and v1.9 presentation boundary. If a module failed to load (for example because a shipped asset was missing or a dynamic import was blocked), the failure was hidden and the runtime could degrade without an explicit diagnostic.

**Change in PR #559:** each of the four import failures is passed to `reportModuleLoadFailure`, which records a `dynamic-import-failure` event through `__KANJI5_OBSERVABILITY__` with the module name and `dataAffected: 'unknown'`. If observability is unavailable, it falls back to a console error; failure of the reporting path itself also gets a console diagnostic.

**Acceptance:** retain failure visibility and do not claim that all module-load failures are recovered automatically. After merge, verify one diagnostic per failed module with observability enabled and with the observability API absent/throwing. Confirm user-facing behavior for truly unavailable critical modules remains appropriate.

## Scope explicitly preserved

The PR makes no changes to:

- FSRS implementation or card scheduling decisions;
- card, content or session identity formats;
- Adaptive Planner's learning-selection algorithm;
- deterministic grading, recovery state machine or evidence semantics;
- canonical local-first persistence, storage keys, backup format or migration behavior;
- CSP, Supabase configuration, RLS, credentials or grants.

Do not add a scheduler, shadow learner model, new persistence owner or broad migration in response to these findings.

## Other audit findings — reference existing canonical records

Do not duplicate or supersede the wider acceptance register here:

- [Product & Engineering Audit](PRODUCT-ENGINEERING-AUDIT-2026-10-17.md): education/content acceptance, offline empty-result ambiguity, PR-queue reconciliation, branch protection, typography/design-system scope and priority order.
- [Security Review](../SECURITY-REVIEW.md): landed R12 controls, current-SHA/live security verification, missing HTTP security headers and Supabase leaked-password-protection acceptance.
- [Release Evidence](../RELEASE-EVIDENCE.md) and [Legal Review Checklist](../LEGAL-REVIEW-CHECKLIST.md): account/local-data deletion, retention, Privacy/Terms and related governance gaps.

The source inspection confirmed the live Supabase account-state table has RLS enabled and owner-scoped CRUD policies; a current Security Advisor query still reports leaked-password protection disabled. These are separate operational/release acceptance items, not a reason to weaken authorization or change runtime code.

**Unverified resilience question, not a confirmed production defect:** `v2-storage-core.js` reads `window.localStorage` during initialization without guarding the getter. Test restricted-storage environments separately before deciding whether graceful degradation is safe; do not introduce an in-memory fallback that could imply progress is durably saved when it is not.

## Required next steps

1. Refresh current `main`, PR #559's diff/base/head and exact-head checks before integrating; do not use this dated record as proof of future status.
2. Review and merge PR #559 only if the four-file change is still minimal and the green exact-head checks remain valid. Its current PR description still says CI is pending and should be reconciled with the successful workflow results.
3. After merge, record the merge SHA and current-main engine/React workflow results here and in the roadmap. If the head changed, rerun the relevant tests rather than transferring success from the prior SHA.
4. Confirm the runtime fix is included in a new successful Pages build/deployment and live/offline smoke before calling it deployed.
5. Continue the existing highest-priority release gates in the main product-engineering audit. In particular, do not mark public beta ready until educational, security, privacy and governance acceptance is closed or has an explicit approved disposition.

**Do not reopen RI-01/RI-02** merely because this document is old. Revisit only if a regression is demonstrated on current `main`, the production artifact differs from the verified source, or new runtime evidence changes the findings.
