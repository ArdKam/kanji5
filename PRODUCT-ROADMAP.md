# Kanji5 Product & Engineering Roadmap

> This roadmap is the active planning source for work after the v1.9 learning-engine closeout. It complements `V1.9-ROADMAP.md`: v1.9 P0–P7 are complete; this document defines the remaining product hardening and the staged path from a polished Kanji foundation to Vocabulary and Grammar.

## 0. Current baseline

- v1.9 learning-engine P0–P7: complete on `main`.
- FSRS remains authoritative for card scheduling.
- Learner Model 2.0, Adaptive Planner 3.0, Recovery, Evaluation, persistence, and offline runtime remain authoritative engine concerns.
- React is presentation-only and consumes the v1.9/v2 boundary contracts.
- Do not reopen or rewrite the learning engine unless a verified defect requires it.
- Every feature must preserve deterministic/offline behavior and existing persistence compatibility.

## 1. Phase A — Finish the Kanji foundation

### A1. Release/runtime integrity
- Verify the active React asset graph is fully represented by the Vite manifest and service-worker precache path.
- Verify cold-start and repeat-start offline behavior.
- Verify deployment-generated artifacts are not committed as source.
- Recheck production cache invalidation and stale-client recovery.
- Measure startup performance on representative mobile conditions; track LCP, INP, CLS and long-task causes.
- Treat missing assets, font failures, dynamic-import failures, and offline regressions as release blockers.

### A2. Learning surface
- Keep Learning and Active Recall conceptually separate.
- Keep Learning Card hierarchy focused: meaning/readings, examples, mnemonic, stroke order.
- Make the four card pages real, keyboard-accessible controls with reliable swipe/next/previous behavior.
- Keep rating/feedback in normal document flow and above the fixed navigation clearance.
- Prevent answer/reveal UI from being clipped on mobile and while the keyboard is open.
- Keep session feedback compact; do not restore analytics-heavy Session Details to the Learning page.

### A3. Stats correctness and information architecture
- Treat persisted learner exposure as the source of truth for seen/unseen counts.
- Treat learner-model states as the source for mastery buckets.
- Ensure studied count, mastery distribution, skill percentages, recent activity, and session aggregates reconcile with the authoritative model.
- Ensure first-open stats hydrate the learner model when needed.
- Refresh stats when the underlying snapshot changes rather than leaving an open dialog stale.
- Keep the primary Stats surface simple.
- Add Advanced Stats only as a secondary/explicit layer.
- Advanced Stats should expose evidence, retention/recovery, attribute coverage, mode distribution and trend without turning Stats into a dashboard maze.
- Never recompute authoritative learning state inside React.

### A4. Reading Lab
- Preserve entered text, scroll position, selected words and analysis state while inspecting dictionary entries.
- Dictionary lookup must be an in-place auxiliary action, not a destructive navigation away from Reading Lab.
- Preserve progress when returning from a lookup.
- Keep Focus Next, Next Unfamiliar, unique coverage and occurrence-weighted coverage understandable.
- Provide a bounded hardest-sentence focus action using authoritative mastery buckets.
- Do not mutate SRS, grading or learner state from Reading Lab analysis.

### A5. Dictionary
- Make mobile Kanji tabs fit without horizontal overflow at 360/375/390px.
- Preserve personal-mnemonic drafts across tab/dialog remounts and async loads.
- Keep lookup and navigation state predictable.
- Separate factual dictionary content from learner-state indicators.
- Avoid excessive density; prioritize readings, meaning, examples and stroke information.

### A6. Settings
- Keep active-learning exercise toggles authoritative and test-backed.
- Verify Production, Vocabulary and Context toggles reach the Active Recall engine.
- Keep Save Changes stable rather than moving with page scroll.
- Remove duplicate or confusing placement-test entry points.
- Decide and document the canonical home for Personal Mnemonics.
- Provide Data Backup/Restore with deterministic, safe semantics.
- Keep destructive/reset actions secondary and clearly separated without alarming primary UI.
- Verify settings persist and survive reload/offline operation.

### A7. Mnemonics / memory aids
- Clearly explain the difference between curated prepared mnemonics, guided scaffolds and personal mnemonics.
- Ensure the actual mnemonic content renders reliably.
- Show provenance/type labels where necessary so generated scaffolds are not mistaken for curated mnemonics.
- Keep mnemonic disclosure adaptive and compact.
- Preserve personal mnemonic editing and persistence.
- Audit coverage and quality; 100% coverage does not imply 100% quality.

### A8. Responsive/accessibility polish
- Audit 360, 375, 390px mobile widths plus tablet and desktop.
- Verify fixed bottom navigation and safe-area clearance.
- Verify menus/dialogs, keyboard focus, live regions, touch targets and reduced motion.
- Remove layout hacks and broad `!important` overrides when they are no longer necessary.
- Ensure secondary pages do not inherit inappropriate Learning-only controls.

## 2. Phase B — Measurement and product evidence

### B1. Core Stats
- Make primary metrics internally consistent and explainable.
- Distinguish exposure, attempts, cards, mastery and completion.
- Label insufficient evidence instead of presenting misleading percentages.

### B2. Advanced Stats
- Add an explicit Advanced Stats section rather than increasing the complexity of the main Stats view.
- Include:
  - attribute accuracy and attempt count
  - recent vs lifetime performance
  - recovery rate
  - repeated-failure signal
  - retention/progression where evidence exists
  - attribute coverage
  - mode distribution
  - session completion and average recalls
- Keep evidence thresholds visible where interpretation could be unstable.
- Keep evaluation read-only.

### B3. Learning efficacy
- Use the existing deterministic evaluation layer to distinguish product/runtime defects from learning outcomes.
- Track whether adaptive choices produce measurable recovery, retention and attribute coverage improvements.
- Do not automatically tune planner parameters from these metrics.

## 3. Phase C — Content quality

### C1. Kanji/mnemonic quality
- Audit generated mnemonics for semantic usefulness, reading relevance and ambiguity.
- Maintain curated entries separately from generated/guided material.
- Build quality checks for missing, malformed or low-information entries.

### C2. Vocabulary quality
- Validate readings, forms, duplicates, empty examples and unsuitable entries.
- Preserve provenance/version where needed.
- Define deterministic fallback selection.
- Treat external APIs as content providers, never learning authorities.

### C3. Context quality
- Validate Japanese sentence, translation and target-kanji placement.
- Detect malformed or empty context.
- Preserve Tatoeba/API cache and offline fallback behavior.

## 4. Phase D — Cross-domain foundation

Before expanding Vocabulary and Grammar, establish shared contracts.

### D1. Canonical identity
- Define stable Content IDs for Kanji, vocabulary, context and future grammar items.
- Define stable Card IDs separately from content identity.
- Do not use display strings as long-term identity.

### D2. Shared evidence model
- Define a common evidence envelope for attempts/outcomes across domains.
- Preserve mode/attribute semantics.
- Preserve grader/model/planner version metadata.
- Keep raw learner input out unless explicitly required for educational functionality.

### D3. Relationships
- Model vocabulary ↔ kanji relationships explicitly.
- Model vocabulary ↔ context relationships explicitly.
- Leave room for grammar pattern ↔ vocabulary/context relationships.
- Keep these relationships deterministic and versionable.

### D4. Scheduling boundary
- FSRS remains card scheduling authority.
- Attribute/domain planning may influence practice selection but must not become a second scheduler.
- New domains must consume the same authoritative session/recovery/persistence seams.

### D5. Migration/offline
- Add deterministic migrations for new identities/evidence.
- Preserve existing Kanji5 learner state.
- Keep the cross-domain core offline-capable.

## 5. Phase E — Vocabulary MVP

Vocabulary is the first major expansion after the Kanji foundation.

### E1. Content model
- Define vocabulary item identity, spelling, reading, meaning, source/provenance and linked Kanji.
- Define supported learner states and evidence semantics.

### E2. Learning modes
- Start with a small deterministic vocabulary recall set.
- Reuse existing grading/outcome contracts.
- Reuse recovery and session semantics.
- Do not create a separate vocabulary scheduler.

### E3. UX
- Vocabulary page should support search, stage/status filtering and focused learning actions.
- Keep vocabulary learning distinct from dictionary browsing.
- Preserve mobile usability.

### E4. Stats
- Extend the existing Stats model without fragmenting the product into separate dashboards.
- Show vocabulary evidence only when sample size is meaningful.

### E5. Acceptance
- deterministic grader
- offline fallback
- persistence/migration
- learner-model integration
- planner integration through existing seams
- browser coverage
- accessibility/responsive coverage

## 6. Phase F — Context and Reading integration

- Connect vocabulary to real sentence context without turning Reading Lab into a scheduler.
- Reuse validated context content.
- Preserve Reading Lab state and analysis.
- Use context as evidence for comprehension/recall rather than merely another navigation page.

## 7. Phase G — Grammar foundation

Grammar follows vocabulary/context foundations.

### G1. Grammar content model
- Stable pattern identity.
- Pattern explanation, examples and linked vocabulary/context.
- Versioned source/provenance.

### G2. Learning model
- Deterministic grammar evidence.
- Reuse shared outcome/evidence/recovery contracts.
- Do not introduce an independent scheduler.

### G3. UX
- Grammar Guide remains reference-first until the evidence model is ready.
- Learning flows should be introduced incrementally.
- Keep grammar separate from the core Kanji learning card.

## 8. Non-goals / guardrails

Do not:
- rewrite FSRS
- replace the learner model because of presentation needs
- put learning rules into React components
- move persistence authority into UI
- introduce an LLM as an authoritative grader
- create a second scheduler for Vocabulary or Grammar
- build a large dashboard before metrics are reliable
- add gamification/social systems before learning quality is measured
- expand content breadth at the expense of content validity
- merge stale PRs merely because they implement a roadmap bullet; rebase/rebuild against current `main` first

## 9. Definition of done for this roadmap

A phase is complete only when:
1. The implementation exists on current `main`.
2. Contract/unit tests pass.
3. Relevant browser E2E passes.
4. Typecheck/build passes when applicable.
5. Offline behavior is verified when applicable.
6. No authoritative engine contract is bypassed.
7. Documentation reflects the implemented behavior.
8. No stale branch/PR is being treated as completed work.

## 10. Execution order

```text
A1 Runtime integrity
 ↓
A3 Stats correctness
 ↓
A2 Learning / Active Recall
 ↓
A4 Reading Lab
 ↓
A5 Dictionary
 ↓
A6 Settings
 ↓
A7 Mnemonics
 ↓
A8 Responsive + accessibility + performance
 ↓
B Measurement / Advanced Stats
 ↓
C Content quality
 ↓
D Cross-domain contracts
 ↓
E Vocabulary MVP
 ↓
F Context integration
 ↓
G Grammar foundation
```

This order is intentionally conservative: first make the existing Kanji product trustworthy, then make its evidence trustworthy, then create the shared seams required for new learning domains.
