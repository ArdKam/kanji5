# Rinemi — Legal & Governance Review Checklist

**Status: owner/counsel review required; this is not legal advice.**

Last reconciled: 2026-10-23 against the release-governance baseline and current account-deletion candidate. This remains an owner/counsel checklist, not legal approval.

## Engineering evidence status — 2026-10-23

- A client-side account-deletion candidate now calls the existing JWT-verified `delete-account` function and requires an explicit success response. It is not available in production until the PR is merged and a controlled deletion test with a disposable account verifies the live path and cascaded cloud data.
- Browser-local erasure remains a separate action. Account deletion does not erase local learning data, downloaded exports, or unrelated browser state.
- No private privacy/account-request channel is currently configured. The public GitHub content-correction form must not be used for private requests; publish beta only after an operator-controlled private channel is established and tested.
- The current Supabase security advisor reports leaked-password protection disabled. Enable and re-verify it in production Auth settings.
- The repository contains a CSP meta policy, but the deployed Pages response currently lacks a CSP response header. Decide the supported hosting/header mitigation and record live verification before public beta.
- Independent Japanese-language/Persian content review, placement validation, physical Android/iOS checks, authenticated two-device sync, restore rollback, and final release-SHA evidence remain open. A passing repository test suite does not satisfy these external acceptance items.

## Product/data behavior

- [ ] Core learning state is accurately described as local-first.
- [ ] Optional Supabase sync categories match the actual payload.
- [ ] Reading Lab local data is distinguished from synced learner state.
- [ ] Backup/export scope and exclusions are documented.
- [ ] Reset learning progress is not described as complete local erasure.
- [ ] Self-service account deletion is implemented and the authenticated production deletion, associated data handling, failure behavior and local/cloud separation are independently verified.
- [ ] A private privacy/account request channel is operational for requests that cannot be handled through self-service.
- [ ] Cloud/local retention semantics are approved before publication.
- [ ] Retained backups, logs, auth metadata, and provider copies are covered.

## Third-party/service disclosure

- [ ] Supabase production configuration and enabled services verified.
- [ ] Google OAuth disclosure verified if enabled.
- [ ] KanjiAPI/EDRDG attribution/terms verified.
- [ ] Tatoeba attribution/license and sentence-query behavior verified.
- [ ] KanjiVG license/attribution verified.
- [ ] Runtime dependency delivery verified.
- [ ] GitHub Pages/Issues usage and public-submission warning reviewed.
- [ ] No unreviewed analytics, crash reporting, advertising, or tracking service is enabled.

## Legal decisions

- [ ] Target markets/jurisdictions selected.
- [ ] Controller/processor/service-provider roles reviewed.
- [ ] International/cross-border transfer requirements reviewed.
- [ ] User-rights/request channel established.
- [ ] Age/child-user requirements reviewed.
- [ ] Terms acceptance/versioning reviewed.
- [ ] User-content/IP terms reviewed.
- [ ] Project software license selected and approved.
- [ ] Third-party licensing/attribution is compatible with the release model.
- [ ] Cookie/consent requirements approved.

## Publication gate

No public-beta release is final while a required legal/governance approval remains unresolved.
