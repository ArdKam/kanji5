# Japanese-Language Learning Content Integrity Audit — 2026-10-23

**Repository baseline:** `main` at `88c184113ebf267695e80670b1e0d7cf3581dc58` (current-main replacement baseline for 2026-10-26).  
**Static inventory:** `kanji-data.json` blob `6a35d02e4c1aab9974b83b253fe81a81644bbbf1` and `frontend/src/app/kanji-topics.json` blob `45036a2007c4cc5d1ff981219d1f04bf175d9f9a`; both match the files counted on the earlier `766f85c` snapshot. The intervening mainline change was documentation-only and did not alter either inventory file.  
**Scope:** committed kanji catalog, source provenance, topic taxonomy, content-validation paths, and onboarding placement feedback.  
**Review type:** reproducible structural inventory plus code-path audit. This is **not** a corpus-wide linguistic verification or independent native-speaker sign-off.

## Executive result

- The committed static catalog is structurally consistent on the measured checks: 2,136 unique Jōyō kanji, stable character-based IDs, 7,937 non-empty gloss values, 2,850 on-reading values, and 3,905 kun-reading values.
- The audit confirmed **no incorrect static-corpus reading, word, or meaning** suitable for a verified data-value patch. Three runtime-path defects are being addressed: malformed fields passed coercion-based checks, alternate readings for one written form were collapsed, and Tatoeba attribution/license metadata was discarded before the context item left the adapter.
- The patch adds strict field-type gates, deduplicates vocabulary on written form plus reading, preserves Tatoeba sentence/translation owners, licenses, and source links, and accepts only explicit CC BY 2.0 FR / CC0 1.0 text licenses for both source sentence and translation. Targeted regression fixtures cover malformed and unlicensed records.
- Dynamic vocabulary and Tatoeba-derived sentences are not a pinned corpus. Their present structural gates cannot prove reading-to-word association, sense alignment, grammar, translation equivalence, naturalness, or learner-level suitability. Independent review remains a release acceptance requirement.
- The onboarding placement answer review is already implemented: after completing the assessment, learners can optionally review each Kanji, their selected answer, the correct answer, and a correct/incorrect status in Persian or English. Correctness is not revealed mid-assessment, reducing the risk of cueing later answers. This is useful answer correction, not a semantic explanation or a validated proficiency diagnosis.

## Current inventory

Counts were calculated from the files on the observed baseline. Structural checks and counts are not evidence that each individual linguistic claim is correct.

| Area | Current inventory | Interpretation |
|---|---:|---|
| Jōyō kanji catalog | 2,136 records; 2,136 unique characters; 0 ID/character mismatches | Character-based IDs must remain stable to preserve card identity and review history. |
| English source glosses | 7,937 values across all records; no record lacks a meaning array | Source gloss presence does not establish the best learner-facing sense or a reviewed Persian translation. |
| On’yomi | 2,850 values; 6 records have an empty on-list | An empty list is not automatically an error; verify individual cases against the relevant reference before editing. |
| Kun’yomi | 3,905 values; 359 records have an empty kun-list | An empty list is not automatically an error. |
| JLPT metadata | 1,964 populated; 172 null; 0 invalid populated labels | Nulls are retained rather than guessed. Source tags are metadata, not proof of official exam scope or learner proficiency. |
| Frequency | 99 null values | Preserve unknown values; do not invent frequency ranks. |
| Topic taxonomy | Version 4; 24 topics; 1,156 assignments; 849 unique kanji tagged | Partial curation by design: 1,287 of 2,136 kanji have no topic tag. There are no duplicate memberships within a single topic and no topic character outside the catalog in the inspected snapshot. |
| Classical radicals | 214 definitions and a mapping for all 2,136 catalog characters, per the existing pipeline audit | A classical radical is not the same as every visible component or a definitive etymological analysis. |
| Visual structure | 2,136 source-derived roots in the committed snapshot, per the existing pipeline audit | Visual grouping is not evidence of historical character origin. |
| Learning dependencies | 2,100 available; 36 explicitly listed source gaps, per the existing pipeline audit | These are learning-order cues, not canonical decompositions; missing source records must remain explicit. |
| Vocabulary examples | Retrieved dynamically through the KanjiAPI adapter and normalized/deduplicated | No reproducible full snapshot is committed; per-entry reading/sense validity remains unverified. |
| Context sentences | Retrieved dynamically from Tatoeba-derived results and structurally filtered | Structural checks cannot establish grammaticality, naturalness, translation fidelity, or level appropriateness. |

## Confirmed defects and corrections

### P2 — non-string provider fields could masquerade as usable content

**Evidence:** `normalizeContentText` intentionally stringifies values. Before this patch, the vocabulary validator could treat `meaning: {}` as the non-empty text `[object Object]`. The context validator could treat `english: {}` as `[object Object]`, which also contains Latin letters and could pass the translation-script check. The upstream KanjiAPI adapter also stringified array-valued `written` / `pronounced` fields and joined non-string gloss values before validation.

**Correction in this branch:**
- Require vocabulary `word`, `reading`, and `meaning` to be strings before normalizing them.
- Require context `text` and `english` fields to be strings, and do not stringify array/object sentence values before validation.
- At the KanjiAPI boundary, accept written forms and pronunciations only when the provider fields are strings, and discard non-string gloss items.
- Add regression tests for array-valued written forms/readings/sentences and object-valued meanings/translations/glosses, while retaining the existing valid-entry fixtures.

**Affected corpus records:** none identified or edited. This is a validation-path defect, not a verified correction to any named vocabulary record. Runtime payload counts cannot be claimed because the provider corpus was not frozen or exhaustively sampled.

### P1 — Tatoeba author/license metadata was discarded by the context adapter

**Evidence:** the official Tatoeba API schema returns sentence `owner` and `license` fields; translation objects are sentence objects as well and carry their own IDs, owners, and licenses. Before this patch, the adapter retained only the Japanese sentence ID/text, English text, and a generic `source: 'tatoeba'` marker. That erased the information needed to produce specific sentence/translation attribution downstream. Tatoeba's reuse guidance says text attribution must identify Tatoeba and its license; its API distinguishes `CC BY 2.0 FR`, `CC0 1.0`, and `PROBLEM`. References: https://api.tatoeba.org/openapi.json and https://en.wiki.tatoeba.org/articles/show/faq

**Correction in this branch:**
- Request only reusable source-sentence licenses explicitly (`CC BY 2.0 FR` and `CC0 1.0`) using repeated query parameters.
- Retain the source sentence URL, owner, and license with every returned context item.
- Retain the chosen English translation's sentence ID, URL, owner, and license.
- Do not select an English translation explicitly marked `PROBLEM`, missing a license, or carrying a license outside the text allowlist.
- Add regression fixtures for source/translation attribution metadata, repeated license parameter serialization, and rejection of PROBLEM, missing, or unrecognized licenses.

**Remaining acceptance requirement:** these fields are now preserved in the runtime context data, but this source-adapter PR does not alter the React presentation. Verify that the production Context experience actually presents appropriate attribution/links to users, and that it does not show material marked `PROBLEM`, before closing the licensing/release gate. Metadata preservation alone is not proof that the user-facing attribution requirement is satisfied.

### P2 — adapter-level deduplication dropped alternate readings for one written form

**Evidence:** `fetchWordsResult` used a set keyed only by the written form (`word`). When a provider record contained two variants with the same written form but different kana readings, the first variant occupied the set and the later reading was silently skipped. The downstream canonical vocabulary identity already distinguishes an item using the written form plus reading, and `validateVocabularyList` also deduplicates by that pair.

**Correction in this branch:** key the adapter's duplicate guard by `word|reading`. Add a fixture containing 日本（にほん／にっぽん） and assert that both variants survive. 漢字ペディア documents ニホン and ニッポン as readings of 日本: https://www.kanjipedia.jp/kotoba/0005439300

**Scope limitation:** this fixes a reproducible lossy transformation, not a claim about the current live KanjiAPI payload. The example regression uses a source-backed alternate-reading fixture; no current provider response was frozen, and no static corpus record was edited.

## Linguistic and pedagogical findings

### P1 — reading-to-word and sense alignment are not yet independently verified

The runtime validator checks required fields, script shape, target-kanji presence, and deduplication. It cannot establish that a given written word takes the supplied reading, that a gloss matches the intended sense, or that a word is natural and useful at the learner's current level. A kana-only reading can still be the wrong reading for a word.

**Action:** freeze a timestamped, source-attributed sample from each provider and review the exact written form, reading, sense, target-kanji relevance, frequency/level, and attribution. Apply corrections only to individual entries with a cited lexical reference and a review record. Do not describe the current dynamic corpus as fully validated.

### P1 — independent educational review and placement validity remain open

The placement result intentionally measures English-gloss recognition of isolated kanji. The interface's optional post-assessment review correctly shows the answer that was keyed for each item, but the interface does not provide a richer etymological or usage explanation for every wrong answer. Adding such explanations requires an accurate, reviewed source record; it should not be generated by guessing from an English gloss.

The 20-item N5–N2 blueprint, 4/5 provisional band threshold, boundary messaging, and N1 upper-range disclosure remain implementation heuristics until independently reviewed and empirically calibrated. This assessment is a starting-point recommendation, not a JLPT prediction or a measure of overall Japanese proficiency.

### P2 — topic membership needs semantic review, not automatic completion

The taxonomy's current membership and structural references are consistent. Its 849-kanji coverage is explicitly partial; 1,287 untagged characters are not automatically defects. Membership can reflect an explicitly reviewed common compound as well as a direct meaning, so tags must not be auto-generated from English gloss strings. No specific topic membership was changed in this audit.

### Reading fields need a source-scoped distinction

The committed `on` / `kun` lists are derived from KANJIDIC2 via the pinned `jkindrix/japanese-language-data` revision. Do not present every dictionary reading as an official reading listed in the Jōyō table. If the product later needs to teach official table readings specifically, model those as separately sourced facts instead of inferring the distinction from on/kun type or JLPT label.

## Data provenance and licensing notes

| Data | Current project source / transformation | Provenance and limits |
|---|---|---|
| `kanji-data.json` | `scripts/build-kanji-data.mjs`, pinned `jkindrix/japanese-language-data` commit `f79c68c9e35c6f8269a6b66e86c63c3713db06a0`; source identifies KANJIDIC2-derived fields | EDRDG KANJIDIC files are provided under CC BY-SA 4.0. Keep the attribution and compatible share-alike terms for distributed derivatives. |
| JLPT metadata | `jlpt_waller` field in the pinned source projection | Treat as source metadata. Do not label a learner as JLPT-certified or imply that a null is N1. |
| Topic taxonomy | Hand-curated `frontend/src/app/kanji-topics.json` | Partial editorial associations; source entries and membership are reviewable, but not licensed dictionary facts. |
| Vocabulary examples | Runtime KanjiAPI response, adapted by `v1.5-network.js` and normalized by the vocabulary/content-quality layers | Not frozen in Git; source version and lexical item may not be reproducible after an upstream change. Confirm current provider and underlying EDRDG terms/attribution before redistributing cached/bundled examples. JMdict is a candidate for future controlled sourcing, not an adopted replacement in this change. |
| Context sentences | Tatoeba API responses with direct English translations | Text licenses include CC BY 2.0 FR, CC0 1.0, and a PROBLEM marker. The adapter now preserves source and translation IDs, URLs, owners, and licenses; it accepts only CC BY 2.0 FR / CC0 1.0 text licenses for both the source and selected translation, excluding PROBLEM, missing, or unrecognized licenses. Tatoeba sentence text and translations still need appropriate user-visible attribution; audio has separate, item-specific licensing. |
| Visual structure / stroke-order sources | Pinned KanjiVG-derived files | Keep the recorded KanjiVG attribution and CC BY-SA 3.0 terms described in `docs/THIRD-PARTY-LICENSES.md`. |
| Learning dependencies | Pinned TopoKanji dependency data | Learning-order aid only; retain the separate provenance and do not describe it as a canonical visual decomposition. |

Useful primary references:
- Agency for Cultural Affairs, official 常用漢字表: https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/kanji/
- EDRDG general dictionary licence: https://www.edrdg.org/edrdg/licence.html
- EDRDG KANJIDIC project: https://www.edrdg.org/wiki/KANJIDIC_Project.html
- 漢字ペディア, on/kun index and the distinction between table-listed and non-table readings: https://www.kanjipedia.jp/include/popup_onkun.html
- 漢字ペディア, kanji entry conventions, meanings, readings and examples: https://www.kanjipedia.jp/include/popup_kanji.html
- EDRDG JMdict project: https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html
- Tatoeba reuse FAQ: https://en.wiki.tatoeba.org/articles/show/faq

## Targeted lexicographic spot-check

**Scope:** a small check of benchmark items previously named in the project QA record. This is an illustrative source check, not a representative sample of the full catalog or dynamic provider responses. A Japanese dictionary reading can confirm a word/read association; it does not by itself validate the chosen English gloss or Persian localization.

| Item in the project sample | Reference evidence | Disposition |
|---|---|---|
| 学ぶ（まなぶ） | 漢字ペディア's word entry lists 学ぶ（まな－ぶ） and definitions covering learning, studying, imitating, and learning from experience. https://www.kanjipedia.jp/kotoba/0000927200 | Reading and broad learning sense supported for this lexeme; no correction proposed. The English “to study; to learn” remains an editorial gloss, not an independently reviewed translation. |
| 学校（がっこう） | 漢字ペディア's 校 entry lists 学校（ガッコウ） under compounds. https://www.kanjipedia.jp/kanji/0002236900/ | Reading supported at the compound level; no correction proposed. |
| 学生（がくせい） | 漢字ペディア's word entry notes 学生（ガクショウ） for historical / religious senses and explicitly says “ガクセイ” means a person receiving an education. https://www.kanjipedia.jp/kotoba/0000924900 | **Word-sense ambiguity recorded:** ガクセイ is the appropriate common reading for “student”; do not confuse it with the historical / religious ガクショウ entry. This reinforces sense-specific validation rather than a character-only lookup. |
| 日本（にほん） | 漢字ペディア's 日本 entry gives ニホン and explicitly notes that ニッポン is also read. https://www.kanjipedia.jp/kotoba/0005439300 | The sample reading is valid, but the lexeme has a common alternative reading. Do not silently replace it; represent alternates where teaching goals and space allow. |
| 今日（きょう） | 漢字ペディア's 今日 entry lists きょう for “this day/today” and notes a separate こんにち reading/sense (“these days/current era”). https://www.kanjipedia.jp/kotoba/0002418800 | Reading supported for the intended “today” sense. This is a concrete example of why a reading must be checked against a word and sense, not inferred from the isolated character alone. |
| 会議（かいぎ） | 漢字ペディア's 会 and 議 entries list 会議（カイギ） among compounds. https://www.kanjipedia.jp/kanji/0000756800/ and https://www.kanjipedia.jp/kanji/0001324000/ | Reading supported at the compound level; no correction proposed. |
| Official-table reading distinction | 漢字ペディア marks readings included in the 常用漢字表 with a distinct symbol in its reading index; the Agency for Cultural Affairs also publishes the official Jōyō index. https://www.kanjipedia.jp/include/popup_onkun.html and https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/kanji/joyokanjisakuin/ | Confirms the source distinction discussed above. Do not assume that every KANJIDIC2 dictionary reading is a table-listed reading. |

These checks did not identify a verified incorrect reading in these sampled words. They do record explicit word-sense distinctions (especially 学生 and 今日) that should be preserved when selecting examples and glosses. This is not a correction to the static catalog, and it does not validate every sense, etymology, learner-level suitability, provider result, or translation in the application. No corpus record was modified.

## Source-backed proposed editorial actions — not applied

These are candidate review rules derived from the small reference check above. They are **not** claims that a current stored or live record is wrong; the runtime provider results have not been frozen and tied to reviewed entry IDs.

1. **学生:** for the ordinary modern sense “student,” select / display ガクセイ. Reserve ガクショウ for the historical or religious sense documented by 漢字ペディア. Review any future fixed sample using this pair before approving it. https://www.kanjipedia.jp/kotoba/0000924900
2. **今日:** attach reading and meaning to the lexeme/sense—きょう “today” versus こんにち “these days / the present era”—rather than validating or teaching a reading in isolation. https://www.kanjipedia.jp/kotoba/0002418800
3. **日本:** preserve ニホン and ニッポン as documented alternatives where the relevant UI supports alternate readings. Do not classify either as erroneous solely because the other is chosen as the display default. https://www.kanjipedia.jp/kotoba/0005439300
4. **Official table readings:** if future pedagogy needs to distinguish readings listed in the Jōyō table from broader dictionary readings, add source-scoped fields backed by the official Agency for Cultural Affairs index or the Kanjipedia marker, instead of inferring that distinction from KANJIDIC2 on/kun arrays. https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/kanji/joyokanjisakuin/
5. **Vocabulary source of record:** evaluate a pinned JMdict-derived source with stable lexeme / sense identifiers and explicit source/version metadata before relying on dynamic provider results for reviewed teaching examples. Confirm current terms, attribution, and compatible share-alike handling before bundling or redistributing any derived dataset. This is a future source evaluation, not a source replacement made in this PR. https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html and https://www.edrdg.org/edrdg/licence.html

## Unresolved review queue

1. **Native Japanese / lexicographic review:** review on/kun entries that are prioritized for teaching, ambiguous readings, and a representative sample of high-frequency and assessment-target characters against Kanjipedia and the official Jōyō table. Record character, exact field, reference URL, reviewed value, reviewer, and date.
2. **Vocabulary review:** use a frozen provider snapshot; check headword spelling, reading-to-word association, sense mapping, target relevance, frequency/usefulness, level, and deduplication. Separate mechanically validated from human-approved content.
3. **Sentence review:** validate grammar, naturalness, translation equivalence, target-kanji context, and learner burden for the frozen Tatoeba sample; retain source/license attribution per item.
4. **Persian localization review:** source English glosses are not reviewed Persian translations. A qualified Japanese–Persian reviewer must approve learner-facing Persian meanings separately.
5. **Topic review:** independently inspect a priority sample of direct and compound-based topic associations. Expand partial coverage only through small reviewed patches.
6. **Placement study:** independently inspect target meanings and distractors, analyze item ambiguity and position bias, and collect representative repeated-attempt stability evidence. Do not use assessment output as an overall Japanese level or JLPT readiness claim.
7. **Licensing/governance:** confirm live provider terms and production attribution for dynamic vocabulary and sentence content before public-beta acceptance.

## Validation status for this change

- Structural inventory was computed from the committed baseline files listed above.
- The existing repository tests already check catalog counts, character-based IDs, reading-token shape, source-projection preservation, topic IDs/memberships, and duplicate entries.
- This patch adds targeted regression coverage for strict field types, malformed provider payloads, alternative vocabulary readings, and Tatoeba attribution/license metadata; it does not edit static corpus records.
- The aggregate `npm test` suite and required GitHub Actions checks must pass on the exact pull-request head before this change is considered verified. This audit does not claim that full local execution or comprehensive linguistic review has occurred.
