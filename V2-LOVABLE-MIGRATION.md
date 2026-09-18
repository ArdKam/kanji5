# Kanji 5 — Lovable → GitHub v2 Migration Inventory

Status: P0 inventory complete  
Source of truth: GitHub `ArdKam/kanji5`  
Lovable source: `Kanjis Bloom` at commit `abf7b589e2066edff3b2cda055d4025828239700`  
GitHub baseline: `main` at tree `1e055eeccce75cbdadf3ab03c5ce98a983c5796e`  
Working branch: `migration/lovable-p0-inventory`

## 1. Executive decision

Do **not** copy the Lovable application into Kanji 5.

The two applications have materially different runtime architectures:

- Lovable: React 19 + TanStack Start/Router + Tailwind v4 + shadcn/Radix + Supabase.
- Kanji 5: browser-first JavaScript runtime with explicit v1.9 learning-engine modules and a vanilla JS/CSS v2 presentation layer.

The migration target is therefore:

`Lovable visual/interaction language → Kanji 5 v2 presentation`

while preserving:

`Kanji 5 v1.9 → grading → learner model → adaptive planner → recovery → FSRS → persistence/offline`

Lovable's progress scheduling semantics are explicitly **not** authoritative and must not be imported.

## 2. Current architecture findings

### Kanji 5

The current architecture already has a formal v1.9 → v2 boundary:

- `v1.9-v2-contract-core.js`
- `v1.9-v2-boundary.js`
- `v2-presentation.js`
- `v2-presentation.css`

The repository architecture explicitly requires presentation code to consume structured view models rather than storage/planner internals.

The current v2 roadmap P0–P5 is marked complete. This migration is consequently a **visual-system and interaction-quality migration**, not a replacement of the v2 architecture.

### Lovable

The source project contains:

- `src/components/AppShell.tsx`
- `src/components/ProgressBar.tsx`
- `src/routes/index.tsx`
- `src/routes/_authenticated/study.tsx`
- `src/routes/_authenticated/test.tsx`
- `src/styles.css`
- `src/lib/kanji.ts`
- `src/lib/progress.functions.ts`
- shadcn/Radix UI primitives
- Supabase auth/progress infrastructure

The Lovable implementation is useful as a visual/interaction reference, but its data and scheduling layer must remain outside Kanji 5's learning authority.

## 3. Visual token inventory

| Token | Lovable source | Migration action | Kanji 5 target |
|---|---|---|---|
| Background / washi | `--washi` | ADAPT | Keep Japanese paper identity; normalize into v2 token |
| Card / paper | `--paper` | ADAPT | Shared surface token |
| Sumi text | `--sumi` | ADAPT | Primary text |
| Ink secondary text | `--ink` | ADAPT | Secondary text |
| Muted text | `--mute` | ADAPT | Muted text |
| Shu | `--shu` | REUSE/ADAPT | Primary accent/action |
| Ai | `--ai` | REUSE/ADAPT | Secondary/action/info |
| Matcha | `--matcha` | REUSE/ADAPT | Success/known state |
| Line | `--line` | REUSE/ADAPT | Hairline borders |
| Card radius | 28px | REUSE | v2 card radius |
| Button radius | ~16–24px | ADAPT | Component-specific radius tokens |
| Kanji font | Noto Serif JP | REUSE | Japanese display glyph |
| UI font | Inter | ADAPT | Preserve existing v2 language/accessibility requirements |
| Rise animation | 0.55s | REUSE/ADAPT | Shared motion token |
| Stamp animation | 0.7s | REUSE/ADAPT | Feedback/achievement state |
| Ink-bleed animation | 1.1s | ADAPT | Progress/celebration only |
| Hairline borders | yes | REUSE | Shared component primitive |
| Soft shadows | low | ADAPT | Keep restrained; avoid generic SaaS-card look |

### Important visual conflict

Current GitHub v2 uses a separate neutral/indigo token system in `v2-presentation.css` (`--v2-bg`, `--v2-accent`, etc.).

Lovable uses the Sumi Play palette.

**Decision:** do not maintain two independent visual systems. P3/P4 of this migration must consolidate the v2 presentation around one semantic token layer, with Sumi Play-derived values where they improve Kanji 5's Japanese identity.

## 4. Screen inventory

### A. Landing / Home

Lovable:
- branded header
- large editorial headline
- Joyo count
- primary CTA
- kanji visual grid
- three feature cards
- responsive single-column → multi-column behavior
- attribution footer

Action: **ADAPT**

Reason:
Kanji 5 already has a product shell and learning dashboard. Reuse the visual hierarchy and composition, but source all counts/progress from the v1.9 boundary.

Potential Kanji 5 components:
- AppHeader
- BrandMark
- Hero
- KanjiPreviewGrid
- FeatureCard
- DailySummary
- DailyGoal

### B. Study / Learning

Lovable:
- large central kanji
- flip/reveal interaction
- meaning/readings/example word on reveal
- status stamp
- Review / Known controls
- previous/next controls
- deck progress
- upcoming cards
- keyboard hints
- responsive two-column desktop layout

Action: **ADAPT + REBUILD INTERACTION**

Reason:
This is the primary migration target. The visual composition maps well to Kanji 5, but the action semantics must be routed through the v1.9 boundary.

Never import:
- `Review = +8 hours`
- `Known = +7 days`
- direct Supabase progress writes
- Lovable `status` model as a replacement for FSRS state

### C. Test

Lovable:
- question counter
- progress bar
- question-type badge
- large stimulus
- four answer choices
- instant correctness feedback
- score/streak panel
- mode selection
- round summary
- recent rounds

Action: **ADAPT**

The visual pattern is reusable. Question generation, skill selection, grading and outcome recording must come from Kanji 5 contracts.

### D. Progress / Statistics

Lovable provides limited recent-session/progress UI.

Kanji 5 already has a richer v1.9 boundary with:
- daily summary
- daily goal
- upcoming reviews
- review statistics
- five-skill learner profile
- adaptive reason
- session summary

Action: **REBUILD using Lovable visual language**

This is an opportunity to make the GitHub implementation substantially richer than Lovable without importing Lovable's simplified learning model.

### E. Settings

Lovable:
- daily new count
- daily goal
- leech threshold
- Production/Vocabulary/Context toggles

Action: **ADAPT**

The controls can inform the visual component design, but values and persistence must use Kanji 5's v1.9 boundary.

### F. Authentication

Lovable:
- Supabase email/password + Google auth

Action: **DO NOT IMPORT as part of the visual migration**

Kanji 5's existing auth/persistence architecture remains authoritative.

## 5. Component inventory

| Lovable element | Decision | Kanji 5 migration |
|---|---|---|
| AppShell | ADAPT | Merge visual shell with existing v2 shell |
| Brand/header | ADAPT | Kanji 5 brand component |
| Deck selector | ADAPT | Boundary-backed configuration |
| Bottom navigation | ADAPT | Keep only if it improves current IA; do not blindly duplicate desktop controls |
| Card | REBUILD | Shared v2 surface primitive |
| ProgressBar | REBUILD | Preserve semantic ARIA contract |
| Kanji display | REBUILD | Dedicated Japanese typography component |
| Flashcard | REBUILD | Presentation-only; dispatches v1.9 actions |
| Choice button | REBUILD | Shared exercise option component |
| Stat card | REBUILD | Boundary-backed metric component |
| Session summary | REBUILD | Boundary-backed session-summary component |
| Toast | ADAPT | Existing v2 operation-status/feedback system |
| Empty state | REBUILD | Shared v2 component |
| Dialog | ADAPT | Preserve native/accessible dialog behavior |
| shadcn/Radix primitives | SELECTIVE REUSE | Reimplement behavior, not framework wholesale |

## 6. Interaction inventory

### Flashcard state machine

Lovable:
`idle → reveal → review/known → next`

Kanji 5 target:
`view-model → reveal/recovery → authoritative rating/feedback → next exercise`

The presentation layer may control visual state only. Scheduling remains outside it.

### Test state machine

Lovable:
`question → choice → feedback → next`

Kanji 5 target:
`exercise VM → user action → v1.9 grading/outcome → feedback VM → next exercise`

### Feedback

Reuse:
- immediate visual response
- success/error differentiation
- short transitions
- clear disabled state
- focus management

Do not reuse:
- hard-coded pass/fail thresholds as learning authority
- independent scoring semantics where v1.9 already supplies the result

### Navigation

Lovable's two-tab Flashcards/Test IA is narrower than current Kanji 5 v2.

Decision: **do not collapse Kanji 5's richer learning IA just to match Lovable**.

Instead:
- borrow the visual simplicity