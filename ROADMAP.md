# Kanji5 — Unified Product, Engineering & Public-Release Roadmap

> **Canonical roadmap:** this document is the forward-looking source of truth for Kanji5 product, engineering, public-release readiness, and the staged expansion from Kanji → Vocabulary → Context/Reading → Grammar.
>
> **Baseline:** \`main\` at commit \`6a21c08ca54bd29ac20612a2160b773a7f711960\` (2026-10-02).
>
> **Important status rule:** only work present on the current \`main\` baseline counts as complete. Open PRs and stale branches are tracked as pending/in-review work and must be rebased or rebuilt against the current \`main\` before being considered complete.

---

## 0. Product direction

Kanji5 started as a personal PWA for learning essential Japanese kanji. The project is now being prepared for broader public distribution.

The product must therefore satisfy two goals at the same time:

1. Preserve the strengths of the original personal tool:
   - local-first behavior
   - deterministic learning behavior
   - FSRS-based scheduling
   - adaptive learning
   - offline operation
   - lightweight daily practice
   - a calm, focused learning experience

2. Become robust enough for users who have never seen Kanji5 before:
   - clear product positioning
   - understandable onboarding
   - trustworthy data persistence and recovery
   - predictable account/sync behavior
   - installable and reliable PWA behavior
   - accessibility
   - responsive/mobile quality
   - performance
   - security and privacy
   - support and feedback paths
   - observable production failures
   - controlled release and migration processes

The product should expand in layers rather than turning into an all-in-one Japanese-learning platform prematurely.

### Product learning loop

**Learn → Recall → Review → Recover → Improve**

Vocabulary, Context/Reading, and Grammar must reinforce that loop rather than compete with it.

---

# 1. Architecture and product guardrails

These rules remain authoritative throughout the roadmap.

### 1.1 Learning-engine authority

- FSRS remains the scheduling authority.
- The v1.9 Learner Model remains the learner-state authority.
- Adaptive Planner remains the content-selection/planning authority.
- Recovery remains the recovery authority.
- Evaluation/grading remains the learning-engine authority.
- Persistence remains an engine concern, not a React concern.
- React remains presentation-only.
- Do not duplicate authoritative learner state inside React.
- Do not introduce a second scheduler for Vocabulary, Context, or Grammar.
- Domain-specific planning may influence practice selection but must feed through the existing scheduling/evidence seams.
- Do not rewrite the learning engine merely to make a new UI possible.
- Only verified defects justify reopening or rewriting authoritative engine behavior.

### 1.2 Cross-domain identity

Use stable domain-scoped Content IDs and separate Card IDs.

Examples:

- \`kanji:日\`
- \`vocabulary:jmdict:12345\`
- \`context:tatoeba:12345\`
- \`grammar:pattern:te-form\`

Card identity must remain separate from content identity and incorporate the learning skill/exercise identity where needed.

Do not use display strings as long-term identity.

### 1.3 Evidence

All learning domains should eventually emit a shared evidence envelope preserving:

- domain
- contentId
- mode/skill
- exercise
- outcome
- attempt type
- modality
- independent/recovery semantics
- grader/model/planner version metadata
- provenance/source version where relevant

Raw learner input should not be persisted unless the educational product explicitly requires it.

### 1.4 Offline-first

All core learning behavior must remain deterministic and usable offline.

External APIs are content providers or optional fallbacks, never authorities for learner state or learning logic.

### 1.5 Minimal-diff rule

Prefer targeted seams and adapters over wholesale rewrites.

Especially avoid:

- replacing FSRS
- replacing the Learner Model
- replacing the planner because of presentation needs
- large persistence migrations without measured need
- broad file restructuring during active feature work

---

# 2. Status legend

- **DONE** — verified as implemented on the current \`main\` baseline.
- **PARTIAL** — meaningful implementation exists but the complete product behavior is not finished.
- **PENDING** — required but not yet complete on current \`main\`.
- **BLOCKER** — must be completed before the dependent phase can be considered production-ready.
- **LATER** — intentionally deferred until evidence or scale justifies it.
- **DO NOT REOPEN** — completed foundational behavior that should not be rewritten without a verified defect.

---

# 3. Current baseline and already-completed foundations

The current \`main\` baseline is commit \`6a21c08ca54bd29ac20612a2160b773a7f711960\`, whose recent history includes:

- D1 — canonical cross-domain content identities
- D2 — shared evidence envelope
- D3 — deterministic cross-domain relationships

These are not hypothetical contracts anymore; concrete source modules and behavioral tests exist on \`main\`.

Current cross-domain files include:

- \`v2-domain-core.js\`
- \`v2-evidence-core.js\`
- \`v2-relationship-core.js\`
- \`v2-vocabulary-core.js\`
- \`v2-vocabulary-learning-core.js\`
- \`v2-vocabulary-view-core.js\`
- \`v2-vocabulary-contract-core.js\`
- \`v2-vocabulary-ui-adapter.js\`

Vocabulary already has foundation tests covering:

- identity
- normalization
- validation
- evidence
- recovery
- view models
- page contracts
- UI adapter behavior
- network normalization

Therefore, the next task is **not** to invent the Vocabulary foundation from scratch. The next task is to connect the existing foundation to a real runtime, stable local content, and the public product surface.

---

# 4. Phase 0 — Release Integrity & Real Baseline

## Goal

Establish a trustworthy production baseline before product expansion.

### 0.1 Runtime/bootstrap integrity — DONE / KEEP VERIFIED

- Ensure \`app-bootstrap.js\` is present and loaded by the production entry path.
- Preserve the correct runtime chain:
  \`index.html → app-bootstrap.js → v1.9-v2-boundary.js → react-entry.js → React presentation\`.
- Keep legacy runtime explicitly behind \`?legacy=1\`.
- Do not allow accidental legacy/default presentation fallback.

### 0.2 React artifact hygiene — DONE

- Keep \`react-dist/\` out of git.
- Generate shipped React artifacts during deployment.
- Build from source during CI/deploy.
- Verify the exact artifact that is shipped.

### 0.3 Deployment gates — IMPLEMENTED, MUST REMAIN VERIFIED

Current deployment workflow contains gates for:

- frontend typecheck
- frontend build
- shipped-artifact validation
- performance/font-loading contract
- service-worker shell contract
- release-integrity contract
- root contract/unit tests
- Playwright engine↔React boundary gate
- staged site verification
- live GitHub Pages artifact verification

A workflow definition is not evidence that a particular commit succeeded. Release records must distinguish:
- workflow configured
- workflow executed
- workflow passed
- live production verified

### 0.4 Cache and stale-client handling — BLOCKER BEFORE PUBLIC RELEASE

- Verify cache invalidation across HTML, JS, CSS, service worker, and dynamically imported assets.
- Verify stale-client recovery.
- Verify no previous release can trap a user in a broken asset graph.
- Treat dynamic-import failures as release blockers.
- Keep service-worker shell and runtime asset lists synchronized.

### 0.5 Production smoke test

For every release candidate:

- cold load
- repeat load
- hard refresh
- offline after first successful visit
- offline cold start where supported
- app restart
- learning session start
- card reveal
- answer/rating
- session completion
- stats refresh
- settings read/write
- backup export
- account state
- PWA update path

---

# 5. Phase A — Finish the Kanji Foundation

This phase makes the existing Kanji product trustworthy before new learning domains become first-class.

---

## A1. Release/runtime integrity

### DONE / PARTIAL

- \`app-bootstrap.js\` loading restored.
- \`react-dist/\` removed from git.
- CI builds React from source.
- production artifact checks exist.
- \`index.html\` substantially reduced and inline CSS removed.
- legacy path explicitly gated.

### PENDING

- verify live asset graph after every release
- verify cold/repeat offline behavior
- verify cache invalidation
- verify stale-client recovery
- measure startup on representative mobile devices
- track LCP/INP/CLS and long-task causes
- treat missing assets/font failures/dynamic imports/offline regressions as blockers

---

## A2. Learning / Active Recall

### Requirements

- Keep Learning and Active Recall conceptually separate.
- Learning Card must remain focused on:
  1. meaning/readings
  2. examples
  3. mnemonic
  4. stroke order
- Four card-page shortcuts must be real keyboard-accessible controls.
- Correct left-to-right shortcut ordering for the reversed conceptual sequence already defined by the product.
- Reliable next/previous navigation.
- Reliable swipe behavior.
- Rating/feedback stays in normal document flow above fixed-navigation clearance.
- Prevent answer/reveal UI clipping on mobile and with keyboard open.
- Preserve distinct Learning vs Active Recall information architecture.
- Keep first exposure, recall, guided practice, and recovery behavior understandable.
- Verify Production, Vocabulary, and Context exercise toggles reach the authoritative Active Recall engine.

### Session Details

The Learning page should **not** become a second Stats page.

Keep session feedback compact.

Do not restore analytics-heavy:
- mastery distribution
- seven-day analytics
- detailed session breakdown
- redundant skill analytics

to the Learning page.

Detailed analytics belong in Stats / Advanced Stats.

---

## A3. Stats correctness and information architecture

### Source-of-truth rules

- persisted learner exposure = source of truth for studied/seen/unseen
- learner-model states = source of truth for mastery buckets
- session aggregates = derived from authoritative session records
- React must not recompute authoritative learning state

### Fix and verify

- studied count
- unseen count
- mastery distribution
- skill percentages
- recent activity
- session aggregates
- first-open hydration
- refresh after underlying state mutation

Specifically prevent false states such as:
- previously studied users showing all skills at 0%
- 2,136 unseen after exposure exists
- mastery info not ready after normal startup

### Stats IA

Primary Stats should stay simple.

Add an explicit **Advanced Stats** layer for:

- attribute accuracy and attempt count
- recent vs lifetime performance
- recovery/repetition signal
- repeated-failure signal
- retention/progression when evidence exists
- attribute coverage
- mode distribution
- session completion
- average recalls
- trend

Do not create a dashboard maze.

Show insufficient evidence instead of misleading percentages.

---

## A4. Reading Lab

### Core bug/UX requirements

- Preserve entered text when scrolling.
- Preserve selected words.
- Preserve scroll position.
- Preserve analysis state.
- Dictionary lookup must be an in-place auxiliary action.
- Do not destructively navigate away from Reading Lab.
- Returning from lookup must preserve all progress.
- Do not require the user to redo word-by-word inspection.

### Navigation

- Focus Next / Next Unknown
- Next Unfamiliar
- unique coverage
- occurrence-weighted coverage
- hardest / most attention-demanding sentence

All must use authoritative mastery state where applicable.

### Audio / context roadmap

- sentence autoplay
- repeat sentence
- manual previous/next
- SRT/VTT synchronization
- clear active cue
- optional voice selection where browser support exists

### Support layer

- lightweight sentence translation/annotation
- contextual word support
- compact mastery micro-popover

### Boundaries

Reading Lab must not:
- become a scheduler
- mutate SRS
- mutate authoritative grading
- maintain a competing mastery model
- become a generic AI chat or all-in-one language tutor

### Reading library

Later:

- saved readings
- source/title metadata
- resume state
- sentence mining
- Vocabulary/SRS integration only after Vocabulary identity/content/learning foundations are mature

---

## A5. Dictionary

### Requirements

- Kanji tabs fit at 360/375/390px without overflow.
- preserve personal-mnemonic drafts through remounts/async loads
- predictable lookup/navigation state
- factual dictionary content separate from learner-state indicators
- readings, meaning, examples, stroke information prioritized
- avoid excessive density
- avoid navigation patterns that destroy Reading Lab state
- keep dictionary browsing distinct from active learning

---

## A6. Settings

### Requirements

- active-learning exercise toggles remain authoritative and test-backed
- Production/Vocabulary/Context toggles reach the engine
- stable Save Changes positioning
- remove duplicate Placement Test entry points
- document canonical Personal Mnemonics location
- Data Backup / Restore
- deterministic safe restore semantics
- destructive/reset actions secondary and clearly separated
- settings persist through reload/offline
- settings do not accidentally reset navigation/session state

---

## A7. Mnemonics / memory aids

### Information architecture

Clearly distinguish:

- curated prepared mnemonics
- generated/guided scaffolds
- personal mnemonics

### Requirements

- explain what each type is for
- ensure actual mnemonic content renders
- show provenance/type labels where needed
- do not imply generated material is curated
- adaptive disclosure
- preserve personal-mnemonic editing/persistence
- audit quality, not only coverage

Current milestone principle:

**100% coverage ≠ 100% quality.**

Continue auditing:
- semantic usefulness
- reading relevance
- ambiguity
- memorability
- malformed/missing entries

---

## A8. Responsive/accessibility/performance polish

### Responsive widths

Explicitly audit:

- 360px
- 375px
- 390px
- tablet
- desktop

### Accessibility

Target WCAG 2.2 AA-compatible behavior.

Audit:

- keyboard navigation
- focus visibility
- focus management
- screen-reader semantics
- live regions
- touch targets
- dialogs
- fixed bottom navigation clearance
- safe-area handling
- reduced-motion
- form/input semantics
- Japanese language tagging
- IME behavior
- error announcements

### Performance

Track:

- LCP
- INP
- CLS
- first interaction
- long tasks
- JS cost
- CSS cost
- font loading
- dynamic imports
- repeat startup
- offline startup

The previously observed poor startup/LCP behavior must be treated as a product issue, not a cosmetic issue.

Existing/open performance work must be rebased against current \`main\` before integration.

---

# 6. Phase B — Measurement and Learning Evidence

## B1. Core metrics

Every metric must clearly distinguish:

- exposure
- attempt
- card
- mastery
- completion

Metrics must reconcile with authoritative data.

## B2. Advanced Stats

Secondary and explicitly optional.

Expose:

- attribute accuracy
- attempt count
- recent vs lifetime
- recovery
- repeated failures
- retention/progression where evidence exists
- attribute coverage
- mode distribution
- session completion
- average recalls
- trend

Keep sample-size/evidence thresholds visible where interpretation is unstable.

Stats remain read-only.

## B3. Learning efficacy

Use deterministic evaluation to distinguish:

- product/runtime failures
- learner outcomes
- planner/recovery behavior

Do not automatically tune the planner from observational metrics.

---

# 7. Phase C — Content Quality

## C1. Kanji and mnemonic QA

Audit:

- missing content
- malformed content
- semantic usefulness
- reading relevance
- ambiguity
- generated mnemonic quality
- prepared-vs-generated provenance

## C2. Vocabulary QA policy

Before public Vocabulary release, define deterministic validation for:

- spelling
- reading
- glosses
- duplicates
- source/provenance
- source version
- linked Kanji
- frequency
- JLPT metadata where available
- POS
- rare/obsolete/unsuitable entries
- empty examples
- fallback selection

## C3. Context QA policy

Validate:

- Japanese sentence
- translation
- target-kanji placement
- malformed/empty content
- source provenance
- offline cache/fallback

---

# 8. Phase R — Public Product Readiness

This phase is the major addition caused by the transition from a personal project to a public product.

It sits **before broad Vocabulary/Grammar expansion**.

---

## R1. Product positioning

Define and expose:

- what Kanji5 is
- who it is for
- what the daily learning loop is
- what FSRS does
- what Learning vs Active Recall means
- expected daily commitment
- what requires an account
- what works offline

The first-open experience must not assume personal knowledge of the project.

---

## R2. Onboarding

### New user

Target flow:

**First Open → understand value → set daily goal → optionally create account → start first learning session**

### Returning user

Target flow:

**Open → today's work → learn/review → finish**

Onboarding must not repeatedly interrupt returning users.

---

## R3. Guest-first account model

Prefer:

- local use without mandatory sign-up
- optional account creation later
- explicit explanation of account benefits

Account benefits may include:

- cross-device sync
- recovery
- persistence beyond a single installation
- future cross-device features

Do not make account creation an unnecessary barrier to first learning.

---

## R4. Data safety / persistence

### Required public behavior

Verify:

- save
- reload
- browser restart
- tab close/reopen
- offline use
- account login
- account logout
- account return
- sync retry
- conflict handling
- backup restore
- migration from existing user state
- failure recovery

### Storage strategy

Do **not** start with a full IndexedDB rewrite just because public users are coming.

First establish a domain-neutral storage abstraction.

Conceptually:

- LearningStore
  - Kanji cards
  - Vocabulary cards
  - Evidence
  - Reviews
  - Sessions
  - settings

Then measure actual user-state size and write frequency.

Move to IndexedDB only when:
- volume
- browser quota
- write performance
- history retention
- cross-domain scale

justify it.

---

## R5. Review-history scalability

Current state is bounded/compacted rather than an unlimited event store.

Do not assume an obsolete numeric cap from older audits.

Required work:

- preserve a bounded operational review history
- preserve long-term aggregates separately
- prevent Stats degradation when raw history is compacted
- ensure analytics remain explainable after compaction
- later consider event/rollup storage in IndexedDB if usage warrants it

---

## R6. Backup / Restore

Make Backup/Restore a public-quality feature.

Backup must be:

- versioned
- deterministic
- integrity-checked
- migration-aware
- corruption-resistant
- safe against accidental overwrite

Restore must:
- validate before applying
- explain what will be changed
- avoid silent destructive replacement
- preserve compatibility with existing learner state

---

## R7. PWA installability

Audit the PWA across major supported platforms.

At minimum:

- Chrome Android
- Safari iOS
- Chrome desktop
- Edge desktop
- Safari macOS
- Firefox desktop

Verify:

- installability
- icon
- launch behavior
- standalone mode
- theme
- splash/start experience
- offline
- update behavior
- reinstall behavior

The current manifest should be rechecked for production install requirements, including appropriate icon sizing/assets.

---

## R8. Offline reliability

Define an explicit offline matrix.

Offline should support the core learning loop:

- learning
- Active Recall
- FSRS scheduling
- learner state
- prepared mnemonics
- local content
- essential dictionary/content already available locally

Network-only operations should degrade gracefully:

- account sync
- remote content fetch
- optional external APIs

On reconnect:

**local learning state → sync → conflict resolution → reconciled state**

No reconnect action may silently reset navigation or learning progress.

---

## R9. Browser compatibility policy

Define browser support tiers.

### Tier 1

- Chrome Android
- Safari iOS
- Chrome Windows/macOS
- Edge Windows

### Tier 2

- Safari macOS
- Firefox desktop
- other modern evergreen browsers where practical

Document:

- supported
- best effort
- unsupported

Do not promise unsupported platform behavior.

---

## R10. Internationalization

Separate:

**UI language** from **learning content language**.

Japanese content remains Japanese.

Internationalize:

- UI labels
- errors
- empty states
- dates
- numbers
- pluralization
- settings
- onboarding
- accessibility labels
- notifications

Keep engine behavior independent from presentation language.

---

## R11. Error handling and observability

Public users need actionable failure states.

Capture/handle:

- uncaught JS errors
- unhandled promise rejections
- sync failures
- data migration failures
- asset load failures
- service worker failures
- dynamic import failures

At minimum retain enough diagnostics to answer:

- what failed
- where
- which release/version
- browser/platform
- whether user data was affected

Do not introduce invasive analytics merely for observability.

---

## R12. Security

Perform a dedicated public-release security review.

Audit:

- XSS
- unsafe DOM injection
- \`innerHTML\` boundaries
- Content Security Policy
- auth/session handling
- Supabase RLS
- unauthorized read/write paths
- backup tampering
- sync abuse
- rate limiting where needed
- dependency vulnerabilities
- accidental secret exposure
- production source-map/data exposure
- third-party CDN dependencies

Any externally supplied text must be treated as untrusted content.

In particular, existing runtime \`innerHTML\` paths must be reviewed before external Vocabulary/Context text enters them.

---

## R13. Privacy and legal surface

Before broad release establish:

- Privacy Policy
- Terms of Use
- account/data deletion behavior
- data export behavior
- third-party service disclosure
- analytics/cookie policy if analytics are introduced
- content licensing/attribution policy
- third-party notices

Document what is:
- stored locally
- synced
- optional
- deleted on account deletion
- retained by third parties

Legal requirements must be reviewed against actual target markets and business model.

---

## R14. User help/documentation

Provide user-facing documentation for:

- How Kanji5 works
- How FSRS works at a user-appropriate level
- Learning vs Active Recall
- rating meanings
- what happens to data
- account/sync behavior
- backup/restore
- offline mode
- PWA installation
- common recovery steps

Documentation should be separate from developer architecture documents.

---

## R15. Feedback and support

Provide simple paths for:

- report a problem
- send feedback
- request a feature

Do not build a full community/social system.

Use feedback to identify:
- onboarding confusion
- recurring UX defects
- device/browser-specific issues
- content problems
- learning-flow problems

---

## R16. Content/data provenance for public users

Whenever relevant, expose provenance without overwhelming users.

Examples:

- source
- source version
- curated/generated status
- dictionary/provider origin

External providers must never silently become learning authorities.

---

## R17. Public product quality bar

A new user should be able to:

- open Kanji5
- understand what it does
- start without help
- complete a session
- understand the feedback
- close/reopen the app
- continue later
- use core learning offline
- recover from a failed sync
- backup/restore their progress
- install the PWA

without developer intervention.

---

## R18. Public Beta

Before broad release:

- recruit a small real-user cohort
- collect structured feedback
- test different device/browser combinations
- observe onboarding
- observe first session completion
- inspect sync/offline failures
- inspect content reports
- inspect performance
- inspect accessibility problems
- fix high-frequency/high-severity public issues

Do not interpret automated test success as proof of public usability.

---

## R19. Public Release Gate

Do not publicly promote Kanji5 beyond beta until:

- no known critical data-loss path
- no known critical asset/deploy path
- offline core learning works
- account/sync behavior is explainable
- backup/restore is reliable
- security pass is complete
- privacy/legal surface exists
- accessibility baseline is met
- major target browsers are validated
- onboarding is understandable
- public error reporting exists
- user documentation exists
- production smoke test passes

---

## R20. Scale Gate — intentionally later

Only after real usage justifies it:

- IndexedDB migration
- record/event-level sync
- more advanced telemetry
- backend scaling
- sync conflict tooling
- larger content indexes
- deeper performance optimizations

Scale work must be evidence-driven.

---

# 9. Phase D — Cross-domain Foundation

D1–D3 are already implemented on current \`main\`.

---

## D1. Canonical identity — DONE

Implemented:

- domain validation
- canonical Content IDs
- separate Card IDs
- identity schema version
- compatibility with existing Kanji identities

Covered domains:

- kanji
- vocabulary
- context
- grammar

---

## D2. Shared evidence envelope — DONE

Implemented/shared:

- cross-domain evidence shape
- outcomes
- content identity
- provenance/version metadata where available

---

## D3. Relationships — DONE

Implemented deterministic relationships.

At minimum support:

- vocabulary ↔ kanji
- vocabulary ↔ context
- room for grammar ↔ vocabulary/context

Relationships must remain deterministic and versionable.

---

## D4. Scheduling boundary — PENDING / BLOCKER FOR FULL VOCABULARY LEARNING

This is the correct interpretation of the earlier SRS concern.

Do not rewrite FSRS.

Do not build separate Vocabulary/Grammar schedulers.

Instead:

- define how domain/skill planning selects content
- create distinct card identities
- feed cards into the same authoritative scheduling authority
- allow planner priorities to influence selection
- preserve existing review semantics
- preserve daily-goal and session semantics
- preserve recovery behavior
- keep domain-specific evidence separate from scheduler mechanics

Target architecture:

**Domain content → skill/evidence → planner/session selection → Card identity → FSRS**

not:

**Kanji Scheduler + Vocabulary Scheduler + Grammar Scheduler**

---

## D5. Persistence/offline seam — PENDING

Minimum first step:

- domain-neutral storage abstraction
- explicit persistence ownership
- migration seams
- vocabulary/grammar records independent of Kanji-only assumptions
- offline-compatible content and learner state
- compatibility with existing Kanji state

Do not perform a large storage backend rewrite unless measured needs require it.

---

# 10. Phase E — Vocabulary MVP

Vocabulary is the first major learning-domain expansion.

The foundation is already substantially implemented.

---

## E1. Content model — FOUNDATION DONE / PIPELINE PENDING

Current foundation supports:

- domain
- contentId
- written form
- reading
- lemma
- glosses
- POS
- linked Kanji
- source/provenance
- source version
- normalization/validation

### Remaining

Build a public-quality local dataset pipeline.

Requirements:

- versioned source input
- deterministic build script
- deterministic normalization
- deterministic deduplication
- deterministic filtering
- provenance retention
- reproducible output
- attribution/license compliance
- sharded/local lazy-loadable content

JMdict is an appropriate candidate source, subject to current licensing/attribution review.

Do not make live \`kanjiapi.dev\` requests the core Vocabulary content authority.

---

## E2. Vocabulary content coverage

Vocabulary must include more than “words attached to a Kanji”.

Include:

- common multi-Kanji words
- kana-only words where pedagogically appropriate
- words whose identity cannot be derived merely from a single character lookup
- readings
- glosses
- POS
- frequency where available
- JLPT/level metadata where reliable
- source/provenance

The current per-Kanji API strategy is acceptable as a legacy/example fallback, not as the final Vocabulary database.

---

## E3. Vocabulary learning state — FOUNDATION DONE

Existing Vocabulary evidence model supports:

- unseen
- introduced
- retrievable
- stable
- exposure
- practice
- correct/wrong
- independent practice
- recovery
- mistake selection
- accuracy/error rate

Do not replace this state model unnecessarily.

---

## E4. Vocabulary learning modes — PENDING

Start with a small deterministic set.

Recommended initial learning loop:

1. introduction
2. guided recognition
3. reading/retrieval
4. contextual/word-completion practice
5. independent recall
6. recovery when needed
7. scheduled review

Prioritize:

- recognition
- reading
- word completion
- contextual use

Avoid over-relying on unrestricted English/Persian free-text meaning grading.

Any free-text meaning grading must use explicit accepted-answer sets/rules rather than a fuzzy external authority.

---

## E5. Vocabulary scheduler integration — BLOCKER

- reuse existing FSRS authority
- reuse session planning seams
- reuse recovery
- reuse evidence
- prevent a single global “Kanji new-card quota” from accidentally controlling the entire product
- define deterministic domain-aware selection without creating a second scheduler
- make user-visible daily counts understandable

The important distinction is:

**domain-aware card/content selection** versus **a new domain-specific scheduler**.

Only the former is allowed.

---

## E6. Vocabulary React UX

A React Vocabulary page shell already exists on an open branch, but the open PR is not current \`main\`.

When integrating, build from the current main baseline.

The final Vocabulary page should support:

- search
- status/stage filtering
- vocabulary detail
- linked Kanji
- evidence summary
- focused learning action
- mobile-friendly layout
- predictable navigation
- clear distinction between browsing and learning

Do not merge stale PR state without rebasing/rebuilding.

---

## E7. Vocabulary ↔ Dictionary relationship

Dictionary browsing:

**reference-first**

Vocabulary learning:

**learning-first**

A dictionary lookup should not silently mutate Vocabulary SRS state.

---

## E8. Vocabulary ↔ Reading Lab

Reading Lab should be able to provide a path:

**sentence → word → vocabulary identity**

but only after:

- stable vocabulary identity
- stable content metadata
- stable learner state
- reliable persistence

Reading Lab remains a workbench, not a competing scheduler.

---

## E9. Vocabulary stats

Add Vocabulary information into existing Stats architecture.

Do not create a separate vocabulary dashboard.

Only show detailed evidence when sample size is meaningful.

---

## E10. Vocabulary offline

Vocabulary core content should be locally available in versioned/sharded assets.

Offline learning must not depend on querying an external API.

External providers can be optional update/build sources.

---

## E11. Vocabulary acceptance gate

Complete only when all are true:

- stable identity
- validated dataset
- provenance/versioning
- deterministic grader
- evidence integration
- FSRS scheduling integration
- recovery integration
- session integration
- persistence/migration
- offline fallback
- browser E2E
- responsive/accessibility coverage
- public-facing UX
- content QA
- no accidental Kanji-only assumptions remain

---

# 11. Phase F — Context and Reading Integration

After Vocabulary is mature.

## F1. Context model

Define stable Context content identity.

Example:

\`context:tatoeba:12345\`

Keep:

- source
- source version
- Japanese sentence
- translation
- target placement
- linked Vocabulary
- linked Kanji

---

## F2. Context evidence

Use context as evidence for:

- comprehension
- recognition
- retrieval
- reading
- contextual use

Do not make context another duplicate SRS system.

---

## F3. Reading Lab integration

Target product chain:

**Text → Sentence → Word → Kanji → Mastery → Audio → Next focus**

Keep existing Reading Lab boundaries.

Do not let sentence analysis silently alter authoritative learner state unless the learning flow explicitly records an educational outcome.

---

## F4. Sentence mining

Add only after Vocabulary identity and persistence are stable.

Support:

- saved sentence
- source/title
- resume
- selected word
- linked vocabulary
- optional learning action

Maintain separation between:
- Reading Lab workbench state
- authoritative SRS learner state

---

# 12. Phase G — Grammar Foundation

Grammar follows Vocabulary and Context foundations.

---

## G1. Grammar content model

Replace hardcoded lesson content with versioned data.

Minimum schema:

- stable contentId
- grammar pattern
- explanation
- level
- prerequisites
- examples
- linked Vocabulary
- linked Context
- exercises
- provenance/source
- source version

---

## G2. GrammarGuide current state

Current GrammarGuide is still primarily a hardcoded reference/learning demo with progress held in \`sessionStorage\`.

This is acceptable as an interim reference surface.

The progress model should not be treated as authoritative learning state.

---

## G3. Grammar learning model

When learning flows are introduced:

- deterministic grammar evidence
- shared outcome/evidence contracts
- shared recovery semantics
- no independent scheduler
- grammar-specific exercise types
- explicit prerequisites
- content versioning

---

## G4. Grammar UX

Start with reference-first.

Then incrementally introduce:

- guided grammar understanding
- controlled practice
- contextual examples
- retrieval
- evidence-backed progression

Do not mix Grammar into the core Kanji Learning Card.

---

# 13. Phase H — Public Product Maturity after Vocabulary/Grammar

After public release foundations and initial domain expansion:

## H1. Content operations

- reproducible content builds
- dataset diffs
- content QA reports
- provenance checks
- license checks
- regression detection

## H2. Production quality

- error monitoring
- support triage
- browser-specific regression tracking
- sync reliability metrics
- performance regression tracking

## H3. Product iteration

Use real-user evidence to determine whether to invest in:

- deeper Vocabulary
- richer Context
- Grammar learning
- better Reading Lab
- better mnemonic quality
- accessibility
- mobile ergonomics

Do not expand breadth automatically.

---

# 14. Repository / architecture cleanup

These are important but should be scheduled carefully around active feature work.

## 14.1 Versioned filename cleanup — PENDING / LATER

There are many \`v1.x-*\` and \`v2-*\` files in the repository.

Long-term direction:

- engine/
- domain/
- learning/
- persistence/
- presentation/

Prefer names based on responsibility rather than historical version.

However:

- do not perform a broad rename while many feature branches are active
- do not invalidate current runtime contracts unnecessarily
- clean legacy incrementally after stable public seams exist

## 14.2 Global bridge cleanup — PENDING / LATER

Current React↔engine integration still relies on numerous \`window.__KANJI5_*\` globals.

Long-term:

- one typed ESM-facing bridge
- explicit API boundaries
- domain-aware typed contracts

But do not rewrite the boundary merely because it is aesthetically imperfect.

The existing boundary is useful and protective during the migration.

## 14.3 Test architecture — PENDING / LATER

Current suite is large and includes both source/contract tests and presentation/browser tests.

There are many source-text contract tests; they are useful historical guards but are more brittle than behavior-level module tests.

Long-term:

- Vitest or equivalent for reusable domain modules
- behavioral tests instead of source-string assertions where possible
- keep E2E for user-visible cross-layer behavior
- keep release-integrity contracts
- preserve historical migration tests only where they provide actual compatibility value

Do not stop feature work to rewrite the whole test suite.

## 14.4 Scripts organization — LATER

Move toward:

- scripts/ = build/release tooling
- tests/ = tests

Only perform this when it can be done without creating merge conflicts or losing historical verification.

---

# 15. Documentation cleanup

## Current problem

There are many historical roadmap/version documents.

Long-term:

- this \`ROADMAP.md\` is the canonical active roadmap
- historical plans/status documents may remain for auditability
- move obsolete historical docs to \`docs/archive/\` only when safe
- do not delete historical engineering evidence

## Version consistency

Unify version source between:

- package.json
- frontend/package.json
- release metadata
- UI display where used

Avoid manually synchronized version strings.

## Changelog

Move from an indefinitely empty “Unreleased” section to real release entries.

---

# 16. Competitive/product-quality guardrails

Kanji5 should remain differentiated through its actual learning behavior rather than feature count.

Keep these product boundaries:

- calm, focused Japanese-learning UX
- adaptive learning
- evidence-backed learner model
- deterministic offline behavior
- useful Kanji foundations
- Vocabulary and Context added as learning layers, not as unrelated utilities
- Grammar added after the earlier layers are trustworthy

Do not optimize for parity by copying every feature from WaniKani, Renshuu, Duolingo, Skritter, Ringotan, Kanji Study, or Anki.

Use other products as UX/content references, not as architecture authorities.

---

# 17. Current open work and merge hygiene

As of this roadmap baseline, several relevant PRs remain open and are based on older commits.

Examples include:

- Reading Lab coverage/focus work
- Vocabulary React page shell
- Learning session analytics separation
- startup/stroke-order performance work
- Stats exposure corrections
- Settings skill-toggle verification
- several earlier responsive/dictionary/learning-card branches

### Rule

An open PR is **not complete**.

Before integration:

1. rebase or rebuild against current \`main\`
2. re-run relevant tests
3. resolve any architecture drift
4. verify the implementation still matches the current roadmap
5. merge only after current-main verification

Do not merge merely because a PR title matches a roadmap bullet.

---

# 18. Detailed execution order

The roadmap has two levels: **product hardening** and **domain expansion**.

The current preferred order is:

**0. Release Integrity**
↓
**A1 Runtime integrity**
↓
**A3 Stats correctness**
↓
**A2 Learning / Active Recall**
↓
**A4 Reading Lab**
↓
**A5 Dictionary**
↓
**A6 Settings**
↓
**A7 Mnemonics**
↓
**A8 Responsive / Accessibility / Performance**
↓
**B Measurement / Advanced Stats**
↓
**C Content Quality**
↓
**R Public Product Readiness**
↓
**D4 Scheduling Boundary**
↓
**D5 Persistence / Offline Seam**
↓
**E Vocabulary MVP**
↓
**F Context + Reading Integration**
↓
**G Grammar Foundation**
↓
**H Public Product Maturity / scale-driven expansion**

### Parallelism rule

Where safe, work may proceed in parallel, but no implementation may bypass an authoritative seam.

Examples:

- content QA can run while UI polish occurs
- accessibility can run while Stats work occurs
- Vocabulary content pipeline can begin after dataset policy is defined
- public documentation can begin before the final public beta
- performance investigation can proceed while non-conflicting UI work continues

However, do not parallelize two changes that both alter the same engine boundary without coordination.

---

# 19. What is explicitly NOT required before public release

Do not block public readiness on:

- complete engine rewrite
- complete ESM migration
- replacing FSRS
- building a second scheduler
- full event-sourcing architecture
- social/gamification
- huge analytics dashboard
- AI grading authority
- all future Vocabulary features
- complete Grammar learning system
- complete repository renaming

---

# 20. Definition of Done

A roadmap phase is complete only when applicable:

1. implementation exists on current \`main\`
2. contract/unit tests pass
3. relevant browser E2E passes
4. typecheck/build passes
5. offline behavior is verified where relevant
6. no authoritative engine contract is bypassed
7. migration/persistence compatibility is verified
8. documentation reflects actual behavior
9. no stale PR is being treated as completed
10. public-facing UX is usable without developer knowledge for public phases

For public-release blockers, “implemented in code” is insufficient; the behavior must be exercised in the supported release environment.

---

# 21. Final release milestones

## Milestone M0 — Engineering baseline

**Result:** stable release pipeline, no critical runtime/deploy failures.

## Milestone M1 — Trustworthy Kanji product

**Result:** learning, Active Recall, Stats, Reading Lab, Dictionary, Settings, Mnemonics, mobile/accessibility, and performance meet the defined quality bar.

## Milestone M2 — Public Beta

**Result:** a new user can onboard, learn, return, work offline, recover data, and provide feedback.

## Milestone M3 — Public Kanji Release

**Result:** privacy/security/documentation/PWA/browser/support/recovery/release gates pass.

## Milestone M4 — Vocabulary MVP

**Result:** Vocabulary becomes a real learning domain using the existing cross-domain foundation and the same authoritative FSRS architecture.

## Milestone M5 — Context/Reading Integration

**Result:** Reading Lab can connect sentences, words, Kanji, mastery and audio without becoming a competing scheduler.

## Milestone M6 — Grammar Foundation

**Result:** Grammar becomes a structured, versioned reference-first domain with evidence-backed learning introduced incrementally.

---

# 22. Decision record from the pre-Vocabulary architecture review

The earlier architecture review identified five broad concerns:

1. SRS was still too Kanji-centric.
2. Review history was bounded.
3. Persistence remained localStorage/blob-oriented.
4. Vocabulary content was too dependent on a live third-party API.
5. Grammar content was still hardcoded.

The unified roadmap retains all five findings, but changes their priority:

### Finding 1 — retain as D4 Scheduling Boundary

Fix through a domain-neutral scheduling seam without rewriting FSRS or creating per-domain schedulers.

### Finding 2 — retain as persistence/analytics scalability

Preserve bounded operational history while separating long-term aggregates.

### Finding 3 — retain as D5 Persistence/Offline Seam

Introduce an abstraction first; migrate to IndexedDB/record-level sync only when actual scale requires it.

### Finding 4 — promote to Vocabulary content-pipeline blocker

Build a local versioned dataset and deterministic build process before public Vocabulary learning.

### Finding 5 — keep Grammar after Vocabulary/Context

Grammar reference can remain interim, but its authoritative learning model should come after the earlier domain seams are proven.

---

# 23. Current strategic conclusion

Kanji5 should **not** jump directly from the personal-project state into “add Vocabulary and Grammar”.

The correct transition is:

**Personal Kanji PWA**
→
**Trustworthy Kanji product**
→
**Public Product Readiness**
→
**Public Beta**
→
**Public Kanji release**
→
**Cross-domain runtime seams**
→
**Vocabulary MVP**
→
**Context/Reading integration**
→
**Grammar foundation**

The key architectural rule is:

**Make the current Kanji product trustworthy first, make the cross-domain seams real second, then add new learning domains without creating competing engines.**

This roadmap deliberately prefers measured migrations over speculative rewrites, preserves historical work for auditability, and treats real public-user reliability as a first-class product requirement.
