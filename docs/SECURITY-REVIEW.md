# Kanji5 — Public Release Security Review

Audit date: 2026-10-06  
Audit evidence baseline: `2e54187c745d2639b329c5335a164145e420d8ab`  
Current `main` after documentation reconciliation: `ea03ee5f02225bebf7b7d960edfc77046853d912`  
R12 PR: #468 — merged at `fa37b536a50cf120b8f20062adcab57fc50d4bf2`  
Status: **NOT COMPLETE**

R12 repository hardening is landed on `main`. This document records only verified repository/production evidence; it does not treat an old PR or prior release candidate as current-main verification.

## Verified findings and fixes

### 1. Unsafe DOM / XSS sinks — LANDED
R12 removes the audited browser-runtime HTML-construction sinks from the security-sensitive paths and isolates the legacy compatibility loader. The remaining `document.write` path is limited to a fixed same-origin script list in `legacy-loader.js`; it does not consume user/provider-controlled data.

`scripts/test-r12-security.mjs` includes source-level sink scanning and JavaScript syntax parsing.

### 2. CSP / remote runtime — LANDED
`index.html` carries the restrictive CSP meta policy and no longer contains the inline theme/legacy bootstrap code. Theme bootstrap and legacy loading are same-origin external scripts. The Supabase browser runtime is vendored/pinned rather than loaded from a remote JavaScript CDN.

Live response-header evidence is still **not verified for current main**.

### 3. Supabase RLS / non-owner access — VERIFIED
Production project: Supabase ref `vbrtzkejodkddfdbolbo`.

Production inspection confirmed RLS on `public.user_learning_state`, owner-scoped SELECT/INSERT/UPDATE/DELETE policies using `auth.uid() = user_id`, and no `anon` table grants. Prior live non-owner verification observed zero visible owner rows and rejected a non-owner INSERT; UPDATE/DELETE against the owner row affected no rows and the transaction was rolled back.

### 4. Backup integrity / payload limits — LANDED
Portable backup integrity is version 2 with SHA-256 over the complete backup envelope. Version-1 backups remain migratable only after their legacy integrity check; migrated backups receive the v2 checksum. Restore validates integrity before applying data.

Imported backup files are capped at 5 MiB before JSON parsing, with sync/restore payload limits enforced by the R12 boundary.

### 5. Dependency / third-party runtime supply chain — LANDED
`@supabase/supabase-js@2.117.2` is pinned and vendored by `scripts/vendor-supabase.mjs`. R12 also adds source, staged-artifact, dependency-audit, source-map, and remote-runtime checks.

## Current production blocker

### Supabase leaked-password protection — VERIFIED OPEN
The production Supabase Security Advisor was re-checked on 2026-10-06 and still reports `auth_leaked_password_protection` as disabled.

Supabase's current documentation states that leaked-password protection is available on the Pro plan and above; the Free plan does not include it. The available connected Supabase tooling does not expose an Auth-settings mutation for enabling it, so there is no safe repository-side fix for this finding.

**Status:** unresolved and release-blocking. The production Auth setting must be enabled operationally, after which the Security Advisor must be re-run.

## Current-main verification gaps

The audit evidence baseline is `2e54187c745d2639b329c5335a164145e420d8ab`; the documentation reconciliation subsequently advanced `main` to the current documentation head recorded above. The audit baseline commit had no workflow runs attached through the current GitHub workflow-run query, so the earlier R12 PR CI evidence remains historical and is not promoted to a current-main claim.

Still required before R12 sign-off:

1. Run the R12 security/source/dependency/build/staged-artifact gates against the current `main`.
2. Verify the current deployed Pages candidate, including artifact hashes and HTTP response headers/CSP.
3. Re-run the production Security Advisor after leaked-password protection is enabled.
4. Record same-SHA deployment/live smoke evidence for the promotion candidate.

## Scope boundary

No R12 change redesigns persistence, the learner model, FSRS scheduling, adaptive planning, evaluation/grading, Vocabulary, Grammar, or unrelated UX architecture.

## Sign-off rule

R12 may be marked complete only after current-main repository security gates pass, the promotion candidate is hash-verified in the deployed environment, relevant live security headers are verified, and the remaining production Security Advisor finding is cleared.


## Agent-safe disposition

R12 repository implementation is **DONE / LANDED** through PR #468 (`fa37b536a50cf120b8f20062adcab57fc50d4bf2`). **Do not restart R12 implementation or repeat the full repository audit** unless a concrete regression or new security finding is demonstrated on current `main`.

Remaining R12 work is acceptance evidence only: current-main security gates, same-SHA deployment/artifact/header/live-smoke verification, and operational clearance of `auth_leaked_password_protection`. The leaked-password finding is external Supabase configuration/plan work, not missing repository implementation.
