# Kanji5 — Legal & Governance Review Checklist

**Status: owner/counsel review required; this is not legal advice.**

Last reconciled: 2026-10-06 against current `main` before R13 merge work.

## Product/data behavior

- [ ] Core learning state is accurately described as local-first.
- [ ] Optional Supabase sync categories match the actual payload.
- [ ] Reading Lab local data is distinguished from synced learner state.
- [ ] Backup/export scope and exclusions are documented.
- [ ] Reset learning progress is not described as complete local erasure.
- [ ] End-user account deletion is implemented and independently verified, or the final policy documents the approved alternative/request workflow.
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
