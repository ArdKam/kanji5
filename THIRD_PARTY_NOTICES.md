# Third-party notices

## KanjiVG

Kanji 5 uses KanjiVG stroke-order SVG data for the learning-card Stroke Order viewer.

- Project: KanjiVG (Kanji Vector Graphics)
- Source: https://github.com/KanjiVG/kanjivg
- Website: http://kanjivg.tagaini.net/
- Pinned source commit: `422b5538595676da918c288a4230cb5e22a1ee7e`
- License: Creative Commons Attribution-Share Alike 3.0 (CC BY-SA 3.0)

The app fetches the per-character SVG assets from the pinned KanjiVG repository revision and displays the stroke paths in their documented stroke order. The viewer does not modify the underlying KanjiVG data.


## Direct build/runtime dependencies

The pinned direct dependencies and their license identifiers are audited in [docs/THIRD-PARTY-LICENSES.md](docs/THIRD-PARTY-LICENSES.md). The audit is derived from the checked-in npm lockfiles and is enforced by `scripts/test-license-audit.mjs`.

The current direct dependency set includes MIT, Apache-2.0, and OFL-1.1 licensed components. KanjiVG remains CC BY-SA 3.0 as documented above, while Jōyō/KANJIDIC2-derived data is CC BY-SA 4.0 per the project README.
