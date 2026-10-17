# Rinemi — Japanese Data Pipeline Audit

**Audit date:** 2026-10-17  
**Baseline branch/commit:** `main` at `085524dc58547e33e42fcaff75784b0c6d3fe6b3`  
**Purpose:** reproducible data-integrity baseline and prioritization. PR #561 restores source values previously removed by the data builder. This is not an assertion that every gloss, reading, compound, or sentence has already received independent human lexicographic review.

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
| English glosses | 7,937 source values; 7,937 retained after the correction | Restores 2,402 formerly discarded glosses across 1,038 kanji |
| On’yomi | 2,850 source values; 2,850 retained after the correction | Restores 6 formerly discarded readings across 6 kanji |
| Kun’yomi | 3,905 source values; 3,905 retained after the correction | Restores 339 formerly discarded readings across 145 kanji |

The generator previously limited English glosses to three and each reading class to four. The pinned-source CI audit verified that the pre-correction snapshot omitted 2,402 English glosses, 6 on’yomi, and 339 kun’yomi (2,747 values across 1,086 characters). This batch removes the caps, regenerates the snapshot from the exact pinned source revision, and adds a CI comparison that fails on any missing or different gloss, reading, stroke count, grade, JLPT value, frequency, order, character ID, or classical radical mapping.

## Verified defects corrected in this batch

### Source-field truncation in the static catalog

The pinned-source audit established that the builder discarded 2,747 KANJIDIC2-derived values due to `.slice(0, 3)` and `.slice(0, 4)` caps: 2,402 English glosses, 6 on’yomi, and 339 kun’yomi. The generator now preserves the full source arrays and `kanji-data.json` is regenerated from the same pinned commit. Presentation code continues to prioritize and limit what it displays; no new kanji IDs, review records, or scheduler data are created. `scripts/audit-kanji-source-overflow.mjs` now compares the full projection, checks metadata and ordering, and enforces zero mismatches.

### Vocabulary reading validator accepted mixed-script strings

Before this change, `validateVocabularyEntry` used a non-anchored kana test. That only required the reading string to contain *some* kana, so strings such as `gakkouがっこう` or `がっこうabc` could pass the reading-shape check even though they are not kana readings. This is a real validation defect, independent of whether any particular upstream example contains it.

The validator now requires the complete normalized reading to consist of kana (including ordinary kana extension/iteration characters covered by the allowed ranges). Regression cases cover hiragana and katakana acceptance, mixed Latin+kana rejection, and kanji-only rejection. This validates script shape only; it does **not** prove that a reading is the correct lexical reading for a word.

## Data pipeline and provenance

The pinned upstream dataset identifies `CC-BY-SA 4.0 (EDRDG License)` and attributes the underlying KANJIDIC2 material to EDRDG. Preserve the required attribution and licence notices when distributing derivatives; the source revision, source URL, and dataset metadata are recorded with this audit.

| Dataset / pipeline | Current source and transformation | What it can establish | Limitation to retain |
|---|---|---|---|
| `kanji-data.json` | `scripts/build-kanji-data.mjs`; pinned `jkindrix/japanese-language-data` revision `f79c68c9e35c6f8269a6b66e86c63c3713db06a0`, whose kanji fields derive from KANJIDIC2; source metadata identifies CC-BY-SA 4.0 (EDRDG License) | Complete source-derived character records, English glosses, on/kun lists, stroke counts, grade and frequency metadata | Broad dictionary data contains rare/technical senses as well as learner-relevant senses; preserve all sourced values and curate display priority separately |
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

### P1 — Preserve the full pinned source projection — implemented in this batch

The generator no longer truncates English glosses, on’yomi, or kun’yomi arrays. The dataset is regenerated from the exact upstream commit. CI now compares all 2,136 character records and fails if any meaning, reading, stroke count, grade, JLPT value, frequency, sort position, identity, or classical-radical mapping differs from the source projection. Presentation components continue to limit visible content and learner-priority policies keep rare/reference senses out of primary prompts; completeness does not require displaying every gloss or reading at once.

### P1 — Freeze and review provider examples

Create a privacy-safe frozen sample of the actual production result sets (kanji, word, reading, gloss, provider/reference, retrieval date, and the validator's accepted/rejected reason). Have a reviewer verify the *word-reading pairing* and meaning alignment against Japanese dictionaries, then classify learner level and pedagogical usefulness. Structural validity must not be described as lexicographic verification.

### P2 — Keep orthogonal character relationships separate

Maintain three separate concepts and interfaces: classical dictionary radical, source-authored visible component tree, and TopoKanji learning dependency. Do not copy one field into another to fill gaps. Do not fill the 36 missing learning dependencies with guessed decompositions.

### P2 — Add contextual reading and provenance to word-level content

A kanji's on’yomi/kun’yomi are not a substitute for the reading of a multi-kanji word. The vocabulary record is the correct place to preserve the word's kana reading and, where the source supplies them, lexical tags (such as ateji or reading restrictions). Learners should see the word reading attached to the specific word rather than be asked to infer it from a character's isolated reading list.

### P2 — Improve searchable dictionary indexing

Treat normalized headword and kana reading as distinct indexed fields; preserve the original written form, reading, and gloss; normalize Unicode and half-/full-width forms for matching without changing displayed source data; and make radical, visual-component, and topic filters independently understandable. Every index change must leave stable kanji IDs and existing review records unchanged.

## Additional audited surfaces

### Mnemonic coverage versus curation

The prepared mnemonic contract tests define coverage for all 2,136 catalog entries, but the curated library contains 259 entries. The remaining 1,877 are deterministic generated scaffolds/fallbacks, not independent human-authored curated stories. UI provenance labels distinguish these categories. The 259 curated items are about 12.1% of the catalog; a complete string for each character must not be described as 2,136 individually curated mnemonics.

The current automated mnemonic tests also verify bilingual non-empty outputs, duplicate checks in the curated Persian/English text, component/readings support contracts, and semantic sentinel examples. These guards cannot prove that all generated scaffolds are accurate or useful; review effort should be weighted toward high-frequency kanji, lookalike confusions, and reading hooks that are used in learner-facing examples.

### Dictionary search and navigation

The actual search path in `frontend/src/app/DictionaryPage.tsx` normalizes text with `trim().toLocaleLowerCase()` and searches only the target character, displayed English meanings, on’yomi, and kun’yomi. It does not perform Unicode NFKC normalization, and it does not index vocabulary-example headwords/readings, classical radicals, visual component labels, or mnemonic text. This behavior can make a half-width/full-width query less reliable and means the feature behaves as a **kanji dictionary search**, not a Japanese lexical dictionary search. This is an observed capability boundary, not proof that every one of those fields must be searchable in the same query box.

Existing filtering does support JLPT, school grade, learning/mastery state, and curated topics; detailed view is paginated in chunks of 160. The topic catalogue is intentionally partial. The next UX/data-indexing batch should explicitly decide whether word lookup is in scope, and if it is, add a normalized headword/reading index as a separate, provenance-preserving data layer rather than making the kanji list query depend on dynamically fetched per-card examples.

### Reading-type contract

The static kanji schema separates `on` and `kun` arrays, while the vocabulary entry has its own lexical kana reading. That is the correct broad separation to retain. The catalog does **not** preserve an explicit per-reading flag for "listed as a reading in the official 常用漢字表" versus "listed in KANJIDIC2 as a broader dictionary reading". KANJIDIC2 readings should not be represented as if they are all officially prescribed Jōyō table readings. If the product wants to teach official table readings specifically, add source-scoped reading records rather than guessing this distinction from on/kun type or JLPT label.

### Dynamic vocabulary and sentence acceptance

The current validator is a fast structural gate, not a Japanese editorial review. It checks that a vocabulary item is non-empty, contains the target kanji, has a kana reading, and has a gloss; the just-fixed regression ensures the whole reading field is kana-only. It does not confirm that the reading is correct for that word, that the gloss matches the relevant sense, that the example is common, or that it fits a beginner's level.

Context validation verifies Japanese-script presence, target-character presence, and a non-empty English translation. It cannot detect awkward grammar, mistranslation, culturally odd sentence construction, or excessive vocabulary difficulty. The existing C4 QA record already acknowledges that the remote kanjiapi.dev/Tatoeba samples have not had independent final-release review. The next content-quality batch should capture a dated, reproducible sample and track reviewer decisions and rejection reasons.

## Safety of content changes

- Do not change a kanji's `id`/character key to repair a meaning, reading, stroke count or tag.
- Do not mutate FSRS card state, review history, learner evidence, or account/sync persistence while correcting lexicographic content.
- Keep raw/source text and curated learner-facing priority distinct.
- A blank source field is not automatically an error; retain explicit nulls or arrays where permitted.
- Do not auto-correct linguistic content based only on a heuristic or a model-generated explanation.
- Each batch should record source revision, exact entry changes, review evidence, and tests.

## Current acceptance status

- **Structural baseline:** measured from the committed static data.
- **Vocabulary reading-shape validator:** corrected in the audit branch; regression tests added.
- **Static source completeness:** the generator and dataset now retain all 7,937 glosses, 2,850 on’yomi, and 3,905 kun’yomi from the pinned input; CI compares the full projection.
- **Independent review of live vocabulary/context examples:** pending.
- **Per-entry linguistic corrections:** only apply after a source can be cited for the specific correction; this batch deliberately does not invent examples or readings.
