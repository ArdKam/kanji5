# Kanji5 — Curated Kanji Topic Taxonomy

**Taxonomy version:** 1  
**Status:** Initial Dictionary filter implementation  
**Scope:** Content navigation only; this is not a new learning scheduler or a statement of mastery.

## Why this exists

The pinned `kanji-data.json` dataset contains 2,136 Jōyō kanji with source glosses, readings, school grade, and JLPT metadata. It does not provide a reviewed topical taxonomy. Automatically classifying kanji by matching English gloss strings would produce false positives and misleading topic membership, so the first edition uses explicit, hand-curated character associations.

## First-edition coverage

The taxonomy defines 16 topics and 495 topic assignments across 422 unique Jōyō kanji. Multi-topic membership is intentional: for example, 日 can be relevant to both nature and time. The first edition therefore covers about 19.8% of the catalog; it does **not** claim exhaustive classification. Unclassified kanji remain searchable and visible when “All topics” is selected.

The authoritative entries, bilingual labels, and exact character membership live in `frontend/src/app/kanji-topics.json`. The dataset is bundled with the React app, so topic filtering does not require a network request and remains available offline.

## Topic set

| ID | English | فارسی |
|---|---|---|
| `numbers` | Numbers & quantity | اعداد و کمیت |
| `body` | Human body | بدن انسان |
| `nature` | Nature & land | طبیعت و زمین |
| `time` | Time & calendar | زمان و تقویم |
| `family` | Family & relationships | خانواده و روابط |
| `people` | People & society | افراد و جامعه |
| `food` | Food & drink | خوراک و نوشیدنی |
| `school` | School & learning | مدرسه و یادگیری |
| `places` | Places & travel | مکان‌ها و سفر |
| `directions` | Directions & position | جهت و موقعیت |
| `weather` | Weather & temperature | آب‌وهوا و دما |
| `animals` | Animals | حیوانات |
| `plants` | Plants & trees | گیاهان و درختان |
| `actions` | Actions & movement | کارها و حرکت‌ها |
| `work` | Work & economy | کار و اقتصاد |
| `emotions` | Thoughts & feelings | احساسات و اندیشه |

## Product and architecture rules

- Topic membership is a curated navigation aid. It must not be interpreted as a vocabulary list, grammatical label, frequency ranking, JLPT equivalence, or evidence that a learner knows the kanji.
- A character may be assigned to more than one topic, but may appear only once within a single topic.
- The “All topics” option includes the complete catalog, including currently untagged characters.
- Topic, JLPT, grade, mastery, and text search combine by intersection. Clearing advanced filters clears only mastery, grade, and topic selection; it preserves the search query and the separate JLPT level.
- The filter reads existing catalog characters. It does not alter FSRS, the Learner Model, Adaptive Planner, learner evidence, or persistence.
- The first edition is intentionally curated and partial. Add membership only after reviewing the character's learner-relevant meaning/use; do not generate tags from unreviewed English gloss matches.

## Verification

`scripts/test-kanji-topic-taxonomy.mjs` validates the taxonomy version, stable unique IDs, bilingual labels, representative coverage, per-topic duplicate-free membership, single-character entries, and that every tagged character exists in the pinned catalog. The React browser test verifies representative topic results, composition with search and JLPT, active-filter counting/reset behavior, and English LTR plus Persian RTL presentation.
