# Kanji 5 — Educational Model 2.0

> **Canonical educational specification**
>
> This document defines what Kanji 5 is trying to teach, how Japanese Kanji knowledge should be represented, how learning should progress, what counts as evidence of learning, and how the adaptive engine should use that evidence.
>
> It is the **source of truth for educational direction**. It is deliberately separate from implementation details and UI design.
>
> **Status rule:** this document defines the target educational model. It is not proof that every target capability is already implemented. Current implementation status is explicitly separated below.

**Spec version:** 2.0.0  
**Status:** normative product/learning design  
**Current baseline:** v2 presentation + v1.9 learning engine  
**Baseline commit when authored:** baa62d7f5e24357baab3933403cbe5d290d5cb10

---

## 1. Product definition

Kanji 5 is not intended to be a simple Kanji flashcard app.

The product goal is:

> **Build durable, usable Japanese orthographic knowledge by connecting Kanji form, semantic value, readings, words, and contextual use, while using retrieval practice, distributed review, and learner-specific adaptation to decide what to learn and practice next.**

The learner may see a single Kanji, but the knowledge being built is a network.

Core chain:

~~~text
Kanji form
  ↓
semantic representation
  ↓
reading candidates
  ↓
lexicalized readings in words
  ↓
word meaning
  ↓
contextual use
  ↓
retrievable and producible knowledge
~~~

The scheduler should therefore optimize more than card recall: it should support recognition, reading, interpretation, and production of useful Japanese containing the target Kanji.

## 2. Evidence base and pedagogical commitments

Kanji 5 adopts these evidence-aligned principles:

1. **Retrieval practice is a learning event, not merely assessment.** Retrieval generally improves later retention compared with restudy, particularly when retrieval is effortful and followed by feedback. [Rowland 2014](https://pubmed.ncbi.nlm.nih.gov/25150680/); [McDermott 2021](https://pubmed.ncbi.nlm.nih.gov/33006925/).
2. **Distributed practice matters.** Spacing learning and retrieval episodes over time generally improves long-term retention relative to massed repetition. [Cepeda et al. 2006](https://pubmed.ncbi.nlm.nih.gov/16719566/); [Mawson & Kang 2025](https://pubmed.ncbi.nlm.nih.gov/40564553/).
3. **Feedback is part of learning.** Retrieval should normally be followed by corrective information, particularly after errors or uncertainty. [Binks 2018](https://pubmed.ncbi.nlm.nih.gov/29929801/).
4. **Japanese Kanji reading is not adequately represented by a simple character-to-sound table.** Japanese Kanji words show lexical frequency, reading consistency, orthographic, phonological, and semantic effects; L2 reading performance can depend strongly on the word containing the character. [Kang & Saito 2025](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/phonological-processing-of-japanese-kanji-word-by-l1-chinese-learners-of-japanese-verification-of-consistency-and-frequency-effects/3D8611EC3445D7034F54C77A2392AECE).
5. **Japanese Kanji knowledge connects orthography, phonology, and semantics.** Kanji 5 should therefore model these relationships instead of treating them as unrelated card fields. [Sakuma et al. 1998](https://pubmed.ncbi.nlm.nih.gov/9519698/); [Chen et al. 2007](https://pubmed.ncbi.nlm.nih.gov/17546732/).
6. **Components can contribute to Kanji processing.** Component information may therefore be useful for encoding and phonological guidance where it is genuinely supported. [Masuda & Saito 2002](https://pubmed.ncbi.nlm.nih.gov/12081412/).

These studies justify the direction, not one fixed algorithm. Kanji 5 should measure its own outcomes and revise rules when internal evidence contradicts assumptions.

---

## 3. Core conceptual correction

Do not treat the product mentally as:

~~~text
Kanji
├── Meaning
├── Reading
├── Production
├── Vocabulary
└── Context
~~~

That is a useful implementation grouping but an incomplete educational model.

The canonical mental model is a graph:

~~~text
Kanji ↔ Sense
  ↕
Reading ↔ Word ↔ Word Reading
  ↕          ↕
Component   Context
~~~

A Kanji is a hub connecting orthographic form, semantic information, readings, lexical items, contexts, components, confusable forms, and learner evidence.

## 4. Canonical knowledge entities

### 4.1 Kanji

A written character-level orthographic item.

Minimum data: character, stroke count, Jōyō/educational metadata, frequency, and available JLPT/grade metadata.

Target data: components, radical, visual confusables, semantic components, phonetic components.

### 4.2 Sense

A semantic concept or gloss cluster associated with a Kanji.

Target data:

~~~text
senseId
kanjiId
coreGloss
secondaryGlosses
semanticNotes
usefulness / frequency
~~~

An English gloss is a cue, not the entire semantic representation.

### 4.3 Reading

A distinct phonological representation associated with a Kanji.

Target data:

~~~text
readingId
kanjiId
reading
type: on | kun | nanori | other
commonness
lexicalized/productive status
~~~

A reading candidate is not automatically an equally important learning target.

### 4.4 Word

A lexical item is the primary bridge between Kanji knowledge and Japanese language use.

Target data:

~~~text
wordId
written
reading
senses
partOfSpeech
frequency
register
difficulty
kanjiIds
provenance
~~~

### 4.5 Context

A real Japanese usage instance.

Target data: sentence, translation, target word/Kanji, source, difficulty, register, content version.

Context is not merely a harder quiz. It supplies transfer into sentence-level use.

### 4.6 Component

A structural/visual sub-unit of a Kanji.

Do not conflate Kangxi radical, graphical component, semantic component, and phonetic component. They can be related but are not identical concepts.

### 4.7 Confusion relation

Target relation types:

~~~text
visual-confusion
reading-confusion
semantic-confusion
lexical-confusion
component-confusion
~~~

The relation should be able to carry evidence and learner-specific strength.

---

## 5. What exactly is being learned?

Kanji knowledge is multidimensional. At minimum distinguish:

~~~text
orthographic recognition
semantic recognition
reading recognition
reading recall
lexical reading
meaning-in-word
Kanji production
word production
contextual comprehension
contextual production
~~~

Not every dimension needs its own long-term FSRS card. The learner model and task model may track finer-grained evidence than the card scheduler.

## 6. Reinterpret the five current skills

Keep the existing five learner-facing skill families:

1. Meaning
2. Reading
3. Production
4. Vocabulary
5. Context

However, treat them as **task families**, not five isolated facts stored independently.

Meaning = retrieve semantic information from written form.

Reading = retrieve pronunciation information from written form or a word.

Production = retrieve the correct orthographic form from a cue.

Vocabulary = integrate the target Kanji into a lexical item.

Context = transfer the knowledge into sentence-level processing/use.

All five should operate on the same underlying knowledge graph.

---

## 7. Learning experience vs Active Recall

### Learning

Purpose: orientation, encoding, organization, explanation, and low-friction first retrieval.

Learning should answer:

> What is this, how does it work, and what should I associate it with?

### Active Recall

Purpose: retrieval practice, discrimination, production, consolidation, and transfer.

Recall should answer:

> Can you retrieve and use this without looking at the answer?

### UX rule

Do not force a pre-question before every learning card simply because pretesting can sometimes help. It should be optional and evidence-driven, not a universal gate that slows the primary learning flow.

Default:

~~~text
Learn → brief first retrieval → continue
~~~

---

## 8. Canonical new-Kanji learning sequence

### Stage A — Orient

Show the Kanji, core meaning, primary useful reading(s), stroke count, and compact structural information. Do not overwhelm the learner with exhaustive rare readings.

### Stage B — Encode

Connect form ↔ meaning ↔ primary reading, then connect one or more high-value words.

### Stage C — Lexicalize

Show selected words that instantiate important readings. The goal is to teach that readings become meaningful in lexical environments.

### Stage D — First retrieval

Immediately after meaningful exposure, use a short, low-friction retrieval task. Prefer retrieval over passive rereading.

### Stage E — Reinforce

Use additional retrieval tasks selected according to learner evidence.

### Stage F — Transfer

Later, use word and context tasks.

---

## 9. Reading pedagogy — major target redesign

A simple Kanji → list of readings model is not sufficient for Japanese.

Target reading ladder:

~~~text
Level 1 — recognize a useful reading
Level 2 — Kanji → reading recall
Level 3 — word → reading recall
Level 4 — context → reading recall
Level 5 — normal spontaneous reading
~~~

A learner who can answer “学 → がく” has not necessarily demonstrated mastery of “学生 → がくせい”. Conversely, word-level reading evidence can be stronger evidence for practical reading ability than isolated-character recall.

Japanese reading research supports the importance of lexical frequency and reading consistency, particularly for L2 learners. [Kang & Saito 2025](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/phonological-processing-of-japanese-kanji-word-by-l1-chinese-learners-of-japanese-verification-of-consistency-and-frequency-effects/3D8611EC3445D7034F54C77A2392AECE); [Hashimoto et al. 2026](https://pubmed.ncbi.nlm.nih.gov/42530480/).

### Reading type

Retain explicit labels for on, kun, nanori, and exceptional/other readings, but treat these as descriptive metadata. The pedagogical target is useful reading knowledge in real lexical environments.

---

## 10. Okurigana must be first-class

For Kun'yomi, distinguish the Kanji portion from the following Kana.

Conceptual structure:

~~~text
食べる
Kanji stem: 食
okurigana: べる
full reading: たべる
~~~

The canonical-reading model should be extended rather than replaced. Reading evidence should be able to distinguish raw form, stem Kana, okurigana, full Kana, and reading type.

---

## 11. Vocabulary becomes the primary bridge

Vocabulary should not remain merely one more exercise mode.

The preferred learning relationship is:

~~~text
Kanji
 ↓
high-value word
 ↓
word reading
 ↓
word meaning
 ↓
context
~~~

For each new Kanji, select a small number of high-value words rather than dumping a dictionary list.

Word selection should consider:

~~~text
lexical frequency
usefulness
relevance to the target Kanji
reading coverage
learner level
prior exposure
content quality
~~~

Rare words should not be promoted simply because they contain the target Kanji.

## 12. Word families

Target capability:

~~~text
学
├── 学ぶ
├── 学生
├── 学校
├── 大学
├── 学習
└── 科学
~~~

The purpose is reusable lexical structure, not list memorization.

---

## 13. Production has two different problems

### Character production

meaning / cue → Kanji

This tests orthographic retrieval.

### Lexical production

meaning / context → Japanese word

This tests usable language production.

A learner can know 学 without being able to produce 学習. Do not collapse character production and word production into one mastery score.

---

## 14. Meaning learning

Prioritize:

1. core semantic concept
2. common glosses
3. high-value lexical examples
4. contextual disambiguation where needed

Do not require mastery of every dictionary sense before useful usage is established.

---

## 15. Context learning

Keep the existing Kanji-cloze concept, but expand it into a transfer ladder:

~~~text
Context Level 1 — identify target Kanji
Context Level 2 — read target word
Context Level 3 — infer meaning
Context Level 4 — produce target Kanji
Context Level 5 — choose/produce the appropriate lexical item
~~~

Not every learner needs every level immediately.

---

## 16. Component learning

Component information should become an optional encoding aid.

~~~text
Kanji
 ↓
component decomposition
 ↓
semantic / phonetic clues where valid
 ↓
memory organization
~~~

Do not infer historical etymology from visual coincidence. Verified linguistic information and learner mnemonics must be explicitly distinguishable.

## 17. Mnemonics

Mnemonics are a support tool, not the core learning method.

Recommended order:

~~~text
understand → connect → retrieve → space → retrieve again
~~~

Mnemonics should be optional, concise, memorable, and clearly labeled. Never present a fabricated mnemonic as etymology.

---

## 18. Stroke order and handwriting

Stroke count is metadata; stroke order and handwriting are distinct knowledge.

Target progression:

~~~text
visual recognition
→ component/shape knowledge
→ stroke-order recognition
→ optional handwriting production
~~~

Handwriting should be optional advanced functionality, not a mandatory blocker for the faster reading-first path.

---

## 19. Graduated retrieval

Target ladder:

~~~text
Recognition
   ↓
Cued recall
   ↓
Free recall
   ↓
Lexical recall
   ↓
Production
   ↓
Contextual transfer
~~~

Task metadata should encode the retrieval level rather than hardcoding it in presentation code.

---

## 20. Error taxonomy

Wrong/correct alone is insufficient for long-term adaptive learning.

Reading error classes may include:

~~~text
unknown
wrong reading
wrong script
wrong okurigana
wrong lexical reading
acceptable alternative
~~~

Production error classes may include:

~~~text
unknown
wrong Kanji
visual confusable
semantic confusable
near miss
~~~

Vocabulary error classes may include wrong word, wrong reading, wrong Kanji, and wrong lexical choice.

Context error classes may include unknown, wrong Kanji, wrong lexical item, and context misunderstanding.

Only record distinctions the grader can establish deterministically. Never manufacture false precision.

---

## 21. Unknown vs wrong vs near-miss

Maintain the existing distinction:

~~~text
unknown
= learner explicitly reports insufficient knowledge

wrong
= learner attempted retrieval but retrieved an incorrect answer

near-miss
= response is demonstrably close under an explicit deterministic rule

correct
= accepted target obtained
~~~

These events should not create identical learner-model updates.

---

## 22. Recovery

Recovery is immediate educational repair:

~~~text
attempt
 ↓
feedback
 ↓
bounded repair
 ↓
retry same target
 ↓
recovery evidence
~~~

Recovery must remain task-specific, session-scoped, bounded, and evidence-producing. It must never become a second scheduler.

---

## 23. Mastery is multidimensional

Do not define “Kanji mastery” as a single score.

Example:

~~~text
Kanji: 読
Meaning: mastered
Reading: stable
Production: weak
Vocabulary: learning
Context: unseen
~~~

This is a valid learner state.

---

## 24. Evidence strength

The learner model should not react strongly to one lucky answer or one accidental mistake.

Conclusions should consider:

- number of attempts
- recency
- consistency
- repeated errors
- recovery behavior
- task difficulty
- content validity

High accuracy over two recent attempts is not equivalent to high accuracy across repeated spaced retrievals.

---

## 25. Separate performance from retention

Core invariant:

~~~text
momentary performance ≠ durable learning
~~~

Distinguish immediate performance, short-lag retrieval, scheduled retention, and repeated spaced success. Later spaced evidence should carry greater weight for claims about durable acquisition.

---

## 26. FSRS ownership

Keep the existing ownership boundaries:

~~~text
FSRS → when the card becomes due
Learner Model → what evidence says about knowledge
Adaptive Planner → which educational task to do now
Recovery → immediate bounded repair
Session Engine → execution/persistence of the session
Presentation → UI only
~~~

No hidden second card scheduler should emerge.

---

## 27. Adaptive new-item load

The current “5 new Kanji per day” setting is a product default, not a pedagogical law.

Target:

~~~text
dailyNewTarget = user setting
adaptiveNewRange = bounded range
~~~

The system may reduce or increase new-item exposure within a bounded range when evidence indicates unusually high cognitive load or unusually low review burden. Changes must be explainable and not drastic.

---

## 28. Curriculum priority

Raw newspaper frequency alone should not determine the whole curriculum.

Target priority signals:

~~~text
frequency
× lexical productivity
× usefulness
× learner prerequisites
× component reuse
× reading coverage
× current learner state
~~~

The exact formula must be versioned and testable.

---

## 29. Soft prerequisite graph

Target capability:

~~~text
Kanji A
 ↓
components / related knowledge
 ↓
high-value words
 ↓
Kanji B
~~~

Prerequisites should normally be soft. The planner may avoid unnecessary difficulty while still allowing exceptions.

---

## 30. Learner-specific confusion graph

Generic smart distractors are useful but not enough.

Target:

~~~text
learner error history
 ↓
confusion graph
 ↓
contrastive practice
~~~

Example pairs can be visual or semantic confusables. The important point is that the system learns which confusions matter for this learner and targets them intentionally.

---

## 31. Task model

A future task should be represented independently from the presentation:

~~~text
taskId
knowledgeTarget
taskFamily
retrievalLevel
difficultyBand
stimulus
expectedResponse
contentId
contentVersion
reason
provenance
~~~

This allows the learner model to reason at the correct granularity.

---

## 32. Adaptive planner objective

The planner should approximate:

> **highest expected educational value per unit of learner effort and session time**

subject to due/review requirements, learner evidence, task availability, anti-repetition, bounded recovery, session length, content quality, and user settings.

It should not simply maximize the weakest numeric attribute.

---

## 33. Required planner behaviors

Retain the existing concepts:

### repair
Fix a recent failure.

### reinforce
Strengthen weak but established knowledge.

### recover
Verify that recently improving knowledge is becoming stable.

### maintain
Preserve stable knowledge.

### explore
Acquire first evidence for a poorly observed dimension.

These are pedagogical intents, not necessarily user-facing difficulty labels.

---

## 34. No mode should monopolize a learner

A weak skill should not automatically receive every subsequent task.

The planner should balance targeted repair with coverage of other meaningful dimensions. A mode may dominate temporarily only when explicit evidence justifies it.

---

## 35. Content quality is learning quality

A learner failure caused by bad content is not valid learner evidence.

Vocabulary and Context providers need validation, deduplication, provenance, deterministic fallback, and malformed-content rejection.

External APIs remain content providers only; they are not authoritative graders.

---

## 36. Audio

Target audio graph:

~~~text
Kanji
 ↓
Word
 ↓
Reading
 ↓
word audio
 ↓
sentence audio
~~~

Audio is particularly valuable for lexicalized readings and contextual use. Browser TTS may remain a convenience layer rather than the sole authoritative pronunciation source.

---

## 37. What must remain deterministic

The following should remain local and testable:

- normalization
- canonical answer logic
- acceptable answer sets
- learner-model projection
- planner scoring
- recovery state machine
- evaluation metrics
- content validation

Remote APIs may provide content. They must not become the authoritative learning or grading logic.

---

## 38. What should NOT be added just because it sounds intelligent

Avoid:

- LLM grading as authoritative judge
- hidden automatic planner tuning
- opaque AI mastery scores
- arbitrary difficulty labels
- forced mnemonics
- forced handwriting
- exhaustive rare-reading memorization
- random vocabulary dumps
- mandatory pretesting before every learning item
- multiple overlapping schedulers
- one aggregate Kanji score

More complexity is not automatically better pedagogy.

---

## 39. Canonical learning architecture

~~~text
CONTENT GRAPH
Kanji ↔ Reading ↔ Word ↔ Sense ↔ Context
        ↕
Components / Confusions / Prerequisites
        ↓
LEARNING EXPERIENCE
orientation → encoding → first retrieval → lexicalization
        ↓
ACTIVE RECALL
recognition → cued recall → free recall → production → context
        ↓
OUTCOME
correct / wrong / unknown / near-miss / recovery
        ↓
LEARNER MODEL
knowledge by target × dimension
        ↓
ADAPTIVE PLANNER
repair / reinforce / recover / maintain / explore
        ↓
SESSION
bounded execution + feedback + persistence
        ↓
FSRS
long-term card scheduling
~~~

The presentation layer is outside this stack.

---

## 40. Current implementation mapping

### Implemented or substantially implemented

- FSRS card scheduling
- separate Meaning / Reading / Production / Vocabulary / Context task families
- deterministic grading
- versioned educational outcomes
- unknown outcome
- evidence-aware learner model
- adaptive planner with repair/reinforce/recover/maintain/explore concepts
- bounded recovery
- session persistence/resume
- content validation and deterministic fallback
- offline-first learning core
- stable v2 presentation contracts
- separate Learning and Active Recall experiences at the current presentation/session boundary

### Partially implemented / needs extension

- reading as learner-state evidence beyond generic Kanji-level recall
- canonical On/Kun/okurigana representation
- adaptive Vocabulary/Context selection
- intelligent distractors
- frequency-aware content selection
- contextual recall
- production recall
- feedback and recovery diagnostics

### Target / not yet complete as a system

- full Kanji ↔ Reading ↔ Word ↔ Sense ↔ Context graph
- word-level reading mastery
- lexicalized reading tracking
- semantic/phonetic component model
- learner-specific confusion graph
- soft prerequisite graph
- structured error taxonomy
- graduated retrieval ladder
- word-family learning
- explicit separation of character production vs lexical production in the learner model
- adaptive new-item load
- optional mnemonic system with provenance/accuracy labels
- stroke-order learning and optional handwriting layer
- richer audio graph
- retention-vs-immediate-performance analysis

---

## 41. Learning-engine roadmap after the current v2 line

### P0 — Educational data model

Define versioned schemas for Kanji, Sense, Reading, Word, Context, Component, Confusion, LearnerTarget, and Task.

Deliverable: one canonical representation of Japanese Kanji knowledge.

### P1 — Lexicalized Reading

Implement Kanji+Reading, Word+Reading, Okurigana, reading commonness, and lexical evidence.

Deliverable: reading learning stops being only a Kanji-level list.

### P2 — Encoding + graduated retrieval

Implement orientation → encoding → first retrieval → cued recall → free recall → production → context.

Deliverable: Learning and Active Recall become pedagogically coherent end-to-end experiences.

### P3 — Vocabulary graph + word families

Implement high-value word selection and lexical relationships.

Deliverable: Kanji knowledge becomes connected to usable Japanese vocabulary.

### P4 — Error taxonomy + confusion graph

Implement deterministic error categories and personalized confusion pairs.

Deliverable: the system understands what kind of mistake occurred.

### P5 — Components + mnemonic support

Implement validated component metadata and optional learner mnemonics.

Deliverable: difficult Kanji become easier to encode without presenting false etymology.

### P6 — Context transfer + audio

Expand context levels and connect word/sentence audio.

Deliverable: transfer from isolated Kanji knowledge to actual language processing.

### P7 — Optional handwriting

Add stroke order and handwriting only after reading/lexical architecture is stable.

### P8 — Educational evaluation

Measure retention, lexical transfer, contextual transfer, error recovery, coverage, time/effort, and new-item load.

Deliverable: claims about better learning become evidence-based.

---

## 42. Mastery contract

Do not declare a Kanji mastered merely because FSRS stability or immediate accuracy is high.

Durable educational mastery should require sufficient evidence across the intended learning objectives, typically semantic + reading + lexical evidence, with production/context added when those objectives are part of the learner's path.

Therefore:

~~~text
FSRS stability ≠ educational mastery
~~~

---

## 43. UX constraint

The educational engine can be sophisticated while the UI remains simple.

Preferred primary navigation:

~~~text
Learning
Active Recall
~~~

Internal concepts such as repair, confidence, momentum, and recovery should not become additional navigation tabs merely because they exist in the engine.

---

## 44. Canonical future-AI handoff

When a future assistant is shown this repository, this document should be treated as the **canonical educational context**.

The assistant should understand immediately:

1. Kanji 5 is a Japanese Kanji learning system, not merely an SRS card viewer.
2. The current engine is already strong in scheduling/adaptation architecture.
3. The next major educational work is linguistic representation and Japanese-specific pedagogy, especially the Kanji → Reading → Word → Context graph.
4. Meaning, Reading, Production, Vocabulary, and Context remain task families, not isolated knowledge silos.
5. FSRS remains the sole long-term card scheduler.
6. Learner-model attributes guide task selection but must not become a second scheduler.
7. Learning and Active Recall are separate experiences.
8. Reading must eventually be represented at lexical/contextual granularity.
9. Vocabulary is the bridge between Kanji knowledge and actual Japanese.
10. Future features must be evaluated against this model rather than added as isolated modes.

### Canonical keywords

~~~text
Educational Model 2.0
Kanji knowledge graph
lexicalized reading
graduated retrieval
encoding layer
learner target
attribute-level evidence
word-family learning
confusion graph
soft prerequisite graph
error taxonomy
retention vs performance
FSRS = card scheduler
planner = task selector
recovery = bounded repair
Learning ≠ Active Recall
~~~

When the user says “بر اساس مدل آموزشی جدید Kanji5 بررسی کن”, the intended reference is this document.

---

## 45. Decision rules for future changes

### Rule 1 — Name the knowledge relationship

Every major feature must state what knowledge relationship it teaches.

### Rule 2 — Name the evidence

Every learner-facing task should generate interpretable evidence.

### Rule 3 — Store evidence at the correct granularity

Do not store a word-level fact as proof of generic Kanji mastery.

### Rule 4 — Preserve ownership boundaries

~~~text
content → data layer
grading → grader
knowledge estimation → learner model
task selection → planner
immediate repair → recovery
long-term due date → FSRS
presentation → React
~~~

### Rule 5 — Guard against bad content

Content failure must never silently become learner failure.

### Rule 6 — Prefer educational value over complexity

A more complicated algorithm is not automatically a better learning algorithm.

---

## 46. Definition of the target product

Kanji 5 should eventually be able to represent a character such as 生 with different learner evidence for:

~~~text
meaning
individual useful readings
specific lexical readings
high-value words
word meanings
context comprehension
Kanji production
visual confusions
components
~~~

It should then be able to select a task such as a word-level reading problem when the learner already has strong isolated-character reading evidence but weak lexicalized reading evidence.

That is the central target of Educational Model 2.0.

---

## 47. Final invariant

> **Kanji 5 must optimize durable Japanese language knowledge, not merely high flashcard scores.**

Therefore:

~~~text
better recall
≠
better Kanji learning
unless
the recalled knowledge transfers to
meaning + reading + words + context
~~~

The engine, learner model, planner, content graph, and UI remain subordinate to that objective.

---

## References

- Rowland, C. A. (2014). [The effect of testing versus restudy on retention](https://pubmed.ncbi.nlm.nih.gov/25150680/).
- McDermott, K. B. (2021). [Practicing Retrieval Facilitates Learning](https://pubmed.ncbi.nlm.nih.gov/33006925/).
- Cepeda, N. J. et al. (2006). [Distributed practice in verbal recall tasks](https://pubmed.ncbi.nlm.nih.gov/16719566/).
- Mawson, R. D. & Kang, S. H. K. (2025). [The Distributed Practice Effect on Classroom Learning](https://pubmed.ncbi.nlm.nih.gov/40564553/).
- Binks, S. (2018). [Testing enhances learning](https://pubmed.ncbi.nlm.nih.gov/29929801/).
- Sakuma, N. et al. (1998). [Orthography and phonology in reading Japanese kanji words](https://pubmed.ncbi.nlm.nih.gov/9519698/).
- Hino, Y. et al. (2011). [Orthographic-phonological and orthographic-semantic relationships for Japanese kana and kanji words](https://pubmed.ncbi.nlm.nih.gov/21557009/).
- Chen, H.-C. et al. (2007). [Homophonic and semantic priming of Japanese Kanji words](https://pubmed.ncbi.nlm.nih.gov/17546732/).
- Masuda, H. & Saito, H. (2002). [Interactive processing of phonological information in reading Japanese Kanji](https://pubmed.ncbi.nlm.nih.gov/12081412/).
- Kang, N. & Saito, S. (2025). [Phonological processing of Japanese Kanji words in L2 learners](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/phonological-processing-of-japanese-kanji-word-by-l1-chinese-learners-of-japanese-verification-of-consistency-and-frequency-effects/3D8611EC3445D7034F54C77A2392AECE).
- Hashimoto, K. et al. (2026). [Lexical and character-based sublexical processing in Japanese Kanji reading](https://pubmed.ncbi.nlm.nih.gov/42530480/).

---

## Document governance

**Source-of-truth order:**

1. This document for educational intent and target pedagogy.
2. ARCHITECTURE.md for runtime ownership and dependency direction.
3. Roadmaps for implementation status.
4. Source code and tests for what is actually implemented.
5. README and CHANGELOG for user-facing summaries.

When these disagree, do not silently assume the target model is already implemented. Mark implementation status explicitly and reconcile the relevant document or code.