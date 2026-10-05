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

## A1 candidate release lock

- Candidate branch: `release/a1-integrity-20261005`.
- Candidate base SHA: `bc028900c8178163e21f97cfb2862759af748dbd`.
- Candidate commit identity: **the exact SHA of the commit containing this section**. This self-reference is intentional: the candidate SHA is the Git commit that contains the final A1 ledger update; the final exact SHA is also reported in the release PR/merge record.
- This candidate intentionally contains no product feature work; only A1 evidence documentation.

## Candidate verification record

The pre-candidate current-main release path already established the following concrete evidence, which is being carried forward into the frozen A1 candidate while the candidate-specific CI/Pages/live checks run:

- React presentation build workflow: run 37151754816, success on `bc028900c8178163e21f97cfb2862759af748dbd`.
- GitHub Pages deployment workflow: run 37152198644, success on `bc028900c8178163e21f97cfb2862759af748dbd`.
- Pages build version recorded by the deploy action: `bc028900c8178163e21f97cfb2862759af748dbd`.
- Same-SHA live artifact verification: pass for index, React entry, service worker, React JS, and React CSS.
- Live core/offline smoke marker: `LIVE_PAGES_OFFLINE_AND_SMOKE_E2E_VERIFIED`.
- Automated source/contract suite: 150/150.
- Production performance baseline: desktop LCP 604 ms / CLS 0.006; mobile profile LCP 428 ms / CLS 0.005; zero long tasks in the measured startup window; application transfer approximately 1,885 KB.
