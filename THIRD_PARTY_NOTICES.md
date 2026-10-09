# Third-party notices

## KanjiVG

Kanji 5 uses KanjiVG stroke-order SVG data for the learning-card Stroke Order viewer.

- Project: KanjiVG (Kanji Vector Graphics)
- Source: https://github.com/KanjiVG/kanjivg
- Website: http://kanjivg.tagaini.net/
- Pinned source commit: `422b5538595676da918c288a4230cb5e22a1ee7e`
- License: Creative Commons Attribution-Share Alike 3.0 (CC BY-SA 3.0)

The app fetches the per-character SVG assets from the pinned KanjiVG repository revision and displays the stroke paths in their documented stroke order. The viewer does not modify the underlying KanjiVG data.

The app also ships `kanji-visual-structure.json`, a generated hierarchy extracted from KanjiVG `kvg:element` groups for all 2,136 Jōyō kanji.

- **Structure data commit:** `70a0b7ae0c18ceb5cb358274b029cce0234a43bc`
- **Structure extraction:** `scripts/build-kanji-visual-structure.mjs`
- **Dataset-specific license:** CC BY-SA 3.0, with attribution to KanjiVG and a link to https://kanjivg.tagaini.net/.
- **Detailed data note:** [docs/KANJI-VISUAL-STRUCTURE.md](docs/KANJI-VISUAL-STRUCTURE.md)

The structural JSON is a derived dataset; it stores component hierarchy and selected group metadata, not the original SVG stroke geometry.


## Direct build/runtime dependencies

The pinned direct dependencies and their license identifiers are audited in [docs/THIRD-PARTY-LICENSES.md](docs/THIRD-PARTY-LICENSES.md). The audit is derived from the checked-in npm lockfiles and is enforced by `scripts/test-license-audit.mjs`.

The current direct dependency set includes MIT, Apache-2.0, and OFL-1.1 licensed components. KanjiVG remains CC BY-SA 3.0 as documented above, while Jōyō/KANJIDIC2-derived data is CC BY-SA 4.0 per the project README.
