# Rinemi — Educational Content & Learning Validity Audit

**Audit date:** 2026-10-07
**Audited implementation/verification candidate:** current `main` @ `f1f9e6066e24674254616ec90267f6562db9fa61`
**Base:** `main` @ `f1f9e6066e24674254616ec90267f6562db9fa61` (includes merged PR #475, the radical learning-aid change)
**Release-candidate note:** C4 is not marked DONE until the remaining psychometric/content-review gates are independently satisfied.
**Scope:** learner-facing educational quality, content validity, assessment validity, and alignment between product claims and actual learning behavior.

This document records the findings of the 2026-10-03 educational/content audit and the 2026-10-06 post-merge documentation reconciliation. It supplements `ROADMAP.md`; it does not replace the roadmap's implementation/status rules.

## 1. Executive finding

Rinemi has a strong educational architecture:

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
   - The placement implementation has been upgraded to a 20-item stratified N5–N2 blueprint with 5 items per band, a 4/5 provisional band threshold, learner-priority answer keys, new-item sampling per retake, and contiguous lower-to-upper band decisions. Empirical calibration and independent content review remain open release gates.
   - Boundary and upper-range conditions are surfaced explicitly, with N1 treated conservatively as outside the directly tested range.
   - The remaining blocker is empirical validation of placement stability/bias on representative answer patterns; the current regression suite is deterministic/contract-focused rather than a psychometric validation study.

2. **Representative human/content QA**
   - Learner-priority meanings/readings and deterministic example/context quality gates are now implemented.
   - The remaining Public Beta blocker is independent human/content review of sampled high-risk meanings, readings, examples, context sentences, and curated mnemonics, with the result recorded against the frozen release SHA.

### P1 — important content quality work

4. Learner-facing meanings now have a separate priority layer, but human review of high-risk/ambiguous entries is still required.
5. Readings now have core/reference treatment; vocabulary-supported reading prioritization still needs broader content QA.
6. Vocabulary examples have deterministic structural/pedagogical filtering, but still require sampled human review for usefulness, naturalness, learner stage, and pedagogical priority.
7. Context sentences have useful structural filters, but limited semantic/grammar difficulty modeling.
8. Curated mnemonics are materially stronger than generated scaffolds; 100% coverage is not equivalent to 100% mnemonic quality.
9. Component/radical structure now includes an explicit low-stakes learning cue: radicals are presented as optional visual memory aids, not prerequisites or independently scheduled skills. This improves teaching value without introducing a second scheduler; it still does not constitute a complete component-learning curriculum.
10. Handwriting grading is good geometric feedback, but should not be interpreted as a full measure of natural Japanese handwriting quality.
11. Reading Lab coverage metrics are useful navigation signals, but must not be interpreted as reading-comprehension proficiency.
12. Grammar Guide is a beginner primer, not yet a complete grammar-learning curriculum.
13. Adaptive planning is evidence-aware, but current architecture does not establish that adaptive planning itself produces better learning outcomes than a baseline.

## 3. Verification evidence — 2026-10-06

The C4 implementation was verified before merge at candidate head `917c40fd99edffbf806b9f426b487febdf5c67cb` and is now merged into `main` at `81957a6065c7b271a3a697e0f41fd25f8bb048d8`. The implementation changes are limited to the C4 educational-validity boundary: learner-priority content projection, independent Production Recall as the primary path, explicit assisted/revealed evidence semantics, placement uncertainty/ambiguity handling, deterministic example/context quality gates, and empirical answer-position-bias screening.

Focused runtime/contract checks cover:
- learner-content projection: primary/reference meanings, core/reference readings, ambiguity overrides, and duplicate/invalid example rejection;
- content-evidence semantics: non-independent/revealed attempts do not inflate independent practice/correct counters, while guided recovery remains isolated;
- production contract: typed independent Kanji production is the default path; reveal/self-report and hint-assisted production remain lower-evidence recovery paths;
- Vocabulary/Context modality labels reflect the actual cued-completion interactions;
- placement uses stable option IDs, documented uncertainty/upper-range handling, and the corrected deterministic seed mixer;
- mnemonic provenance remains explicit.

The final pre-merge React presentation workflow passed on run `37363072127`, with all 40 gates green, including build/typecheck, repository/unit coverage, Active Recall content, offline/PWA, accessibility, Firefox/WebKit, Learning Card, mnemonic, Review/Practice separation, and Production Recall keyboard gates. Earlier engine validation for the same runtime candidate was also successful. A later engine workflow was queued/cancelled by the Actions runner after that successful validation; it introduced no runtime changes.

### Updated placement assessment — 2026-10-09

The original 16-question / four-items-per-band placement screen is superseded by assessment v2. The current candidate uses 20 items (five per supported band), seed-based stratified sampling across each band's frequency-order range, four-option item contracts, learner-priority meaning keys, and a contiguous recommendation that does not skip a failed lower band.

The executable contract suite covers same-seed reproducibility, different retake samples, exactly one correct option and four unique labels per item, sparse-band behavior, missing-answer uncertainty, lower-band consistency, boundary scores, and N2 upper-range disclosure. The result uses `provisional`, `boundary`, or `limited`; it no longer labels an uncalibrated complete score as high confidence.

This is implementation-level validation only. It does **not** establish psychometric validity or real-user placement stability. Independent review of production item/distractor quality and representative repeated-attempt data remain required before Public Beta.

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

### Radical/component learning-aid decision — 2026-10-07

The Dictionary structure view now explicitly teaches the traditional radical as an **optional visual memory cue**. The learner is told to use the radical to notice recurring structure while not treating it as a prerequisite that must be memorized separately. Radical data remains reference/content infrastructure; no radical-specific learner state, Card ID, scheduler, or evidence stream was introduced.

The visual component breakdown remains the primary structural explanation. Radical classification is intentionally kept separate from visual decomposition because the two concepts are not interchangeable. A future radical/component curriculum would require independent educational validation before becoming a scheduled skill.

### Visual-structure correction — 2026-10-09

The structural breakdown has been separated from TopoKanji's learning-dependency graph. The new `kanji-visual-structure.json` snapshot contains KanjiVG `kvg:element` trees for all 2,136 Jōyō kanji. Repeated components and nested groups are preserved. SVG groups explicitly marked as parts of one component (`kvg:part`) are rejoined to avoid showing a fragmented glyph as duplicate components; their source part IDs remain in the data. `kvg:partial` and `kvg:original` metadata are preserved and partial forms are marked in the UI. The Learning Card and Dictionary both render this same canonical hierarchy. TopoKanji data remains only for the optional learning-dependency path, with its UI label explicitly stating that these links are learning cues rather than a literal decomposition. Prepared mnemonic scaffolds now receive direct visual children from the pinned KanjiVG tree, not TopoKanji's flattened dependency list.

The structural snapshot is pinned to KanjiVG commit `70a0b7ae0c18ceb5cb358274b029cce0234a43bc`, licensed CC BY-SA 3.0, and documented in `docs/KANJI-VISUAL-STRUCTURE.md`. The test contract checks all 2,136 roots, tree integrity, provenance, and known repeated/nested structures. The data-completeness contract does not by itself establish historical/etymological truth for every component; the product describes source-authored visual grouping, not character etymology.

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

## 10. Placement diagnostic audit — updated 2026-10-09

### Current assessment contract

The onboarding and standalone diagnostic use the shared placement assessment core:

- 20 items total: five each from N5, N4, N3, and N2.
- Items are sampled across five strata of each band's frequency-ranked pool; changing the persisted seed changes the selected Kanji as well as answer order.
- The seed and answer IDs persist together in onboarding progress so a reload resumes the same paper.
- A sparse band is not filled with an item assigned to a different band. Incomplete band/item coverage yields limited confidence.
- The correct option is built from the shared learner-priority meaning projection, not the raw first dictionary gloss.
- Each item must have four unique labels and exactly one answer key. Alternative target glosses and strongly overlapping glosses are excluded from the distractor pool.
- A band is provisionally demonstrated at 4/5 (80%).
- The suggested starting band moves upward from N5 only while each preceding band passes; performance in N2 cannot hide a lower-band gap.
- A complete result is called provisional, near-cutoff results (3/5 or 4/5) are marked boundary, and incomplete evidence is limited.
- Passing all bands through N2 produces an explicit note that N1 is outside the diagnostic range.

### What this assessment does and does not measure

The instrument currently measures recognition of selected English glosses for isolated Kanji. It does not assess overall Japanese proficiency, reading recall, vocabulary production, sentence comprehension, grammar, handwriting, or listening. JLPT labels are strata in the source data, not a certificate that the learner is at that JLPT level.

The 20-item / 4-of-5 cutoff is a practical onboarding heuristic, not an empirically validated psychometric decision rule. The source dataset's level tags, meaning ambiguity, and distractor plausibility still require independent review. Retake variation and code-level score contracts do not establish stability across real learners.

### Remaining release gate

Before Public Beta, freeze a production question-set sample against the release SHA; independently review correct glosses and distractor ambiguity; examine answer-position distribution across seeds using the shipped catalog; and collect repeated-attempt evidence to estimate recommendation stability. Keep all learner-facing copy explicit that this is only a provisional Kanji starting-point estimate.

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

Current component coverage is 2,100 / 2,136 (98.31%). Traditional-radical infrastructure covers the 2,136 Jōyō Kanji set and remains a reference/content layer.

### Current educational status — 2026-10-07

The first pedagogical step is now implemented on `main`: the Dictionary structure view explicitly presents the traditional radical as an **optional visual learning cue**. Learners are told to use it to notice recurring structure and support memory, without treating it as something that must be memorized separately.

This is intentionally a **learning-aid layer**, not a new learning domain:

- no radical-specific Card ID;
- no radical-specific learner state;
- no independent FSRS scheduling;
- no separate evidence stream;
- no prerequisite relationship for Kanji mastery;
- no claim that knowing a radical equals knowing the Kanji.

The visual component breakdown remains the primary structural explanation. Radical classification and visual decomposition remain separate concepts and should not be merged into one data model merely for convenience.

### What remains

A true component/radical curriculum would require an evidence-backed loop such as:

**teach → retrieve → apply in related Kanji → reinforce/recover**

Before introducing that loop, the product needs:

1. evidence that the current learning cue is useful to learners;
2. curated selection of which components/radicals are worth explicitly teaching;
3. clear educational distinction between traditional radicals and visually recurring components;
4. an explicit skill/evidence model only if a later curriculum justifies scheduled practice.

Therefore the current status is:

**Radical infrastructure: mature/reference-ready → Radical learning cue: implemented → Radical curriculum: not started / intentionally deferred.**

This remains a future educational enhancement, not a public-release blocker or reason to rewrite the existing decomposition boundary.

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

See `docs/C4-SAMPLE-CONTENT-QA.md` for the current sampled content-review record.

1. Empirical placement stability/bias validation for the 20-item stratified assessment.
2. Independent human/content QA for sampled high-risk meanings/readings/examples/context.
3. Curated mnemonic human review and curation expansion.
4. Broader learner-priority Vocabulary/Context QA as real content coverage grows.
5. Component-learning curriculum.
6. Grammar progression beyond primer.

The existing learning-engine architecture should be preserved while these content/validity improvements are implemented through its established boundaries.