# Kanji5 Learning-Engine Audit — 2026-10-03

## Audit baseline

- Repository: `ArdKam/kanji5`
- Baseline: `main` at `940224fad0fe50c82bb03e7064dd1909ad9d6e4c`
- Focus: learning engine, not React visual design
- Status: architecture review + code-path review; this document records actionable findings and does not claim live-user efficacy

## Executive finding

Kanji5 already has a substantially structured learning engine: FSRS scheduling authority, a five-skill learner model, adaptive planning, bounded recovery, deterministic grading/evidence, persistence/migration seams, and offline-first behavior. The central weakness is not the software architecture; it is the **learning model's integration**.

The current system has two partially separate notions of learning:

1. **FSRS card memory** — scheduled review state/retrievability.
2. **Educational skill evidence** — Meaning, Reading, Production, Vocabulary, and Context performance.

The second layer is currently much closer to a performance/accuracy model than a fully time-aware memory model. A mature future engine should explicitly relate these layers instead of letting them optimize independently.

## Findings

### E1 — Card memory and attribute memory are only partially integrated (P0)

The scheduling boundary correctly keeps FSRS as authority. The Learner Model, however, derives mastery largely from attempts, accuracy, recency/momentum, error streaks, and confidence. Its semantic skill state currently leaves retention unverified.

**Risk:** a skill can look strong because of repeated recent success even when long-term retrievability is uncertain; conversely, a card can be scheduled far into the future while one attribute remains weak.

**Required direction:** preserve FSRS as the card scheduler, but define how retrievability and attribute-level evidence interact in prioritization. Do not create a second SRS.

### E2 — Global streak aggregation can be semantically wrong (P0)

The aggregate learner model can derive success/error streak information from the latest state of multiple Kanji sorted by their timestamps. A streak is an ordered sequence of learner events, not a set of latest per-Kanji states.

**Risk:** cross-card aggregation can fabricate a success/error streak that never occurred in the actual event stream, affecting planner state.

**Required direction:** derive global streaks from chronological events/session history and keep per-Kanji streaks separate.

### E3 — Production Recall is not consistently free production (P0)

The current learner-facing Production path can use meaning → “select the matching Kanji” recognition, while the project also contains a deterministic production grader. Recognition and free production are different retrieval demands.

**Risk:** the product can overstate productive mastery.

**Required direction:** provide a true free-production mode (type and/or handwriting) and record its modality explicitly. Keep recognition as recognition.

### E4 — Planner and item selector optimize separately (P0)

Adaptive Planner chooses among skills; the education/item selector separately ranks Kanji/content. There is no single explicit objective over the combined `Kanji × skill × content × spacing` choice.

**Risk:** the selected skill can be educationally appropriate while the selected item is poorly matched to that intervention (or vice versa).

**Required direction:** introduce a deterministic combined decision layer or an explicit contract between the two optimizers; avoid duplicated hidden heuristics.

### E5 — Mastery is still predominantly accuracy-derived (P1)

Mastery/state thresholds are built around attempts, accuracy, confidence, recent accuracy, momentum, and error streaks. This is useful learner evidence but not equivalent to a calibrated memory-strength estimate.

**Required direction:** make time since successful retrieval/retrievability a first-class input and validate it against delayed outcomes.

### E6 — Evidence collection is ahead of evidence utilization (P1)

Evidence records already preserve modality, response time, attempt type, independence/recovery semantics, task identity, grader version, and related metadata. The core planner/model does not yet exploit all of these signals materially.

**Required direction:** progressively use response time, modality and delayed outcomes, with evidence sufficiency guards to avoid overfitting sparse data.

### E7 — Vocabulary/Context grading is deterministic but exactness-heavy (P1)

Vocabulary and Context graders currently normalize input and then require an exact normalized match. Determinism is a strength, but exactness can produce educational false negatives when multiple explicitly valid forms exist.

**Required direction:** retain deterministic grading, but move accepted alternatives/normalization rules into auditable answer sets rather than fuzzy external grading.

### E8 — Content difficulty remains heuristic (P1)

Current content selection uses deterministic features such as text/word length and number of other Kanji as difficulty priors. These are useful fallback signals but are not yet calibrated to individual learners.

**Required direction:** preserve deterministic priors while adding learner-calibrated difficulty from observed outcomes.

### E9 — Evaluation infrastructure exists but efficacy evidence is not yet established (P1)

Kanji5 already has deterministic adaptive-vs-baseline evaluation and evidence-sufficiency guards. This establishes measurement infrastructure, not proof of learning advantage.

**Required direction:** evaluate delayed retention, time-to-stability, review cost, recovery, and cross-modal transfer once enough real-user data exists. Do not infer efficacy from immediate session accuracy alone.

### E10 — Curriculum dependency graph should become stronger (P2)

The product has begun building radical/component relationships. Mature Kanji curricula can exploit explicit dependencies among radicals/components, Kanji, and vocabulary.

**Required direction:** encode pedagogical prerequisites explicitly where they are justified, without turning them into a second scheduler.

### E11 — Cross-vector scheduling can learn from mature tools (P2)

Renshuu demonstrates the usefulness of tracking question vectors separately. WaniKani demonstrates strong prerequisite/stage relationships. Anki demonstrates deep FSRS/scheduler calibration.

**Required direction:** use these as comparative design references, not architecture authorities. Kanji5 should preserve its own five-skill model and deterministic offline behavior.

## Competitive reference frame

### Anki / FSRS

Relevant strengths to study:

- explicit desired retention/retrievability concepts;
- review ordering tied to scheduling state;
- optimizer/simulation tooling;
- mature learning/relearning semantics.

Kanji5 currently has FSRS authority and good scheduling seams, but its adaptive learner model is not yet as tightly calibrated to time-dependent retention.

### WaniKani

Relevant strengths to study:

- explicit Radical → Kanji → Vocabulary curriculum dependency;
- well-defined progression stages;
- predictable stage-based progression.

Kanji5's five-skill adaptive model is richer in attribute dimensions, but its curriculum dependency graph is still less explicit.

### Renshuu

Relevant strengths to study:

- multiple question/skill vectors for the same learning item;
- cross-vector practice behavior;
- flexible exercise types.

Kanji5 already has the architectural basis for separate skill evidence, but should improve cross-vector scheduling semantics and avoid counting cue-heavy recognition as equivalent to free recall.

## Priority decision

The engine should **not** be rewritten. The recommended direction is:

`FSRS card memory`
`+`
`attribute-level evidence`
`+`
`delayed-retention signals`
`+`
`explicit combined selection objective`
`→ deterministic adaptive intervention`

The near-term goal is therefore **integration and calibration**, not architectural replacement.

## Required regression/acceptance tests

Future engine changes should add or maintain tests for:

1. chronologically correct global streaks;
2. distinction between recognition, free recall, guided recovery, and revealed self-report evidence;
3. FSRS remaining the sole scheduling authority;
4. deterministic planner output for identical snapshots;
5. delayed-review behavior where applicable;
6. accepted-answer sets for content with documented alternatives;
7. migration of existing evidence without semantic loss;
8. offline execution of core grading/planning paths;
9. learner-model/planner changes not mutating persistence unexpectedly;
10. cross-layer E2E behavior from exercise → outcome → evidence → learner model → planner.

## Non-goals

This audit does not call for:

- replacing FSRS;
- introducing a Vocabulary/Context-specific scheduler;
- moving business logic into React;
- replacing the current v1.9 learner-model architecture wholesale;
- importing another product's algorithm as-is;
- blocking the public Kanji release on a research-grade adaptive overhaul.