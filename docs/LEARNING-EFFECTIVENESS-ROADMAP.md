# Rinemi — Learning Effectiveness & Transfer Roadmap

**Document date:** 2026-10-17  
**Source-inspection baseline:** `main` at `085524dc58547e33e42fcaff75784b0c6d3fe6b3`  
**Status:** proposed implementation roadmap; none of the recommendations below should be marked complete until verified on current `main`.  
**Relationship to existing plans:** This is a companion to the canonical `ROADMAP.md` and `docs/EDUCATIONAL-CONTENT-AUDIT.md`. It focuses on connecting existing learning capabilities into a coherent learner journey and evaluating transfer beyond isolated kanji. It does not replace release-status rules or supersede existing content-validity gates.

> **Change-isolation note:** created as a new document deliberately. Do not edit or reorder `ROADMAP.md`, `docs/EDUCATIONAL-CONTENT-AUDIT.md`, or other shared planning documents as part of this change. Add a cross-link to the canonical roadmap only during an explicitly coordinated documentation reconciliation.

## 1. Executive direction

Rinemi already has substantial learning infrastructure: a character-first Learning card; separate Practice exercises for Meaning, Reading, Production, Vocabulary, and Context; an evidence-aware learner model and adaptive planner; FSRS scheduling; Dictionary topic/mastery filtering; mnemonic and component support; handwriting guidance and geometric feedback; and a Reading Lab for text/audio work.

The next educational step is **not to add more isolated features**. It is to make these capabilities form an observable progression:

**Encode → retrieve → correct/discriminate → read words → understand sentences → read passages → verify later.**

The core open question is whether learners can use their knowledge without the prompts, choices, translations, or exact examples used while learning. Product capability, passing software tests, within-session accuracy, learner confidence, and long-term learning outcomes are different kinds of evidence and must be reported separately.

The main architectural constraint is unchanged:

- **FSRS owns scheduled card intervals and due dates.**
- **The v1.9 Learner Model owns learning-state estimates and evidence interpretation.**
- **The Adaptive Planner owns exercise/skill selection.**
- **Recovery and deterministic grading/evidence components own their respective behavior.**
- **React remains presentation-only; persistence and domain decisions stay behind existing engine/boundary seams.**
- No parallel scheduler, domain-specific interval logic, or broad persistence migration should be introduced to solve an instructional-design problem.

## 2. Baseline: verified capabilities versus unresolved outcomes

This baseline records source inspection, not a claim that all tests or live UI paths were executed. Recheck current `main` before implementing a task; open PRs, branch commits, historical audit SHAs, and test filenames are not proof that behavior is currently shipped.

| Area | Capability present in the inspected source | Remaining educational question |
|---|---|---|
| Learning card | Character-first front; reveal; learner-priority meanings/readings; structure, examples, mnemonic, and stroke-order pages | Does the learner know exactly what to retrieve before revealing, and is unaided retrieval distinguishable from looking at the answer? |
| Practice | Five learning attributes; typed production path; cued tasks; explicit introduction stages for Vocabulary/Context; outcome and modality semantics | Does the sequence progress reliably from supported practice to independent retrieval and transfer? |
| Learner model/planner | Tracks per-skill evidence, recent outcomes, uncertainty, weakness, and recovery signals to guide exercise selection | Do its recommendations improve delayed outcomes over a reasonable baseline, or only change task order? |
| FSRS/review queue | FSRS remains the scheduling authority; due reviews are ordered with educational priority signals; new cards respect the configured daily-new allowance | Can a returning learner resume when overdue reviews and ordinary new-card introduction compete for attention? |
| Dictionary | Topic/mastery filtering and detailed kanji views with vocabulary, structure, mnemonic, and handwriting support | Does browsing lead to targeted retrieval and later demonstrated skill, rather than passive inspection? |
| Mnemonics | Curated and generated/scaffolded content, provenance, personal notes, and staged support | Are the aids distinctive, accurate, useful, and eventually unnecessary for retrieval? |
| Handwriting | Stroke-order reference, progressive hints, stroke-path drawing, component metrics, and per-kanji handwriting signals | How well do geometric scores correspond to human-rated legibility/order, and are handwriting signals kept distinct from reading knowledge? |
| Reading Lab | Imported/entered text, sentence navigation, speech/audio/subtitles, word lookup, kanji focus, and local session restoration | Can a learner select appropriately difficult content, demonstrate comprehension before translation, and progress toward less-supported reading? |
| Evaluation | Versioned evidence and evaluation infrastructure exist | Is there enough prospective, delayed, independent evidence to justify claims about retention or reading transfer? |

### Existing references to preserve

- `ROADMAP.md` is the canonical product/engineering/release roadmap and defines architecture/status guardrails.
- `docs/EDUCATIONAL-CONTENT-AUDIT.md` contains the fuller audit of content validity, placement, learner-content prioritization, vocabulary/context quality, mnemonics, components/radicals, and handwriting interpretation.
- `V1.9-ROADMAP.md`, `v1.9-curriculum-policy.js`, and the v1.9 learner-model, planner, recovery, evidence, and evaluation modules provide relevant implementation context. The existence of a curriculum-stage helper is not evidence that a complete learner-facing cross-feature curriculum is orchestrated.
- Current presentation entry points include `frontend/src/app/App.tsx`, `PracticeHome.tsx`, `DictionaryPage.tsx`, `DictionaryKanjiCard.tsx`, `ReadingLab.tsx`, and `HandwritingPractice.tsx`. Confirm current content and interactions at the latest HEAD before patching.

## 3. Intended learning sequence

Use this as the instructional-design target, not as a mandate to add a new scheduler or force every learner into handwriting.

### Stage A — Encode a useful first representation

For a new kanji, emphasize its form, one or two useful meanings, a small number of high-value example words, and trustworthy structural support. Keep secondary/reference meanings and less useful readings available without treating every dictionary gloss as an equally important beginner target.

**Exit evidence:** learner has seen a clear explanation. Exposure alone is not mastery or independent retrieval.

### Stage B — Attempt retrieval before answer exposure

Every retrieval task should state the target: recall a meaning, retrieve a known word’s reading, produce a character, or interpret a sentence. The learner attempts an answer before seeing the correction. Distinguish independent typed/free recall, cued completion/choice, hint-assisted work, revealed self-report, and recovery attempts in evidence.

**Exit evidence:** a correctly classified outcome for the intended task and modality. A reveal/self-report must not be counted as independent recall.

### Stage C — Correct and discriminate

When an error recurs, give a concise correction and, where supported by evidence, contrast the target with likely confusable characters or meanings. Follow feedback with another attempt. Do not automatically interleave every new character pair before the learner has formed a basic representation.

**Exit evidence:** fewer errors on the relevant contrast, preferably on a later attempt that does not repeat the exact prompt.

### Stage D — Learn kanji through words

Prioritize useful word-level examples that establish form, reading, and meaning together. Progress from exposure, to cued completion, to retrieving the reading/meaning without options when appropriate. Do not require memorization of every dictionary reading before a learner can use the kanji.

**Exit evidence:** independently read and interpret a practiced word, with the modality recorded. Then test transfer to an unpracticed word where the data and learner level allow it.

### Stage E — Understand sentences, then passages

Start with short controlled sentences that use mostly familiar vocabulary and grammar. Ask a comprehension question before revealing a translation. Offer optional word/grammar supports, then reduce scaffolding over time. Move to short connected passages and finally learner-chosen/authentic text. Keep free text/subtitle import as a workspace; the guided route is an additional path, not a replacement.

**Exit evidence:** comprehension of a sentence/passage before translation, plus performance on a different but comparable text. Kanji coverage and lookup counts are supporting navigation signals, not comprehension scores.

### Stage F — Offer writing practice according to need

Where production is a learner goal or a known weakness, use stroke-order demonstration followed by progressive hints and independent writing. Preserve a way to request more help. Keep handwriting evidence separate from the five existing learning attributes unless a future evidence-backed product decision explicitly extends the model.

**Exit evidence:** adequate drawing/grader reliability plus validated stroke-pattern performance. Do not describe geometric similarity alone as general writing proficiency.

### Stage G — Maintain and verify after delay

Let FSRS schedule the scheduled kanji card. Let the Learner Model and Adaptive Planner determine which educational task/skill to practice next. Use later independent tasks and new reading material to verify retention/transfer; do not infer it from an immediate retry or a streak.

**Exit evidence:** outcome measured after a predeclared delay, under a defined modality, and reported with sample size/uncertainty. Only verified evidence can support the term “retention verified.”

## 4. Prioritized implementation roadmap

Priority is the recommended execution order, not a declaration that an item is currently a release blocker. Each phase needs a separate, focused patch and current-main verification.

### LE-0 — Preserve evidence semantics and define outcome metrics (P0; before educational claims)

**Problem.** Existing evidence infrastructure distinguishes several modes and outcome types, but dashboards or future features can still accidentally treat cue-assisted performance, immediate correction, and delayed independent recall as interchangeable.

**Recommendation.** Define a concise metric contract for every new learning experiment: skill/target, stable content/task identity, modality, independent versus cued/revealed/recovery status, correctness/outcome, hint/reveal usage, and relevant grader/evidence version. Avoid persisting raw free text unless required. Use existing evidence seams where possible rather than inventing a second event store.

- **Mechanism:** separates what the learner can retrieve independently from what can be recognized or recovered with support.
- **Expected benefit:** interpretable learner-state estimates and trustworthy experiment results.
- **Limitations:** instrumentation cannot by itself prove learning; missing or biased observations can misrepresent the learner.
- **Implementation:** audit current evidence fields and consumers first; extend the existing contract minimally; preserve backwards compatibility and offline-first behavior.
- **Evaluation/acceptance:** contract tests demonstrate that revealed self-report, cued answers, incorrect answers, and recovery retries do not inflate independent-attempt counts; old stored evidence still reads safely; evaluator labels immediate accuracy separately from delayed retention and transfer.

### LE-1 — Make the Learning-card retrieval target explicit (P0)

**Problem.** The character-first card and its four-page back are useful, but the front does not necessarily specify one consistent retrieval goal. Browsing a rich answer surface can feel like learning without establishing what was recalled.

**Recommendation.** Use short target-specific pre-reveal copy and keep the back-page priority: kanji → primary meaning/core readings → high-value vocabulary → structure → optional mnemonic/stroke order. Preserve reference information and personal notes; do not remove useful data. Do not force handwriting or every reading into each review.

- **Mechanism:** a clear prompt cues a deliberate retrieval attempt rather than undirected inspection.
- **Expected benefit:** fewer ambiguous review actions and a more predictable first-use experience.
- **Limitations:** a reminder to retrieve does not independently establish recall; too many task choices increase friction.
- **Implementation:** presentation/copy refinement first; any answer capture must use existing engine boundaries and record evidence semantics without taking authority over FSRS ratings.
- **Evaluation:** first-session usability test (can learners state what to do?), pre-reveal attempt rate where reliably measurable, session duration, and delayed unaided recall compared with a control version. Keep scheduler settings unchanged in the comparison.

### LE-2 — Build a word-level reading progression (P0)

**Problem.** Isolated on’yomi/kun’yomi lists cannot fully represent contextual Japanese readings. Showing readings and example words together is not the same as deliberately teaching the word’s pronunciation and meaning.

**Recommendation.** Link a small number of useful words to the target kanji and progress from explanation to cued completion and then independent word-reading/meaning retrieval. Keep core readings and vocabulary-supported readings distinct from reference readings. Continue to label the true modality: a four-option selection is not free recall or full production.

- **Mechanism:** binds written form, sound, and lexical meaning in the unit learners encounter in real text.
- **Expected benefit:** more usable reading knowledge and a measurable bridge between kanji knowledge and lexical access.
- **Limitations:** success on studied words can reflect memorization; one word does not establish generalization to unfamiliar words.
- **Implementation:** improve word-example selection/quality and existing Vocabulary exercise progression; stable content IDs and grader/accepted-answer rules must be deterministic and test-backed.
- **Evaluation:** independently retrieved reading and meaning for trained words; separate transfer test for new words; delayed checks. Report selected-option results separately from typed/free recall.

### LE-3 — Add a guided Reading Lab pathway (P0)

**Problem.** Reading Lab supports personal text/audio workflows and word lookup, but user-imported text may have no exact translation match, and a string of individually supported sentences is not equivalent to comprehension of connected reading.

**Recommendation.** Add an optional progression of controlled sentence → comprehension attempt → on-demand word/grammar support → short passage → less-supported/authentic text. Ask the learner to answer before revealing a translation. Clearly distinguish sourced/verified translations from missing support; do not invent or silently auto-generate authoritative translations. Retain the existing import/subtitle workflow.

- **Mechanism:** requires semantic integration and gradually transfers responsibility from the tool to the reader.
- **Expected benefit:** a pathway from known kanji/vocabulary to reading comprehension and fluency practice.
- **Limitations:** text difficulty depends on grammar, morphology, background knowledge, genre, and vocabulary; a rough unknown-word estimate is not a validated reading level.
- **Implementation:** source or license a small starter set of leveled Japanese texts/sentences with reviewed translations and questions; improve lexical matching/tokenization where feasible; create a clear fallback for unsupported content; integrate existing kanji/word details without requiring every word to be looked up.
- **Evaluation:** comprehension-before-translation accuracy, time, lookup burden, and performance on new matched sentences/passages. Track text coverage as a diagnostic only; do not present it as proficiency.

### LE-4 — Diagnose and practice confusable kanji (P1)

**Problem.** Component decomposition and radical information support noticing structure, but they do not by themselves identify and repair a learner’s individual confusion patterns.

**Recommendation.** Begin with a small, reviewed list of high-value visual/semantic contrasts. Record relevant wrong-answer confusion where confidently identifiable; offer a short contrast explanation and later mixed discrimination. Use contrasts when evidence indicates a problem, not as a universal mandatory module for every kanji.

- **Mechanism:** directs attention to differentiating features; interleaving can improve discrimination for some confusable categories, but it may make initial acquisition feel harder.
- **Expected benefit:** reduced recurrent confusions and more accurate character recognition in words.
- **Limitations:** automatic similarity lists can be misleading; semantic interference is not the same as visual similarity; pairwise success may not transfer to running text.
- **Implementation:** human-reviewed contrast metadata, a deterministic contrast task/grader, and an error taxonomy connected through existing evidence/planner seams. No new scheduler or independent skill interval.
- **Evaluation:** pair-specific confusion errors before and after, delayed mixed-pair test, and the same characters embedded in words. Check that improvements are not limited to memorized side-by-side layouts.

### LE-5 — Improve mnemonic specificity and hint fading (P1)

**Problem.** Full mnemonic/scaffold coverage is not equivalent to full coverage of quality, tested stories. A generic instruction to imagine a scene may be scaffolding rather than a distinctive character-specific mnemonic.

**Recommendation.** Keep curated, generated/scaffolded, and personal content labels. Prioritize human-authored/verified aids for high-frequency, visually deceptive, frequently confused, or irregular-reading items. Reveal a useful cue after the attempt or corrective feedback, and allow the learner to proceed with fewer hints later.

- **Mechanism:** a specific mnemonic can add a retrieval route from visual form to meaning; fading cues tests whether retrieval becomes independent.
- **Expected benefit:** better support for difficult items without turning every card into a long story.
- **Limitations:** aids can be false, distracting, culturally opaque, or memorable without helping recall. Mnemonics must not be framed as factual etymology unless sourced as such.
- **Implementation:** retain provenance; add focused human QA and learner-stage guidance; do not automatically use generated prose as proof of learning.
- **Evaluation:** blinded quality review for sampled aids, delayed unaided meaning recall, time-on-task, and hint dependence. Compare a manageable sampled cohort rather than claiming benefit from coverage alone.

### LE-6 — Add missed-day workload recovery without rescheduling (P1)

**Problem.** Due reviews and new-card introductions can compete for time after absence. A normal new-card allowance may be unrealistic for a learner facing a large backlog.

**Recommendation.** Show due backlog and realistic session options; offer a temporary reduction/pause in new introductions and short resumable sessions. Do not erase overdue cards, silently move due dates, rewrite card state, or create an alternative interval algorithm.

- **Mechanism:** lowers the perceived re-entry cost and makes the remaining workload visible and manageable.
- **Expected benefit:** more successful returns after gaps and clearer trade-offs between catch-up and new content.
- **Limitations:** a shorter session does not eliminate overdue reviews; lower new-card volume slows curriculum coverage; a streak recovery mechanic is not a retention intervention.
- **Implementation:** presentation and session-budget policy only, using current queue/card states and settings. FSRS remains authoritative for interval and due-date decisions; planner may select task type but not scheduling time.
- **Evaluation:** return rate after inactivity, completion of available due reviews, backlog trend, session duration, new-card throughput, and unchanged scheduling authority. Avoid judging success using streak alone.

### LE-7 — Validate handwriting feedback as a separate skill (P2; bounded scope)

**Problem.** Current geometric stroke feedback is actionable but cannot fully judge human legibility, natural style, or whether a learner can read kanji.

**Recommendation.** Preserve progressive hints (trace/ghost/stroke guide/minimal/recall) and let learners request help. Treat geometric similarity and stroke-order adherence as narrow signals. Do not make handwriting compulsory for a reading-first learner or let its score directly change FSRS intervals.

- **Mechanism:** active production and faded motor/visual guidance support the ability to write a character.
- **Expected benefit:** more useful practice for learners whose goals include handwriting and better calibrated feedback.
- **Limitations:** touch/stylus input, device size, stroke capture, and valid stylistic variation affect grading.
- **Implementation:** test on representative characters/devices; suppress low-reliability feedback; retain the separation between handwriting skill data and scheduled kanji cards.
- **Evaluation:** compare grader output with human ratings for a representative sample; measure delayed writing and stroke-order performance independently from recognition and reading.

### LE-8 — Prospectively evaluate learning and transfer (P0 for claims; incremental research work)

**Problem.** Contracts, UI E2E tests, and immediate correct rates validate different things. They do not establish month-scale retention, reading comprehension, or that adaptive selection outperforms a baseline.

**Recommendation.** Predefine at least one primary delayed outcome for each experiment and a simple comparison. Preserve identical FSRS configuration and content exposure where possible when comparing presentation or practice-policy changes. Use sufficient observations and report limitations. Do not silently auto-tune planner parameters as part of evaluation.

- **Mechanism:** delayed, independent, unfamiliar-item tests distinguish immediate performance from retained and transferable knowledge.
- **Expected benefit:** evidence to prioritize product work and make proportionate educational claims.
- **Limitations:** attrition, selection bias, repeated-test effects, learner differences, and small samples can overwhelm apparent differences. A short pilot is not evidence of month-scale benefit.
- **Implementation:** use existing versioned evidence/evaluator where suitable; record content/task and modality; add controlled feature/policy assignment only when the design is approved; minimize personal data.
- **Evaluation:** predefine cohort, denominator, exclusion criteria, test interval, and comparison; report confidence intervals or otherwise make uncertainty explicit. Include one-day/one-week and (when feasible) one-month outcomes plus transfer to unfamiliar words/passages. Keep source-level software QA separate from a learner study.

## 5. Global educational evaluation contract

For each phase/experiment, document these fields before implementation:

1. **Target skill/outcome:** precisely what the learner should be able to do.
2. **Task/modality:** free recall, typed response, cued completion, multiple choice, revealed self-report, handwriting, or reading comprehension.
3. **Content scope:** trained versus unseen/unpracticed content and stable content identity.
4. **Support level:** answer choices, hint, translation, stroke guide, and whether the answer was revealed.
5. **Immediate measures:** accuracy/outcome type, response time when valid, retries/recovery, and task completion.
6. **Delayed/transfer measures:** the planned delay, independent condition, and unfamiliar items/text where applicable.
7. **Safety/quality checks:** accepted-answer correctness, content provenance, human review sample, accessibility, offline behavior, and data minimization.
8. **Decision rule:** what result would justify shipping, revising, or rolling back the change; include uncertainty and sample-size limitations.

Never collapse the following pairs into one reported “mastery” number: recognition vs independent recall; studied-word vs unseen-word reading; sentence lookup vs comprehension; immediate retry vs delayed recall; handwriting similarity vs reading skill; session completion vs long-term retention.

## 6. Definition of done for this roadmap

A phase is complete only when all applicable conditions are true on a freshly inspected current `main`:

- The educational target and the intended mechanism are written down.
- Learning-engine ownership, card identity, evidence semantics, offline-first behavior, and FSRS authority are preserved.
- User-facing behavior and failure states work on desktop/mobile and in supported English/Persian layouts.
- Deterministic unit/contract and focused E2E tests are added or updated.
- Content/distractor/mnemonic/translation quality has human review when algorithmic checks cannot establish it.
- Relevant evidence is actually instrumented and interpreted correctly.
- Delayed retention/transfer claims remain explicitly unverified until appropriate learner data exists.
- The exact implementation, tests, and source state are verified on current `main`; open PRs or old workflow results are not counted as shipped.

### Suggested test families to inspect before each patch

Inspect current code/tests rather than assuming names or contracts have remained unchanged:

- Learning card / reveal / active recall: `e2e/react-learning-card-flip.spec.mjs`, `e2e/react-active-recall-content.spec.mjs`, `e2e/react-production-recall-keyboard.spec.mjs`.
- Review, planner, recovery, and evaluation: `e2e/react-review-practice.spec.mjs`, `e2e/v1.9-p1-learner-model.spec.mjs`, `e2e/v1.9-p2-adaptive-planner.spec.mjs`, `e2e/v1.9-p3-recovery.spec.mjs`, `e2e/v1.9-p4-learning-evaluation.spec.mjs`.
- Mnemonic, Dictionary, Reading Lab, and handwriting: `e2e/react-mnemonic-support.spec.mjs`, `e2e/react-topic-learning.spec.mjs`, existing Dictionary/Reading Lab and handwriting unit/E2E tests.
- Release/architecture: `e2e/react-engine-boundary-gate.spec.mjs`, `e2e/react-presentation-offline.spec.mjs`, current release-integrity and architecture-boundary checks.

Tests are starting points, not evidence that a target learning outcome has already been measured.

## 7. Research basis and interpretation limits

These sources motivate mechanisms and evaluation discipline; they do not prove that a specific Rinemi feature is effective:

- Roediger, H. L., & Karpicke, J. D. (2006). “Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention.” *Psychological Science*, 17(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x — testing effects in prose-learning experiments; do not extrapolate effect sizes directly to kanji practice.
- Cepeda, N. J., et al. (2006). “Distributed Practice in Verbal Recall Tasks: A Review and Quantitative Synthesis.” *Psychological Bulletin*, 132(3), 354–380. https://doi.org/10.1037/0033-2909.132.3.354 — spacing and retention interval interact; supports spaced practice, not replacing FSRS with custom interval rules.
- Dunlosky, J., et al. (2013). “Improving Students’ Learning With Effective Learning Techniques.” *Psychological Science in the Public Interest*, 14(1), 4–58. https://doi.org/10.1177/1529100612453266 — review of learning techniques and their evidence; application to Rinemi still needs testing.
- “An examination of the utility of the Aozora Repository to support reading comprehension development, reading fluency, and extensive reading for L2 learners of Japanese.” *System* (2025). https://doi.org/10.1016/j.system.2024.103564 — discusses graded resources and vocabulary coverage in Japanese L2 extensive reading; coverage estimates should guide text selection, not act as comprehension scores.
- “Tailoring interleaved practice: Does adaptive sequencing boost the interleaving effect?” *Learning and Individual Differences* (2025). https://doi.org/10.1016/j.lindif.2025.102804 — supports cautious experimentation with confusable-category practice and warns against assuming that adaptive interleaving necessarily outperforms a simpler alternative.

## 8. Instructions for future Rinemi audits and implementation

When asked to continue this work:

1. Inspect the **actual latest `main` HEAD** and the current canonical `ROADMAP.md`; do not rely on the SHAs or statuses in this document as current implementation evidence.
2. Read this roadmap alongside `docs/EDUCATIONAL-CONTENT-AUDIT.md` and `ARCHITECTURE.md` to avoid duplicating or contradicting existing content-validity and architecture decisions.
3. Check open PRs and changed files before touching shared files. Prefer one narrowly scoped implementation branch/PR. Do not edit shared roadmap/audit documents that another workstream is actively changing; add an isolated new file or coordinate the edit.
4. Select the highest-priority incomplete item, inspect its actual UI/runtime/data/test paths, and state a measurable acceptance criterion before coding.
5. Keep FSRS interval/due-date authority untouched unless a separately verified scheduler defect is demonstrated. Educational task selection, hinting, presentation, and evidence must use existing authoritative seams.
6. Do not describe proposed features as shipped, tests as learner evidence, immediate accuracy as retention, or coverage/streaks as proficiency.
