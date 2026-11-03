# Kanji5 security and data-trust review — 2026-10-23

## Scope and evidence

- Current-main port baseline: `main` at `a303071c5fe4457a98b921f26c2df3db741fdd99`. The initial session-isolation port was reviewed against the current-main sync implementation, preserving the later concurrent-write and tombstone safeguards from PR #623 (`10a9d79d26b75c594c91a6b97482ed36f0ca3281`); the focused fix was ported onto this current-main commit rather than carrying the older branch base.
- Production Supabase project metadata: project named Kanji5, ref `vbrtzkejodkddfdbolbo`, organization tier `free`. The repository's `supabase-config.js` targets this project's hostname and contains a public browser key; no service-role/secret-key marker was found. The public key value is intentionally not copied into this report.
- Production Pages URL: `https://ardkam.github.io/kanji5`; `.github/workflows/pages-deploy.yml` builds and stages the exact React-verified commit before deployment.
- Production database checks were read-only metadata queries. No user rows or tokens were printed, and no destructive operation was run.
- Proposed code remediation is on `fix/auth-session-isolation-current-main-20261023`; the candidate is not deployed evidence.
- Source contract tests and CI are not production verification. The current Pages deploy and the matching live-security workflow must be inspected against the exact promoted SHA before release.

## Risk ranking

| ID | Priority / impact | Exploitability and evidence |
|---|---|---|
| F1 | **P1 — high potential privacy/data-integrity impact** | **Low-to-moderate exploitability:** requires an auth transition while a sync request is pending. The browser client used a mutable account ID across async boundaries; RLS still restricts row ownership. This is a client composition/session race, not an RLS bypass. The mocked-browser test exercises the timing locally. |
| F2 | **P1 — release blocker / medium security impact** | **Low-to-moderate likelihood of direct exploitation, but meaningful credential-stuffing risk:** protection against known leaked passwords is disabled. This check prevents use of known-compromised passwords; it does not prove that an existing account password has been exposed. Live Advisor and organization tier were observed. |
| F3 | **P1 — release hardening blocker** | **Exploitability depends on another attack path:** absence of a verified response CSP leaves response-only protections, including `frame-ancestors`, unproven. No XSS or clickjacking exploit was reproduced; latest successful deployment evidence is older than current `main`. |
| F4 | **No database authorization defect confirmed** | Live catalog/policy definitions and grants were inspected read-only. A transaction using the `authenticated` role and a synthetic non-owner claim returned zero visible learner-state rows and was rolled back. Actual HTTP/PostgREST JWT probes on the final deployed SHA remain separate acceptance work. |
| F5 | **P1 — public-beta capability/privacy blocker** | The active server deletion function is configured securely by inspection, but a production user-facing deletion workflow is not verified end-to-end. No real-user deletion was attempted. |

## Findings

### F1 — High: in-flight sync was not bound to the identity that started it

**Evidence on baseline main:** `supabase-sync.js` used the mutable module-level `user.id` when reading and writing `public.user_learning_state`. It computed a merged payload from the local state and one remote account, then awaited additional network operations before writing the merged result to the remote row and local storage. During sign-out or switching to another account, those operations could observe a different global user. Row-level security would still enforce that the JWT can only access its own row, but it cannot identify an incorrectly composed payload sent by the client to the new account's own row.

**Impact:** account-state crossover or stale remote state being applied to local progress during a fast account transition. This is a client-side identity/data-integrity race; it is not evidence that the database RLS owner predicate is bypassed.

**Candidate remediation:** capture an immutable user ID and auth-generation number per operation; scope reads and writes to that captured ID; abort stale work before applying remote results locally; and queue a sync for the new identity if an earlier identity still owns the single-flight lock. Profile/password operations also verify that the active identity remains the captured identity before applying returned user data. No scheduler, grading, FSRS or learning-engine decision logic is changed.

**Status:** current-main candidate on a dedicated branch; only complete after exact-head CI and a controlled, non-destructive browser/account-switch regression pass. No deployment or live account-switch test is claimed.

### F2 — Medium / release blocker: leaked-password protection is disabled in production Auth

**Live evidence:** Supabase Security Advisor returned `auth_leaked_password_protection` / “Leaked Password Protection Disabled” for the Kanji5 project. It was the returned security lint. This is an operational Auth setting, not a missing application environment variable or an RLS policy.

**Required action:** Supabase currently documents this feature as available on Pro and above; the connected production organization reports the Free tier. An authorized owner must decide whether to upgrade to a supported tier, then enable leaked-password protection in Auth settings and rerun Security Advisor. If the owner chooses not to upgrade, the release remains blocked until an explicit documented risk decision/alternative control is approved; do not pretend a code change enables this feature. No setting was changed by this audit.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### F3 — High / release blocker: deployed response-header coverage is not complete

Repository release records and the Pages deployment workflow show that the last successful deployment with recorded artifact verification was SHA `183888f31be316aaa1c60ce57e301d4f6b37e454`; that evidence recorded no HTTP `Content-Security-Policy` response header. A later deployment attempt for `6e0544954186f12b3b7755f7613cbdc6e782a98a` failed the stale-SHA guard because `main` moved. The current-main React build/deployment needs fresh verification. A meta policy does not provide all response-only protections, including `frame-ancestors`; historical smoke evidence is not proof of current headers.

**Required action:** the candidate changes `.github/workflows/live-security-audit.yml` to invoke the read-only live audit automatically after a successful Pages deployment from `main`, checking out the deployment run's exact `head_sha`; OWASP ZAP remains manual-only. After this workflow change is merged and deployed, verify that the trigger ran against the exact served candidate, then decide on an actual hosting/CDN/edge response-header mechanism. GitHub Pages static hosting should not be assumed to apply a Cloudflare-style `_headers` file. Verify CSP, `X-Content-Type-Options: nosniff`, framing protection, Referrer-Policy, and Permissions-Policy from real HTTP responses. Do not mark this fixed by changing HTML alone.

### F4 — RLS / authorization — live policy definition verified, not a full access-test claim

Read-only production catalog inspection confirmed:

- `public.user_learning_state` has RLS enabled and primary key `user_id`.
- SELECT, INSERT, UPDATE and DELETE policies are limited to role `authenticated` and compare `auth.uid()` to `user_id`.
- UPDATE has both `USING` and `WITH CHECK` ownership predicates.
- The table grants SELECT/INSERT/UPDATE/DELETE to `authenticated`; no table privilege is granted to `anon`.
- The account-state table's `user_id` foreign key references `auth.users.id`.

No policy or schema migration was justified by the catalog results. A read-only transaction explicitly assumed the `authenticated` role, set both supported request-claim settings to a synthetic non-owner UUID, and received `rows_visible_to_non_owner = 0`; it was rolled back. This exercises database role/RLS behavior without touching user data, but it is not an actual PostgREST HTTP request or JWT-backed REST test. Rerun the automated read-only non-owner HTTP probe against the final deployed SHA. Write-denial testing must use disposable accounts or a fully rolled-back synthetic transaction, never modify real learner data.

### F5 — Account deletion is not yet a released end-to-end product flow

The production Edge Function `delete-account` is ACTIVE and has JWT verification enabled. Its code obtains the target ID from verified user claims, rejects missing user identity, calls the Admin API, and returns explicit deletion success; failures log only a code. It does not accept a target user ID in the request body.

**Database deletion scope inspected read-only:** `public.user_learning_state` is the only application table found under `public`; its `user_id` foreign key cascades on `auth.users` deletion. No Storage buckets or Storage objects existed at the time of inspection. Supabase Auth's own user-owned identity/session/factor tables also have cascade foreign keys; the built-in `auth.scim_users` relation uses `ON DELETE SET NULL`. This inventory is bounded to the connected project at the inspection time and does not establish retention behavior for provider-side logs, backups, or external services.

PR #617 is an open candidate for the browser UI and Account API integration. Until it is merged, deployed, and tested with a disposable authenticated account, do not claim that end users have a verified production deletion flow. Account deletion must remain distinct from clearing browser-local learner data and downloaded backups. Never test this on a real learner account.

### F6 — Privacy, configuration and public-beta acceptance remain open

The release-blocker tracker, issue #603, still requires owner/counsel decisions and evidence for a private privacy/account-request channel, legal/terms/license/retention, local-data erasure scope, independently reviewed educational content and placement validity, physical Android/iOS checks, and one frozen release candidate.

The live Auth password-protection setting and actual deployed HTTP headers are not fixable merely by changing browser code. Exact redirect allowlists and OAuth/provider settings must also be verified in the authorized production Auth dashboard against the deployed origin/path.

## Regression and validation plan

- `scripts/test-auth-session-isolation.mjs` asserts the session snapshot, immutable owner scoping, stale-result guards, auth-generation invalidation and follow-up sync behavior.
- `e2e/auth-session-isolation.spec.mjs` drives a local mock Supabase client: it holds account A's SELECT response, switches to account B, then releases A's response with a matched optimistic timestamp. It asserts that A-derived data is neither written under B's identity nor applied to local storage. The fixture makes no production network requests and mutates no real accounts.
- `.github/workflows/react-frontend.yml` runs this browser regression on the PR head.
- `.github/workflows/live-security-audit.yml` is updated to run strict read-only probes after a successful Pages deployment from `main`, checking out the triggering deployment's exact SHA; the ZAP passive scan stays manual-only. `scripts/test-live-security-workflow.mjs` covers this trigger and checkout contract.
- The root test runner `node scripts/test-all.mjs` auto-discovers `scripts/test-*.mjs`; the new test is included automatically.
- Required CI: root contracts, React build/typecheck, engine-boundary and WebKit/browser checks on the exact PR head.
- Required acceptance: the new mocked-browser regression must pass, then rerun live read-only security probes against the frozen promoted SHA. The mock isolates the client race; it does not replace RLS access tests or an authenticated multi-device sync test using disposable test accounts.
- These commands/tests must be reported with actual CI results before claiming pass. This audit author did not run a local checkout test suite or destructive account tests.

## Rollback and remaining risks

The source change is isolated to `supabase-sync.js`, targeted regression tests, deployment-audit workflow wiring, and the findings document; it can be reverted as a single PR if required. Roll back only after preserving investigation logs without personal data, and never downgrade or relax RLS to work around a failure.

This focused fix fences in-flight operations; it does **not** partition local learning state per account or define an explicit product policy for switching between different accounts on the same browser. Because Rinemi is local-first and merges guest state into a signed-in account, that cross-account product behavior needs a separately reviewed decision/test before multi-account use is presented as isolated profiles. It also does not clear the leaked-password warning, configure HTTP response headers, verify provider redirects, complete legal review, or constitute security clearance.
