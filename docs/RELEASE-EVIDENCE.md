# Kanji5 — Release Evidence

This file is an operational ledger, not a user-facing promise.

## Current release-candidate ledger — 2026-10-03

- **Current main:** `1dad70cb6af1c4d7f2accc9ca21940cf2d3b98be`.
- **Latest main change:** educational/content audit and assessment-validity gates are now on main; see `docs/EDUCATIONAL-CONTENT-AUDIT.md` and `docs/ENGINE-AUDIT.md`.
- **Pages deployment:** the exact-SHA deployment/live artifact/hash evidence for `1dad70cb6af1c4d7f2accc9ca21940cf2d3b98be` is not yet recorded here.
- **PR #420:** current-main security/CSP/Supabase hardening remains open; implementation is not counted until CI and production verification pass.
- **PR #421:** current-main global React error-boundary/recovery remains open; implementation is not counted until CI/build/live checks pass.
- **PR #422:** merged as `7bd26bf8713b03898fd00dcdd8e4a39402d659ac`, bringing the Privacy/Data and Release Governance docs onto main.
- **Production Supabase:** `public.user_learning_state` has RLS enabled with auth.uid()-scoped ownership; the authenticated delete policy was applied in production on 2026-10-03; the `delete-account` Edge Function is deployed with JWT verification. Credentialed end-to-end account deletion is not yet evidenced.
- **Security Advisor:** one warning remains for leaked password protection being disabled.
- **Project license:** no project-level `LICENSE` file is present; owner/legal license selection remains a release blocker.

## Verified baseline

- efbfaf1912f99e3ae6afc607e675efcd9cb2ff62: release artifact/cache/stale-client/offline production verification recorded in roadmap PR #377.
- a580a2024aaec58d8fc700b399957656f17c23d8: expanded live Pages smoke gate through onboarding, Learning, Active Recall, Stats, Settings/backup export, Account, and offline reload. The PR's CI validation passed.

## Current-main pre-Vocabulary additions

- PR #389: domain-neutral persistence adapter over the existing localStorage backend.
- PR #390: explicit PWA install metadata and 192/512 icon assets are prepared on a current-main branch; merge/CI evidence must be captured before marking them complete.
- PR #388: Help, browser support, privacy/data, and feedback are discoverable from Settings.

## Evidence still requiring external execution

Representative-device performance must be recorded on actual target hardware.

Browser compatibility should be recorded per browser/OS/device, not inferred from one Chromium run.

Public beta observations must come from real users.

Security/privacy/legal sign-off must use the production Supabase project, headers, enabled third-party services, and actual target markets.

Do not convert a configured workflow or a PR CI result into a production claim without the corresponding live evidence.