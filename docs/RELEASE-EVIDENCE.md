# Kanji5 — Release Evidence

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
