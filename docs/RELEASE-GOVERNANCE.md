# Rinemi — Release Governance & Public Beta Gate

Audit date: 2026-10-06

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

1. **Account deletion:** no end-user account-deletion operation is implemented in the current browser runtime.
2. **Local-data deletion:** Reset learning progress is not complete browser-data erasure.
3. **Project license:** no owner-approved project-level license exists.
4. **Private privacy/account request channel:** no dedicated non-public channel is operational.
5. **Legal review:** target markets, user-rights handling, age/child-user treatment, transfers, retention, user-content/IP, terms acceptance, licensing, and cookie/consent requirements remain owner/counsel decisions.
6. **Production configuration evidence:** exact enabled Supabase/provider configuration must be confirmed against the final deployment.
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
