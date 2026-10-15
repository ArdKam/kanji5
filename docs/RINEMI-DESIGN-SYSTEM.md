# Rinemi Design System

**Status:** Semantic foundation and an initial cross-page migration are implemented on the integration branch. CI and rendered review remain pending; the product-wide migration is not yet complete.  
**Source of truth:** `frontend/src/design-system.css`  
**Rendered reference:** production components plus the captured Playwright reference set in the [visual-audit workflow](../.github/workflows/visual-audit.yml).

## Purpose

Rinemi uses a calm Japanese editorial language: warm paper, sumi text, muted indigo actions, disciplined typography, and restrained supporting color. The design system standardizes meaning, state, and interaction without making Learning, Practice, Dictionary, and reading tools look like copies of the same template.

## Enforceable principles

1. Educational intent determines visual hierarchy; the kanji, prompt, or learner decision comes first.
2. Keep one clear primary action in each task context.
3. Supporting information must not compete with the current learning action.
4. Treat whitespace as part of composition, not as unused space to fill.
5. Reuse component behavior and tokens, but let each page retain the structure its task requires.
6. Color communicates semantic meaning; brand color is not a substitute for success, warning, error, or review outcomes.
7. Controls need a clear name, predictable keyboard behavior, visible focus, and disabled/selected/loading states where applicable.
8. Design mobile layouts independently; do not merely shrink desktop density.
9. RTL and LTR are first-class, including mixed Japanese/Persian/Latin content.
10. Verify the rendered product in both themes, at real breakpoints, before calling a visual change complete.
11. Preserve learning and persistence contracts. Presentation refactors must not own grading, scheduling, learner-model state, recovery, or sync.

## Architecture and migration contract

The production path remains:

`index.html → app-bootstrap.js → v1.9-v2-boundary.js → react-entry.js → React presentation`

React remains a presentation layer. FSRS, the v1.9 learner model, adaptive planning, grading, recovery, persistence, and offline synchronization are unchanged by this stylesheet.

`design-system.css` loads after the shared and page styles in `main.tsx`. The `--ds-*` variables are the semantic source of truth for new and migrated presentation. Existing names (`--washi`, `--paper`, `--sumi`, `--mute`, `--ai`, `--line`, `--space-*`, `--radius-*`, and related legacy tokens) are declared once in `styles.css` and reference those semantic roles. This keeps older consumers theme-aware without maintaining a second duplicate alias block. Do not add new UI dependencies or new legacy aliases.

Some historical declarations and page-specific overrides remain in `styles.css` and screen stylesheets. They have not been mass-deleted: remove them only after the consumers are migrated and visual/contract tests cover the resulting behavior. If a legacy rule conflicts with a semantic token, fix the conflict in the owning component rather than stacking another unrelated override.

## Palette and semantic roles

### Brand palette

| Token | Light value | Role |
|---|---|---|
| `--ds-brand-rice-paper` | `#F7F4EE` | Main canvas |
| `--ds-brand-surface` | `#FDFBF7` | Primary surface |
| `--ds-brand-sumi` | `#292B2D` | Core ink |
| `--ds-brand-indigo` | `#505F83` | Primary action and focus family |
| `--ds-brand-sakura` | `#D6A1AA` | Restrained brand accent |
| `--ds-brand-moss` | `#8C9B87` | Supporting progress accent |
| `--ds-brand-secondary-surface` | `#EEE9E0` | Secondary paper surface |
| `--ds-brand-border` | `#DED8CE` | Soft border |

### Theme semantics

| Role | Light | Dark |
|---|---|---|
| Canvas | `#F7F4EE` | `#171614` |
| Surface | `#FDFBF7` | `#23211E` |
| Subtle surface | `#F1EDE6` | `#292724` |
| Elevated surface | `#FFFDF8` | `#2B2824` |
| Primary text | `#292B2D` | `#F4EFE3` |
| Secondary text | `#53545A` | `#DDD5C8` |
| Muted text | `#62676B` | `#B8AFA2` |
| Primary action | `#505F83` | `#8DA9D9` |
| Primary action text | `#FDFBF7` | `#171614` |
| Strong border | `#ABA398` | `#A99E8D` |
| Focus ring | `#505F83` | `#A9C1ED` |

Explicit `light` and `dark` preferences are stable. `system` follows `prefers-color-scheme` until the user chooses an explicit theme. Native control `color-scheme` follows that same preference.

### Semantic states and review outcomes

Use `--ds-state-success-*`, `--ds-state-warning-*`, `--ds-state-danger-*`, and `--ds-state-info-*` for meaning. Never use sakura or indigo as a replacement for an error just to keep a palette consistent.

Learning review uses distinct Again, Hard, Good, and Easy roles:

| Outcome | Light foreground / background | Dark foreground / background |
|---|---|---|
| Again | `#8E3026` / `#F8ECE8` | `#FF9B91` / `#332724` |
| Hard | `#76510A` / `#FAF0D9` | `#E9C46A` / `#332F27` |
| Good | `#43582B` / `#EDF2E7` | `#B9D49A` / `#283128` |
| Easy | `#314B6F` / `#ECF1F8` | `#A9C1ED` / `#27303B` |

The automated visual coverage suite calculates text contrast for each outcome and primary actions in light, dark, and system modes. Color is reinforced by the visible outcome label, not used as the only signal.

## Typography

| Role | Token | Family |
|---|---|---|
| Persian and RTL UI | `--ds-font-persian` | Vazirmatn, with Latin/system fallback |
| English/Latin UI | `--ds-font-latin` | Plus Jakarta Sans Variable, Plus Jakarta Sans, system |
| Japanese editorial/kanji | `--ds-font-japanese` | Noto Serif JP, Hiragino Mincho ProN |

Use the Japanese role selectively for kanji display and editorial emphasis; ordinary Japanese interface copy may keep the product's general UI font. A kanji embedded in Persian or English text should use a local `lang="ja"` wrapper when a Japanese glyph is intended. Keep the Rinemi wordmark LTR in RTL contexts.

The existing type scale maps to `--ds-type-caption` (11px), `--ds-type-small` (13px), `--ds-type-body` (15px), `--ds-type-body-emphasis` (17px), `--ds-type-subtitle` (19px), and heading roles (22px, 28px, 34px). Display and kanji sizes remain fluid with `clamp()` because their space requirements differ from ordinary UI copy. Reserve the caption size for metadata, not primary learning information.

## Layout and motion tokens

| Category | Tokens |
|---|---|
| Spacing | `--ds-space-1` … `--ds-space-12` (4px through 64px) |
| Radius | `--ds-radius-sm`, `md`, `lg`, `xl`, `full` |
| Motion | `--ds-motion-instant`, `fast`, `normal`, `slow`, `hover`, `flip`, `feedback` |
| Layering | `--ds-z-base`, `content`, `nav`, `overlay`, `modal` |
| Layout guidance | `--ds-layout-content-max: 880px`; `--ds-layout-dialog-max: 780px` |
| Breakpoint references | `--ds-breakpoint-tablet: 760px`; `--ds-breakpoint-narrow: 380px` |
| Target guidance | `--ds-target-min: 44px`; `--ds-target-aa-min: 24px` |

CSS custom properties cannot yet be used directly in media-query conditions across the supported browser baseline; the layout tokens document the agreed breakpoint values while media queries remain literal. Prefer logical properties (`padding-inline`, `margin-inline-start`, `inset-inline-end`) in reusable rules. Use page-specific exceptions when a fixed dimension is required for a real visual task, not because it is faster than responsive design.

### Product stylesheet adoption pass

This integration migrates the root legacy aliases in `styles.css` and begins adoption in the product stylesheets listed below. The existing `--*` aliases remain because unmigrated screens still consume them. The caption token is 12px so essential supporting labels are not retained below the intended minimum. Theme-color aliases and page-specific declarations that remain hard-coded require separate, evidence-led migration rather than blind replacement.

The merged Dictionary implementation from #544 remains authoritative: `App.tsx` route-loads `dictionary-page.css?inline` and does not render the catalog until its module and stylesheet are ready. Shared `dictionary.css` remains in the global stylesheet path because Reading Lab and existing card surfaces also consume it. This integration intentionally preserves the current Vite CSS output configuration and existing static `practice-home.css` / `exercise-layout.css` imports; the Practice route stylesheet split from the earlier foundation branch is not included. The startup shell CSS continues to paint before React styles load. Dark/system/forced-contrast contracts remain mandatory.

Migrated in this pass: `frontend/src/styles.css` (canonical compatibility-alias mappings), `frontend/src/experience-nav.css`, `frontend/src/app/component-breakdown.css`, `frontend/src/app/dictionary.css`, `frontend/src/app/dictionary-page.css`, `frontend/src/app/exercise-layout.css`, `frontend/src/app/handwriting-practice.css`, `frontend/src/app/learning-card-enhancements.css`, `frontend/src/app/learning-surface.css`, `frontend/src/app/mnemonic-support.css`, `frontend/src/app/practice-home.css`, `frontend/src/app/reading-lab-playback.css`, `frontend/src/app/topic-learning.css`, and `frontend/src/app/traditional-radical.css`. Thirteen consumer stylesheets now reference canonical semantic tokens directly instead of legacy color, typography, spacing, font, border, radius, motion, and layer aliases; regression checks assert that those old references do not creep back. `styles.css` continues to define compatibility aliases for remaining unmigrated global selectors and inline-style consumers. `dictionary.css` stays in the shared global import because it also supports Reading Lab and other experiences; its token migration does not change route or stylesheet ownership. Migration of the remaining global selectors and any other page-specific styles is still outstanding.

## Component contracts

The current implementation uses the existing CSS-class component API; it does not add a second React component library.

| Component family | Existing API / states | Contract |
|---|---|---|
| Buttons | `.button.primary`, `.button.secondary`, `.button.danger`, icon/compact actions | A filled primary action per task; secondary actions stay quieter; destructive actions are explicit |
| Inputs | native `input`, `select`, `textarea` and page-specific field classes | Inherit UI type; preserve label/accessible name, disabled state, and visible focus |
| Tabs / segments / chips | native buttons, `[role=tab]`, selected classes and `aria-current` | Selected state is programmatically exposed, not communicated by color alone |
| Surfaces | `.surface`, `.card`, page-owned structured surfaces | Use a border and surface contrast only where grouping adds meaning; avoid nesting cards by default |
| Badges / status | `.badge`, `role=status`, `aria-live` | Use for concise state, not as decoration or as a substitute for a heading |
| Progress | `.progress[role=progressbar]` | Provide label and numeric value; visually distinguish track from fill |
| Navigation / menus | `.experience-nav`, `.header-tools-menu`, semantic buttons | Predictable keyboard interaction, stable selected state, clear overlay order |
| Dialogs / popovers | native dialog patterns and existing modal hooks | Keep title/close action visible, bound dialog to viewport, contain only the intended scroll region |
| Loading / empty / error | existing skeleton and state components | Preserve layout stability and tell the user what happened or what is actionable |

Core interaction treatment in this foundation includes a consistent high-visibility focus ring, theme-aware primary action foreground/background, semantic review feedback colors, and system-wide reduced-motion handling. Component-specific states remain owned by the existing components where they need domain-specific behavior.

## Page patterns

### Learning

Learning and Practice remain distinct. The Learning front prioritizes one kanji, pronunciation when available, and the reveal action. On the back, meaning/readings are primary; examples, mnemonic, and stroke order remain navigable supporting pages. Use compact supporting labels and avoid putting every learning aid into one dense panel. The card's existing flip/reveal and rating actions remain backed by the current runtime boundary.

### Active Recall / Practice

The prompt and response/reveal affordance should dominate. After an answer, show correctness and explanation before the next action. Keep Again / Hard / Good / Easy visually distinct but equally readable in both themes. Topic filters and a recommended session should support the primary action instead of competing with it.

### Dictionary

The order is page title/context → search → essential JLPT filters → optional advanced filters → view/sort controls → result grid. Mobile should collapse controls intentionally and keep active filters visible and removable; it should not expose desktop control density in a narrower column. The detail dialog uses the same tab hierarchy for Overview, Structure, Writing, Words, and Mnemonic, with bounded scroll and a visible close action.

### Onboarding

Use one typographic scale and progress rhythm through all stages. Preserve the existing question text, choice semantics, account/guest options, and current CTA hierarchy. The design system must not quietly reorder onboarding choices to fit a generic primary-button rule.

### Navigation and secondary surfaces

Header, persistent navigation, account, settings, statistics, Reading Lab and auxiliary dialogs share tokens and accessibility states but retain page-specific composition. Dialogs should not inherit a one-size-fits-all content template; long settings forms and focused reading have different scroll behavior.

## Responsive and accessibility rules

- Validate at 1440×960, 768×1024, 390×844, and 320×740 as relevant to each state.
- Validate `dir="rtl"` and `dir="ltr"`, with Japanese text inside both.
- Maintain text contrast at WCAG AA (4.5:1 for ordinary text and 3:1 for large text); the current token test enforces 4.5:1 for rating and primary-action text.
- Every interactive control must retain a visible keyboard focus indicator. Do not remove native keyboard access when adding custom visuals.
- Prefer 44px touch targets; the WCAG 2.2 AA minimum target-size criterion is 24px subject to its documented exceptions.
- Honor `prefers-reduced-motion: reduce`; meaning and state changes must remain understandable without animation.
- Ensure overlays fit the viewport, the page does not scroll horizontally, and primary actions remain reachable when on-screen keyboards or safe areas reduce available height.

## Before/after evidence and known migration boundary

The latest available visual artifact was captured from a successful Playwright run against the October 14 visual-coverage branch and includes broad product screenshots plus focused Learning, Dictionary, onboarding, light/dark, RTL/LTR and narrow-width captures. The snapshots show that the product already has a recognizable paper/ink identity and a deliberately sparse Learning front. The next visual migration priority is to reduce the gap between this coherent Learning surface and the denser Practice/Dictionary control layouts, and then audit component-state parity page by page.

The existing screenshot harness is kept intact. `npm run e2e:visual` and `npm run e2e:visual:coverage` remain the review commands; the workflow publishes PNGs and machine-readable reports. Token tests are assertions, not a substitute for visual inspection.

## Good / avoid

**Good:** one strong primary action; semantic tokens; one surface when one group is enough; concise helper copy; predictable RTL/LTR alignment; outcome labels plus color; motion that can be disabled.

**Avoid:** hard-coded colors in new components; using brand pink/indigo as generic success/error; nested cards for every section; tiny muted subtitles that compete with the task; physical left/right rules in reusable components; deleting a legacy selector before checking its consumers; changing learning or onboarding semantics for visual uniformity.


## Latest visual evidence

The visual capture report from 2026-10-14 at commit `ba5069d09caf8c39c027ac200e35021e2bcb2798` is **pre-integration baseline evidence** from the design-system source branch. It covers 42 primary viewport/scroll captures and focused suites for Dictionary (25 screenshots), Learning back pages (9), Learning faces/themes/breakpoints (25), and onboarding/system-theme states (26). The source report recorded no page/console errors, failed requests/responses, broken images, or horizontal overflow in the captured screens; four scroll captures had no meaningful scroll range. Those results do not verify this integration branch. The current PR's fresh CI artifacts must be reviewed before claiming its rendered appearance is verified. Neither automated captures nor contrast assertions alone establish full WCAG conformance; manual keyboard, screen-reader, and representative-device checks remain necessary.
