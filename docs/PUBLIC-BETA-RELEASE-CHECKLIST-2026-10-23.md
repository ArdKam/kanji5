# Public-Beta Release Checklist — 2026-10-23

**Audit status:** NO-GO / release blocked  
**Audit target:** `ArdKam/kanji5` — `main` at `f06396e0f0d353b097072a28d541bc4db290cdb6` ([commit](https://github.com/ArdKam/kanji5/commit/f06396e0f0d353b097072a28d541bc4db290cdb6))
**Audited:** 2026-10-23 (UTC)  
**Deployment target:** GitHub Pages, `https://ardkam.github.io/kanji5/`  
**Evidence policy:** CI, production deployment, and hands-on/device acceptance are separate gates. Statuses below apply only to the stated SHA and evidence. An open/merged PR is not proof of production behavior.

## Status legend

- **PASS** — a recorded check passed for the exact SHA or stated deployed SHA.
- **FAIL** — direct evidence shows a required check/control failed.
- **BLOCKED** — required action/evidence is missing or a prerequisite has not passed.
- **NOT TESTED** — no adequate evidence was available from this audit.
- **IN PROGRESS** — a workflow is still running; not an acceptance pass.

## Current-main addendum — `f06396e0f0d353b097072a28d541bc4db290cdb6`

The original CI failure recorded below was on older SHA `766f85c`; the same source passed after the CI build job was rerun. Current main is now `f06396e0f0d353b097072a28d541bc4db290cdb6` after documentation-only PR #621. Its React presentation build [run #4130](https://github.com/ArdKam/kanji5/actions/runs/40009475936) remains in progress at the time this checklist was refreshed; WebKit is green, but the main build and current-SHA engine status must be checked again. The Pages deployment attempts for the earlier mainline commits were refused by the stale-SHA guard, so current production deployment and live smoke remain unverified.

## Release summary

| Gate | Status | Evidence / disposition |
|---|---|---|
| Current source identity | **PASS** | Current `main`: `f06396e0f0d353b097072a28d541bc4db290cdb6`, documentation-only merge of PR #621; no app-code change in that commit. |
| Learning-engine CI | **IN PROGRESS / NOT YET VERIFIED ON CURRENT SHA** | Last exact app-code SHA `766f85c` engine run #3589 passed. Recheck a current-main engine run for `f06396e0f0d353b097072a28d541bc4db290cdb6`; do not carry forward a prior SHA result as exact-current-main evidence. |
| Historical React presentation CI, initial attempt on `766f85c` | **FAIL, RECOVERED BY RETRY** | [React run #4078](https://github.com/ArdKam/kanji5/actions/runs/40003155485) initially failed 1 of 14 Review/Practice browser cases: the shared `seedSeenCard` helper did not observe a persisted review within 10 seconds after Good. |
| Historical React presentation CI retry on `766f85c` | **PASS** | The failed build job was rerun without source changes and completed successfully; WebKit passed too: [run #4078](https://github.com/ArdKam/kanji5/actions/runs/40003155485). The initial failure cause is unresolved; do not assert either a confirmed product defect or confirmed test flake. |
| WebKit compatibility | **PASS** | `webkit-compat` passed on exact SHA `766f85c4633ee5d2699509c981bb4cfc456d26f9` in [React presentation run #4078](https://github.com/ArdKam/kanji5/actions/runs/40003155485); it also passed on the retry attempt. |
| Build/typecheck/source contracts | **PASS (step-level only)** | In the initial [React run #4078](https://github.com/ArdKam/kanji5/actions/runs/40003155485), frontend typecheck/build, R12 source/artifact checks, shipped-artifact validation, generated release contracts, visual-structure contract and earlier required steps passed before the final review/practice Playwright failure. The failed overall workflow remains a release **FAIL** pending exact-head successful retry. |
| Current-main deployment | **BLOCKED** | Current `f06396e0f0d353b097072a28d541bc4db290cdb6` is not verified deployed. The later deployment attempts [#1722](https://github.com/ArdKam/kanji5/actions/runs/40005633824) and [#1724](https://github.com/ArdKam/kanji5/actions/runs/40009002010) failed at the stale-SHA guard after `main` advanced; deployment and live checks were skipped. |
| Last successful Pages deployment | **PASS for older SHA only** | [Pages deployment #1720](https://github.com/ArdKam/kanji5/actions/runs/39994041669) succeeded for `183888f31be316aaa1c60ce57e301d4f6b37e454`, older than current `main`; hashes and offline/core smoke passed for that SHA only. |
| Live HTTP response CSP | **FAIL** | Deployment #1720 explicitly logged `LIVE_CSP_HEADER=absent; HTML meta CSP remains the source-level control for this Pages deployment.` The HTML meta policy is not equivalent to a response header. Track hosting/response-header mitigation in [issue #603](https://github.com/ArdKam/kanji5/issues/603). |
| Production leaked-password protection | **FAIL / open** | The project’s 2026-10-23 Supabase Security Advisor record reports `auth_leaked_password_protection` disabled. The production setting must be changed by the configuration/security owner, then rechecked and recorded; this repository audit did not change production configuration. See [issue #603](https://github.com/ArdKam/kanji5/issues/603). |
| Live security audit | **BLOCKED** | The read-only audit workflow exists, but the required manual dispatch and results for the exact deployed candidate have not been evidenced here. Dispatch only after verifying the deployed SHA; save output and remediate findings. |
| PWA manifest/build artifact integrity | **PASS at older deployed SHA / BLOCKED for current SHA** | Workflow #1720 verified public asset probes and staged/live hash equality on `183888f`. No completed deployment/hash match is recorded for `f06396e0f0d353b097072a28d541bc4db290cdb6`. |
| Offline shell/cache smoke | **PASS at older deployed SHA / BLOCKED for current SHA** | Workflow #1720 ended `LIVE_PAGES_OFFLINE_AND_SMOKE_E2E_VERIFIED` on `183888f`. It does not prove current-SHA behavior or authenticated multi-device sync. |
| Startup transfer budget | **PARTIAL / separate gate remains open** | An earlier React run reported the startup-performance baseline passing, but [issue #609](https://github.com/ArdKam/kanji5/issues/609) remains open with the fixed 2,202 KB budget and prior 2,204 KB candidate overage. Recheck exact current-head artifact and desktop/mobile measurements. |
| Guest onboarding, navigation, Dictionary, Learning Card | **BLOCKED for release sign-off** | Automated journey coverage exists, but the overall exact-main React gate is red on the initial attempt and the retry was in progress at checkpoint. Re-run full current-head journeys and verify the successfully deployed exact SHA before sign-off. |
| Keyboard, contrast, reduced-motion and responsive behavior | **PARTIAL / NOT TESTED on devices** | CI contains automated accessibility/visual/theme contracts and WebKit checks, but this audit did not inspect a fresh live build or run representative assistive-technology, zoom, keyboard-only, reduced-motion and touch checks on physical devices. [PR #620](https://github.com/ArdKam/kanji5/pull/620) is still open and is not shipped evidence. |
| Saved Kanji bookmarks | **MERGED / NOT DEPLOYED or independently verified** | Implemented in merged PR #616 at `766f85c4633ee5d2699509c981bb4cfc456d26f9`; current-main build retry and matching Pages deployment/live acceptance still need to pass. Authenticated multi-device sync and backup/restore require separate evidence. |
| Account deletion | **BLOCKED** | [PR #617](https://github.com/ArdKam/kanji5/pull/617) is open and unmerged at audit time. Its UI/server wiring is a candidate, not a production control; required exact-head CI, deployed flow and controlled disposable-account smoke remain outstanding. |
| Complete local-data erasure | **BLOCKED / NOT VERIFIED** | “Reset learning progress” is not proof of full browser-data erasure across owned storage/cache locations. Document/implement approved semantics and test them separately from cloud account deletion. |
| Sync correctness and interrupted/offline recovery | **BLOCKED** | [PR #623](https://github.com/ArdKam/kanji5/pull/623) is open and was based on an older main SHA at audit. Unit merge tests and offline shell loading do not demonstrate live authenticated multi-device sync, deletion/restore tombstones, concurrent edits or interrupted-session recovery. |
| Reading Lab focused flow | **BLOCKED** | [PR #622](https://github.com/ArdKam/kanji5/pull/622) is open and was based on an older current-main SHA at audit; check/refresh its base and pass exact-head CI plus browser/live verification. Older #606 is not release evidence. |
| Privacy request channel, legal/terms/license/service disclosures | **BLOCKED** | No operational private privacy/account request channel and owner/counsel sign-off have been evidenced. Privacy/Terms, target markets, age/child-user treatment, retention/deletion, project license and third-party data/service terms require explicit decisions. See [issue #603](https://github.com/ArdKam/kanji5/issues/603) and [legal checklist](LEGAL-REVIEW-CHECKLIST.md). |
| Independent educational review and placement validity | **BLOCKED** | Qualified independent review of representative meanings, readings, vocabulary/context, curated mnemonics and Persian learner-facing glosses, plus placement-validity evidence, remains open. Automated content/source audits are not independent educational approval. |
| Physical Android/iOS install, update, cold start and recovery | **NOT TESTED** | No dated physical-device evidence was produced in this audit. Required before public beta. |
| Independent direct HTTP probe from this audit executor | **BLOCKED by environment** | The execution environment could not resolve external GitHub/Pages hostnames, so no separate ad hoc HTTP probe was possible. This is an auditor-environment limitation, not evidence that the deployed site itself is down. Use the workflow’s live probes and repeat against the final deployed SHA. |

## Exact CI commands and current outcome

These are the repository workflow commands; outcomes below are taken from linked CI, not represented as locally executed in this audit.

| Command / gate | Observed result |
|---|---|
| `cd frontend && npm ci --no-audit --no-fund` | Passed in the initial current-main React workflow. |
| `cd frontend && npm run typecheck` | **PASS**, SHA `766f85c4633ee5d2699509c981bb4cfc456d26f9`, [run #4078](https://github.com/ArdKam/kanji5/actions/runs/40003155485), initial attempt. |
| `cd frontend && npm run build` | **PASS**, SHA `766f85c4633ee5d2699509c981bb4cfc456d26f9`, same run, initial attempt. |
| `node scripts/test-r12-security.mjs` and staged-site R12 check | **PASS**, initial current-main React run; does not replace live production configuration checks. |
| `node scripts/test-react-shipped-artifact.mjs` | **PASS**, initial current-main React run. |
| `node scripts/test-performance-font-loading.mjs` | **PASS**, initial current-main React run. Keep the separate fixed-budget issue #609 open pending full acceptance. |
| `node scripts/test-service-worker-shell.mjs` | **PASS**, initial current-main React run. Does not prove cross-device sync. |
| `node scripts/test-react-release-integrity.mjs` | **PASS**, initial current-main React run. |
| `node scripts/test-v2-p3-accessibility.mjs`, `node scripts/test-v2-p4-visual.mjs`, `node scripts/test-v2-v18-parity.mjs` | Automated contracts are in the CI workflow; treat the whole workflow as not green until the rerun and remaining exact-SHA gates conclude. |
| `npm audit --audit-level=high --no-fund` (frontend/root) | Dependency audits are mandatory workflow steps; inspect final retry/deploy-run results before recording final gate as closed. |
| `npm test` | Root aggregate suite started in the initial run and the pre-E2E aggregate steps passed as logged; exact retry was still at the root suite when last polled. Recheck retry before release. |
| `npx playwright test --timeout=20000 --retries=0 e2e/react-review-practice.spec.mjs` | **FAIL on initial attempt: 13 passed / 1 failed**. Failed test’s shared setup observed review count stuck at zero for 10 seconds following a Good click; it did not reach the typed reading answer assertion. Retry is in progress; do not remove or weaken the assertion simply to turn CI green. |
| WebKit compatibility smoke (workflow step) | **PASS** on exact current-main SHA. |
| `node scripts/validate-...` engine suite / learner-model, deterministic selection, content-source and aggregate checks | **PASS** in [engine workflow #3589](https://github.com/ArdKam/kanji5/actions/runs/40003155635) on exact current-main SHA. |
| Pages deployment + asset hashes + offline/core E2E | **PASS only for older deployed SHA `183888f`**, [run #1720](https://github.com/ArdKam/kanji5/actions/runs/39994041669); current SHA not deployed as of this checkpoint. |

## Open PR dispositions (release relevance)

- [#617 Account deletion](https://github.com/ArdKam/kanji5/pull/617): **OPEN / NOT DEPLOYED**. Needs current-base revalidation, required CI, controlled production smoke with disposable account, and distinct local-data erasure semantics.
- [#623 Sync/data integrity](https://github.com/ArdKam/kanji5/pull/623): **OPEN / NOT DEPLOYED**. Its own React check failed on a candidate head at the time of inspection; do not merge until refreshed on current main and required checks pass.
- [#622 Reading Lab](https://github.com/ArdKam/kanji5/pull/622): **OPEN / NOT DEPLOYED**. Exact-head CI, browser and visual gates remain required.
- [#620 Light rating contrast](https://github.com/ArdKam/kanji5/pull/620): **OPEN / NOT DEPLOYED**; keep manual theme/contrast tests separate.
- [#618 Offline stale-cache handling](https://github.com/ArdKam/kanji5/pull/618): **OPEN / NOT DEPLOYED**.
- [#610 Semantic design system](https://github.com/ArdKam/kanji5/pull/610): **DRAFT/OPEN** and must retain the existing performance budget.
- Documentation candidates #619/#621/#615 are not production evidence.
- Do not bulk-merge stale older branches or modify `main` directly. The active [main ruleset](https://github.com/ArdKam/kanji5/rules/25670314) requires PRs, resolved review threads, up-to-date branch, and `build`, `validate-learning-engine`, `webkit-compat`; current user cannot bypass it.

## Prioritized blockers and suggested ownership

1. **P0 — Current-main exact-head CI and promotion:** React build’s initial mandatory Playwright gate failed. Reproduce from CI trace/screenshots, determine whether persistence failed in app behavior or the test precondition, retain the regression check, and get every required status green on the exact current SHA. Owner: release/QA with Learning/Practice implementation owner.
2. **P0 — Production security controls:** enable/recheck Supabase leaked-password protection, produce a response-header CSP mitigation and verify real response headers, then dispatch the read-only live security audit against the exact deployed SHA. Owner: Security/Data-Trust.
3. **P0 — Frozen current-main deployed artifact:** only promote after CI green; verify artifact hash equality, public manifest/assets, stale-client/cache behavior and live offline/core-product journeys on the same SHA. The stale-SHA guard is correct; rerun fresh CI instead of bypassing it. Owner: Release/Deployment.
4. **P0 — Privacy and deletion:** finish #617 through required review/CI, deploy it, perform a controlled disposable-account deletion smoke and separately define/test complete local erasure; establish a private request channel. Owner: Security/Data-Trust + Privacy/Governance.
5. **P0 — Independent education acceptance:** human review of representative content and Persian glosses; collect placement validity evidence. Owner: Educational Quality.
6. **P1 — Offline/sync integrity:** evaluate #623/#618 on current main; test authenticated multidevice convergence, deletion tombstones, concurrent-write merge, backup/restore and interrupted/offline recovery. Owner: Persistence/Sync.
7. **P1 — Real device and accessibility acceptance:** physical Android/iOS install/update/cold-start/offline/recovery, keyboard, screen reader, zoom, contrast, reduced motion, touch-target checks. Owner: Accessibility + Device QA.
8. **P1 — Reading Lab and rating contrast:** merge only after current-head gates pass, then verify the deployed target. Owners: Learning Card / Reading Lab UI.

## Release recommendation

**NO-GO for public beta.** Reopen the decision only after one frozen exact SHA has: all required PR/main CI checks green; a matching Pages deployment and current-SHA live artifact/offline/core-flow evidence; closed production security controls and a completed live security audit; accepted account/local deletion and privacy/legal governance; independent educational/placement sign-off; and dated Android/iOS plus accessibility/device evidence. A green build, earlier successful deployment, open implementation PR, or offline shell alone is insufficient.
