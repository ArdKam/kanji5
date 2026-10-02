# Kanji5 — Release Evidence

This file is an operational ledger, not a user-facing promise.

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