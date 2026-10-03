# Kanji5 — Release Evidence

This file is an operational ledger, not a user-facing promise.

## Current release-candidate ledger — 2026-10-03

- **Current `main`:** `7bd26bf8713b03898fd00dcdd8e4a39402d659ac`.
- **Pages deployment for current `main`:** workflow run `37141806727` is in progress; no same-SHA deployment/hash claim is recorded yet.
- **Security PR:** #420 targets current `main` and remains open; CI must pass before its implementation can count on `main`.
- **Failure-containment PR:** #421 targets current `main` and remains open; CI/build/live verification must pass before its implementation can count on `main`.
- **Governance/docs PR:** #422 merged into `main` as `7bd26bf8713b03898fd00dcdd8e4a39402d659ac`; Privacy/Data and Release Governance docs are now on the current baseline.
- **Production Supabase:** RLS is enabled on `public.user_learning_state`; ownership policies use `auth.uid()`; the authenticated delete policy was applied in production on 2026-10-03; the `delete-account` Edge Function is deployed with JWT verification. Credentialed end-to-end deletion has not yet been executed.
- **Security Advisor:** one warning remains for leaked password protection being disabled.

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

No project-level `LICENSE` file has been selected/committed yet; this remains a release blocker.

Do not convert a configured workflow or a PR CI result into a production claim without the corresponding live evidence.