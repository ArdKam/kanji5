# Kanji5 — Public Release Security Review

Audit date: 2026-10-06  
Audit baseline: `main` at `ff07ed43fe88683005783d1907cc114203d9baed`  
Security work branch: `r12-public-release-security`  
Status: **NOT COMPLETE**

R12 source hardening has been reconciled onto the current `main` baseline. Repository-side security controls are retained; production configuration and deployed-artifact evidence are still tracked explicitly.

## Verified findings and fixes

### 1. Unsafe DOM / XSS sinks — VERIFIED in the R12 branch
R12 removes the audited browser-runtime HTML-construction sinks from the security-sensitive paths and isolates the legacy compatibility loader. The remaining `document.write` path is limited to a fixed same-origin script list in `legacy-loader.js`; it does not consume user/provider-controlled data.

`scripts/test-r12-security.mjs` covers source-level sink scanning and JavaScript syntax parsing.

**Evidence:** branch source and focused security-test implementation verified; CI re-run for the reconciled head remains required.

### 2. CSP / remote runtime — VERIFIED at source level
`index.html` carries the restrictive CSP meta policy and no longer contains the inline theme/legacy bootstrap code. Theme bootstrap and legacy loading are same-origin external scripts. Supabase browser runtime is vendored/pinned rather than loaded from a remote JavaScript CDN.

**Evidence:** source-level controls verified. Live HTTP response-header evidence remains unverified until this candidate is deployed.

### 3. Supabase RLS / non-owner access — VERIFIED in production
Production project: Supabase ref `vbrtzkejodkddfdbolbo`.

Live database inspection confirms RLS is enabled on `public.user_learning_state`. Policies restrict SELECT/INSERT/UPDATE/DELETE to rows whose `user_id` equals `auth.uid()`. `authenticated` has SELECT/INSERT/UPDATE/DELETE table privileges; `anon` has no table grants.

A live transaction using an authenticated non-owner JWT subject observed **0 visible rows**. An attempted INSERT for the non-owner subject was rejected by RLS. UPDATE and DELETE attempts against the existing owner row affected no rows. All write attempts were rolled back.

**Evidence:** production DB/RLS behavior verified for the current table/path.

### 4. Backup integrity / payload limits — VERIFIED in source
Portable backup integrity is version 2 with SHA-256 over the complete backup envelope. Version-1 backups remain migratable only after their legacy integrity check; migrated backups receive the v2 SHA-256 checksum. Restore validates integrity before applying data.

Imported backup files are capped at 5 MiB before JSON parsing. Sync/restore payload limits remain enforced by the existing R12 boundary.

**Evidence:** reconciled source contains the R12 integrity and payload-limit controls; focused CI verification remains required.

### 5. Dependency / third-party runtime supply chain — VERIFIED in repository controls
`@supabase/supabase-js@2.117.2` is pinned and vendored by `scripts/vendor-supabase.mjs`. Root/frontend dependency audits and staged artifact checks are part of the R12 workflows. Production source maps are disabled by Vite configuration and staged checks reject source-map artifacts.

**Evidence:** repository controls retained; exact candidate artifact/live Pages hash verification remains pending.

## Verified production blocker still open

### Supabase leaked-password protection — VERIFIED OPEN
The production Supabase Security Advisor was re-checked on 2026-10-06 and still reports `auth_leaked_password_protection` as disabled.

Current Supabase documentation confirms this setting is controlled through the project's Auth settings and is available on Pro Plan and above. The available repository/Supabase tool surface does not expose the required Auth configuration mutation, so this task cannot safely change the production Auth setting without inventing an unsupported control path.

**Status:** unresolved and release-blocking. After the production Auth setting is enabled, the Security Advisor must be re-run and this section updated with the passing evidence.

## Remaining release evidence

1. Re-run the R12 CI/security/build/staged-artifact gates on the reconciled head.
2. Verify the candidate on the deployed GitHub Pages site, including artifact hashes and response headers/CSP.
3. Re-run the production Security Advisor after leaked-password protection is enabled.
4. Do not mark R12 complete until the above evidence is recorded.

## Scope boundary

No R12 change redesigns persistence, the learner model, FSRS scheduling, adaptive planning, evaluation/grading, Vocabulary, Grammar, or unrelated UX/observability architecture.

## Sign-off rule

R12 may be marked complete only after repository-side security gates pass, the production candidate is hash-verified, relevant live security headers are verified, and the remaining production Security Advisor finding is cleared.
