# Kanji5 — Third-Party License & Service Audit

Audit date: 2026-10-06

This is a repository compliance inventory, not legal advice and not a re-licensing document.

## Project license status

No project-level open-source license has been approved. `LICENSE` is intentionally a governance placeholder and must be replaced by owner-approved license text before public release.

## Direct dependencies

| Scope | Package | Pinned version | License | Role |
| --- | --- | --- | --- | --- |
| root | @playwright/test | 1.59.0 | Apache-2.0 | Development/E2E |
| frontend | react | 19.2.0 | MIT | Runtime |
| frontend | react-dom | 19.2.0 | MIT | Runtime |
| frontend | vazirmatn | 33.0.3 | OFL-1.1 | Font |
| frontend | @fontsource-variable/plus-jakarta-sans | 5.3.0 | OFL-1.1 | Font |
| frontend | @types/react | 19.2.0 | MIT | Development |
| frontend | @types/react-dom | 19.2.0 | MIT | Development |
| frontend | @vitejs/plugin-react | 5.2.0 | MIT | Build tooling |
| frontend | typescript | 5.8.3 | Apache-2.0 | Build tooling |
| frontend | vite | 8.1.5 | MIT | Build tooling |
| frontend | @supabase/supabase-js | 2.117.2 | MIT | Runtime; vendored |

## Vendored/runtime content

- `ts-fsrs 5.4.1` — MIT; vendored under `vendor/`.
- Noto Serif JP — OFL-1.1 where used; license file retained with the assets.
- KanjiVG — CC BY-SA 3.0 for the pinned stroke-order SVG source and the generated visual-structure hierarchy. Structure snapshot commit: `70a0b7ae0c18ceb5cb358274b029cce0234a43bc`; see [docs/KANJI-VISUAL-STRUCTURE.md](KANJI-VISUAL-STRUCTURE.md).
- Supabase JS 2.117.2 — MIT; vendored as `vendor/supabase-js-2.117.2.js`.

## Datasets and providers

- Jōyō/KANJIDIC2-derived Kanji data — documented as CC BY-SA 4.0 in project documentation.
- KanjiAPI / EDRDG-derived vocabulary content — external provider/content source; applicable provider terms/licensing apply.
- Tatoeba — external sentence/translation source; applicable Tatoeba licensing/attribution applies.
- GitHub Pages / GitHub Issues — hosting and public support platform; GitHub service terms apply.

## Runtime service disclosure

The Supabase browser client is currently loaded from the repository's vendored runtime path, not from a third-party CDN. Any future CDN, analytics, crash-reporting, advertising, identity provider, or other runtime service must be added to this inventory before release.

## Verification

Package versions/license identifiers come from the checked-in lockfiles and the repository license-audit test. The final release inventory must be rerun against the exact production build and enabled-service configuration.
