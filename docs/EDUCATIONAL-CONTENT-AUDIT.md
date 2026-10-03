# Kanji5 — Educational Content & Learning Validity Audit

**Audit date:** 2026-10-03  
**Audited baseline:** `main` @ `940224fad0fe50c82bb03e7064dd1909ad9d6e4c`  
**Scope:** learner-facing educational quality, content validity, assessment validity, and alignment between product claims and actual learning behavior.

This document records the findings of the 2026-10-03 educational/content audit. It supplements `ROADMAP.md`; it does not replace the roadmap's implementation/status rules.

## 1. Executive finding

Kanji5 has a strong educational architecture:

- Learn → Recall → Review → Recover → Improve
- FSRS for long-term review scheduling
- separate Meaning, Reading, Production, Vocabulary, and Context evidence
- recovery-aware outcome recording
- adaptive selection based on weakness, uncertainty, recency, and failure signals
- explicit distinction between curated, generated/scaffolded, and personal mnemonic content

The main remaining risk is **content and assessment validity**, not the absence of an educational engine.

The product currently has several places where implementation is more conservative or less capable than the feature name/README implies. These gaps must be treated as product-quality issues even when the underlying engineering and tests are correct.

## 2. Severity summary

### P0 — public-beta blockers

1. **Placement validity**
   - The correct answer is always the first option in the generated choice list.
   - The current diagnostic uses only 3 questions per N5–N2 level, maximum 12 questions.
   - A level can be selected after only 2 answered questions at >=67% accuracy.
   - N1 is not directly sampled.
   - The selected items are primarily the earliest entries by frequency order, not a psychometrically designed level blueprint.
   - Result: the current diagnostic is a useful lightweight kanji check, but it is not yet reliable enough to make a strong proficiency claim.

2. **Production Recall fidelity**
   - The production mode offers a reveal-first self-report path.
   - The user can reveal the answer and then select "I knew it / I didn't know it".
   - The engine correctly marks revealed self-report as `independent=false`, so evidence semantics are not being falsely promoted.
   - However, the learner-facing label "Production Recall" implies independent production more strongly than the current default interaction provides.
   - True production should be the primary path; reveal/self-report should remain a hint/recovery path.

3. **Vocabulary/Context modality mismatch**
   - The underlying graders support typed answers.
   - The current v2 presentation generally presents a choice grid for Vocabulary and Context retrieval.
   - This makes the default activity recognition/cued retrieval rather than full word production or free contextual retrieval.
   - Feature naming and educational claims should match the actual modality, or the product should promote typed/free recall into the main path.

### P1 — important content quality work

4. Learner-facing meanings are too close to raw dictionary glosses.
5. Readings are not tiered into core/secondary/reference learning targets.
6. Vocabulary examples are validated for structural quality, but not yet sufficiently curated for learner stage, usefulness, naturalness, and pedagogical priority.
7. Context sentences have useful structural filters, but limited semantic/grammar difficulty modeling.
8. Curated mnemonics are materially stronger than generated scaffolds; 100% coverage is not equivalent to 100% mnemonic quality.
9. Component/radical visualization is useful but does not yet constitute a complete component-learning curriculum.
10. Handwriting grading is good geometric feedback, but should not be interpreted as a full measure of natural Japanese handwriting quality.
11. Reading Lab coverage metrics are useful navigation signals, but must not be interpreted as reading-comprehension proficiency.
12. Grammar Guide is a beginner primer, not yet a complete grammar-learning curriculum.
13. Adaptive planning is evidence-aware, but current architecture does not establish that adaptive planning itself produces better learning outcomes than a baseline.

## 3. Dataset audit

Current `kanji-data.json` contains:

- 2,136 / 2,136 Jōyō kanji
- meanings for 2,136 / 2,136
- stroke counts for 2,136 / 2,136
- On'yomi for 2,130 / 2,136
- Kun'yomi for 1,777 / 2,136
- JLPT metadata for 1,964 / 2,136
- grade metadata for 2,136 / 2,136
- component coverage: 2,100 / 2,136 (98.31%)

These missing values are not automatically content errors. In particular:

- not every Jōyō kanji needs a Kun'yomi;
- not every kanji has a JLPT assignment in the current source data.

The educational problem is that raw dictionary metadata is still too close to the learner-facing layer.

Examples of technically valid but pedagogically secondary meanings include:

- counters
- radical annotations
- affix-like glosses such as `co-`, `anti-`, `un-`
- historical/technical senses

### Required learner-content model

Keep source/dictionary data authoritative, but introduce a learner-facing semantic layer:

- Primary meaning(s)
- Secondary/common meaning(s)
- Reference/dictionary meanings
- Core reading(s)
- Other/reference readings
- learner-priority vocabulary
- provenance and source version

Do not silently delete source meanings. Reclassify them.

## 4. Learning Card audit

### What is good

The card exposes the right conceptual areas:

1. meaning/readings
2. vocabulary examples
3. mnemonic support
4. stroke order

The information architecture also separates factual reference data from personal mnemonic editing.

### Problems

The card is closer to a compact dictionary reference than a carefully staged teaching card.

Current risks:

- multiple readings receive similar visual weight;
- all dictionary meanings can appear similarly important;
- vocabulary example selection is availability/heuristic-driven rather than fully curated;
- six examples can be more information than a learner needs at first exposure.

### Acceptance target

A learner-first card should emphasize:

- 1–2 core meanings
- core reading(s)
- 2–4 high-value example words
- one strong mnemonic/scaffold
- visual/component structure
- stroke order

Reference meanings/readings should remain accessible but lower-priority.

## 5. Meaning Recall audit

### Strengths

- actual retrieval before answer reveal;
- separate meaning evidence;
- answer normalization;
- multiple accepted meanings;
- partial matching rather than brittle exact string equality.

### Main limitation

The meaning grader is token-overlap/F1 based. It is not a semantic model and therefore cannot reliably distinguish all valid synonyms from misleading near-matches.

### Required follow-up

Create explicit learner-facing accepted-meaning sets for high-frequency/ambiguous kanji and add regression fixtures for:

- valid synonym
- too-broad answer
- wrong but lexically similar answer
- technical/reference-only meaning
- common alternate gloss

## 6. Reading Recall audit

The reading grader correctly normalizes kana and romaji and accepts registered On/Kun readings.

The educational issue is target selection, not only grading.

A prompt such as "write a common reading" should not treat every dictionary reading as equally important.

### Required model

Classify readings as:

- core / first-teach
- vocabulary-supported
- reference / later

Use the core target first in direct recall, then teach other readings through vocabulary/context evidence where possible.

## 7. Production Recall audit

### Current behavior

The UI supports:

- reveal answer;
- self-report after reveal;
- optional choice hint path.

The engine explicitly records revealed self-report separately from independent evidence. This is correct.

### Educational requirement

The primary path should become:

**meaning → independent Kanji production → submit/grade → feedback**

with:

**reveal → self-report**

as a lower-evidence fallback.

Multiple choice should be a hint/recovery mechanism, not the normal definition of production.

### Regression requirement

Tests must demonstrate that:

- independent production creates independent evidence;
- revealed self-report does not count as independent production;
- hint-assisted production is labeled as assisted/cued evidence;
- retries do not inflate independent-attempt counts incorrectly.

## 8. Vocabulary Recall audit

The runtime has a deterministic Vocabulary grader, content validation, adaptive difficulty selection, provenance, and content evidence.

The current presentation usually exposes a multiple-choice/missing-kanji interaction.

### Educational interpretation

This is useful, but the primary activity is closer to **cued vocabulary retrieval / recognition** than full vocabulary production.

### Required progression

Support a staged difficulty ladder:

1. review new word
2. recognize missing Kanji
3. complete the word
4. retrieve the word from meaning/reading
5. use/retrieve the word in context

The product should record the modality actually used and avoid calling all stages equivalent "vocabulary production".

## 9. Context Recall audit

The context pipeline already filters for:

- Japanese text presence
- target Kanji containment
- English translation presence
- non-orphan/non-unapproved source data
- short sentences
- bounded number of other Kanji

This is a strong structural foundation.

### Remaining issue

Structural validity is not the same as pedagogical validity.

The system does not yet sufficiently model:

- grammar difficulty
- vocabulary difficulty
- naturalness
- currentness/register
- translation quality beyond presence
- target-usage pedagogical value

### Required progression

Move toward:

**guided context → sentence completion → free contextual recall**

and annotate content difficulty separately from simple sentence length.

## 10. Placement diagnostic audit

Current contract:

- N5–N2
- 3 selected Kanji per level where available
- maximum 12 questions
- first meaning is used as the correct answer
- suggested level checks N2→N5
- >=2 answered questions and >=67% accuracy can trigger a level suggestion

### Confirmed validity defects

The generated option list places the correct answer at index 0. Because options are rendered in their generated order, this creates an avoidable position-bias/guessing vulnerability.

The item blueprint is also too small and not sufficiently representative for strong level placement.

### Required redesign

Placement must:

- randomize option order;
- keep correct-answer scoring keyed by stable option id;
- use a documented item blueprint instead of raw first-frequency entries;
- sample enough items to make a level decision reasonably stable;
- handle boundary cases explicitly;
- define N1 behavior;
- show uncertainty/sample-size limitations;
- distinguish "recommended starting Kanji band" from overall Japanese proficiency.

### Product wording

Never describe this diagnostic as an assessment of overall Japanese proficiency.

It is a **Kanji starting-point diagnostic** unless and until a broader language-proficiency assessment exists.

## 11. Mnemonic audit

Current prepared-mnemonic system:

- full 2,136 / 2,136 coverage;
- 259 curated entries;
- 1,877 generated/guided scaffolds;
- explicit provenance;
- personal mnemonic persistence;
- representative semantic sentinels and structural checks.

### What is good

The provenance distinction is correct and important.

Curated examples frequently connect:

- component shape
- concrete scene
- mnemonic action
- target meaning

### Main limitation

The generated 1,877 entries are scaffolds/templates, not 1,877 individually authored, learner-tested mnemonics.

The project must preserve the principle:

**100% coverage ≠ 100% quality.**

### Required next step

Grow curated coverage, prioritizing:

- high-frequency Kanji;
- high-confusion pairs;
- irregular readings;
- visually deceptive Kanji;
- Kanji with weak automatic mnemonics.

Human/content review must supplement regex/structural checks.

## 12. Handwriting audit

The handwriting grader measures:

- stroke count
- stroke order
- shape
- endpoints
- length
- direction
- curvature
- placement

It also produces stroke-level feedback.

This is a strong technical feedback layer.

### Educational boundary

The score is geometric similarity to a reference path. It is not a full native-writer judgment of legibility, style, or natural handwriting.

Future claims/UI should use terms such as:

- pattern similarity
- stroke-order adherence
- stroke-path feedback

rather than implying complete handwriting proficiency assessment.

## 13. Components and radicals

The project correctly distinguishes visual decomposition from Kangxi radical semantics.

Current component coverage is 2,100 / 2,136.

### Educational limitation

The current experience is primarily explanatory/visual. A graph of components is not yet a component-learning curriculum.

A full component-learning loop would need:

**teach component → retrieve component → use in compound Kanji → reinforce/recover**

This remains a future educational enhancement, not a reason to rewrite the existing decomposition boundary.

## 14. Reading Lab

Current strengths:

- preserves reading-session state;
- supports sentence focus;
- unique and occurrence-weighted coverage;
- hardest-sentence targeting;
- contextual lookup;
- audio/speech support;
- translation/annotation;
- clear boundary against becoming a second scheduler.

### Important interpretation rule

Kanji coverage is not reading-comprehension proficiency.

Future analytics must not imply:

> 80% Kanji coverage = 80% reading comprehension.

Reading comprehension also depends on vocabulary, grammar, syntax, context, and inferencing.

## 15. Grammar Guide

Current Grammar Guide contains 12 beginner lessons covering:

- です
- は
- が
- を
- に
- で
- の
- demonstratives
- も
- から / まで
- ～たいです

The introductory explanations and examples are broadly suitable for beginner use.

### Limitation

The current format is primarily lesson explanation + three-option recognition.

A stronger grammar curriculum will later need:

**recognition → controlled production → completion → transformation → contextual production**

This is intentionally outside the immediate Kanji release scope.

## 16. Adaptive-learning validity

The adaptive planner has meaningful signals:

- weakness
- accuracy
- confidence
- uncertainty
- error streak
- recovery
- recency
- anti-repetition

This is a sound basis for adaptive practice.

However, algorithmic sophistication is not proof of improved learning.

Do not claim that adaptive planning is more effective than fixed/baseline practice until real learning-efficacy evidence exists.

Maintain the current rule:

**observe first, validate second, tune third.**

## 17. Public-beta acceptance criteria

Before Public Beta, educational quality must satisfy all applicable gates:

### Assessment validity

- Placement option order randomized.
- Placement blueprint documented.
- Placement uncertainty documented.
- Production modality semantics accurate.
- Vocabulary/Context modality labels accurate.
- No known answer-position bias.

### Content validity

- Learner-facing meaning layer separated from raw dictionary glosses.
- Reading priority classification documented.
- Representative Kanji content sampled for meaning/readings/examples/strokes.
- Context sentences sampled for naturalness/translation quality.
- High-risk ambiguous/synonym cases have regression fixtures.
- Content provenance is visible where learner interpretation could otherwise be misleading.

### Mnemonic validity

- Curated vs generated/scaffold distinction remains explicit.
- Curated quality reviewed by humans.
- Coverage metrics are never presented as equivalent to quality metrics.

### Evidence validity

- Independent retrieval separated from reveal/self-report.
- Recovery/assisted attempts separated from independent attempts.
- Stats never imply stronger learning evidence than the underlying modality supports.

### Learning-efficacy evidence

After a baseline comparison exists, evaluate:

- independent retrieval accuracy
- delayed recall/retention
- recovery frequency
- repeated-failure rate
- modality-specific performance
- progression by content stage
- session completion

Do not automatically change FSRS/planner parameters from observational metrics without an explicit evaluated decision record.

## 18. Recommended educational order of work

1. Placement redesign.
2. Production primary-path correction.
3. Vocabulary/Context modality correction.
4. Learner-facing meaning/reading content layer.
5. Curated vocabulary/context QA.
6. Mnemonic curation expansion.
7. Component-learning curriculum.
8. Grammar progression beyond primer.
9. Empirical adaptive-learning comparison.

The existing learning-engine architecture should be preserved while these content/validity improvements are implemented through its established boundaries.
