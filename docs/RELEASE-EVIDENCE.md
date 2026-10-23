# Rinemi — Release Evidence

This file is an operational ledger, not a user-facing promise.

## Current R13 governance evidence

Audit date: 2026-10-06.

Repository-side verification against current `main` at the post-R13 merge baseline `c5997a432aa4b60bc2913cbaec277127b96935db`:

- The current account API exposes authentication, profile/password management, sign-out, and sync, but **no account-delete operation**.
- The current Settings reset is scoped to learning progress and does not provide complete browser-data erasure.
- The Supabase schema's `ON DELETE CASCADE` relationship is database behavior, not a user-facing deletion workflow.
- The portable backup is schema/checksum validated and is not a complete representation of every browser-held datum.
- The Supabase browser runtime is vendored at the current pinned version; no third-party CDN is required for that runtime path.
- Repository search found no application-level product-analytics/advertising SDK or analytics-cookie implementation in the audited code surface.
- Public issue forms are available for general product/content feedback; security guidance routes vulnerabilities away from public issues.
- No dedicated private privacy/account request channel is operational.
- No approved project-level software license is present.

## R13 evidence status

**Repository-side:** PASS for documentation/governance reconciliation on current `main`.

**External/legal:** BLOCKED until owner/counsel decisions and production verification are recorded.

Required external evidence:
- production account deletion workflow, if implemented;
- complete local-data deletion semantics and verification;
- exact production Supabase/provider configuration;
- retention/deletion policy approval;
- target-market and age/child-user review;
- user-rights/private request channel;
- final Terms/Privacy approval;
- project license approval;
- third-party licensing/attribution approval.

## Existing release evidence

Historical exact-SHA Pages, artifact-equality, smoke, cache/stale-client, and offline evidence remains tied to its recorded candidate SHA. Do not treat historical evidence as proof for a different candidate SHA.


## Current-main follow-up — 2026-10-23

Current checkpoint: `main` at `544c7c096d4b3579d288c5a9a2beb2b672604d6a` after PR #597 moved the React manifest to the public `react-dist/manifest.json` path.

- The preceding mainline deployment run [#39871282639](https://github.com/ArdKam/kanji5/actions/runs/39871282639) failed only at the final live offline/core-product browser gate with `LIVE_PWA_ASSET_UNAVAILABLE:react-dist/.vite/manifest.json:404`. The production site had already been deployed by that run; treat that deployment as failing release acceptance.
- PR #597's pre-merge required CI and visual/browser diagnostics passed at its reviewed head. On the merged main SHA, the learning-engine and WebKit checks were observed passing; the React build was still running when this entry was prepared.
- No post-merge deployment/live-smoke pass is recorded here yet. Add the exact run URL, promoted SHA, artifact hash checks, public manifest/asset checks, offline/core-product smoke result, and stale-client result only after their actual outcomes are available.
- Keep R7 acceptance PARTIAL until this post-merge evidence is complete. Keep security, privacy/legal, educational content validation, and physical-device accessibility/install testing open independently.

This entry supplements rather than replaces the historical R13 evidence below. Evidence is SHA-specific and must not be carried forward to a different release candidate.


## Post-merge PWA verification — 2026-10-23

**Promoted SHA:** `544c7c096d4b3579d288c5a9a2beb2b672604d6a` (PR #597).

Verified evidence:
- React presentation build, all 54 steps: [run #39873770123](https://github.com/ArdKam/kanji5/actions/runs/39873770123) — success.
- Learning-engine validation: [run #39873770214](https://github.com/ArdKam/kanji5/actions/runs/39873770214) — success.
- Pages deployment and live/offline smoke: [run #39874874140](https://github.com/ArdKam/kanji5/actions/runs/39874874140) — success.
- Public React manifest and all 12 referenced graph assets verified: `LIVE_PWA_MANIFEST_AND_ASSET_GRAPH_VERIFIED assets=12`.
- Live manifest and shipped-artifact integrity passed; staged/live hashes matched for the root, entry, service worker, React JS/CSS, and pinned Supabase runtime. Final smoke reported `LIVE_PAGES_OFFLINE_AND_SMOKE_E2E_VERIFIED`.

This closes the specific hidden-path manifest 404 for SHA `544c7c0`. It does not close response-header CSP/security findings, production Supabase configuration, physical-device acceptance, privacy/legal gates, or independent educational-validity review. Do not carry these results forward to a different promoted SHA without rerunning verification.

## Supabase production Auth finding — 2026-10-23

A read-only Supabase Security Advisor check against the project named `Kanji5` returned warning `auth_leaked_password_protection`: **Leaked Password Protection Disabled**. Supabase Auth is not currently configured to reject passwords known to be compromised through HaveIBeenPwned.org.

- **Severity/source:** Supabase Security Advisor, category SECURITY, level WARN; checked 2026-10-23.
- **Required action:** enable leaked-password protection in the production Supabase Auth security settings, then re-check the advisor and record the verified setting against the frozen release SHA.
- **Documentation:** [Supabase password strength and leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- **Status:** OPEN. No configuration change is claimed here. Treat this as a distinct acceptance item from application build/tests, RLS checks, and the Pages deployment.
- **Related outstanding control:** the successful Pages deployment logged no HTTP `Content-Security-Policy` response header. The HTML meta CSP is not equivalent to a response CSP header and cannot supply all response-header directives. Decide and verify the hosting/header mitigation before public beta.

This is operational security evidence, not a compliance certification. Repeat the check after configuration changes and on the final production candidate.

The release acceptance tracker for these and the privacy, legal, educational, and device blockers is [issue #603](https://github.com/ArdKam/kanji5/issues/603).

The current-main follow-up dated 2026-10-23 links the public-beta acceptance tracker at https://github.com/ArdKam/kanji5/issues/603 and the startup-transfer blocker at https://github.com/ArdKam/kanji5/issues/609. The read-only live-security audit harness was merged by PR #604 at 2fda3fbdb76c0931a09eb378e7e778aade24154d; do not mark live audit complete until manually dispatched against the deployed SHA.
