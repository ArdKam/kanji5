# Mnemonic sourcing and provenance

Kanji5 keeps mnemonic text in `prepared-mnemonic-core.js`. The corpus has two deliberately different layers:

1. **Curated** — Kanji5-authored mnemonic text.
2. **Generated** — deterministic scene fallbacks built from open dictionary/component data. Generated entries are explicitly marked `source: "generated"` and `generationStrategy: "scene-v2"`.

## Sources that can legally supply reusable data

### Kanji Alive — CC BY 4.0 language data

Kanji Alive publishes its reusable language data and media under CC BY 4.0, while explicitly excluding its mnemonic hints from reuse. Therefore Kanji5 may use its **language/radical/component metadata with attribution**, but must not copy the Kanji Alive mnemonic hints or their associated graphics. The public API also excludes mnemonic hints for the same licensing reason.

Reference:
- https://github.com/kanjialive/kanji-data-media
- https://kanjialive.com/credits/
- https://app.kanjialive.com/api/docs

### jkindrix/japanese-language-data — CC BY-SA 4.0

This dataset is already the pinned upstream for Kanji5's Jōyō/KANJIDIC2 data build. It aggregates open Japanese-language resources including KANJIDIC2, JMdict, KanjiVG, Tatoeba-derived data and component/radical relationships. Its dataset is CC BY-SA 4.0, so redistributed derivatives of the data must respect share-alike and attribution requirements.

Reference:
- https://github.com/jkindrix/japanese-language-data

### Tatoeba — CC BY 2.0 FR for textual sentence data

Tatoeba's textual sentence corpus is reusable with attribution under CC BY 2.0 FR; some individual sentences are also available under CC0. Kanji5 can therefore use appropriately attributed example sentences as **semantic/context evidence**, but those sentences are not themselves mnemonic stories.

Reference:
- https://tatoeba.org/en/downloads
- https://en.wiki.tatoeba.org/articles/show/faq

## Sources we do NOT bulk-copy for mnemonic text

- Kanji Alive mnemonic hints — explicitly excluded from the open-data license.
- Remembering the Kanji / RTK book stories — copyrighted book content.
- Publicly visible community stories on third-party sites — public visibility is not by itself permission to redistribute the text.

Community sites such as Kanji Koohii can still be used as **research/reference material** when designing new Kanji5-authored mnemonics. The resulting Kanji5 text is written independently rather than copied verbatim.

## Current fallback strategy

For a non-curated Jōyō kanji, Kanji5 now builds a meaning-aware scene instead of a generic “picture this” sentence:

1. Resolve up to three visual components.
2. Convert known components into concrete visual anchors.
3. Classify the English meaning into a scene profile (person, movement, water, nature, everyday task, body action, emotion, place, comparison, or neutral object/situation).
4. Make the anchor interact with the semantic profile through an explicit action.
5. Bind the target meaning to the peak of the scene.
6. Keep the character's visual shape inside the same scene.
7. Mark the result as generated so it is never confused with editorially curated content.

This gives full Jōyō coverage without pretending that a generated fallback has the same quality as a human-curated mnemonic.

## Editorial quality gate

Prepared mnemonics are checked for:

- concrete imagery;
- action/scene language;
- character/component linkage;
- direct meaning linkage;
- minimum length;
- absence of the retired generic fallback templates;
- explicit provenance.

The generated layer is a **coverage and recovery layer**, not a substitute for continued human curation.
