# Rinemi — Curated Kanji Topic Taxonomy

**Taxonomy version:** 4  
**Status:** Expanded Dictionary topic filters  
**Scope:** Content navigation only; this is not a new learning scheduler or a statement of mastery.

## Practice Home integration

The curated topic taxonomy is available as a topic-selection path in Practice Home. Selecting a topic passes its reviewed character membership into the existing custom-study selection contract; the topic narrows the candidate pool, while JLPT, due/new, weakness, mistake, and daily-new-budget rules continue to apply. Topic selection is a content filter, not a separate scheduler or mastery claim. Characters outside a curated topic remain available through general learning and dictionary search.

## Why this exists

The pinned `kanji-data.json` dataset contains 2,136 kanji with glosses, readings, school-grade, and JLPT metadata. It does not include a reviewed topical taxonomy. Matching English gloss strings mechanically can misclassify ambiguous meanings, so membership remains explicit and curated.

## Version 4 coverage after two semantic QA rounds

The taxonomy provides **24 topics**, **1,156 topic assignments**, and **849 unique tagged kanji** (39.7% of the catalog). A character may belong to multiple relevant topics. Coverage is still partial by design: a missing topic assignment does not mean a kanji is irrelevant, and untagged kanji remain searchable and visible when “All topics” is selected.

The first-edition taxonomy contained 16 topics, 495 assignments, and 422 unique characters. Version 2 added eight topic families and widened membership in several existing families. Version 3 removed 13 overbroad assignments, reducing unique coverage from 741 to 737 characters. Version 4 adds 144 curated memberships across 112 previously untagged kanji, raising unique coverage to 849 while retaining intentional partial coverage.

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


## Semantic QA — first conservative pass (2026-10-09)

Reviewed the current memberships against the pinned catalog's meanings. The goal is not to make every association a literal one-word gloss: well-established, transparent compounds can justify a topic (for example, `学生` / `先生` for school, `新聞` / `放送` for media, `貿易` for finance, and `鉄道` for transport). However, a generic or incidental sense alone is not enough.

This pass removes the following **13 overbroad assignments**; these characters remain available in the general Dictionary and may still belong to other topics:

| Topic | Removed kanji | Reason |
|---|---|---|
| People & society | `学` | Its pinned meanings are study/learning/science, not a person or social role. |
| School & learning | `明`, `黒`, `白` | Brightness and the colors black/white are not school-specific meanings or clear school-topic anchors on their own. |
| Places & travel | `銀`, `物`, `建` | Silver, generic things/objects, and the verb “build” do not denote a place; `銀` and `物` remain in other relevant topic families. |
| Government & law | `庫` | “Warehouse/storehouse” alone does not establish a government or law association. |
| Thoughts & feelings | `絶` | “Sever/discontinue/cut off” is not itself an emotion; any link through compounds such as despair is too indirect for this tag. |
| Arts & culture | `福`, `授`, `統`, `産` | Blessing/fortune, impart/grant, rule/relationship, and products/birth are too broad or belong more naturally to other domains without a specific arts/culture meaning. |

The regression test now asserts these exclusions in addition to catalog integrity, bilingual labels, representative membership, duplicate checks, and audited counts. This is a conservative first pass, not a claim that every remaining association is beyond debate. Future edits should record both the semantic rationale and any common-compound basis for context-dependent entries.


## Coverage expansion — round 2 (2026-10-09)

This round reviews previously untagged entries in catalog order (the pinned dataset is ordered by newspaper frequency) and adds memberships only where the catalog meaning or an explicit common-compound relationship provides a defensible topic link. It adds **144 assignments** covering **112 newly tagged kanji**; cross-topic reuse is intentional. The number of untagged catalog entries falls from 1,399 to **1,287**. Nothing was removed from the underlying kanji catalog, and all of the untagged entries remain available through “All topics” and text search.

| Topic | Added kanji | Semantic basis |
|---|---|---|
| Numbers & quantity | `点`, `量`, `率`, `比`, `差`, `残`, `周`, `総` | Point/mark, quantity, rate, ratio, difference, remainder, circuit/lap, and total/whole. |
| Nature & land | `井`, `河`, `岡`, `湾`, `浜`, `景`, `幹`, `藤`, `沢` | Well, river, hill, bay, shore, scenery, tree trunk, wisteria, and marsh. |
| Time & calendar | `初`, `去`, `旧`, `未`, `予` | Beginning/first time, past, old times, not-yet, and beforehand. |
| Family & relationships | `育`, `児`, `婦`, `郎` | Raising/bringing up, child, wife/woman, and son. |
| People & society | `位`, `衆`, `性`, `独`, `副`, `師`, `雄`, `児`, `婦`, `郎`, `将` | Rank, groups of people, gender, individual/aloneness, assistant, teacher/expert, male, child/family roles, and leader/commander. |
| School & learning | `課`, `例`, `師`, `講`, `修` | Lesson/section, example, teacher, lecture, and study/training. |
| Places & travel | `宅`, `境`, `域`, `線`, `段`, `席`, `座`, `韓`, `欧`, `井`, `河`, `岡`, `湾`, `浜` | Residence, region/boundary, track, steps/stairs, seating/place, Korea/Europe, and named natural land or water features. |
| Directions & position | `側`, `逆`, `対`, `境`, `界`, `域` | Side, reverse/opposite, boundary, world/border, and region/limits. |
| Weather & temperature | `候` | Climate, season, and weather. |
| Plants & trees | `幹`, `藤` | Tree trunk and wisteria. |
| Actions & change | `参`, `援`, `施`, `付`, `配`, `導`, `備`, `視`, `断`, `違`, `去`, `失`, `整`, `迎`, `捜`, `競`, `育`, `守`, `捕`, `撃`, `殺`, `与`, `供`, `遣`, `献`, `換` | Participation/going, help, carry out/give, attach, distribute, guide, equip/prepare, inspect/regard, refuse/cut off, differ, leave/quit, lose, organize, welcome, search, compete, raise, protect, capture, attack, kill, bestow/offer, dispatch, present, and change/exchange. |
| Work & economy | `案`, `策`, `件`, `局`, `企`, `副`, `労` | Plan/draft, policy, case/matter, office/bureau, undertake/design, assistant, and labor. |
| Thoughts & feelings | `情` | Feelings and emotion. |
| Qualities & comparison | `常`, `格`, `状`, `質`, `形`, `非`, `負`, `色`, `白`, `黒`, `赤`, `青`, `型`, `性`, `独`, `雄`, `逆`, `違`, `比`, `差` | Ordinary/normal, rank/capacity, condition, quality/substance, shape, negative/non-, colors, type/model, nature/gender, single/alone, masculine, reverse, difference, compare, and variation. |
| Government & law | `反`, `策`, `証`, `条`, `票`, `命`, `訴`, `盟`, `将` | Opposition, policy, evidence/certificate, legal article/clause, ballot, command/decree, accusation/lawsuit, alliance/oath, and commander. |
| Communication & media | `声`, `評`, `写` | Voice, evaluation/commentary, and copy/photography/description. |
| Transport & travel | `線`, `券`, `票` | Track/line and tickets; `票` has a common ticket sense alongside ballot/label. |
| Technology & industry | `型`, `核` | Mold/type/model and core/nucleus, including technical and industrial uses. |
| Money & finance | `融` | Added based on established compounds `金融` and `融資` (finance/financing), not inferred from the English gloss “dissolve/melt”; see [Kanji Pedia's entry for 融](https://www.kanjipedia.jp/kanji/0006891000). |
| Arts & culture | `和`, `神`, `写`, `色`, `形`, `景`, `調` | Japanese style/harmony, religion/deities, photography, color, form, scenery, and musical tone/tuning. |

The regression test checks every membership added in this round, while retaining the exclusions from the prior semantic audit. It also checks exact assignment and unique-character counts so accidental drift is visible in CI. Categories without additions in this batch (for example, Food & drink, Animals, Human body, and Health & medicine) were left unchanged rather than filled with weak matches; they remain candidates for later reviewed batches.

## Product and architecture rules

- Topic membership is a curated navigation aid. It is not a vocabulary list, grammatical label, JLPT equivalence, frequency ranking, or evidence that a learner knows the kanji.
- A character may be assigned to multiple topics, but may appear only once within each topic.
- “All topics” includes the complete catalog, including untagged kanji.
- Topic, JLPT, grade, mastery, and text search combine by intersection. Clearing advanced filters resets only topic, grade, and mastery; text search and JLPT remain unchanged.
- This is a local content taxonomy. It does not change FSRS, the Learner Model, Adaptive Planner, learner evidence, or persistence.
- Do not infer memberships automatically from gloss keywords. Expand coverage through reviewable curation and representative QA, especially for kanji with ambiguous or compound-dependent meanings.

## Verification

`scripts/test-kanji-topic-taxonomy.mjs` checks taxonomy version, stable unique IDs, bilingual labels, representative membership, duplicate-free topic entries, single-character entries, and membership against the pinned catalog. React browser regression coverage verifies selection from the expanded category set, composition with search and JLPT, active-filter counting/reset behavior, and English LTR plus Persian RTL.
