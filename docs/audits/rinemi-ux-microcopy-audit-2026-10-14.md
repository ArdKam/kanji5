# Rinemi UX Microcopy Audit & Cleanup
**Date:** 2026-10-14  
**Base:** `main` at `0012831e6c17318d71b9d999a2e2fe8441e1a4d1`  
**Scope:** React app copy, Fa/En translation dictionaries, targeted conditional states, accessible names, and interaction copy.  
**Approach:** Remove duplicated helper layers rather than reduce words indiscriminately. Preserve learning content, error/status feedback, safety constraints, and scientific/data caveats.

## Decision key
- **A / P0 — Remove:** redundant text that repeated a title, placeholder, action, or adjacent label.
- **B / P1 — Shorten:** retain useful meaning in fewer words.
- **C / P1 — Relocate/conditional:** show the note at the point of need or only after the relevant section is opened.
- **D / P2 — Preserve:** information affects user decisions, correct interpretation, accessibility, security, or learning.

## Audit inventory and decisions

| Surface / component | Candidate text or pattern | Decision | Reason / implementation |
|---|---|---|---|
| Global tools menu — `App.tsx` | Grammar, Reading Lab, Prepared Mnemonics, Stats, Settings hint lines | **A / P0** | Icons and clear destination titles already identify the actions. Removed the five redundant `<small>` lines while retaining button accessible names, destinations, and focus behavior. |
| Practice home — `PracticeHome.tsx` | Generic intro below “Practice”; topics explanation below “Learn by topic” | **A / P0** | Both restated the two visible paths or the title and topic cards. Removed. |
| Practice recommendation | Active-recall explanation | **B / P1** | Shortened to explain its useful outcome: finding skills needing more practice. |
| Topic selection | “Due reviews and daily limit remain in effect” | **C / P1** | Kept one copy in `CustomStudyPanel`, where session settings are being chosen. Removed its duplicate from the selected-topic card. |
| Topic coverage note | Curated semantic coverage and availability of other kanji | **C / P1** | Shortened and moved inside the expandable “show all topics” region, so it appears when the user explores the topic catalogue. |
| Advanced/custom study | General explanation and advanced-controls summary | **A/B / P0–P1** | Removed the unneeded topic intro; retained a compact list of the actual session controls (focus, JLPT level, card count). |
| Placement diagnostic | Limit of kanji-only starting-point assessment | **B / P1 + D / P2** | Shortened while preserving that the result is a kanji starting point, not an overall Japanese proficiency score; clarifies N1 is not directly assessed. |
| Dictionary search — `DictionaryPage.tsx` | `dictionaryHint` and a dynamic message repeating the placeholder | **A / P0** | Removed duplicate copy and the generic “searching” message that conveyed no new state. Kept visible placeholder and a screen-reader label through the wrapping `label` and `.sr-only` text. |
| Vocabulary examples — `VocabularyExamples.tsx` | Subtitle beneath “Vocabulary examples” | **A / P0** | Removed a sentence that simply described the section title. |
| Vocabulary co-occurrence graph | What the displayed co-occurrences mean | **B / P1** | Kept and shortened, because co-occurrence is not obvious from the graph title alone. |
| Prepared-mnemonic panel — `DictionaryPage.tsx` | Generic explanation under the panel title | **A / P0** | Removed repeated guidance; the title, suggestions, and save/edit actions remain. |
| Prepared-mnemonic library — `MnemonicsDialog.tsx` | Long general library explanation | **B / P1 + D / P2** | Shortened but explicitly kept the caveat that mnemonic cues do not replace scheduled reviews. Existing replacement warning remains conditional on an existing personal mnemonic. |
| Memory-cue section — `MnemonicSupport.tsx` | “Memory bridges” title plus short hint | **A/B / P0–P1** | Renamed the title to the clearer “Memory cues / سرنخ‌های حافظه” and removed the redundant subtitle. |
| Settings — `SettingsDialog.tsx` | Page intro; learning, review scheduling, and data/backup section intros | **A / P0** | These statements repeated the purpose already apparent from the controls and tools. Removed. |
| Settings controls | New-kanji/day, daily-review-goal, and skill-toggle explanations | **A / P0** | Labels already expressed the same meaning; removed duplicate helper strings. Control behavior is unchanged. |
| Retention and repeated-error settings | Higher target usually causes more reviews; repeated-failure threshold | **D / P2** | Retained because these explain consequential scheduling/flagging effects. Removed only the redundant second retention helper beneath the range. |
| Settings support links | Explanation of where to find docs/privacy/feedback | **A / P0** | The next controls are the named destinations. Removed the extra paragraph and turned the section titles into semantic headings linked by `aria-labelledby`. |
| Settings safeguards | Unsaved changes, discard confirmation, reset warning | **D / P2** | Kept status/confirmation copy and the statement that deleting local progress and review history cannot be undone. No save/reset behavior was changed. |
| Statistics — `StatsDialog.tsx` | Repeated eyebrow labels before “7-day activity”, “Kanji mastery”, “Learning profile”, “Needs attention” | **A / P0** | Removed labels that duplicated the more specific heading underneath them. |
| Statistics header and advanced area | Generic intro and duplicate “Progress details” label | **A/B / P0–P1** | Removed the broad overview sentence; changed the advanced title to “Performance details / جزئیات عملکرد”. |
| Statistics methodology | Accuracy vs model confidence, attempts/evidence, adaptive vs baseline | **B / P1 + D / P2** | Kept and shortened. Data sufficiency remains explicit; accuracy is not presented as model confidence. |
| Account sign-in — `AccountDialog.tsx` | Multi-topic login introduction and guest-mode wording | **B / P1** | Shortened both without implying registration is required: account sync benefit and continued local use without an account remain explicit. |
| Magic link/password reset | Instructions tied to the active form | **B / P1 + D / P2** | Kept as contextual actions; shortened the magic-link instruction. Minimum password length remains visible outside the placeholder. |
| Account profile/security | Display name, new-password, and current-password hints | **A/B / P0–P1** | Shortened the display-name helper; removed instructions that merely restated the new/current password form labels. |
| Account sync | Local-first storage and connectivity behavior | **B / P1 + D / P2** | Shortened, while preserving the actual local-first and sync-when-connected behavior; real sync-status labels/errors remain. |
| Reading Lab source input — `ReadingLab.tsx` | General source hint duplicating the empty state | **A / P0** | Removed the always-visible source paragraph. The empty state gives the action and expected outcome when no text is loaded. |
| Reading Lab file import | TXT versus SRT/VTT timing behavior | **B / P1 + D / P2** | Shortened while retaining that TXT imports text only and SRT/VTT preserve sentence timings for audio synchronization. |
| Reading Lab audio sync | “Synced with audio” plus sentence-following description | **B / P1 + D / P2** | Kept both status and the distinct playback behavior, but shortened the second string. |
| Reading Lab reader and word lookup | Tap-kanji behavior; instruction repeated below the word result | **B/A / P1/P0** | Kept compact guidance on the clickable kanji (also used for its accessible name), removed the repeated visible instruction after the word result opens. |
| Structure dialog — `KanjiStructureDialog.tsx` | Repeated source label next to source disclaimer | **A / P0 + D / P2** | Removed the redundant component note only in the dialog; preserved the KanjiVG disclaimer that visual decomposition is not a historical-etymology claim. Embedded dictionary structure still labels its source. |
| Traditional radical and component learning path | Kangxi versus visual components; learning-path caveat | **D / P2** | Preserved both: traditional radical classification is distinct from visual components, and the suggested path is not a literal decomposition. |
| Handwriting practice — `HandwritingPractice.tsx` | Long copy in the collapsed header | **A / P0** | Removed the explanation from the collapsed row. Expanded canvas retains mouse/touch/pen instructions next to the canvas and its `aria-describedby`, plus grading feedback. |
| Stroke order — `StrokeOrderViewer.tsx` | Playback instruction beneath a “Stroke order” heading | **A / P0** | Removed the obvious helper while preserving loading/unavailable states, playback controls, and KanjiVG attribution. |
| Topic-learning dialog — `TopicLearningDialog.tsx` | Same topic-selection explanation in header and footer | **A / P0** | Removed both duplicates; the title, search, topic counts, focus controls, and empty-match state remain. |
| Onboarding — `OnboardingFlow.tsx` | Intro paragraph repeating the learning/retrieval/review bullets | **A / P0** | Removed only the duplicate paragraph; kept the three distinct stages, starting-point limits, new-kanji/day meaning, and optional-account copy. |
| Unused translation copy | `recommendedLearningHint` and other keys without a remaining consumer | **A / P0** | Removed only after checking source and search results for consumers; paired Fa/En values and key type entries were removed together. |
| Grammar, backup and empty/error states | Educational examples, import/restore scope, failure/loading/no-result status | **D / P2** | Preserved where text changes the next action, explains evidence/data scope, or prevents an unsafe interpretation. |

## Translation and accessibility rules applied
- Matched Persian and English for all edited retained messages.
- Removed unused locale/type entries together instead of leaving dead translation keys.
- Kept labels and control names accessible when visible helper copy was removed. The dictionary input remains labelled by the enclosing label and screen-reader-only text; menu button accessible names remain explicit.
- Converted Settings section captions to headings and connected each section with `aria-labelledby`.
- Did not change scheduling, FSRS, planner selection, content, storage, sync behavior, API contracts, RLS, or security policy.

## Verification added
- `scripts/test-ux-microcopy-audit.mjs`: source-contract checks for removed duplicate strings, bilingual key parity, retained scientific/security/data caveats, conditional topic disclosure, and accessibility associations.
- Updated `scripts/test-menu-redesign.mjs` so the menu contract now verifies removal of secondary hint keys while retaining navigation names and interactions.
- `e2e/ux-microcopy.spec.mjs`: rendered Playwright assertions at mobile (390×844) and desktop (1280×800) for Practice, Dictionary, menu, Reading Lab, Stats, and Settings.
- Full `npm test`, typecheck/build, and Playwright checks must be read from the CI run attached to the resulting pull request. A passing static contract alone is not proof of rendered correctness.
