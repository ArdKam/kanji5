# Kanji5 — Educational Content & Learning Validity Audit

**Audit date:** 2026-10-05
**Audited implementation baseline:** `c4-educational-validity` @ `0b53e1b629c58e627bd64bdbfcedd509a6aa9da6`
**Release-candidate note:** this SHA is the pre-documentation verification baseline; C4 is not marked DONE until the remaining empirical/content-review gates are independently satisfied.  
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

1. **Placement empirical validity / stability**
   - The implementation now randomizes answer order, uses the 16-question N5–N2 blueprint, and applies the documented 3/4 threshold.
   - Boundary and upper-range conditions are surfaced explicitly, with N1 treated conservatively as outside the directly tested range.
   - The remaining blocker is empirical validation of placement stability/bias on representative answer patterns; the current regression suite is deterministic/contract-focused rather than a psychometric validation study.

2. **Representative human/content QA**
   - Learner-priority meanings/readings and deterministic example/context quality gates are now implemented.
   - The remaining Public Beta blocker is independent human/content review of sampled high-risk meanings, readings, examples, context sentences, and curated mnemonics, with the result recorded against the frozen release SHA.

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

## 3. Verification evidence — 2026-10-05

The C4 release candidate was inspected against `main` @ `7d9d413ccb1a236d535ea2ff36d1a124587d7d2d`. The implementation verification baseline recorded above is the final code/test SHA before this documentation update.

Focused runtime spot checks executed in the isolated verification environment:
- learner-content projection: primary/reference meanings, core/reference readings, ambiguity overrides, duplicate/invalid example rejection;
- content-evidence semantics: non-independent/revealed attempts do not inflate practice/correct counters, while guided recovery remains isolated;
- source-level contract review: Production default modality, Vocabulary/Context labels, stable-ID placement scoring, uncertainty/upper-bound presentation, and mnemonic provenance checks.

The full repository `npm test` / TypeScript build was not executed in this environment because there is no local repository checkout and GitHub Actions exposed no workflow runs/statuses for the C4 branch at verification time. This is an execution limitation, not a pass claim.

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

### Current state

The learner-facing contract now separates source meanings/readings from a learner-priority layer:

- 1–2 primary meanings are emphasized, with curated ambiguity overrides for selected high-frequency cases;
- secondary/common meanings remain visible but lower priority;
- reference-style meanings remain available without being treated as primary learning targets;
- core On/Kun readings are shown first, while remaining readings are reference-tiered;
- example candidates are deterministically filtered for target containment, valid reading/meaning fields, duplicate removal, and lower-burden ordering.

### Remaining content-quality risk

The deterministic layer does not replace human pedagogical review. The release gate still requires sampled human review of meaning priority, reading usefulness, example naturalness, and context burden.

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

### Current behavior after C4 patch

The primary v2 path is now:

**meaning → typed Kanji production → submit/grade → feedback**

The lower-evidence paths are:

- reveal → self-report;
- optional multiple-choice hint.

The evidence path explicitly distinguishes:

- `independent_production` / `independent-typed-production`;
- `cued_production` / `cued-kanji-choice`;
- `revealed_self_report`;
- `guided_recovery`.

Retries remain recovery evidence and do not increment independent-attempt counts.

### Regression requirement

Tests must demonstrate that:

- independent production creates independent evidence;
- revealed self-report does not count as independent production;
- hint-assisted production is labeled as assisted/cued evidence;
- retries do not inflate independent-attempt counts incorrectly.

## 8. Vocabulary Recall audit

The runtime has a deterministic Vocabulary grader, content validation, adaptive difficulty selection, provenance, and content evidence.

The current presentation exposes a missing-Kanji choice interaction for Vocabulary/Context retrieval.

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
- 4 sampled Kanji per level where available
- 16-question target
- answer order shuffled from stable option IDs
- first source meaning remains the answer key for the diagnostic item
- suggested level checks N2→N5
- a level must reach 3/4 (75%) to qualify
- results expose boundary/limited-confidence conditions
- 4/4 at N2 exposes an explicit upper-range/N1 limitation

### Current validity status

The prior answer-position defect and tiny-sample threshold are no longer present in the current implementation. The remaining validity gap is empirical: there is no representative user/response dataset demonstrating placement stability across repeated retakes or difficult boundary populations.

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

The provenance distinction remains explicit and regression-covered. Grow curated coverage, prioritizing:

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
- Vocabulary/Context modality labels accurate to the actual cued-completion UI.
- No known implementation-level answer-position bias.
- Empirical placement-stability validation remains required.

### Content validity

- Learner-facing meaning layer is separated from raw dictionary glosses.
- Reading priority classification is documented in code.
- Representative example/context fixtures are regression-checked for target containment, translation presence, reading validity, duplication, and burden.
- High-risk ambiguous/synonym cases have regression fixtures.
- Independent human/content review of sampled material remains required before Public Beta.
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

## 18. Recommended remaining educational work

1. Empirical placement stability/bias validation.
2. Independent human/content QA for sampled high-risk meanings/readings/examples/context.
3. Curated mnemonic human review and curation expansion.
4. Broader learner-priority Vocabulary/Context QA as real content coverage grows.
5. Component-learning curriculum.
6. Grammar progression beyond primer.

The existing learning-engine architecture should be preserved while these content/validity improvements are implemented through its established boundaries.