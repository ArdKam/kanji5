# Kanji5 — Release Governance & Public Beta Gate

Audit date: 2026-10-03

## Evidence policy

A roadmap item is only considered complete when implementation, automated tests, CI, production/live verification, and real-device evidence have the evidence required by that item's gate. An open PR is not completion evidence.

The release candidate must be identified by an exact commit SHA and frozen before the Public Beta Gate.

## Current repository/legal state

- A project-level software license file is not currently present in the repository.
- Third-party license inventory exists in docs/THIRD-PARTY-LICENSES.md.
- docs/PRIVACY-AND-DATA.md is an intended-data notice and still requires legal review against production services.
- docs/TERMS-OF-USE-DRAFT.md records current account deletion, local-data, backup, and third-party-service semantics but is not final legal text.

The absence of a project-level license is a release blocker until an explicit license decision is recorded by the owner.

## Public Beta acceptance evidence

Before opening Public Beta, record:

1. exact frozen release SHA and matching deployed Pages artifact;
2. production Supabase/RLS/auth/delete/export evidence;
3. security evidence for CSP, unsafe DOM, dependency audit, secret/source-map review, and third-party runtime inventory;
4. global runtime failure containment and observability checks;
5. current onboarding/RTL/empty-state validation;
6. Tier 1 real-device evidence for installability, cold/repeat start, learning/review, offline/reconnect, backup/restore, and key accessibility paths;
7. Kanji dataset/provenance/placement QA and a user-facing content-reporting path;
8. final privacy/terms/license/legal review.

## Known unverified items on 2026-10-03

No claim of representative real-device validation is made from repository CI alone.

Production authenticated account deletion has been deployed, but a credentialed end-to-end invocation has not been executed in this environment.

HTTP response-header verification against the deployed Pages site has not yet been completed.

The current Supabase Security Advisor warning for leaked-password protection remains open.

The Supabase browser client is still CDN-loaded in supabase-sync.js; the release hardening plan still requires a reviewed local/vendor path or an explicitly approved exception.

## Decision rule

Any unresolved item above keeps the release candidate in a non-final state. Do not infer release readiness from green source/CI checks alone.

## Current-main reconciliation — 2026-10-05

Current `main` is `2618d779222c00b906466a122762a19eb44a4f6c`. Since the previously verified A1 candidate, the following implementation work has landed on `main`:

- PR #463 — R11 runtime failure diagnostics/observability hardening.
- PR #464 — final Kanji public UX/accessibility defect pass.
- The R2 onboarding implementation is already on `main` through the merged placement/onboarding sequence (#451/#453/#454/#456).

These changes are implementation evidence on current `main`; they are not, by themselves, release evidence.

The current-main React presentation workflow (run `37358688159`) is **failed** at the account shell gate, and the corresponding Pages deployment (run `37359308280`) is **skipped**. The repository therefore remains in a pre-release-lock state until the current head is repaired and re-verified on one exact candidate SHA.

Open PRs currently targeting the remaining release gates are not counted as complete:
- #467 — R4–R6 persistence/history/backup safety.
- #468 — R12 security hardening.
- #469 — C4 educational content and assessment validity.
- #465 — R13 privacy/legal reconciliation.

PR #392 (older R11 observability work) is superseded by the merged #463 implementation and should not be used as evidence that R11 is still unimplemented.
