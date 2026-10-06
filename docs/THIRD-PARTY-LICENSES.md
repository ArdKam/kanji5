# Kanji5 — Third-Party License Audit

Audit date: 2026-10-05

This audit records the direct runtime/build dependencies pinned by the repository lockfiles. It is a compliance inventory, not a request to upgrade dependency versions.

## Root development dependencies

| Package | Pinned version | License | Purpose |
| --- | --- | --- | --- |
| `@playwright/test` | 1.59.0 | Apache-2.0 | Browser/E2E test runner |

## React frontend dependencies

| Package | Pinned version | License | Scope |
| --- | --- | --- | --- |
| `react` | 19.2.0 | MIT | Runtime |
| `react-dom` | 19.2.0 | MIT | Runtime |
| `vazirmatn` | 33.0.3 | OFL-1.1 | Font |
| `@fontsource-variable/plus-jakarta-sans` | 5.3.0 | OFL-1.1 | Font |
| `@types/react` | 19.2.0 | MIT | Development/type definitions |
| `@types/react-dom` | 19.2.0 | MIT | Development/type definitions |
| `@vitejs/plugin-react` | 5.2.0 | MIT | Build tooling |
| `typescript` | 5.8.3 | Apache-2.0 | Build/typechecking |
| `vite` | 8.1.5 | MIT | Build tooling |
| `@supabase/supabase-js` | 2.117.2 | MIT | Runtime; same-origin vendored UMD |

## Project data and vendored runtime

- Jōyō/KANJIDIC2-derived Kanji data: CC BY-SA 4.0, as documented in `README.md`.
- FSRS runtime: ts-fsrs 5.4.1, MIT; vendored under `vendor/`.
- Supabase JS browser runtime: `@supabase/supabase-js` 2.117.2, MIT; vendored as `vendor/supabase-js-2.117.2.js` from the immutable upstream release commit `6d21e3f`. The repository build script verifies the exact npm version and runs `npm audit --audit-level=high` before producing the release artifact.
- Example-word/content providers are documented as KanjiAPI/EDRDG and Tatoeba in `README.md`; their external service terms remain applicable to fetched content.

## Verification source

The package versions and license identifiers above are taken from the checked-in root `package-lock.json` and `frontend/package-lock.json`. The lockfile audit is enforced by `scripts/test-license-audit.mjs`.

The Supabase browser runtime is intentionally pinned/vendor-copied for supply-chain control; it is not loaded from a third-party CDN at runtime. No package is intentionally re-licensed by Kanji5.
