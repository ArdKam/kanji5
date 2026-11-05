# Learner meaning provenance and review-status audit

**Integration baseline:** `cb7a8b0a4e037e6c405d0ee1bd69aa1df2f9e11d` (2026-10-27).
**Status:** implementation candidate; not a linguistic/content sign-off.

## Display contract

- Each learner meaning record carries text, language (`en`, `fa`, `ja`, or `unknown`), priority (`primary`, `secondary`, or `reference`), provenance (source/version/entry ID/URL), and review status (`verified`, `unreviewed`, `rejected`, or `unavailable`).
- Only `verified` localized records in the active UI language may replace the primary meaning. A Persian UI without a verified Persian primary meaning explicitly falls back to the source meaning in English; it must not present English source data as a reviewed Persian translation.
- Vocabulary examples preserve meaning-language metadata and expose review-status labels. English meanings use LTR direction; Persian/Japanese meaning text uses automatic direction so the script is rendered correctly.
- Provenance and review-status cues must remain readable on narrow mobile cards. The 360×640 acceptance gate must keep readings, one compact vocabulary example, and rating controls visible without shrinking body text below readable sizes.

## Scope and safety

- No catalog-wide Persian translation is claimed. No human review is inferred from source availability or automated metadata.
- No persistence/schema migration, card identity, review history, FSRS scheduling, grading, Learner Model decision authority, or Adaptive Planner behavior is changed.
- Existing vocabulary source attribution and source-license validation remain separate from linguistic review. A license does not establish semantic accuracy.

## Release gates

- Exact-head engine/root contracts, React build/typecheck, WebKit compatibility, and rendered responsive UI audit must pass.
- Independent Japanese/Persian review must verify translations, readings, vocabulary examples, source attribution, and correction workflow before public beta.