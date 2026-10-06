# Kanji5 — Release Evidence

This file is an operational ledger, not a user-facing promise.

## Verified baseline

- efbfaf1912f99e3ae6afc607e675efcd9cb2ff62: release artifact/cache/stale-client/offline production verification recorded in roadmap PR #377.
- a580a2024aaec58d8fc700b399957656f17c23d8: expanded live Pages smoke gate through onboarding, Learning, Active Recall, Stats, Settings/backup export, Account, and offline reload. The PR's CI validation passed.

## Current-main pre-Vocabulary additions

- PR #389: historical candidate for the domain-neutral persistence adapter; superseded by the merged R4 implementation in PR #467.
- PR #390: explicit PWA install metadata and 192/512 icon assets are prepared on a current-main branch; merge/CI evidence must be captured before marking them complete.
- PR #388: Help, browser support, privacy/data, and feedback are discoverable from Settings.

## Evidence still requiring external execution

Representative-device performance must be recorded on actual target hardware.

Browser compatibility should be recorded per browser/OS/device, not inferred from one Chromium run.

Public beta observations must come from real users.

Security/privacy/legal sign-off must use the production Supabase project, headers, enabled third-party services, and actual target markets.

Do not convert a configured workflow or a PR CI result into a production claim without the corresponding live evidence.

## A1 final release lock

- Final candidate commit: **the exact SHA of the commit containing this section**.
- Final candidate base: `feb4cf31121e4124aaa2cb57b801d1aba3fa8b23`.
- Final candidate scope: release-integrity documentation only; no product feature, scheduler, learner-model, grading, Vocabulary, Grammar, R4, R11, R12, or C4 implementation work.
- The candidate SHA is intentionally self-referential so the ledger remains attached to the immutable commit that is promoted and verified.

## A1 verification evidence

The immediately preceding exact-main candidate established the complete release path and exposed/fixed two test-harness issues without weakening the product checks:

- PR #459 raised the React release job timeout from 15 to 30 minutes after the exact-main run was cancelled during Playwright browser dependency installation.
- PR #460 made the live review persistence assertion wait for the asynchronous React review action to commit.
- PR #461 fixed the live-smoke initialization so cleanup runs once per test context and does not erase learner state on the reload used to verify persistence.

Exact-main verification on `feb4cf31121e4124aaa2cb57b801d1aba3fa8b23`:

- React presentation workflow: run `37342578633`, **success**, all 43 steps passed.
- GitHub Pages deployment: run `37343502696`, **success**.
- Pages deployment recorded `pages_build_version=feb4cf31121e4124aaa2cb57b801d1aba3fa8b23`.
- Live artifact checks: HTTP 200 and staged/live SHA-256 equality for index, React entry, service worker, React JS, and React CSS.
- Live smoke/offline marker: `LIVE_PAGES_OFFLINE_AND_SMOKE_E2E_VERIFIED`.
- Exact-main browser gates included React E2E, performance, offline, stale-client PWA, accessibility, Firefox, WebKit, final release matrix, onboarding, account, Stats, mnemonic, Learning flip, Review/Practice, and Production Recall keyboard checks; all passed.

Performance evidence on that exact main candidate:

- Desktop: navigation 304 ms; DOMContentLoaded 303 ms; load 304 ms; FCP 196 ms; LCP 600 ms; CLS 0.006; long tasks 0; app transfer approximately 1,885 KB; interaction 9 ms.
- Mobile profile (390×844): navigation 244 ms; DOMContentLoaded 236 ms; load 244 ms; FCP 144 ms; LCP 440 ms; CLS 0.005; long tasks 0; app transfer approximately 1,885 KB; interaction 12 ms.
- All configured release budgets passed.

The final A1 candidate is this commit. Its exact-SHA React workflow and GitHub Pages deployment are the authoritative promotion gate; no A1 completion claim is valid unless both are successful and the live artifact/smoke checks remain green for this exact SHA.


## Current-main post-A1 changes — 2026-10-06

The previously verified A1 candidate was advanced by subsequent merges. The current `main` head is now `d5c19809c9659fd5ff4951af5e1a619d3434a12e`, so earlier exact-SHA A1 evidence remains historical and does not apply to the current head.

- **PR #463** — R11 runtime failure diagnostics/observability hardening.
- **PR #464** — final Kanji public UX/accessibility defect pass.
- **PR #469** — C4 educational content and assessment validity implementation.
- **PR #470** — release/documentation reconciliation.
- **PR #471 / merge `b32ff2a90ee30a35308b30cd20347e37ae11638b`** — A1 account-dialog geometry fix.
- **PR #472 / merge `d5c19809c9659fd5ff4951af5e1a619d3434a12e`** — A1 Production Recall keyboard-gate fix; removed the conflicting Production Recall input autofocus so the global Space reveal shortcut remains available.

### Current-main A1 verification state

- Current `main`: `d5c19809c9659fd5ff4951af5e1a619d3434a12e`.
- Exact-main React presentation workflow: run `37378192793`, **success**.
- GitHub Pages deployment for this exact SHA: run `37379018058`, **success**.
- The merge cleared the prior A1 CI blocker and triggered the matching Pages deployment.
- **Release lock is not yet marked complete in this ledger:** same-SHA live HTTP/artifact hash equality, live smoke/offline markers, and the remaining applicable production/device evidence must still be recorded for this exact SHA.


## Data Trust R4-R6 landed on main — 2026-10-06

PR #467 was merged into `main` at merge commit `ff1ec47018e12d8f4a45c78159dc3a25a3f15417`. The landed implementation includes the domain-neutral storage adapter (R4), bounded 2,000-event operational review history with separate cumulative/90-day aggregates and cross-device merge semantics (R5), and backup v2 with v1 migration, checksum/future-version rejection, and journaled rollback/startup recovery (R6).

- Branch-level engineering evidence before merge: 152/152 `scripts/test-*.mjs` tests passed; dedicated Data Trust browser persistence/backup coverage passed on the previously verified branch head.
- The React workflow also contains the dedicated `e2e/data-trust.spec.mjs` gate.
- Final completion is **not** claimed yet: live authenticated production Supabase sync/conflict evidence and physical real-device Backup/Restore success + failure/rollback evidence remain outstanding.
- An unrelated React presentation E2E (`personal mnemonic editor auto-scrolls fully into view when opened`) was red on the pre-merge branch head and was intentionally not changed under Data Trust scope.
