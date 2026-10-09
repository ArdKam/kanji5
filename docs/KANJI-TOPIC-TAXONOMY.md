# Kanji5 — Curated Kanji Topic Taxonomy

**Taxonomy version:** 2  
**Status:** Expanded Dictionary topic filters  
**Scope:** Content navigation only; this is not a new learning scheduler or a statement of mastery.

## Why this exists

The pinned `kanji-data.json` dataset contains 2,136 kanji with glosses, readings, school-grade, and JLPT metadata. It does not include a reviewed topical taxonomy. Matching English gloss strings mechanically can misclassify ambiguous meanings, so membership remains explicit and curated.

## Version 2 coverage

The taxonomy provides **24 topics**, **1,025 topic assignments**, and **741 unique tagged kanji** (34.7% of the catalog). A character may belong to multiple relevant topics. Coverage is still partial by design: a missing topic assignment does not mean a kanji is irrelevant, and untagged kanji remain searchable and visible when “All topics” is selected.

The first-edition taxonomy contained 16 topics, 495 assignments, and 422 unique characters. Version 2 adds eight topic families and widens membership in several existing families.

The authoritative entries, bilingual labels, and exact character membership live in `frontend/src/app/kanji-topics.json`. They are bundled with the React app, so filtering needs no network request and works offline.

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
| `actions` | Actions & change | کارها و تغییر |
| `work` | Work & economy | کار و اقتصاد |
| `emotions` | Thoughts & feelings | احساسات و اندیشه |
| `qualities` | Qualities & comparison | ویژگی‌ها و مقایسه |
| `government` | Government & law | حکومت و قانون |
| `communication` | Communication & media | ارتباط و رسانه |
| `money` | Money & finance | پول و اقتصاد |
| `transport` | Transport & travel | حمل‌ونقل و سفر |
| `health` | Health & medicine | سلامت و پزشکی |
| `industry` | Technology & industry | فناوری و صنعت |
| `culture` | Arts & culture | هنر و فرهنگ |

## Product and architecture rules

- Topic membership is a curated navigation aid. It is not a vocabulary list, grammatical label, JLPT equivalence, frequency ranking, or evidence that a learner knows the kanji.
- A character may be assigned to multiple topics, but may appear only once within each topic.
- “All topics” includes the complete catalog, including untagged kanji.
- Topic, JLPT, grade, mastery, and text search combine by intersection. Clearing advanced filters resets only topic, grade, and mastery; text search and JLPT remain unchanged.
- This is a local content taxonomy. It does not change FSRS, the Learner Model, Adaptive Planner, learner evidence, or persistence.
- Do not infer memberships automatically from gloss keywords. Expand coverage through reviewable curation and representative QA, especially for kanji with ambiguous or compound-dependent meanings.

## Verification

`scripts/test-kanji-topic-taxonomy.mjs` checks taxonomy version, stable unique IDs, bilingual labels, representative membership, duplicate-free topic entries, single-character entries, and membership against the pinned catalog. React browser regression coverage verifies selection from the expanded category set, composition with search and JLPT, active-filter counting/reset behavior, and English LTR plus Persian RTL.
