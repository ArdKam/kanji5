# Kanji5 — Privacy & Data Policy (Product Draft)

**Status: product-accurate engineering draft for owner/counsel review. Not legal advice and not final public policy.**

Last reconciled: 2026-10-06 against the current runtime on the R13 branch rebased from `main`.

## Scope

Kanji5 is a local-first browser application. Core learning data is stored in browser-controlled storage by default. An optional account can use Supabase Authentication and the `user_learning_state` table for synchronization.

This document describes observed repository behavior. It does not create legal commitments or promise capabilities that are not implemented.

## Data stored locally

Depending on features used, the browser may store:

- learner state, cards, review records, scheduling data, settings, streaks, and bounded session history;
- learner-model/component/skill evidence used by the learning engine;
- personal and prepared mnemonic data;
- cached content and dataset-version metadata;
- a per-device identifier used by the local learning-state layer;
- onboarding and presentation preferences;
- Reading Lab session data, including user-entered Japanese text, annotations, translations, audio/playback metadata, and related session state.

Browser profile/site-data controls determine the lifetime of this local storage. Clearing site data can remove it. The application does not currently implement a general-purpose local-data retention scheduler.

## Accounts and synchronization

Account creation is optional. The current account surface supports email/password, magic-link authentication, Google OAuth, password reset/change, profile display name, sign-out, and optional synchronization.

When synchronization is enabled, the browser sends a bounded learning-state payload to the configured Supabase service. The current payload includes learner state/cards/reviews, settings, knowledge/mnemonics, bounded session history, components, and skill-profile information. Reading Lab's separate local session storage is not part of this sync payload.

Supabase Authentication processes the account identifier and authentication material required by the selected sign-in method. The application does not independently store plaintext passwords.

## User-provided content

Personal mnemonics and Reading Lab text/annotations are user-provided content. Do not place passwords, auth tokens, private backups, or sensitive personal information in public GitHub issues.

## Export and backup

Settings provides a versioned JSON backup with schema/checksum validation. The portable backup represents the application's supported learning snapshot and related data covered by the backup schema; it is not a cloud export and is not guaranteed to contain every browser-held datum.

The backup does not by itself represent:

- authentication/session state;
- service-worker/browser caches;
- arbitrary browser storage outside the backup schema;
- Reading Lab state that is outside the portable backup payload.

Personal mnemonic backup/import has a separate supported path.

## Deletion semantics

### Account deletion

The current browser runtime **does not expose an end-user account-deletion operation or UI**. The account API exposes sign-in/sign-up, profile/password management, password reset, sign-out, and sync, but no account-delete method.

The Supabase schema uses a foreign-key relationship with `ON DELETE CASCADE` for `user_learning_state`; that database relationship is not an end-user deletion workflow.

The project therefore must not claim that users can currently delete their account from the product. A verified production deletion route and an appropriate private request workflow remain release blockers.

### Local-data deletion

Settings currently exposes **Reset learning progress**. That action resets learning state/history within its defined scope; it is not a promise to erase every browser-held value.

It does not constitute complete deletion of onboarding/presentation preferences, Reading Lab session data, service-worker/browser caches, or the Supabase authentication session.

### Cloud/local separation

A future account-deletion implementation must explicitly define whether and how local data is affected. Until that is implemented and verified, documentation must not infer cloud deletion from the local reset action or vice versa.

## Retention

The repository does not define a fixed cloud retention period for accounts, synchronized learner state, provider copies, backups, or logs.

Local-data lifetime is primarily controlled by browser storage and product reset behavior. No application-level retention scheduler currently enforces a universal local retention period.

Exact retention periods, inactive-account handling, backup/log retention, provider copies, legal exceptions, and deletion timelines require owner/counsel decisions against the final production configuration.

## Third-party services and content

The current runtime/repository represents:

| Service/source | Current role | Data interaction |
| --- | --- | --- |
| Supabase | Optional auth and learner-state sync | Account/auth data and sync payload |
| Google | Optional OAuth identity provider | Authentication exchange when selected |
| KanjiAPI / EDRDG-derived content | Optional vocabulary/content lookup | Browser requests content when the feature needs it |
| Tatoeba | Optional context/translation lookup | Reading Lab may send entered sentence text for a lookup |
| KanjiVG | Stroke-order data | Stroke assets/content |
| GitHub Pages | Hosting/deployment | Serves the public application |
| GitHub Issues | Public support/feedback | Public submissions may be visible to others |
| Vendored Supabase JS | Runtime dependency | Same-origin repository asset; no runtime CDN dependency for the Supabase client |

The final public notice must be reduced to the services actually enabled in the production deployment and must include the applicable provider disclosures.

## Analytics, cookies, and tracking

The repository contains educational **session analytics** as learner data, but no separate third-party product-analytics, advertising, or crash-reporting SDK is currently implemented.

The repository does not intentionally set application analytics/advertising cookies. Authentication and OAuth providers may use their own browser/session mechanisms outside the application's direct control.

Cookie/consent obligations remain a legal decision for the final deployment and target markets; the project must not claim that no consent is ever required.

## Security/contact channels

- Security vulnerabilities must not be reported through public issues; use the private GitHub security-reporting mechanism when available.
- General product feedback/content correction currently uses public GitHub issue flows.
- A dedicated private privacy/account-request channel is **not currently operational** and remains a release blocker.
- Public issue forms explicitly warn users not to submit passwords, tokens, private backups, or sensitive learner data.

## Age, children, and target markets

The repository does not establish a legally reviewed minimum age, child-directed status, parental-consent model, or final target-market/jurisdiction set.

Those are owner/legal decisions. Until approved, public materials must not make unsupported statements such as “not for children,” “18+,” “COPPA compliant,” or jurisdiction-specific rights guarantees.

## Content licensing and attribution

The project software license has not been approved. Third-party software, fonts, datasets, stroke data, and external content remain governed by their applicable licenses/terms and are inventoried separately in `docs/THIRD-PARTY-LICENSES.md` and `THIRD_PARTY_NOTICES.md`.

No project-level license grant should be inferred from the repository's current `LICENSE` placeholder.

## Legal-release gate

Before Public Beta, owner/counsel review must approve:

1. target markets and applicable privacy requirements;
2. service/provider roles and cross-border transfers;
3. account deletion and local-data deletion semantics;
4. retention and deletion periods/exceptions;
5. user-rights/private request handling;
6. age/child-user treatment;
7. terms acceptance/versioning;
8. user-content/IP terms;
9. third-party licensing/attribution;
10. project software license;
11. cookie/consent requirements.

