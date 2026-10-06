# Kanji5 — Release Governance & Public Beta Gate

Audit date: 2026-10-06

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

## Current-main reconciliation — 2026-10-06

Current `main` is `d5c19809c9659fd5ff4951af5e1a619d3434a12e`.

Since the previously verified A1 candidate, the following relevant implementation/documentation work has landed on `main`:

- PR #463 — R11 runtime failure diagnostics/observability hardening.
- PR #464 — final Kanji public UX/accessibility defect pass.
- PR #469 — C4 educational content and assessment validity.
- PR #470 — release/documentation reconciliation.
- PR #471 — A1 account-dialog geometry correction.
- PR #472 — A1 Production Recall keyboard-gate correction.

The exact-main React presentation workflow for the current SHA is **successful** (run `37378192793`), and the matching GitHub Pages deployment is **successful** (run `37379018058`). This is necessary A1 promotion evidence, but not sufficient by itself to declare the release lock complete.

### A1 release-lock decision

The current head is a valid release candidate pending completion of the remaining exact-SHA live verification ledger. Do not infer final release readiness from CI and deployment success alone.

Required remaining evidence includes:

1. same-SHA live HTTP 200 checks for the shipped entry artifacts;
2. staged/live SHA-256 equality for the release artifacts;
3. live smoke/offline/stale-client evidence and the corresponding markers;
4. applicable real-device, accessibility, security, privacy/legal, and production-service evidence required by the Public Beta Gate.

Open PRs or green branch CI that do not correspond to the exact frozen candidate SHA must not be counted as completion evidence.

PR #392 (older R11 observability work) remains superseded by the merged #463 implementation.
