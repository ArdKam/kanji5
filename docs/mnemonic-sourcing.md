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
