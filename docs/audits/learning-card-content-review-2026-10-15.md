# Learning Card content audit — 15 October 2026

## Scope and evidence

This is a review of the current learner-meaning priority rules and the new provenance/review-status contract. It is **not** an independent subject-matter expert sign-off or a Persian translation review.

- Source dataset: `kanji-data.json`, documented in the file as KANJIDIC2 via `jkindrix/japanese-language-data`.
- Projection: `v1.9-learner-content-core.js`, `LEARNER_CONTENT_VERSION=1.0.0`.
- Priority overrides are presentation-priority rules, not translation verification. Every source-derived record remains `unreviewed` unless explicit reviewer identity and review timestamp are supplied with a verified record.
- No Persian meaning translations were introduced or marked verified in this patch.
- Persian UI falls back to source English glosses with an explicit note when there is no reviewed Persian primary meaning.

## Representative sample

This sample covers frequent, ambiguous, and technical-gloss cases. The right-hand columns show the existing priority projection, not a claim that every sense is equally common in modern usage.

| Kanji | Source English glosses | Current primary | Secondary | Reference |
|---|---|---|---|---|
| 日 | day; sun; Japan | day; sun | Japan | — |
| 一 | one; one radical (no.1) | one | — | one radical (no.1) |
| 国 | country | country | — | — |
| 会 | meeting; meet; party | meet; meeting | party | — |
| 人 | person | person | — | — |
| 生 | life; genuine; birth | life; birth | genuine | — |
| 行 | going; journey; carry out | going; journey | carry out | — |
| 前 | in front; before | in front; before | — | — |
| 後 | behind; back; later | behind; later | back | — |
| 入 | enter; insert | enter; insert | — | — |
| 出 | exit; leave; go out | exit; leave | go out | — |
| 家 | house; home; family | house; home | family | — |
| 中 | in; inside; middle | middle; inside | in | — |
| 本 | book; present; main | book; main | present | — |
| 張 | counter for bows & stringed instruments; stretch; spread | stretch; spread | — | counter for bows & stringed instruments |
| 杯 | counter for cupfuls; wine glass; glass | glass; wine glass | — | counter for cupfuls |
| 箇 | counter for articles | — | — | counter for articles |
| 陸 | land; six | land | — | six |
| 塔 | pagoda; tower; steeple | pagoda; tower | steeple | — |

## Findings and disposition

1. **Confirmed good separation:** the radical/counting sense in `一` and counter senses in `張`, `杯`, and `箇` remain reference-level instead of becoming the first visible meaning.
2. **Ambiguous polysemy still requires review:** `日`, `生`, `行`, `中`, `本`, and `会` have context-dependent senses. The current overrides improve display ordering but do not establish a single correct translation for all contexts.
3. **English source meanings are not all editorially verified:** the contract intentionally records their provenance and `unreviewed` state. The override map should not be used as evidence of human review.
4. **Persian coverage is not established:** zero new Persian translations were marked verified; actual Persian wording, sense priority, and review notes remain an external human review task.
5. **Reading/vocabulary linkage needs expert curation:** the network source gives word-level readings, not an authoritative mapping from each word back to a particular reading of each constituent Kanji. No association should be generated solely because a word contains the target glyph. The current card plays an explicit prioritized reading and keeps full words in the vocabulary page; explicit word-to-reading curation remains open.

## Review-status policy now enforced by the contract

- Records carry language, learner priority, source/version/entry/url provenance, review state, notes, reviewer, and timestamp.
- A record attempting to claim `verified` without known language/source plus reviewer identity and timestamp is downgraded to `unreviewed`.
- Missing translations can be represented as `unavailable` with a null text and an explanatory note; the UI never invents a translation to fill the gap.
- Existing snapshots remain compatible: old meaning arrays remain available, while the new records are additive. No scheduler, learner-model evidence, FSRS, or persistence migration is part of this change.

## Still required before content acceptance

A qualified reviewer should validate the English sense priorities above and supply reviewed Persian equivalents/provenance for a representative set before any Persian records are marked verified. This code patch supplies an auditable contract and safe fallback; it does not manufacture review evidence.
