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

### 1. Japanese linguistic screen — PRELIMINARY PASS

The exact Japanese rendering リネミ is phonotactically straightforward as ri-ne-mi and does not surface as an obvious standard Japanese dictionary word in the web-indexed Japanese-language searches performed on 2026-10-02.

Searches did, however, surface existing Japanese-market use of the exact string リネミ / Linemi, including a Mercari Shops seller using “Linemi リネミ” for handmade ceramic plant pots. This is a different product category, but it means the Japanese string is not globally unused. citeturn835034search0turn835034search1

Conclusion: no obvious linguistic red flag was found in the preliminary screen, but this is not equivalent to native-speaker or professional localization sign-off.

### 2. Trademark screen — PRELIMINARY ONLY

USPTO guidance states that clearance requires searching confusingly similar marks, related goods/services, federal records, state records, and internet/common-law use; it also notes that marks can conflict based on appearance, sound, meaning, or commercial impression. citeturn354760search3turn354760search4

The Japanese J-PlatPat trademark search supports exact, phonetic, and similarity-oriented searches and allows filtering by goods/services similarity groups. citeturn907897search0

Web-indexed searches performed on 2026-10-02 did not surface an obvious exact-match RINEMI Japanese-learning trademark record, but the searchable government databases themselves are the authoritative place for a full clearance search.

Known unrelated uses surfaced:
- “Rinemi” is the name of an engineered-marble 3D wall/floor tile product. citeturn169069search0
- OOO “RINEMI” was registered in Moscow on 7 August 2026 for wholesale/retail and related activities. citeturn169069search3

Conclusion: **not legally cleared**. A professional trademark search remains required before filing or commercial launch.

### 3. App Store / Google Play — PRELIMINARY ONLY

Searches for exact-match RINEMI listings and combinations with Japanese-learning terms did not surface an obvious competing Japanese-learning app in the indexed results available to this environment.

This does not establish name availability in either store. Store-side exact-name availability and account-level reservation remain unverified.

### 4. Domains — UNVERIFIED

The following were checked for indexed/public presence but could not be authoritatively verified for current registration/availability from this environment:

- rinemi.com
- rinemi.app
- rinemi.jp
- getrinemi.com
- userinemi.com

No indexed WHOIS result was returned for these exact queries, and direct domain/RDAP access was unavailable in the browsing environment. Therefore none should be treated as available.

Priority:
1. rinemi.com
2. rinemi.app
3. rinemi.jp
4. getrinemi.com
5. userinemi.com

### 5. Social handles — UNVERIFIED

Exact-handle availability could not be authoritatively verified through the available web access.

Indexed use of “rinemi” exists on unrelated accounts/services, including a Japanese social user named rinemi and other unrelated user identities. citeturn800584search0turn800584search1

Before reservation, check:
- X
- Instagram
- YouTube
- TikTok
- GitHub
- Discord

Conclusion: handle clearance remains open.

### Stage 1 decision gate

**Current status: CONDITIONAL / NOT CLEARED.**

What is established:
- no obvious Japanese-learning product collision found in indexed web/store searches
- no obvious linguistic red flag found
- unrelated commercial uses exist in Japan and internationally

What remains mandatory before “cleared”:
- official trademark database review in target jurisdictions
- similarity/phonetic trademark review, not only exact-match search
- actual domain registration checks
- actual platform-side handle checks
- professional legal opinion before filing/launch

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

### Tagline

No separate marketing tagline is approved yet. “Japanese Learning” remains a descriptor, not a tagline.

### Mascot rule

Cat = primary character.
Shiba = secondary companion.

Characters should appear in product illustrations/onboarding/empty states where useful, but should not be fused into the core wordmark.

### Asset status

The existing RINEMI visual-identity exploration remains an exploratory reference:
https://canva.link/h3y2tct89e692jm

Final production assets are deliberately **not yet committed** because Stage 1 clearance is still conditional.

### Stage 2 asset plan

After the clearance gate:
1. final wordmark
2. compact/horizontal lockup
3. monochrome variants
4. light/dark variants
5. app icon
6. favicon
7. small-size usage tests
8. mini brand usage guide

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
