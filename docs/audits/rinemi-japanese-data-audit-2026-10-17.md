# Rinemi — Japanese Data Pipeline Audit

**Audit date:** 2026-10-17  
**Baseline branch/commit:** `main` at `085524dc58547e33e42fcaff75784b0c6d3fe6b3`  
**Purpose:** reproducible data-integrity baseline and prioritization. This is not an assertion that every gloss, reading, compound, or sentence has already received independent human lexicographic review.

## Executive result

The committed static data passes baseline structural integrity checks in the audit run: 2,136 unique Jōyō kanji records; character-based IDs match their characters; ordering is contiguous; meanings are populated; stroke counts and grade values are structurally valid; and all 2,136 kanji have a classical radical mapping and a visual-structure root. These facts establish structural consistency, **not** that all linguistic content is exhaustive or semantically correct.

The new `scripts/test-kanji-data-pipeline-audit.mjs` is intended to make the baseline reproducible in the root Node test suite. Existing focused tests remain authoritative for visual hierarchy extraction, topic guardrails, and radical/component anchors.

## Quantified baseline

| Area | Observed baseline | Interpretation |
|---|---:|---|
| Jōyō catalog | 2,136 entries; 2,136 unique characters | No duplicate character keys |
| Stable identity | 0 ID/character mismatches | Keep the character-based ID unchanged; do not re-key review state |
| Meaning field | 0 empty meaning arrays | All records have one or more English glosses |
| On’yomi field | 6 records with no on’yomi | Not automatically an error; verify per character against a reference |
| Kun’yomi field | 359 records with no kun’yomi | Not automatically an error; verify per character against a reference |
| Stroke count / grade | 0 structural failures | Does not adjudicate variant counting conventions |
| Frequency | 99 records are null | Preserve as unknown; do not invent a rank |
| JLPT | 172 records are null | JLPT metadata is not defined for all characters in this snapshot |
| Classical radicals | 214 definitions; 2,136 mappings | Separate source field from visible components |
| Visual structure | Declared coverage 2,136/2,136 | KanjiVG tree roots are complete in the committed snapshot and existing contract test |
| Learning dependencies | 2,100/2,136; 36 explicit source gaps | Not a completeness failure: TopoKanji dependencies are optional learning scaffolds, not canonical radical/structure data |
| Topic taxonomy | 24 topics; 1,156 assignments; 849 unique kanji | 1,287 characters are not topic-tagged; this is documented partial curation |
| Glosses at current cap | 1,492 entries contain 3 glosses | Candidates for comparison with source; not proof of discarded values |
| On’yomi at current cap | 22 entries contain 4 readings | Candidates for comparison with source; not proof of discarded values |
| Kun’yomi at current cap | 273 entries contain 4 readings | Candidates for comparison with source; not proof of discarded values |

The cap counts are particularly important: the current generator limits glosses to three and each reading class to four. Because those limits have already been applied in `kanji-data.json`, the committed output alone cannot tell us whether additional source values were omitted. A source-to-output comparison is needed before reporting an exact count of omitted readings or meanings.

## Verified defect corrected in this batch

### Vocabulary reading validator accepted mixed-script strings

Before this change, `validateVocabularyEntry` used a non-anchored kana test. That only required the reading string to contain *some* kana, so strings such as `gakkouがっこう` or `がっこうabc` could pass the reading-shape check even though they are not kana readings. This is a real validation defect, independent of whether any particular upstream example contains it.

The validator now requires the complete normalized reading to consist of kana (including ordinary kana extension/iteration characters covered by the allowed ranges). Regression cases cover hiragana and katakana acceptance, mixed Latin+kana rejection, and kanji-only rejection. This validates script shape only; it does **not** prove that a reading is the correct lexical reading for a word.

## Data pipeline and provenance

| Dataset / pipeline | Current source and transformation | What it can establish | Limitation to retain |
|---|---|---|---|
| `kanji-data.json` | `scripts/build-kanji-data.mjs`; pinned `jkindrix/japanese-language-data` source revision `f79c68c9e35c6f8269a6b66e86c63c3713db06a0`, whose kanji fields derive from KANJIDIC2 | Character records, English glosses, on/kun lists, stroke counts, grade, frequency metadata | Generator currently caps glosses at 3 and each reading class at 4; the exact loss count is unknown until source comparison |
| `kanji-radicals.json` + `kanji-radical-map.json` | KANJIDIC2-derived classical-radical assignments; radical definitions include Kangxi classification provenance | One dictionary-radical assignment per catalog kanji | A radical is not the same thing as every visible subcomponent; alternate editorial systems can classify/count differently |
| `kanji-visual-structure.json` | Pinned KanjiVG SVG hierarchy, generated by `scripts/build-kanji-visual-structure.mjs` | Source-authored glyph-group nesting, repeated visible components, order and selected role annotations | Visual decomposition does not, by itself, establish etymology or historical character origin |
| `kanji-components.json` | Pinned TopoKanji `dependencies/1-to-N.json`, commit `cd04afc2c4335336c9243b8aef01c0d2a69c3009` | Optional learning dependencies for mnemonic scaffolds and learning paths | TopoKanji explicitly treats dependencies as a learning ordering aid, not universally canonical visual decomposition |
| `frontend/src/app/kanji-topics.json` | Version 4, hand-curated memberships | Topic navigation for selected useful kanji | Partial membership; never infer membership from an English gloss automatically |
| Vocabulary examples | Runtime-fetched via `kanjiapi.dev`, validated and deduplicated through the v1.9 data-quality path | Word, reading, and English gloss candidates for a target kanji | The full live result set is not frozen in Git; script-shape validation does not verify naturalness, frequency, level, reading correctness, or sense alignment |
| Context sentences | Runtime-fetched from Tatoeba-based content with structural validation/fallback | Candidate Japanese sentence and English translation | Structural checks cannot establish grammar, translation equivalence, naturalness, or pedagogical level without content review |
| Mnemonics | Curated prepared entries plus separately labeled generated scaffolds | Memory support in the learning experience | Presence/coverage is not evidence that the mnemonic is accurate, memorable, or helpful |

## Reference hierarchy for corrections

Each correction should cite the reference actually checked for that character or lexeme. Use the official Japanese Jōyō list to verify inclusion, Japanese lexicographic references for the learner-facing meaning and readings, and the relevant project's provenance/licence documentation for derived technical datasets.

1. **Jōyō inclusion and official character table:** Agency for Cultural Affairs, 常用漢字表（平成22年内閣告示第2号） — https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/kanji/
2. **On/kun readings, glosses, classical radical fields, stroke counts and grade metadata:** EDRDG KANJIDIC/KANJIDIC2 field documentation — https://www.edrdg.org/kanjidic/kanjidic2_ov_legacy.html and https://www.edrdg.org/wiki/KANJIDIC_Project.html
3. **Japanese reading notation and radical conventions for independent spot-checks:** 漢字ペディア, 音訓索引について — https://www.kanjipedia.jp/include/popup_onkun.html and 漢字一字について — https://www.kanjipedia.jp/include/popup_kanji.html
4. **Vocabulary forms/readings/glosses:** EDRDG JMdict project and field documentation — https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html and https://www.edrdg.org/wiki/Kanji_and_Reading_Information_Fields.html
5. **Visual structures:** KanjiVG at the pinned source revision, with the attribution/licence recorded in `docs/KANJI-VISUAL-STRUCTURE.md`.
6. **Learning dependencies:** TopoKanji documentation and the pinned revision named in `kanji-components.json`.

KANJIDIC2 is a valuable broad character dictionary, but it is not identical to the official list of readings prescribed by the Japanese 常用漢字表; the latter distinguishes readings in the table from other readings of those characters. Rinemi should preserve that distinction in its data model and UI rather than imply that every dictionary reading is an official Jōyō reading.

## Findings to carry into the next batches

### P1 — Compare the generator output against the pinned source

Remove arbitrary reading/gloss truncation only together with a regenerated `kanji-data.json` and regression evidence. The source file was not available to this audit execution as a readable local payload, so no records are fabricated and no exact loss count is claimed. Before changing the dataset, run the builder in CI or another environment with access to its pinned source; compare every character's original `meanings.en`, `readings.on`, and `readings.kun` arrays with generated output. If display density is the concern, retain complete data and limit display in the presentation layer instead.

### P1 — Freeze and review provider examples

Create a privacy-safe frozen sample of the actual production result sets (kanji, word, reading, gloss, provider/reference, retrieval date, and the validator's accepted/rejected reason). Have a reviewer verify the *word-reading pairing* and meaning alignment against Japanese dictionaries, then classify learner level and pedagogical usefulness. Structural validity must not be described as lexicographic verification.

### P2 — Keep orthogonal character relationships separate

Maintain three separate concepts and interfaces: classical dictionary radical, source-authored visible component tree, and TopoKanji learning dependency. Do not copy one field into another to fill gaps. Do not fill the 36 missing learning dependencies with guessed decompositions.

### P2 — Add contextual reading and provenance to word-level content

A kanji's on’yomi/kun’yomi are not a substitute for the reading of a multi-kanji word. The vocabulary record is the correct place to preserve the word's kana reading and, where the source supplies them, lexical tags (such as ateji or reading restrictions). Learners should see the word reading attached to the specific word rather than be asked to infer it from a character's isolated reading list.

### P2 — Improve searchable dictionary indexing

Treat normalized headword and kana reading as distinct indexed fields; preserve the original written form, reading, and gloss; normalize Unicode and half-/full-width forms for matching without changing displayed source data; and make radical, visual-component, and topic filters independently understandable. Every index change must leave stable kanji IDs and existing review records unchanged.

## Safety of content changes

- Do not change a kanji's `id`/character key to repair a meaning, reading, stroke count or tag.
- Do not mutate FSRS card state, review history, learner evidence, or account/sync persistence while correcting lexicographic content.
- Keep raw/source text and curated learner-facing priority distinct.
- A blank source field is not automatically an error; retain explicit nulls or arrays where permitted.
- Do not auto-correct linguistic content based only on a heuristic or a model-generated explanation.
- Each batch should record source revision, exact entry changes, review evidence, and tests.

## Current acceptance status

- **Structural baseline:** measured from the committed static data.
- **Vocabulary reading-shape validator:** corrected in the audit branch; regression tests added. CI still needs to confirm the complete suite.
- **Complete source comparison for capped readings/glosses:** pending access to the pinned source during a reproducible build.
- **Independent review of live vocabulary/context examples:** pending.
- **Per-entry linguistic corrections:** only apply after a source can be cited for the specific correction; this batch deliberately does not invent examples or readings.
