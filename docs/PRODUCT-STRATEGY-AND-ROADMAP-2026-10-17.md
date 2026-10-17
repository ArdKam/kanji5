# Rinemi — Product Strategy and Differentiated Roadmap

**Strategy date:** 2026-10-17  
**Repository:** `ArdKam/kanji5`  
**Product:** Rinemi  
**Strategy baseline inspected:** `main` at `085524dc58547e33e42fcaff75784b0c6d3fe6b3`  
**Status:** Directional strategy and proposed roadmap; validate execution status against current `main` before acting.

## How future contributors should use this document

This document records the product strategy, target audience, competitive position, ranked opportunities, and intended 6–12-month direction. It is designed to preserve decisions across future inspections and contributor handoffs.

- **`ROADMAP.md` remains the canonical execution roadmap** for current status, release blockers, sequencing, and acceptance evidence.
- This document is not proof that a capability is complete, shipped, effective, or deployed. Verify current `main`, open PRs, workflow runs, and live deployment before making any such claim.
- Do not turn every opportunity below into an implementation task. Each proposed feature must first have a defined user problem, an owner, an acceptance criterion, a measurable outcome, and an ongoing maintenance cost.
- Preserve existing architecture and release governance. In particular, React remains presentation-only; FSRS remains scheduling authority; the v1.9 Learner Model remains learner-state authority; Adaptive Planner remains practice-selection authority; Recovery/Grading/Persistence remain with their established engine boundaries.
- **Concurrent-document safety (2026-10-17):** PR #560 (`docs: record 2026-10-17 Rinemi audit and roadmap handoff`) is modifying `ROADMAP.md`. This strategy change is intentionally scoped to a new file and must not overwrite or rebase over that contributor's roadmap edits. After #560 and other active roadmap edits have been reconciled, add a small link to this file under the product-direction section of `ROADMAP.md` in a separate minimal change. Do not duplicate the roadmap or create a second source of truth.

## 1. Executive decision

**Position Rinemi as the Persian-first bridge from learning kanji to understanding written Japanese.**

Rinemi should not try to out-Anki Anki on extensibility, out-Renshuu Renshuu on breadth, or become an all-in-one Japanese course before the current learning experience is consistently reliable. It should combine:

1. Natural, accurate Persian-first explanations of kanji meaning and usage.
2. A dependable and understandable daily learning loop supported by spaced repetition and adaptive practice.
3. Useful connections among kanji, vocabulary, dictionary lookup, and short Japanese reading.
4. A local-first, privacy-conscious, offline-capable experience that avoids unnecessary barriers to starting.

The strategic objective is depth before breadth. Vocabulary is the first natural expansion because it reinforces kanji learning and reading. Grammar should initially appear as contextual help inside reading, not as a separate curriculum. Further expansion depends on observed learner needs, learning outcomes, retention, content quality, and maintainability.

### Proposed value proposition

> Rinemi helps Persian-speaking learners build durable kanji knowledge through Persian-first explanations, adaptive practice, and contextual reading—while keeping daily study focused, private by default, and available offline.

This is a hypothesis to validate with learners, not a proven market-position or claim of superior educational outcomes.

## 2. Current capability baseline

The repository and product documentation reviewed at the strategy baseline describe the following capabilities. These are **implementation/documentation facts**, not proof of quality, current release readiness, or learning efficacy.

| Area | Current documented position | Strategic implication |
|---|---|---|
| Kanji curriculum | Coverage of the 2,136 Jōyō kanji with frequency-oriented ordering | A bounded, understandable product foundation; content accuracy and learner-level usefulness matter more than adding a much larger raw catalog. |
| Review scheduling | FSRS, four review ratings, and configurable study pace | Keep the proven scheduling authority; FSRS by itself is not a differentiator. |
| Adaptive practice | Meaning, Reading, Production, Vocabulary, and Context with learner modeling and adaptive planning | Explain the learner-facing benefit simply; test outcomes before claiming adaptive superiority. |
| Memory aids | Curated and guided mnemonics, visual structure, stroke information, and similar-character support | Potential differentiator if accurate, useful, and disclosed only when helpful. Coverage alone does not prove quality. |
| Dictionary and vocabulary | Dictionary experience and vocabulary-oriented practice, with content providers and fallback behavior | Integrate it into the learning journey; audit content quality and reliability before expanding volume. |
| Reading | Reading Lab with selectable words and associated reading/lookup support | Strongest route from isolated recall to practical comprehension; prioritize integration over another standalone module. |
| Languages and accessibility | Persian and English interfaces and accessibility/responsive implementation work | Necessary for the intended audience; do not equate translated strings with Persian-first pedagogy. |
| Local-first and offline | Local progress, PWA/offline infrastructure, backup/restore, optional account/synchronization paths | Trust is part of the value proposition. Validate progress safety, cache/update behavior, and cloud/local data semantics. |

Primary repository references:

- [README](../README.md)
- [Public Product Guide](PUBLIC-PRODUCT.md)
- [Project Structure](../PROJECT-STRUCTURE.md)
- [Educational Content Audit](EDUCATIONAL-CONTENT-AUDIT.md)
- [Privacy and Data Draft](PRIVACY-AND-DATA.md)
- [Canonical execution roadmap](../ROADMAP.md)

### What is not yet established

Do not infer any of the following from implementation or tests alone:

- Persian explanations are consistently natural, nuanced, and pedagogically useful.
- All example vocabulary or sentences are correct, natural, licensed for the intended use, and appropriately leveled.
- Adaptive planning improves delayed recall over a simpler baseline.
- Dictionary and Reading Lab usage leads to later practice or improved comprehension.
- Onboarding and first-session completion are good.
- Learners return after a week or a month.
- Persian-speaking learners will select Rinemi over current alternatives, or pay for it.

These require content review, observed usability testing, privacy-respecting product measures, and learner research.

## 3. Target audience and user problems

### Primary audience

Focus first on **independent Persian-speaking learners who have learned, or are finishing, hiragana and katakana and want to build lasting kanji knowledge that helps them read Japanese**.

Useful initial subsegments:

- Early learners who need Persian explanations rather than relying on English as an intermediary.
- Committed self-learners who want a coherent kanji curriculum without building and maintaining their own flashcard system.
- Intermediate learners who recognize characters but confuse similar kanji, forget readings, or fail to understand vocabulary in context.

Do not promise to serve all Japanese learners equally at launch. Interview across those segments and identify which has the strongest recurring unmet need and best retention potential.

### Unmet needs to validate

1. **Persian-native understanding:** correct, natural Persian meanings, distinctions between related senses, and explanations of how readings appear in common words. A Persian interface alone is not enough.
2. **Repair of persistent errors:** distinguish forgotten meaning, reading confusion, visual interference, and vocabulary/context weakness; offer an appropriate repair and later test whether it lasted.
3. **Transfer to reading:** connect kanji to frequent words, sentences, and short leveled texts; allow lookup and return to future practice without fragmenting study across disconnected tools.
4. **Low-friction consistency:** provide one obvious next action, a realistic workload, reliable offline use, and understandable re-entry after missed days.
5. **Trust:** accurate content, clear provenance and correction pathways, dependable backups/sync, and privacy disclosures that match actual behavior.
6. **Meaningful progress:** show durable recall, improved weak areas, and reading comprehension rather than treating streaks and raw review counts as learning outcomes.

These are working hypotheses. Record interview evidence and behavior; do not represent prevalence or market demand as known until measured.

## 4. Competitive positioning

Competitive feature claims were reviewed for this strategy on 2026-10-17 using official product pages/documentation where possible and public listings for Persian-language alternatives. Product features and commercial terms can change; **re-check current official sources before making public comparisons or implementation decisions**. This is a product-positioning assessment, not an independent usability or educational-efficacy benchmark.

| Product | Core strength / positioning | Rinemi's opportunity | Competitive implication |
|---|---|---|---|
| [Anki](https://apps.ankiweb.net/) / [FSRS documentation](https://github.com/ankitects/anki/blob/main/docs-site/faqs/what-spaced-repetition-algorithm.mdx) | Flexible spaced-repetition flashcards, extensive community decks, customization, and FSRS support | Guided Persian-first teaching, curated content, targeted repair, and integrated reading without requiring learners to assemble a system | Do not compete on customizability or generic scheduling. Anki is a strong substitute for experienced users willing to configure it. |
| [WaniKani](https://www.wanikani.com/) | Structured kanji/radical/vocabulary progression, mnemonics, and a focused curriculum | Persian-native semantic instruction, more flexible practice, individual weakness repair, and a smoother path to reading | Closest focused-kanji competitor. A large kanji collection or mnemonics alone do not differentiate Rinemi. |
| [Renshuu](https://www.renshuu.org/) | Broad Japanese study with vocabulary, kanji, grammar, multiple exercise types, and customizable study | Offer a calmer, more focused kanji-to-reading journey designed around Persian explanations | Do not try to replicate all breadth at once. |
| [jpdb](https://jpdb.io/) | Vocabulary/kanji SRS and vocabulary learned through Japanese media and text | Support learners who need Persian explanations and guidance before they are comfortable with immersion-first vocabulary learning | Context and vocabulary features must be good, not merely present. |
| [Bunpro](https://bunpro.jp/) | Grammar-led SRS, examples and broader grammar/reading support | Explain grammar encountered during reading without initially launching a separate grammar product | Contextual grammar help is a reasonable experiment; standalone grammar curriculum has a much larger scope. |
| Persian/Japanese dictionary apps, e.g. [public Google Play listing](https://play.google.com/store/apps/details?id=id.melatieduplay.dictionary.translator.persian.iran.japanese) | Advertised Persian/Japanese lookup, offline dictionary, kanji search, JLPT decks and grammar tools | Deeper kanji pedagogy, reviewed usage examples, targeted recall and continuity between lookup and study | “Available in Persian” is not enough of a moat. |
| [Mynawoo Japanese via Persian](https://mynawoo.com/courses/japanese-via-persian-306707101401) | Advertises a structured Persian-taught course with multiple levels and broader language skills | Complement structured instruction with adaptive daily practice and kanji/reading transfer | Competes indirectly for beginner attention. Validate the quality and activity of alternatives through learner interviews. |

### Strategic conclusion from the matrix

Rinemi should not be the most customizable tool, the broadest course, or the biggest vocabulary catalog. Its differentiation should emerge from three connected assets:

1. **A high-quality Persian–Japanese learning corpus:** meaning distinctions, readings in real words, learner-level examples, and useful confusion contrasts.
2. **An understandable error-and-recovery experience:** choose a useful practice based on evidence and show a concise reason when that explanation helps.
3. **A connected learning-to-reading workflow:** a word encountered in reading can be looked up, understood, saved, and connected to existing learner knowledge and future practice.

These assets are harder to replace than another quiz mode, AI wrapper, streak, or dashboard.

## 5. Smallest coherent product

The minimum coherent product should deliver one clear outcome: **remember kanji and use that knowledge to understand written Japanese**.

Organize the everyday experience around three primary destinations:

### 1. Today — start the daily session

Show due reviews, a manageable new-learning target, and one clear start/continue action. Hide internal planner complexity. Keep statistics secondary to starting useful study.

### 2. Kanji — learn, recall, recover

The learning item should answer, in order:

- What is the primary meaning?
- How is it read in useful words?
- Where is it used?
- How do I distinguish it from commonly confused characters?
- Can I retrieve it correctly later?

Keep the kanji, meaning, and useful readings prominent. Reveal detailed structure, mnemonics, stroke order, and reference glosses when useful, without letting them compete equally for attention. Keep Again / Hard / Good / Easy semantics clear and visually accessible.

### 3. Explore — dictionary and reading

Enable lookup of kanji and vocabulary, inspection of readings/examples, and work with short Japanese texts. Connect selected words to the existing learning experience rather than creating another independent study system.

Settings, account management, curriculum filters, and detailed statistics remain available but do not compete with these primary destinations.

### Do not build into the minimum coherent product

Do not prioritize a full grammar school, open-ended deck builder, AI conversation tutor, social feed, heavy achievement system, multiple overlapping progress dashboards, or a second scheduling engine. Each requires a specific validated problem before inclusion.

## 6. Ranked opportunity portfolio

Ranks are strategic judgments as of the strategy date. Effort refers to relative implementation and ongoing maintenance, not a committed estimate.

| Rank | Opportunity | User value | Relative effort | Why / measurable criterion |
|---:|---|---|---|---|
| 1 | Persian content quality and Learning-card clarity | Very high | Medium | Audit common and confusing kanji, readings, vocabulary, examples, and mnemonics. Pass a reviewed content gate and observed comprehension tasks. |
| 2 | Release reliability and data/privacy trust | Very high | Medium | Protect learner progress, clarify backup/sync/deletion semantics, resolve critical release blockers, and pass current release gates. |
| 3 | Integrate Dictionary, vocabulary, and Reading Lab | Very high | Medium–high | Increase the share of active learners who go from lookup/reading to useful future practice; measure reading comprehension. |
| 4 | Targeted recovery for persistent errors | High | Medium | Measure repeat-error rate and delayed recall for repaired items; compare with a simple-practice baseline where feasible. |
| 5 | Curated beginner vocabulary and sentence collection | High | Medium–high | Begin with approximately 300–500 reviewed, useful words only if the pipeline, provenance, and correction process can maintain them. |
| 6 | Onboarding, realistic daily workload, missed-day re-entry | High | Low–medium | Improve first-session completion and 7/30-day cohort retention without coercive notifications or streak pressure. |
| 7 | Anki-friendly import/export interoperability | Medium | Medium | Reduce switching costs for existing learners if interviews show it blocks activation. Preserve identity and data-integrity invariants. |
| 8 | Grammar in context | Conditional | Medium initially; high for full course | Test concise explanations within reading. Do not commit to a standalone syllabus without a clear demand signal. |
| 9 | AI tutor, community, broad gamification, many new language interfaces | Unproven | High and ongoing | Defer until a specific target-user problem, expected benefit, privacy design, and maintenance plan exist. |

## 7. Feature disposition rules

### Improve now

- Learning-card hierarchy, first-render stability, rating clarity, mobile/desktop geometry, and accessible focus/keyboard behavior.
- First-time onboarding, daily session initiation, empty/error/recovery states, and re-entry after missed study.
- Persian meaning, reading, and example quality.
- Offline updates, backup/restore, synchronization safety, and privacy disclosures.
- Content provenance and correction workflow.

### Integrate before adding equivalents

- Dictionary lookup with the relevant kanji, vocabulary, and Reading Lab.
- Reading Lab word selection with known/unknown learner content and a sensible way to revisit an item.
- Mnemonic and similar-character support with evidence from the current learner, shown progressively.
- Learning outcomes and progress summaries into one understandable view, instead of multiplying dashboards.

### Simplify

- Keep the underlying five-skill/adaptive engine, but present it through an obvious Practice action rather than expecting learners to choose internal modes without guidance.
- Keep key information on the Learning card; reveal detailed reference content progressively.
- Make the main navigation prioritize Today, Kanji/learning, and Explore/reading. Settings and account functions are secondary.

### Defer pending evidence

- Standalone grammar curriculum, large vocabulary expansion, AI tutoring/conversation, social/community features, complicated gamification, additional language localizations, and native app-store packaging before PWA quality is proven.
- New learner dashboards or more algorithmic sophistication unless a concrete user problem and measurable expected benefit justify them.

### Do not compromise architecture to accelerate a feature

- FSRS remains the review scheduler.
- The v1.9 Learner Model owns learner-state interpretation.
- Adaptive Planner owns next-practice selection.
- Recovery, grading, and persistence remain within their established engine boundaries.
- React remains presentation-only.
- Do not introduce another scheduler for vocabulary, context, or grammar.
- Do not perform broad persistence migrations without concrete evidence and a reviewed migration/rollback plan.
- Domain expansion should reuse stable content/card identity and existing evidence/scheduling seams.

## 8. Proposed 6–12-month roadmap

This is a directional roadmap starting 2026-10-17. It must be reconciled with current blockers, dependencies, and execution status in [`ROADMAP.md`](../ROADMAP.md). Dates are planning windows, not completion claims.

### Phase 1 — Stabilize and validate the core
**Window:** October–November 2026  
**Goal:** Dependability before feature expansion.

Work:
- Consolidate overlapping Learning-card and UX changes; verify the selected changes on their own PR heads and on current main after merging, never assume open PR equals shipped code.
- Test Persian and English, desktop and narrow mobile, short viewports, themes, accessibility, and first-session flows.
- Verify the daily session, answer reveal, Again/Hard/Good/Easy, failed exercise recovery, offline reviews, reload persistence, backup/restore, and synchronization.
- Resolve release-blocking privacy/legal decisions: actual data flow, cloud/local boundaries, account deletion request/implementation semantics, retention and third-party disclosures.
- Interview 8–12 Persian-speaking learners from the target segments and observe real tasks.

Proposed exit criteria:
- All mandatory current-main contract, build, browser, offline, and release checks pass.
- No unresolved critical progress-loss, data integrity, or blocking navigation defects.
- At least 70% of learners who start onboarding complete a useful first session in the pilot.
- At least 8 of 10 observed pilot learners complete the core learning task without moderator intervention.

The quantitative usability targets are starting pilot goals, not external benchmarks. Record the baseline and revise based on evidence.

### Phase 2 — Persian-first educational quality
**Window:** December 2026–January 2027  
**Goal:** Turn Persian support into a real educational advantage.

Work:
- Audit a representative sample of common and confusing kanji, learner-priority meanings, readings, vocabulary, examples, and memory aids.
- Separate core/common readings and meanings from secondary/reference information without deleting valuable source data.
- Ensure that readings are shown in useful vocabulary context; avoid implying that all readings are interchangeable or equally important.
- Distinguish official radicals from visual components; present visual structure as a recognition aid.
- Add a review/correction workflow with data provenance and clear editorial status.

Proposed exit criteria:
- Review at least 200 representative kanji and 300 associated vocabulary items against a written rubric.
- No critical error in the approved sample; reach at least 98% agreement with the review rubric on non-critical audited fields.
- Entries that require review are explicitly marked rather than silently treated as approved.
- Observed learners can explain sampled meaning/reading distinctions without relying on ambiguous glosses.

These are proposed internal quality gates. Automated validation is insufficient for natural Persian or pedagogical validity; use qualified human editorial review.

### Phase 3 — Close the kanji-to-reading loop
**Window:** February–April 2027  
**Goal:** Make reading a natural extension of learning.

Work:
- Connect Reading Lab word selection with dictionary details and learner-known kanji/vocabulary.
- Provide a useful path from lookup to saving/revisiting content and later practice through existing scheduling/evidence boundaries.
- Curate a small selection of licensed or appropriately sourced, reviewed, leveled texts.
- Keep unknown content lookup helpful without forcing the learner into a separate study subsystem.

Proposed exit criteria:
- Measure what percentage of active users open a text, select a word, look it up, and later review/recognize it.
- Measure reading-comprehension performance before and after defined practice.
- Pilot against a pre-test; use a provisional goal of a 10-percentage-point improvement on the defined short assessment, subject to validating the test and cohort.
- No second scheduler; do not create duplicate learning state for the same content.

### Phase 4 — Selective beginner vocabulary
**Window:** May–July 2027  
**Goal:** Improve reading usefulness without turning Rinemi into an unfocused all-in-one course.

Work:
- Pilot approximately 300–500 frequent/useful beginner vocabulary items linked to kanji, readings, Persian meanings, and reviewed examples.
- Build/maintain one reusable, source-aware content pipeline for Learning, Dictionary, and Reading Lab.
- Extend volume only after the content validation, provenance, correction, and update process works in practice.

Proposed exit criteria:
- Delayed recall and contextual recognition improve or meet the defined target in the pilot.
- Content corrections are traceable and operationally manageable.
- Existing kanji study and release reliability do not regress.

### Phase 5 — Expansion decision and public-beta learning
**Window:** August–October 2027  
**Goal:** Choose the next product investment from evidence.

Evaluate:
- Contextual grammar explanations inside Reading Lab.
- Anki-friendly import/export if it removes a demonstrated activation barrier.
- Public beta positioning, learner feedback, and acquisition channels.
- Whether users consistently request and use content beyond the kanji-to-reading product.

Only start a standalone grammar curriculum if research with retained learners shows that it is an important, recurring need and the team has a maintainable curriculum plan.

Proposed beta success signals:
- Aim for at least 25% seven-day and 15% thirty-day retention among activated beta cohorts.
- Pair those figures with delayed recall, reading comprehension, session completion, and qualitative learner evidence.
- Treat a small beta as directional evidence, not proof of broad product-market fit.

## 9. Measurement and evidence rules

Use a small scorecard, not another complex dashboard. Define cohort, denominator, time window, exclusions, and data source for each metric before comparing results.

| Metric | Definition / purpose | Proposed starting target |
|---|---|---|
| First-session completion | Proportion of onboarding starters who finish a defined useful learning session | At least 70% in pilot |
| Seven-day retention | Proportion of activated learners returning for a meaningful learning activity within the defined day-7 window | Aim for ≥25% in a mature beta cohort |
| Thirty-day retention | Proportion of activated learners returning for meaningful study around day 30, with window explicitly defined | Aim for ≥15% in a mature beta cohort |
| Delayed recall | Correct independent retrieval after a defined delay, reported by skill/attribute | Establish baseline; test improvement rather than assuming it |
| Reading transfer | Accuracy on a defined, preferably unseen, reading-comprehension task | Pilot a pre/post measure; provisional +10 percentage points |
| Content quality | Critical-error count and rubric agreement in documented human-reviewed samples | Zero critical errors in approved sample; ≥98% agreement on non-critical audited fields |
| Reliability | Current-main release gates, data integrity, offline persistence, failure recovery | Mandatory gates pass; no unresolved critical learner-data loss |
| Feature connection | Share of users moving from reading/lookup into later review or practice | Establish baseline, then test an explicit improvement hypothesis |

Use 7/30-day retention carefully: returning to open the app is not automatically learning, and fewer but better sessions can still be educationally effective. Pair engagement with delayed/independent recall and reading transfer.

Respect the local-first promise. Collect the minimum measurements needed; avoid collecting raw learner text or detailed learning records without a clear educational need, a disclosed purpose, and appropriate privacy controls.

## 10. Product-decision checklist for future work

Before implementing a substantial feature, record answers to all of these:

1. **Target user:** Which specific learner segment has the problem?
2. **Evidence:** What interview, observed-task, content audit, or cohort result shows the problem exists?
3. **Current alternative:** How is the learner solving it now, and why is that insufficient?
4. **Expected outcome:** What should the learner do or learn better after this change?
5. **Success measure:** What metric, cohort, baseline, and decision threshold will be used?
6. **Scope and maintenance:** What content, support, dependencies, licensing, privacy, and testing burden is added?
7. **Architecture:** Can the existing learner model, adaptive planner, scheduler, and persistence boundaries be reused?
8. **Rollback:** How can the change be reverted without corrupting progress or leaving incompatible cached clients?
9. **Decision:** What result causes us to expand, revise, or stop?

If these cannot be answered, collect evidence first instead of adding a feature.

## 11. Future-inspection and document-governance instructions

At every later audit, the contributor/agent must:

1. Fetch the current `main` SHA and read the current canonical `ROADMAP.md`; never use this document's baseline SHA as current truth.
2. Inspect open PRs, changed files, and checks before choosing work. An open branch can contain useful changes, but is not evidence of completion or deployment.
3. Reconcile with concurrent contributors before editing files. Prefer new scoped files or minimal diffs; avoid simultaneous edits to shared roadmap/spec documents. In particular, after the 2026-10-17 roadmap handoff PR #560 is settled, add only a small link to this strategy under product direction in `ROADMAP.md`, rather than copying the content into it.
4. Keep strategy stable but execution status current. Update the canonical roadmap with status/evidence and point to relevant acceptance documents rather than creating competing task lists.
5. Avoid reopening completed work without a verified current-main regression. Do not claim test success, merge, deployment, product-market fit, or learning efficacy without corresponding evidence.
6. Prefer targeted, testable changes. Do not rebuild authoritative learning-engine components to solve presentation or product-positioning needs.
7. Keep scope small during active release work: reliability and educational-content trust precede broad expansion.

## 12. Reference sources

### Rinemi repository
- [Current README](../README.md)
- [Public product guide](PUBLIC-PRODUCT.md)
- [Project structure and authority boundaries](../PROJECT-STRUCTURE.md)
- [Canonical roadmap](../ROADMAP.md)
- [Educational content audit](EDUCATIONAL-CONTENT-AUDIT.md)
- [Privacy and data draft](PRIVACY-AND-DATA.md)
- [Onboarding specification](ONBOARDING-SPEC.md)
- [Public beta checklist](PUBLIC-BETA-CHECKLIST.md)

### Competitor product sources
- [Anki](https://apps.ankiweb.net/) and [Anki FSRS FAQ](https://github.com/ankitects/anki/blob/main/docs-site/faqs/what-spaced-repetition-algorithm.mdx)
- [WaniKani](https://www.wanikani.com/)
- [Renshuu](https://www.renshuu.org/)
- [jpdb](https://jpdb.io/)
- [Bunpro](https://bunpro.jp/)
- [Public Persian/Japanese dictionary listing](https://play.google.com/store/apps/details?id=id.melatieduplay.dictionary.translator.persian.iran.japanese)
- [Mynawoo Japanese taught via Persian](https://mynawoo.com/courses/japanese-via-persian-306707101401)

Official product claims and feature availability may change. Re-verify them before publishing comparative marketing claims. Competitor feature presence does not establish comparative educational efficacy.
