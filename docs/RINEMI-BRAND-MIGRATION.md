# RINEMI Brand Migration

**Status:** Selected working product brand  
**Date:** 2026-10-02  
**Repository:** `ArdKam/kanji5`

## Brand decision

The selected product name is **RINEMI**.

- Latin: **RINEMI**
- Japanese phonetic lockup: **リネミ**
- Descriptor: **Japanese Learning**
- Previous public-facing names: `Kanji5` / `کانجی‌یار`

This is a product naming decision for the current migration. It is **not legal trademark clearance**.

## Migration principle

This migration is surface-first.

### Allowed to change

- Browser document title
- PWA `name` / `short_name` / description
- Startup shell branding
- React-visible product name
- Localized user-facing product copy
- Startup error copy
- Public README positioning
- User-facing backup download filenames
- Brand metadata contracts/tests

### Must remain stable in this migration

Do **not** rename these merely because the product brand changed:

- `localStorage` keys
- IndexedDB/store identifiers, where present
- FSRS state and scheduling data
- learner-model persistence identifiers
- review/event identifiers
- service-worker cache identifiers
- `__KANJI5_*` runtime globals and engine contracts
- Supabase configuration identifiers
- `kanji5-react.js/css` generated artifact names
- repository/package technical names

The purpose is to make the public product surface adopt RINEMI without creating a destructive persistence or runtime migration.

## Current public identity

Recommended current lockup:

**RINEMI**  
**リネミ**  
**Japanese Learning**

The visual system remains the existing **Sumi Play** direction. This brand migration does not introduce a new color system or redesign the learning UI.

## Clearance status

Initial web/store/GitHub screening did not identify a Japanese-learning product with the exact name RINEMI. However, other uses exist:

- An engineered-marble / 3D wall and floor product uses the name RINEMI: https://www.giovannibarbieri.com/rinemi-sustainability-product/
- A company named OOO "RINEMI" is listed in Moscow: https://www.org-info.com/company/2966286
- "RinEmi" also appears as an unrelated user/display name and account handle.

These are not presented as legal conflicts. Trademark, domain, App Store, and Google Play clearance still require formal verification in the intended markets and relevant goods/services classes.

## Compatibility rules

Existing users must retain:

- current review history
- current FSRS scheduling state
- current learner model
- current personal mnemonics
- current session/history data
- current account/sync state

A public rename must never force a learner reset.

## Release checklist

Before a public rename/repository rename:

1. Verify trademark availability in intended jurisdictions and relevant software/education classes.
2. Verify `rinemi.com`, `rinemi.app`, `rinemi.jp` and intended social handles.
3. Verify App Store and Google Play name availability in target storefronts.
4. Keep `Kanji5` technical identifiers stable unless a dedicated migration is specified and tested.
5. Run source/contract tests, React typecheck/build, relevant browser E2E, PWA/install checks, and offline smoke.
6. Verify an existing learner profile survives upgrade with no data loss.

## Rename boundary

A future repository rename is a separate change. It should only happen after:

- brand clearance is complete,
- redirect/URL impact is understood,
- deployment references are updated,
- documentation links are audited,
- external references are migrated,
- and the complete release gate passes.
