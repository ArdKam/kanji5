# RINEMI — Brand Foundation

Status: Stage 0–2 only. Stage 3 (product/repository migration) is explicitly not started.

## Stage 0 — Brand decision

Selected working brand:

- Primary name: RINEMI
- Japanese lockup: リネミ
- Descriptor: Japanese Learning

The product name is intentionally independent from the current technical project/repository identity (Kanji5). This document does not authorize technical renaming.

### Naming principles

- Short and internationally pronounceable.
- Distinct from literal Japanese-learning vocabulary.
- Broad enough for Kanji → Vocabulary → Context/Reading → Grammar.
- Calm, premium, modern, and compatible with the existing Sumi Play visual direction.
- Mascots remain supporting brand characters, not part of the wordmark.

### Usage

Preferred:
- RINEMI
- リネミ
- RINEMI — Japanese Learning

Avoid introducing alternate spellings, transliterations, or competing product names.

## Stage 1 — Preliminary clearance

This is a preliminary product/market screen, not legal trademark clearance.

### Web / market screen

Searches on 2026-10-02 found existing unrelated uses of the string “RINEMI”, including:

- a product/design name for engineered-marble 3D wall/floor tiles. citeturn704006search1
- an OOO “RINEMI” company registered in Moscow in August 2026, with wholesale/retail as its primary activity. citeturn704006search0
- a historical “RINEMI TRADING CO. LIMITED” in Cyprus, currently dissolved. citeturn704006search4

The searches did not surface an obvious Japanese-learning product using RINEMI. Search results are not a substitute for a formal trademark search.

### App-store screen

Searches for exact-match RINEMI listings on Apple App Store and Google Play did not surface an obvious Japanese-learning app. This is an initial screen only; store search coverage can be incomplete.

### Domain screen

Direct automated opening of rinemi.com, rinemi.app, and rinemi.io was not available through the browsing environment, so domain availability is unverified and must not be treated as available.

### Legal gate

Before public commercial use, perform professional trademark clearance for the intended territories/classes, at minimum the software/education classes relevant to a Japanese-learning application.

Do not file or publish based on this preliminary screen alone.

## Stage 2 — Brand system foundation

### Visual direction

RINEMI inherits the established “Sumi Play” direction:

- warm off-white / rice-paper base
- sumi charcoal
- muted indigo / deep blue
- dusty sakura pink
- subtle desaturated green
- restrained Japanese editorial feel
- premium, calm, contemporary
- no cliché torii/Fuji/wave treatment
- no anime-first visual language

### Typography direction

Primary Latin/UI typography: Inter-style neutral sans for product UI and system copy.
Japanese display/content: Noto Serif JP where a literary/editorial Japanese tone is appropriate.
Persian UI: retain the existing Persian UI typography system until a later migration stage.

These are brand-system recommendations, not implementation changes.

### Logo/lockup rule

Canonical textual lockup:

RINEMI
リネミ
Japanese Learning

The English name is the primary global brand. The Japanese lockup is a supporting identity element. The descriptor clarifies category and should not be mistaken for the product name.

### Mascot rule

Cat = primary character.
Shiba = secondary companion.

Characters should appear in product illustrations/onboarding/empty states where useful, but should not be fused into the core wordmark.

### Existing exploration

The RINEMI visual-identity exploration has already been produced as a separate Canva deck for review:
https://canva.link/h3y2tct89e692jm

It is exploratory brand work, not legal approval.

## Stage 3 boundary — DO NOT START

The following are intentionally excluded from this stage:

- changing visible product copy in the live app
- changing index.html branding
- changing PWA manifest names
- changing React brand strings
- changing backup filenames
- repository rename
- package rename
- generated artifact rename
- storage-key migration
- IndexedDB/store identifier migration
- service-worker cache identifier migration
- internal __KANJI5_* contract changes
- FSRS/learner-model identifiers
- deployment URL changes

Any such work belongs to Stage 3 and requires a separate migration plan, compatibility review, and release verification.

## Stage 0–2 exit criteria

Stage 0–2 is considered prepared when:

1. RINEMI / リネミ / Japanese Learning is the recorded working brand decision.
2. Preliminary collision/market screening is documented.
3. Trademark/domain checks are explicitly identified as unverified where appropriate.
4. Core visual direction and naming rules are documented.
5. Brand assets/exploration are available for review.
6. Stage 3 remains isolated from main.
