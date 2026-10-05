# Kanji5 — Public Release Security Review

Audit date: 2026-10-05  
Audit baseline: `main` at `7d9d413ccb1a236d535ea2ff36d1a124587d7d2d`  
Security work branch: `r12-public-release-security`  
Status: **NOT COMPLETE**
Reconciled base: current `main` at `708244a5ae096fba4c926ca6bb25c33978341d83` (R11, 2026-10-05).

R12 was originally branched from the preceding `main` tip; the PR base has now been refreshed to current `main`, and the overlapping R11 observability changes in `index.html` / `supabase-sync.js` were preserved explicitly.


R12 is intentionally not signed off from source inspection alone. The branch contains code and schema hardening plus focused checks, but production/live release evidence remains incomplete and the Supabase Security Advisor still reports one verified production blocker.

## Verified findings and fixes

## Latest CI evidence

At the pre-reconciliation R12 head `d6b8ab78d7b0c834ab63fb716f98f3badbc1c550`, all R12-specific security/staged-artifact/dependency/typecheck/build/unit-contract gates passed. The overall React workflow later failed only at the WebKit browser-compatibility smoke because `#root .app-shell` did not appear within 20 seconds; Firefox passed. This is outside the R12 security scope and is not used as evidence that R12 is complete.

The current R12 security test additionally parses every root browser-runtime JavaScript file before running sink/secret checks, preventing syntax-level runtime defects from being missed by string scanning alone.


### 1. Unsafe DOM / XSS sinks — VERIFIED and fixed in branch

The initial audit found two browser-runtime `innerHTML` sinks in `v1.6-session-ui.js` and `v1.2-runtime-fixes.js`. Both only rendered fixed application strings, but they were unnecessary sinks and were replaced with DOM construction + `textContent`.

The React source already had a source-level gate rejecting `dangerouslySetInnerHTML` and `innerHTML =`. R12 adds `scripts/test-r12-security.mjs`, which scans the browser runtime inventory for `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `srcdoc`, `document.write`, and related sinks.

The compatibility-only `legacy-loader.js` retains `document.write` with a compile-time constant list of same-origin local scripts. No user-controlled or provider-controlled data reaches that sink. This path remains isolated and explicitly tested.

**Evidence status:** source/test evidence verified on this branch; deployed-artifact/live-browser evidence still required.

### 2. CSP — VERIFIED at source level; live header UNVERIFIED

`index.html` now carries a restrictive Content-Security-Policy meta policy with same-origin script execution, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `script-src-attr 'none'`, and explicit allowlists for the known data/content endpoints.

Inline JavaScript in `index.html` was removed. The theme bootstrap and legacy compatibility loader are now external same-origin scripts. `style-src 'unsafe-inline'` remains because the current presentation/runtime injects styles; this does not permit inline script execution.

This is a source-level CSP control. Actual HTTP response-header behavior on the deployed Pages site is still an open evidence item. A CSP meta tag is not equivalent to a response header for directives such as `frame-ancestors`.

**Evidence status:** source-level check implemented; deployed response-header verification UNVERIFIED.

### 3. Supabase Auth/session — VERIFIED in code; end-to-end production auth evidence UNVERIFIED

The browser Supabase client is configured with persisted sessions, automatic token refresh, and session detection in the callback URL. OAuth/password/magic-link/reset redirects are derived from the current same-origin URL rather than user-supplied redirect destinations.

R12 removes the previous CDN/ESM runtime fallback and changes the browser runtime to a same-origin pinned vendor artifact: `vendor/supabase-js-2.117.2.js`.

**Evidence status:** source-level control verified; credentialed production auth lifecycle remains release evidence, not a code-inspection claim.

### 4. Supabase RLS / unauthorized read-write — VERIFIED in production

Production project: Supabase ref `vbrtzkejodkddfdbolbo`.

The production `public.user_learning_state` table has RLS enabled. The live policies enforce `auth.uid() = user_id` for SELECT, INSERT, UPDATE, and DELETE. The live table grants were tightened so `authenticated` has only SELECT/INSERT/UPDATE/DELETE and `anon` has no table privileges.

A live transaction tested an authenticated role with a non-owner JWT subject: it observed zero rows and could not INSERT a row for that subject or UPDATE/DELETE the existing owner's row. The transaction was rolled back.

**Evidence status:** production DB verification complete for the tested table/path. This does not prove security of future tables that do not yet exist.

### 5. Backup integrity / tampering — VERIFIED for local restore path in source tests

Portable backups are now version 2 and use SHA-256 over the complete backup envelope (format, version, timestamp, data, metadata, and summary). The restore path verifies the checksum before applying the data.

R12 also limits imported backup files to 5 MiB in the UI and adds a focused tamper regression. The checksum implementation is synchronous so the existing backup boundary contract is unchanged. A modified backup is rejected without replacing current state.

This is an **integrity check, not authenticity**: a party that can arbitrarily execute trusted client code can recompute a client-side checksum. Cloud synchronization remains protected by authenticated Supabase access controls and RLS.

**Evidence status:** source/unit verification implemented; real-device backup/restore evidence remains part of the public-release gate.

### 6. Dependency / third-party runtime supply chain — VERIFIED in branch; production artifact UNVERIFIED

The security-sensitive Supabase browser client is pinned to `@supabase/supabase-js@2.117.2` and built into a same-origin vendor artifact by `scripts/vendor-supabase.mjs`. The vendor script uses an exact npm version, runs `npm audit --audit-level=high`, verifies the installed version, and records a SHA-256 digest of the generated artifact.

The existing FSRS runtime remains vendored at `vendor/ts-fsrs-5.4.1.mjs`.

Known external runtime data/content services remain explicit: KanjiAPI, Tatoeba, and the pinned KanjiVG raw GitHub path. No remote JavaScript runtime is intended.

**Evidence status:** repository controls verified; generated/live artifact verification still required in CI/Pages.

### 7. Secrets / source maps — VERIFIED at source/staging policy level; deployed artifact UNVERIFIED

The browser Supabase key is a publishable/anon key; the audit rejects service-role/private-key patterns from runtime files. Vite production builds now explicitly set `sourcemap: false`.

The Pages verifier and R12 security check reject source-map files in the staged site and reject remote Supabase JavaScript URLs.

**Evidence status:** source checks implemented; exact deployed artifact still requires CI/live hash verification.

## Verified production blocker still open

### Supabase leaked-password protection — VERIFIED OPEN

The production Supabase Security Advisor reports leaked-password protection as disabled. This is a verified production configuration warning and remains outside the current repository file/tool surface available to this task.

R12 therefore remains **NOT COMPLETE**. The finding should be treated as release-blocking until the production Auth configuration is changed and the advisor is re-checked.

## Unverified release evidence

The following items are deliberately not claimed complete from code inspection:

1. The exact R12 branch build/staged artifact has not yet been promoted and hash-verified on the live Pages site.
2. Deployed HTTP response headers/CSP have not yet been exercised against the live site.
3. Representative real-device/browser security behavior has not been independently verified for this R12 candidate.
4. Credentialed production auth lifecycle evidence is still required.
5. The production leaked-password-protection blocker remains unresolved.

## Scope boundary

No R12 change redesigns persistence, the learner model, FSRS scheduling, adaptive planner, evaluation/grading, Vocabulary, Grammar, or the observability architecture.

## Sign-off rule

R12 may be marked complete only after the automated security/artifact checks pass, the production candidate is hash-verified, the relevant live security headers are verified, the remaining production auth/security configuration findings are cleared, and the required production/browser evidence is recorded.
