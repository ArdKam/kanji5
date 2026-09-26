# Mnemonic sourcing and provenance

Kanji5's prepared mnemonic corpus is curated in `prepared-mnemonic-core.js`.

## External reference used during curation

**Kanji Koohii** is used as a research/reference source for mnemonic design patterns and community-story discovery. It documents a community system where learners share, vote on, and adapt stories, and its public documentation explicitly distinguishes community stories from the copyrighted original stories in *Remembering the Kanji*. See:

- https://kanji.koohii.com/learnmore
- https://kanji.koohii.com/news/id/27
- https://kanji.koohii.com/news/id/62

Kanji5 does **not** bulk-copy the RTK book stories. It also does not treat an arbitrary third-party story dump as automatically redistributable merely because it is publicly accessible.

## Current strategy

1. Preserve the existing Kanji5-authored curated corpus.
2. Use community mnemonic systems such as Koohii to identify effective mnemonic patterns and candidate ideas during editorial work.
3. Write/adapt Kanji5's own mnemonic text rather than copying RTK book text.
4. Require concrete imagery, action, component linkage, and meaning linkage through the existing scorer.
5. Use a stronger scene-based fallback for kanji that do not yet have curated content.

## Why the fallback remains

A complete 2,136-kanji product needs a mnemonic available for every Jōyō kanji. Until each entry has passed human/editorial curation, the scene generator provides coverage without pretending that generated content is equivalent to curated content.

The generated entries are marked `source: "generated"` and `generationStrategy: "scene-v2"`.


## Editorial quality principles

The 2025 EMNLP work on interpretable mnemonic generation supports the same design direction used in this batch: effective kanji mnemonics are compositional, combining a kanji's meaning with salient component keywords and a coherent, vivid cue rather than relying on an opaque generic template. It also reports that learner preferences vary, so Kanji5 treats curated stories as a strong default rather than a universal optimal story.

Kanji5 uses that research as methodological guidance, not as a text corpus. No third-party mnemonic text is copied into the prepared corpus. Koohii community stories remain reference material only because its learner-contributed content is licensed CC BY-NC-SA; that license is not treated as a blanket permission for unrestricted redistribution.
