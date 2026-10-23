# Rinemi — Release Governance & Public Beta Gate

Audit date: 2026-10-23

## Evidence policy

A roadmap item is complete only when its implementation and applicable CI, production/live, real-device, security, or legal evidence is recorded. An open PR or stale branch is not completion evidence.

## R13 current status

R13 engineering/governance reconciliation is **merged to current `main`**. Repository-side work is complete; external/legal blockers remain explicit.

Verified repository-side reconciliation:
- Privacy/data documentation matches the current browser/runtime model.
- Terms remain explicitly a legal-review draft.
- Account deletion is **not** claimed as implemented; the current account API has no delete operation or UI.
- Reset learning progress is distinguished from complete local-data deletion.
- Backup/export scope and exclusions are documented without claiming a complete cloud export.
- Retention is not assigned an invented fixed period.
- Supabase, Google OAuth, KanjiAPI/EDRDG, Tatoeba, KanjiVG, GitHub Pages/Issues, and the vendored Supabase runtime are disclosed at repository level.
- No application-level third-party analytics/advertising SDK or analytics-cookie implementation was found in the audited surface.
- Third-party licensing/attribution inventory is maintained separately from the project license.
- Repository governance files, issue forms, PR template, legal checklist, and release procedure are staged.

## Remaining release blockers

1. **Account deletion:** the candidate now exposes an authenticated, typed-confirmation client path calling the active JWT-verified `delete-account` function. The static contract and repository tests are added, but an authenticated production deletion smoke test and final evidence are still required. Local browser data is explicitly not removed by account deletion.
2. **Local-data deletion:** a separate Settings action and browser regression test clear the defined app-owned local/session keys, Reading Lab text/notes, local auth tokens, and app API-cache entries while preserving the app shell/dataset caches and unrelated site data. Do not describe it as clearing unrelated origin data or downloaded backups; verify the complete supported local-data scope on real devices.
3. **Project license:** no owner-approved project-level license exists.
4. **Private privacy/account request channel:** no dedicated non-public channel is operational.
5. **Legal review:** target markets, user-rights handling, age/child-user treatment, transfers, retention, user-content/IP, terms acceptance, licensing, and cookie/consent requirements remain owner/counsel decisions.
6. **Production authentication setting:** the connected Supabase security advisor currently reports “Leaked Password Protection Disabled” (WARN). Enable leaked-password protection in production Auth settings, review password-policy impact, rerun the security advisor and record the result before release.
7. **Security-header evidence:** run the read-only live-security workflow against the deployed candidate. A CSP meta policy exists, but no successful live audit for the final release candidate is recorded here; do not infer HTTP response-header coverage from the meta tag.
8. **Production configuration evidence:** exact enabled Supabase/provider configuration must be confirmed against the final deployment.
7. **External service/data licensing:** provider terms/attribution and production usage require final review.

## Explicitly not claimed

- No fixed cloud retention period.
- No legal compliance certification.
- No child/age classification.
- No account-deletion availability.
- No complete “delete all local data” capability.
- No project license grant from the placeholder LICENSE.

## Public Beta gate

Before Public Beta, record on one frozen candidate SHA:
1. exact SHA and matching deployed artifact;
2. production auth/RLS/delete/export evidence;
3. R12 security evidence;
4. R11 failure containment/observability evidence;
5. onboarding/device/accessibility evidence;
6. content/provenance/placement evidence;
7. final Privacy/Terms/license/legal approval;
8. operational private privacy/account request channel.

Any unresolved blocker above keeps the candidate non-final.
