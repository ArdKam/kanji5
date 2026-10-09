# Kanji visual-structure data

## What is displayed

`kanji-visual-structure.json` is the canonical source for the structural breakdown shown on the Learning Card and in Dictionary → Structure. It stores the hierarchy extracted from KanjiVG's SVG `kvg:element` groups, rather than the flattened TopoKanji learning-dependency list.

The data model preserves:

- direct children in source order;
- repeated components as separate nodes;
- nested component groups;
- source-authored placement, variant-form, radical-role, and phonetic-role metadata when present.

A node with an empty `components` array means that the pinned KanjiVG structure contains no finer component group for that character. It is not a claim about the character's historical etymology.

## Provenance and license

- **Source:** KanjiVG (Kanji Vector Graphics), copyright Ulrich Apel.
- **Pinned source commit:** `70a0b7ae0c18ceb5cb358274b029cce0234a43bc`.
- **Source files:** `kanji/{Unicode code point}.svg`.
- **License:** Creative Commons Attribution-Share Alike 3.0 (CC BY-SA 3.0).
- **Attribution:** KanjiVG; https://kanjivg.tagaini.net/ and https://github.com/KanjiVG/kanjivg.
- **Local data format:** the source-authored `kvg:element` hierarchy and selected structural metadata are extracted into JSON by `scripts/build-kanji-visual-structure.mjs`. Stroke geometry and path coordinates are not copied into this JSON.

Because the generated structure data is derived from KanjiVG, this dataset is marked CC BY-SA 3.0. This is a dataset-specific license notice; it does not grant a project-level license for the rest of the repository.

## Distinct concepts

- `kanji-visual-structure.json`: source-authored visible component hierarchy.
- `kanji-components.json`: TopoKanji learning dependencies, retained for mnemonic scaffolds and the optional learning-dependency path. Those dependencies are not displayed as authoritative visual structure.
- `kanji-radicals.json` + `kanji-radical-map.json`: traditional dictionary radical classification.

A radical, a visible component, and a learning dependency are not interchangeable.

## Regeneration and validation

Run `node scripts/build-kanji-visual-structure.mjs` with network access to retrieve the exact pinned KanjiVG files and regenerate the snapshot. The generator fails rather than silently accepting a missing Jōyō kanji or malformed root structure.

The `scripts/test-kanji-visual-structure.mjs` contract test validates complete Jōyō coverage, tree integrity, provenance, and known repeated/nested structures. The production staging check verifies that all 2,136 structure records are included in the shipped artifact.
