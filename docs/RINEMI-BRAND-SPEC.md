# RINEMI — Brand System Specification

Status: Stage 2 foundation. No app implementation changes.

## 1. Canonical identity

**Primary:** RINEMI

**Japanese lockup:** リネミ

**Descriptor:** Japanese Learning

Canonical stacked presentation:

RINEMI
リネミ
Japanese Learning

The descriptor is category language, not the product name and not a tagline.

## 2. Naming rules

Use `RINEMI` in all-caps for the primary global product name.

Use `リネミ` when Japanese-language identity or a Japanese-facing brand treatment calls for it.

Use `RINEMI — Japanese Learning` for contexts where the category needs explicit clarification.

Do not introduce alternate spellings such as Rinemi, RINEMI Japanese, or RinemI as official brand variants.

## 3. Brand personality

Keywords:
- calm
- precise
- warm
- editorial
- contemporary
- playful in restraint

Avoid:
- anime-first aesthetics
- generic Japan tourism imagery
- torii/Fuji clichés
- loud gamification
- glossy-tech gradients
- mascot-as-logo treatment

## 4. Sumi Play palette

These are brand-system reference tokens only; they are not yet wired into the application.

| Token | Hex | Intended role |
|---|---|---|
| Rice Paper | `#F7F2EA` | primary background / paper |
| Sumi | `#252322` | primary text / mark |
| Indigo | `#40556F` | primary interactive/accent |
| Sakura | `#C98F9D` | secondary accent / warmth |
| Moss | `#7C917D` | tertiary accent / positive states |
| Paper Line | `#E2D9CF` | borders / dividers |

Color use should remain restrained: charcoal and paper dominate; indigo carries interaction; sakura and moss are accents rather than competing primary colors.

## 5. Typography

Latin/UI: **Inter** or an equivalent neutral sans with strong UI legibility.

Japanese editorial/display: **Noto Serif JP** where a literary or learning-content tone is beneficial.

Persian UI: use the existing Persian type system for now; brand migration is out of Stage 2 and must not be coupled to this document.

## 6. Wordmark specification

Conceptual direction: typographic wordmark first; no mandatory pictorial symbol.

Construction rules:
- high legibility at small sizes
- moderate tracking, never tightly cramped
- generous clear space
- charcoal-first rendering on paper/light backgrounds
- monochrome-compatible
- no gradient dependency

Minimum clear space: at least **0.5× the cap height of the R** around the lockup.

Do not merge the cat or shiba character directly into the wordmark.

## 7. Japanese lockup

`リネミ` sits as a supporting Japanese identifier, not as a translation of the English descriptor.

Recommended hierarchy:

RINEMI  ← primary
リネミ   ← supporting
Japanese Learning  ← category clarification

## 8. Mascot system

Primary character: **cat**.

Secondary companion: **shiba dog**.

Use mascots in:
- onboarding
- empty states
- educational illustrations
- occasional celebrations

Do not use mascots as the only brand identifier.

## 9. Icon direction

App icon should remain recognizable without the full wordmark.

Preferred concept direction:
- simplified geometric interpretation of the RINEMI rhythm/letterform
- paper/sumi base
- one restrained indigo or sakura accent
- strong silhouette
- no tiny text
- no photographic or anime-character dependency

Final icon artwork remains intentionally uncommitted until the Stage 1 clearance gate is satisfied.

## 10. Required production asset set after clearance

- primary horizontal wordmark
- stacked lockup
- monochrome light/dark variants
- favicon
- app icon
- social avatar
- small-size wordmark test
- spacing/clear-space reference
- export set for web and mobile stores

## 11. Tagline decision

No separate marketing tagline is approved at Stage 2.

The product should first establish the name + descriptor system. A tagline can be introduced later without forcing a semantic meaning onto the coined name.

## 12. Stage 3 boundary

This spec does not authorize:
- changing application copy
- changing HTML/manifest branding
- repository/package renaming
- asset-path renaming
- storage-key migration
- service-worker/cache renaming
- internal API/global renaming
- deployment/domain cutover

All of those remain Stage 3 migration work.