# Rinemi — Product Strategy, Competitive Positioning, and Growth Roadmap

**Strategy date:** 2026-10-17  
**Product:** Rinemi  
**Repository:** `ArdKam/kanji5`  
**Repository HEAD when prepared:** `fe3277433fd77d8cfef70acefa9bbaa61398c959`  
**Last application-code baseline inspected:** `085524dc58547e33e42fcaff75784b0c6d3fe6b3` (the subsequent `fe327743` commit added only `docs/LEARNING-EFFECTIVENESS-ROADMAP.md`).  
**Status:** Strategy recommendation; market demand, retention, and comparative educational efficacy remain unproven.

## Document authority and change-isolation rules

This document preserves the product strategy, target audience, competitive assessment, differentiated value proposition, feature-scope decisions, and business/product-level 6–12-month direction.

- `ROADMAP.md` remains the canonical execution/status and release-sequencing source.
- [Product Priorities & Audit Handoff (2026-10-23)](PRODUCT-PRIORITIES-AND-AUDIT-HANDOFF-2026-10-23.md) consolidates the current top-ten priorities, maps them to their authoritative documents, and records open-vs-planned distinctions. It is an index/handoff, not a replacement backlog; refresh current-main evidence before relying on its dated status.
- [Learning Effectiveness & Transfer Roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md) owns the more detailed educational sequence, instructional design, and learner-outcome evaluation work. Use it rather than duplicating its implementation backlog here.
- [Educational Content Audit](EDUCATIONAL-CONTENT-AUDIT.md) and existing content-quality documents retain their authority for educational acceptance and data validity.
- This document does **not** claim that an item is implemented, merged, deployed, effective, or released. Re-check current `main`, active PRs, workflows, and deployment evidence before acting.
- **Concurrent-document safety (2026-10-17):** PR #560 is open and edits `ROADMAP.md`; the learning-effectiveness roadmap was also just added to `main` with an explicit instruction to avoid shared planning-document edits during that change. This PR therefore adds only this new, complementary strategy file. Do not overwrite or reorder the other contributors' documents. After active roadmap/documentation changes are reconciled, add a minimal cross-reference to this file from the canonical roadmap in a separate coordinated change.
- Future contributors must preserve the architecture contract: FSRS is the review-scheduling authority; the v1.9 Learner Model is the learner-state authority; Adaptive Planner is the practice-selection authority; Recovery, Grading, and Persistence remain behind established engine boundaries; React is presentation-only. Do not introduce a second scheduler or broad persistence migration to implement product strategy.

## 1. Executive decision

**Position Rinemi as the Persian-first bridge from learning kanji to understanding written Japanese.**

Rinemi should not try to out-Anki Anki on extensibility, out-Renshuu Renshuu on breadth, or become a full Japanese course before the existing learning journey is dependable. It should combine:

1. Accurate, natural Persian-first explanations of kanji meaning and usage.
2. A reliable, understandable daily loop supported by spaced repetition and adaptive practice.
3. Strong connections among kanji, vocabulary, dictionary lookup, and short Japanese reading.
4. A local-first, privacy-conscious, offline-capable experience that makes starting and returning to study straightforward.

The direction is **depth before breadth**. Vocabulary is the first natural expansion because it reinforces kanji and reading. Initially, grammar should appear as contextual help when it blocks comprehension, not as a standalone curriculum. Additional scope must be earned through observed user needs, learner outcomes, retention, content quality, and maintainability.

### Proposed differentiated value proposition

> Rinemi helps Persian-speaking learners build durable kanji knowledge through Persian-first explanations, adaptive practice, and contextual reading—while keeping daily study focused, private by default, and available offline.

This is a strategic hypothesis, not a proven market position or a claim of better educational outcomes.

## 2. Current position: assets and gaps

The repository documentation describes a substantial technical base. Confirm the actual current implementation before claiming any capability is release-ready.

| Area | Current documented capability | Strategic implication |
|---|---|---|
| Kanji curriculum | 2,136 Jōyō kanji with frequency-oriented ordering | A bounded, coherent foundation; improve teaching and usage, not just catalog size. |
| Spaced repetition | FSRS and Again/Hard/Good/Easy ratings | Retain the scheduling authority; FSRS alone is not differentiation. |
| Adaptive practice | Meaning, Reading, Production, Vocabulary, Context; learner model and adaptive planner | Make the benefit understandable; compare outcomes with a simpler baseline before claiming advantage. |
| Memory support | Curated and guided mnemonics, visual structure, stroke-order reference, similar-kanji support | Valuable if accurate, distinctive, and shown when needed. Coverage is not quality. |
| Dictionary and vocabulary | Dictionary/reference views and vocabulary practice using local/external content pathways | Connect them to learning; quality, sourcing, and failure handling matter more than breadth. |
| Reading | Reading Lab for Japanese text/audio workflows and word lookup | The strongest route from isolated recall to useful comprehension; integrate rather than launch another disconnected module. |
| Persian and English | Dual-language user interface and localized learning experience | A baseline requirement, not enough by itself to differentiate the product. Persian-first pedagogy needs human-reviewed content. |
| Offline and learner data | Local progress, PWA/offline infrastructure, backup/restore and optional account/sync paths | Reliability and transparent data semantics are part of the product promise. |

Useful current sources:
- [README](../README.md)
- [Public Product Guide](PUBLIC-PRODUCT.md)
- [Project Structure and authority boundaries](../PROJECT-STRUCTURE.md)
- [Canonical execution roadmap](../ROADMAP.md)
- [Learning Effectiveness & Transfer Roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md)
- [Educational Content Audit](EDUCATIONAL-CONTENT-AUDIT.md)
- [Privacy & Data draft](PRIVACY-AND-DATA.md)

### What remains unproven

Do not infer any of the following from code, feature presence, or passing software tests:

- Persian explanations reliably convey the semantic distinctions a learner needs.
- Examples and vocabulary are consistently correct, natural, appropriately leveled, and properly licensed.
- Adaptive planning improves delayed recall relative to a reasonable simple-practice baseline.
- The Dictionary and Reading Lab lead to later practice or improved comprehension.
- Onboarding and the first session are effective.
- Learners return after one week or one month.
- Persian-speaking learners choose Rinemi over existing alternatives or are willing to pay for it.

Validate these through human content review, observed usability sessions, learner interviews, privacy-respecting product measurements, and explicit learning-outcome evaluation. The [Learning Effectiveness & Transfer Roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md) defines the educational evaluation path.

## 3. Target audience and unmet needs

### Initial target audience

Focus on **independent Persian-speaking learners who have learned, or are finishing, hiragana and katakana and want durable kanji knowledge that helps them read Japanese**.

Initial segments to research:

- **Early learners** who need Persian explanations rather than relying on English as an intermediary.
- **Committed self-learners** who want a coherent kanji curriculum without curating and maintaining a flashcard system themselves.
- **Intermediate learners** who recognize characters but confuse similar kanji, forget useful readings, or fail to understand vocabulary in real sentences.

Do not assume equal fit across segments. Interview across them and observe real study tasks to identify the group with the strongest recurring problem and best retention potential.

### Unmet needs to validate

1. **Persian-native understanding:** natural Persian definitions, differences between related meanings, and explanations of how readings appear in common vocabulary. A Persian UI alone is not enough.
2. **Repair of recurring errors:** distinguish meaning errors, reading confusion, visual interference, and vocabulary/context weakness; provide targeted repair and later verify whether it lasts.
3. **Transfer to reading:** connect kanji to useful words, sentences, and short leveled texts without forcing the learner to manage separate systems.
4. **Low-friction consistency:** one obvious next action, realistic workload, dependable offline behavior, and a supportive return after missed days.
5. **Trust:** accurate content, source/provenance transparency, reliable backups/sync, and privacy statements aligned with actual behavior.
6. **Meaningful progress:** show improved delayed recall, reduced repeat confusion, and reading ability—not just streaks or raw review counts.

These are hypotheses, not claims of measured prevalence. Record interview evidence and user behavior before prioritizing them further.

Persian-language alternatives already advertise Japanese dictionaries and courses taught in Persian. Therefore, "Japanese in Persian" is not enough to own a niche. The opportunity is the combination of Persian-native pedagogy, adaptive kanji learning, and useful reading transfer.

## 4. Competitive matrix

This comparison was prepared on 2026-10-17 from official product pages/documentation where possible and public listings for Persian-language alternatives. It assesses advertised positioning and feature patterns, not independent usability tests or comparative educational efficacy. Re-check current sources before using the claims in public marketing.

| Product | Main strength | Opportunity for Rinemi | Strategic implication |
|---|---|---|---|
| [Anki](https://apps.ankiweb.net/) / [FSRS documentation](https://github.com/ankitects/anki/blob/main/docs-site/faqs/what-spaced-repetition-algorithm.mdx) | Flexible spaced-repetition flashcards, extensive community decks, customization, and FSRS support | Purpose-built Persian teaching, curated content, error repair, and an integrated reading journey without requiring learners to assemble their own system | Do not compete on customizability or generic scheduling. Anki is a strong substitute for experienced users willing to configure it. |
| [WaniKani](https://www.wanikani.com/) | Structured kanji/radical/vocabulary progression, mnemonics, and focused curriculum | Persian-native semantic instruction, flexible practice, weakness repair, and a clearer path into reading | Closest focused-kanji competitor. A large catalog or mnemonics alone are not distinctive. |
| [Renshuu](https://www.renshuu.org/) | Broad Japanese study with kanji, vocabulary, grammar, varied exercises, and customizable study | A focused and calmer kanji-to-reading journey designed around Persian explanations | Do not replicate all of its breadth in the first year. |
| [jpdb](https://jpdb.io/) | Vocabulary/kanji SRS and media/text-associated vocabulary learning | Guide learners who need Persian explanations before they are comfortable with immersion-first study | Context and vocabulary features must be good, not merely present. |
| [Bunpro](https://bunpro.jp/) | Grammar-led SRS, examples, and broader grammar/reading support | Explain grammar encountered in reading without immediately launching a separate grammar product | Test contextual grammar support before funding a standalone syllabus. |
| Persian/Japanese dictionary alternatives, e.g. [public Google Play listing](https://play.google.com/store/apps/details?id=id.melatieduplay.dictionary.translator.persian.iran.japanese) | Advertise Persian/Japanese lookup, offline dictionary access, kanji search, JLPT decks and grammar tools | Deeper kanji pedagogy, reviewed usage examples, targeted recall, and continuity between lookup and study | Persian localization by itself is not a moat. |
| [Mynawoo Japanese via Persian](https://mynawoo.com/courses/japanese-via-persian-306707101401) | Advertises a structured Persian-taught course with multiple levels and broad language skills | Complement courses with adaptive daily kanji practice and reading transfer | Indirect competitor for beginners; interview learners about the alternatives they actually use. |

### Positioning decisions implied by the matrix

- Do not compete with Anki on flexibility or with Renshuu on breadth.
- Do not copy WaniKani's value proposition without a clear Persian-first or reading-transfer advantage.
- Do not add example sentences, vocabulary quizzes, or progress dashboards merely to match competitors.
- Do not market Persian support as unique without checking current local alternatives.
- Compete on a **connected combination** of high-quality Persian–Japanese content, learner-specific error repair, and learning-to-reading continuity.

### Potential defensible assets

**1. A high-quality Persian–Japanese corpus.** Learner-priority meanings, readings in real words, natural Persian distinctions, reviewed examples, and useful comparisons between confusable characters.

**2. An understandable recovery experience.** The product identifies a weakness, chooses a useful practice, offers a concise reason when that helps, and checks later whether the learner improved.

**3. A connected learning-to-reading workflow.** Words found while reading can be looked up, understood, saved, and connected to existing learner knowledge and future practice.

These are more defensible than another quiz mode, AI wrapper, streak, or dashboard—but they become defensible only if the content and outcomes are consistently good.

## 5. Smallest coherent product

The minimum coherent product delivers one outcome: **remember kanji and use that knowledge to understand written Japanese**.

The learner-facing product should have three primary destinations:

### Today — start a useful session
Show due reviews, a manageable new-learning target, and one clear start/continue action. Keep planner complexity and statistics secondary.

### Kanji — learn, recall, recover
Keep the character, primary meaning and useful readings prominent. Connect the character to common words and meaningful context. Make visual structure, mnemonics, stroke order, and reference details accessible without competing equally with the answer. Keep Again/Hard/Good/Easy semantics clear.

### Explore — dictionary and reading
Let learners look up kanji and vocabulary, examine readings/examples, and work with short Japanese texts. Connect selected words back to the existing learning experience instead of adding an independent study system.

Settings, account controls, topic filtering and detailed statistics remain available, but should not compete with these core destinations.

Do not include a full grammar school, unrestricted deck builder, AI conversation tutor, social feed, heavy achievement system, or multiple overlapping progress dashboards in the minimum product. Add these only when a specific target-user problem and feasible maintenance plan are demonstrated.

## 6. Ranked strategic opportunities

Effort means relative implementation and ongoing content/support burden. Ratings are strategic judgments, not measured market statistics. Educational acceptance and detailed tasks remain in the [Learning Effectiveness & Transfer Roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md).

| Rank | Opportunity | User value | Relative effort | Measurable decision criterion |
|---:|---|---|---|---|
| 1 | Persian content quality and Learning-card clarity | Very high | Medium | Human-reviewed sample passes an explicit rubric; observed learners correctly understand sampled meaning/reading distinctions. |
| 2 | Release reliability and data/privacy trust | Very high | Medium | Mandatory current-main release checks pass; no unresolved critical progress-loss or blocking-flow issue; product disclosures match deployed behavior. |
| 3 | Connect Dictionary, vocabulary, and Reading Lab | Very high | Medium–high | Increase the share of active learners who go from lookup/reading to a later useful practice; measure reading comprehension separately. |
| 4 | Targeted repair for persistent kanji errors | High | Medium | Reduce recurring errors and improve delayed recall against a defined baseline; no claim of planner superiority without evidence. |
| 5 | Curated beginner vocabulary and sentence collection | High | Medium–high | Pilot a maintained collection of roughly 300–500 useful, reviewed words only after provenance, validation, correction and updates are operational. |
| 6 | Onboarding, manageable workload, missed-day return | High | Low–medium | Improve first-session completion and 7/30-day cohort retention without coercive streaks or notifications. |
| 7 | Kanji bookmarks and a saved-kanji list | High | Low | Validate that learners return to saved kanji and start useful practice from the saved list; ensure bookmarks never alter review state. |
| 8 | Anki `.apkg` deck import (MVP) | Medium; potentially high for experienced learners | Medium–high | Proceed only if learner research confirms switching cost is a real activation barrier; measure import completion, card fidelity, and clear handling of unsupported content. |
| 9 | Grammar in context | Conditional | Medium initially; high for full course | Try concise explanations inside Reading Lab first; require a repeated demand signal before a standalone curriculum. |
| 10 | AI tutor, community, broad gamification, additional language packs | Unproven | High and ongoing | Defer until a specific problem, expected benefit, privacy design, evaluation plan, and maintenance owner exist. |

### Feature disposition

**Improve now:** Learning-card clarity and stability; first-session and recovery paths; Persian educational content quality; offline and backup/sync reliability; privacy and source/provenance handling.

**Integrate before adding equivalents:** Dictionary with learning items; Reading Lab with selected vocabulary; mnemonic/visual support with relevant learner weaknesses; meaningful progress indicators into one understandable view.

**Simplify:** Keep the five-skill/adaptive engine, but present it through a straightforward Practice action. Reveal reference detail progressively. Keep the main navigation focused on Today, Kanji/learning, and Explore/reading.

**Defer:** A standalone grammar curriculum, large vocabulary expansion, AI tutoring/conversation, community features, complex gamification, many additional language interfaces, and app-store packaging before PWA quality is established.

### 2026-10-18 — Two proposed learner-owned study features

- **Kanji bookmarks — first:** a small, high-value improvement after release-critical gates. Save/unsave a kanji from Dictionary surfaces and revisit saved kanji through a dedicated list/filter. Keep it separate from FSRS review state and preserve stable identity, local persistence, backup/restore, and existing sync contracts.
- **Anki deck import — research-gated follow-on:** let a learner import a local `.apkg` deck and review supported cards in Rinemi. Begin with a bounded format-support contract, preview before import, explicit treatment of unsupported note types/templates/media, safe HTML/media handling, duplicate-import behavior, and validation that the existing review engine can own imported-card scheduling without creating a parallel scheduler.
- Detailed scope and acceptance gates: [Kanji Bookmarks & Anki Deck Import feature roadmap](FEATURE-ROADMAP-ANKI-IMPORT-AND-KANJI-BOOKMARKS.md).

These are **planned**, not implemented or release-ready. They must not delay Public Kanji release or override the canonical release blockers.

## 7. Strategic 6–12-month roadmap

This is a product-level sequence, aligned with but deliberately less detailed than the [Learning Effectiveness & Transfer Roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md). The canonical [`ROADMAP.md`](../ROADMAP.md) retains cross-stream release blockers, current status and execution order. Dates are planning windows from 2026-10-17, not completion claims.

### Phase 1 — Earn trust and validate the audience
**October–November 2026**

Prioritize reliable onboarding, Learning-card UX, practice recovery, offline/data integrity and privacy readiness; interview 8–12 Persian-speaking learners and observe real tasks. Do not increase scope while core release blockers remain.

**Exit evidence:** mandatory current-main release checks pass, critical progress-loss/navigation issues are resolved, first-session completion is measured, and target segments are supported by observed learner research. Initial pilot goal: ≥70% of onboarding starters finish a useful first session.

### Phase 2 — Establish Persian-first teaching quality
**December 2026–January 2027**

Audit a representative sample of meanings, readings, vocabulary, examples, mnemonics and confusing-character distinctions. Ensure the most common/useful reading explanation is clear and the reference information stays available without dominating the Learning card.

**Exit evidence:** sample-based editorial gate passes, corrections have provenance, and observed learners can explain tested meaning/reading distinctions. Detailed content rubric and sequence live in the educational roadmap and existing content audit.

### Phase 3 — Make kanji useful in reading
**February–April 2027**

Connect Reading Lab, Dictionary, known vocabulary and future practice. Use a small, reviewed and properly sourced collection of short texts. Keep content and learner-state authority within current engine boundaries.

After release-critical work is secure, ship a small **Kanji Bookmarks** increment: learners can save/unsave kanji from Dictionary surfaces and return to a saved-kanji list. This is a navigation/personal-organization feature, not a second review system; it must preserve existing kanji/card identity and leave FSRS, grading, evidence and learner state untouched.

**Exit evidence:** measure lookup-to-practice continuity, active use of reading, and comprehension on defined tasks. For bookmarks, measure whether learners revisit saved kanji and start a useful learning/practice action. Do not treat saves, word lookups, time spent, or immediate recognition alone as comprehension.

### Phase 4 — Add only the vocabulary breadth the reading path needs
**May–July 2027**

Pilot approximately 300–500 useful beginner words linked to kanji, readings, Persian meanings and reviewed examples. Expand only after the quality pipeline can be maintained.

**Exit evidence:** delayed recall/contextual recognition are acceptable in the pilot, content corrections remain tractable, and the core experience does not regress.

### Phase 5 — Choose expansion from evidence
**August–October 2027**

Decide among contextual grammar support, **Anki `.apkg` import**, and public-beta distribution based on retained-user needs. Before implementation, verify through learner interviews/tasks that an existing Anki collection is a meaningful switching barrier. Start with a constrained, explicitly documented set of supported note/card types and clear warnings for unsupported templates or media. Do not silently discard content, execute imported card JavaScript, or claim complete scheduling-history transfer until it is verified on representative decks. Do not automatically start a full grammar curriculum.

**Provisional beta signals:** at least 25% seven-day retention and 15% thirty-day retention among activated cohorts, measured with explicit denominators/windows and interpreted alongside delayed recall and reading-comprehension results. These are initial targets for validation, not industry benchmarks or proof of product-market fit.

## 8. Product scorecard and decision rules

Define denominator, cohort, window, exclusions, and source before comparing metrics. Use the educational roadmap for assessment validity and learning-outcome measurement.

| Metric | Why it matters | Initial decision rule |
|---|---|---|
| First-session completion | Did the learner reach the core value quickly? | Establish baseline; pilot target ≥70% of onboarding starters |
| Seven-day return | Is the value strong enough for a repeat study habit? | Aim for ≥25% in a mature beta cohort |
| Thirty-day return | Does usefulness persist beyond novelty? | Aim for ≥15% in a mature beta cohort |
| Lookup-to-practice continuity | Are Dictionary/Reading Lab connected to learning? | Establish baseline, then run one clearly defined improvement experiment |
| Reading transfer | Can learners use knowledge beyond the practiced card? | Use delayed/independent comprehension measures defined in the educational roadmap |
| Content quality | Can learners trust Persian explanations and examples? | Zero critical errors in reviewed release samples; maintain traceable corrections |
| Reliability | Can users safely depend on saved progress and offline use? | Mandatory release gates pass; no unresolved critical learner-data loss |
| Audience fit | Which segment gets recurring value? | Use interviews and cohort differences; do not infer fit from total signups alone |

Engagement does not establish learning, and learning does not necessarily require maximal session frequency. Pair retention measures with delayed/independent recall and comprehension. Respect the local-first promise; collect only the product measurements needed and avoid raw learner text or detailed learning records without a clear educational need and privacy review.

## 9. Expansion opportunities and risks

### Vocabulary and reading — first choice
Natural extension of existing kanji capability. Risk: poor coverage, inaccurate content, and high editorial maintenance. Control the scope with a reviewed, sourced starter collection.

### Contextual grammar — test before building
A grammar explanation shown when it helps a learner understand a sentence may improve Reading Lab utility. Risk: quickly turning into a separate curriculum with broad sequencing and assessment requirements. Start with in-context explanations and measure use and comprehension.

### Full Japanese-learning platform — long-term option only
Could broaden the audience through vocabulary, grammar, reading, listening and more. Risk: diluted positioning and unsustainable content breadth before product-market fit. Do not fund broad expansion until retention, user interviews and willingness-to-pay research justify it.

### Monetization
Keep the core daily learning loop accessible while trust and retention are being established. Consider premium curated content or advanced reading only after testing willingness to pay. Avoid premature subscription complexity or paywalling the core review experience without evidence.

## 10. Required checklist for future product work

Before committing a substantial feature, record:

1. **Target user and problem:** which learner segment and which observed problem?
2. **Evidence:** interview, observed task, content audit, or cohort measure?
3. **Current alternative:** how do users solve it now and why is that inadequate?
4. **Expected outcome:** what specific behavior or learning outcome should improve?
5. **Success measure:** metric, cohort, baseline, and decision threshold?
6. **Cost:** content, support, dependencies, licensing, privacy, testing, and maintenance?
7. **Architecture fit:** can existing learner model, planner, scheduler, and persistence seams be reused?
8. **Rollback:** how can the change be reversed without losing learner progress or leaving incompatible cached clients?
9. **Decision rule:** what result causes us to expand, revise, or stop?

If these questions have no evidence-based answer, research first rather than implementing by default.

## 11. Instructions for future Rinemi inspections

1. Fetch the actual latest `main` SHA and read current `ROADMAP.md`; never treat this document's baseline or a prior audit SHA as current.
2. Read this strategy alongside the canonical roadmap, [Learning Effectiveness & Transfer Roadmap](LEARNING-EFFECTIVENESS-ROADMAP.md), and [Educational Content Audit](EDUCATIONAL-CONTENT-AUDIT.md). They serve different purposes; do not merge them into one duplicate backlog.
3. Check active PRs and changed files before touching shared docs. Open PRs are candidates, not shipped implementation. Avoid simultaneous edits to root roadmap and shared audits; prefer one scoped change and coordinate cross-links only after concurrent edits are reconciled.
4. Inspect the relevant source, data, tests, active runtime path, and actual current-main results before changing code. Passing software tests do not demonstrate educational effectiveness.
5. Do not claim shipped status, merge/deployment, product-market fit, market uniqueness, or learning superiority without evidence.
6. Select the highest-priority incomplete task; set a measurable acceptance criterion before implementation.
7. Do not rebuild authoritative learning-engine components to solve a positioning or presentation issue. Prefer targeted changes, preserve stable identity/evidence seams, and avoid broad persistence migrations without a verified need.

## 12. Competitor sources

- [Anki](https://apps.ankiweb.net/) and [Anki FSRS FAQ](https://github.com/ankitects/anki/blob/main/docs-site/faqs/what-spaced-repetition-algorithm.mdx)
- [WaniKani](https://www.wanikani.com/)
- [Renshuu](https://www.renshuu.org/)
- [jpdb](https://jpdb.io/)
- [Bunpro](https://bunpro.jp/)
- [Public Persian/Japanese dictionary listing](https://play.google.com/store/apps/details?id=id.melatieduplay.dictionary.translator.persian.iran.japanese)
- [Mynawoo Japanese taught via Persian](https://mynawoo.com/courses/japanese-via-persian-306707101401)

Competitor features and terms can change. Re-verify official sources before publishing comparative claims. Feature presence does not establish comparative educational efficacy.
