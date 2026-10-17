# Rinemi — Brand System & Production Usage Guide

**Status:** Active brand reference, v1.1  
**Source audit:** 2026-10-17  
**Scope:** Identity, type, palette roles, iconography, illustrations, mascot use, and cross-surface consistency.

This guide governs how Rinemi should look and sound. Runtime behavior and component implementation remain owned by the app. Keep brand changes presentation-only: do not change FSRS, grading, learner-model, adaptive-planner, recovery, persistence, synchronization, storage keys, runtime contracts, build paths, or PWA URLs as part of a visual change.

## 1. Brand thesis

**Rinemi is a quiet, capable companion for serious Japanese learners.** The product should feel thoughtful, credible, and welcoming without turning study into a game show or a cartoon.

Design principles, in order:

1. **Learning content first.** Kanji, meaning, readings, examples, and the learner's next useful action outrank decoration.
2. **Warm clarity.** Paper-like surfaces and ink-like text soften the experience; hierarchy, contrast, and copy remain precise.
3. **Editorial restraint.** Japanese editorial influence comes from typography, spacing, subtle rules, and a controlled accent—not decorative brush effects, anime tropes, or pseudo-Japanese ornaments.
4. **Quiet confidence.** Show meaningful progress and honest system status. Do not oversell streaks or simulate success.
5. **Language parity.** Persian, Japanese, and English are first-class. RTL changes reading flow, not brand identity or the LTR spelling of Rinemi.

Avoid generic SaaS-dashboard chrome, excessive cards-within-cards, noisy gradients, glossy 3D, oversized emoji, anime faces, chibi proportions, and ornamental sakura patterns.

## 2. Naming and logo system

- Canonical name: **Rinemi** in Persian, English, and Japanese-learning contexts. Localize explanatory copy, never the Latin brand spelling.
- Keep the wordmark explicitly LTR inside Persian layouts.
- Primary horizontal lockup: rinemi-logo.svg on light surfaces.
- Dark-surface lockup: rinemi-logo-dark.svg.
- Monochrome reproduction: rinemi-logo-mono.svg.
- Compact brand mark: rinemi-mark.svg.
- Browser/in-product mark: icon.svg.
- Install icons: icon-192.svg and icon-512.svg.

The current app header and onboarding render the standalone mark beside live HTML text. Preserve that approach when localization, semantics, or responsive layout makes live text preferable to the SVG wordmark. Use the complete SVG lockup for static brand placements, not as a replacement for semantic page headings.

### Clear-space and sizing rules

- Give the full lockup clear space of at least the height of the capital “R” on each side.
- Use the standalone mark in compact spaces; do not shrink the horizontal lockup until the wordmark becomes hard to read.
- Do not recolor, skew, stretch, add shadows, add outlines, or place the logo over busy artwork.
- On light surfaces, use the warm-paper/indigo/sakura version. On dark surfaces, use the dark lockup; do not place the light wordmark on charcoal without checking contrast.
- Keep SVG title/description metadata in non-decorative brand assets.
- The square full-bleed PWA icon backgrounds are intentional for the manifest's “any maskable” purpose. Do not add rounded corners to maskable variants; operating systems may apply their own masks. The standalone favicon may keep its own rounded silhouette.

The present logo is serviceable and recognisable at product scale. It does not need a wholesale rebrand. The main production caveat is typography: the SVG wordmark contains live text with a fallback stack, so verify it in each target renderer and outline the type when an exact print/export master is required.

## 3. Color tokens and roles

Treat colors as roles, not independent decoration. The light palette below matches the current shared stylesheet.

| Role | Light value | Usage |
| --- | --- | --- |
| Washi / app canvas | #F7F4EE | Main page and quiet background |
| Paper / primary surface | #FDFBF7 | Cards, dialogs, menu surfaces |
| Sumi / primary text | #292B2D | Headings, body text, primary neutral |
| Ink / secondary text | #53545A | Supporting content with emphasis |
| Muted text | #62666A | Metadata, hints, secondary labels |
| Shu / brand indigo | #505F83 | Primary action, focus family, selected navigation |
| Sakura | #D6A1AA | Small decorative accent only |
| Matcha | #8C9B87 | Progress and positive emphasis, with a text label |
| Line | #DED8CE | Borders and separators |
| Soft line | #E9E3DA | Low-emphasis dividers |
| Secondary surface | #EEE9E0 | Subtle grouped regions |

### Dark-theme target palette

| Role | Dark value | Usage |
| --- | --- | --- |
| Washi / app canvas | #171614 | Main page |
| Paper / primary surface | #23211E | Cards and dialogs |
| Sumi / primary text | #F4EFE3 | Headings and body |
| Ink / secondary text | #DDD5C8 | Secondary readable copy |
| Muted text | #B8AFA2 | Metadata and hints |
| Line | #746B60 | Borders and separators |
| Soft line | #4B463F | Low-emphasis dividers |
| Shu / dark-theme brand indigo | #A8B5D8 | Primary actions and brand accents |
| Matcha | #A9B77C | Positive/progress emphasis |
| Sakura | #D6A1AA | Small decorative accent only |

Sakura and moss are not default text colors: on paper surfaces they are too weak for normal-size text. Never communicate review outcome, mastery, selection, or error through color alone. Keep Again, Hard, Good, and Easy visually distinct through text, shape/border, and background as well as hue. The label is mandatory.

### Required contrast targets

- Normal text: WCAG AA contrast of at least 4.5:1.
- Large text and meaningful non-text control boundaries: at least 3:1 where applicable.
- Keyboard focus: always visible, at least 3:1 against adjacent colors, with a clear offset.
- Recalculate contrast when the surface or token changes; do not assume a color that passed on paper will pass on charcoal.

## 4. Typography

- **Persian UI:** Vazirmatn. Keep Persian copy natural and avoid squeezing headings into overly tight line-height.
- **English and Latin UI:** Plus Jakarta Sans, with a robust system fallback.
- **Japanese learning/editorial surfaces:** Noto Serif JP for kanji-first editorial moments; retain an appropriate Japanese fallback stack for general copy and platform compatibility.
- **Brand wordmark:** Latin Rinemi, weight 700; always LTR.
- Use tabular numerals for counts, percentages, dates, and progress values.
- Keep Japanese readings and example text direction-isolated from surrounding Persian copy. Never rely on CSS direction alone when text mixes scripts.
- Do not introduce a new type family for an isolated feature without a system-level review.

## 5. Layout and component rules

Use the existing spacing and radius scale as the baseline; do not create a second competing scale.

| Token family | Baseline values |
| --- | --- |
| Spacing | 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64 px |
| Radius | 10, 14, 20, 28 px; pill radius only for genuinely pill-shaped controls |
| Motion | Fast feedback near 120–180 ms; use existing transition tokens for larger transitions |
| Main content | Preserve the current 880 px desktop shell maximum unless measured evidence supports a change |
| Control targets | Aim for 44–48 px minimum interactive height |

Component contracts:

- **Primary action:** one clear primary action per local decision area. Indigo fill with a foreground that passes contrast in the resolved theme.
- **Secondary action:** neutral surface and border; no decorative accent competing with the primary action.
- **Cards/surfaces:** paper surface, restrained border, optional subtle shadow. Do not add a card wrapper when spacing and hierarchy already suffice.
- **Navigation and icon buttons:** one coherent line-icon family, consistent optical size and stroke weight. Use 18–20 px glyphs and accessible labels for icon-only controls.
- **Selected/active state:** visible surface/border change plus semantics such as aria-pressed or selected state. Do not depend on color alone.
- **Focus:** a high-contrast visible focus ring. Never remove outlines without a replacement.
- **Disabled:** retain legible text and shape; reduced opacity must not make the control ambiguous.
- **Feedback:** place the status close to the action that caused it and use concise, actionable copy.
- **Motion:** avoid perpetual decorative movement. Respect prefers-reduced-motion for transitions and animation.

## 6. Empty, loading, and error states

### Empty states
- **No search/filter matches:** use a brief “nothing found” message, a useful explanation, and a direct way to clear or adjust the query. Keep this state text-first; mascot art would add noise when the learner already knows what they were searching for.
- **New learner / truly empty home:** one reassuring sentence and one next step. The cat may appear as a small companion if it makes the moment more welcoming.
- **Completed session:** acknowledge completion plainly and make the next action clear. Avoid forced celebration, confetti, or a Shiba cameo on every completion.

### Loading states
- In data-heavy views, retain quiet skeletons with the correct approximate content geometry. Do not replace every skeleton with a mascot.
- Global startup loading can use the Rinemi companion as a small, static illustration once its asset is included in the shell precache. Keep the brand name, product purpose, and loading indicator clear without the illustration.
- Loading copy should not promise a duration. Stop motion under reduced-motion preferences.
- The first static startup shell must resolve into the selected light, dark, or system theme before React mounts; the shell should not flash a different visual system.

### Error states
- State what failed in plain language, preserve the learner's work where possible, and provide one prominent recovery action.
- Make diagnostic export/copy secondary to retry or recovery; never expose raw stacks as the primary message.
- Avoid alarming, blaming, or joke copy. The cat may be a quiet supportive accent, not the explanation for the failure.
- A missing asset or network failure should not leave an empty reserved illustration box or block recovery.

Current source-level concern: ReactErrorBoundary.tsx uses a very large 迷 glyph as the fatal-error illustration. It is understandable as “lost/confused,” but it can feel ominous and turns a serious failure into a character/glyph gag. Replace it in a separate, tested UX pass with a neutral status symbol and calm recovery copy; do not change the error recovery/backup behavior during that visual edit.

## 7. Cat companion and secondary character

The cat is a **companion, not a teacher, coach, mascot-as-logo, or rewards machine**.

Canonical first asset: assets/brand/rinemi-companion-cat.svg.

Character direction:
- Calm, attentive, intelligent, slightly wry; friendly without a baby-like face.
- Rounded head, small ears, restrained eyes and linework.
- No teacher outfit, pointer, graduation cap, glasses, speech bubble, or “look at this” gesture.
- Sumi outline, warm-paper body, muted-indigio details, and only a small sakura accent.
- No geometric robot aesthetic, glossy 3D, anime treatment, giant eyes, blush marks, or busy props.

Usage rules:
- Use sparingly: first-use welcome, a genuinely empty home, a meaningful milestone, or a recovery state where it adds reassurance.
- Do not place the cat on every Learning card, every review rating, each loading skeleton, all empty searches, or routine stats. Repeated exposure weakens its meaning and competes with retrieval practice.
- Keep it static by default. If movement is ever added, use one brief, low-amplitude response and honor reduced motion.
- The illustration is decorative when beside explanatory text: use an empty alt and aria-hidden. If the illustration communicates information, provide that information in adjacent text.
- Do not make the cat talk for routine system copy. Rinemi's interface speaks directly and respectfully.

A Shiba Inu may be introduced later as a secondary friend for an occasional celebratory or seasonal moment. It must not compete with the cat, become a second logo, or appear as a default control icon. No Shiba asset is introduced in this pass.

## 8. Responsive, RTL, and theme rules

- Preserve the established application layout and learning-card hierarchy. Brand polish is not a reason to reorder learning content or change card gestures.
- Validate at 320, 390, 768, 1024, and 1440 px. No horizontal overflow, clipped wordmark, hidden focus ring, or overlapping status/action rows.
- Keep brand wordmarks and Japanese learning examples LTR where appropriate; use logical CSS properties and localized copy for layout and reading flow.
- Check English and Persian; verify Persian numbers and Japanese script isolation in the same component.
- Explicit Light, explicit Dark, and System with both light and dark OS preferences are distinct test cases.
- Check loading and error shells as well as the normal app screen: theme flashes and font mismatches are part of brand consistency.

## 9. Source audit and incremental implementation record — 2026-10-17

Inspected main-branch source for the logo variants, icon assets, manifest, index startup shell, startup-shell.css, theme-bootstrap.js, frontend/src/styles.css, App.tsx, PracticeHome.tsx, OnboardingFlow.tsx, ReactErrorBoundary.tsx, current brand metadata assertions, and visual coverage suite. This was a source inspection; no live browser screenshots or physical-device checks were available in this pass.

Findings:
- The core logo family and canonical warm-paper/indigo/sakura palette already exist. Keep them; improve consistency instead of starting another identity.
- The onboarding welcome currently uses a large 漢 hero mark, not a mascot. That is a good content-led base; introduce the cat only as a secondary companion after the concurrent onboarding/design-system work has settled.
- Search/filter empty states are appropriately text-led. The global loading shell uses skeletons and an abstract mark; preserve the skeleton pattern.
- startup-shell.css hard-codes a light-only canvas/card and an Inter font stack, even though the app supports Light, Dark, and System and the rest of the UI uses Plus Jakarta Sans/Vazirmatn. This pass aligns its font stack and adds explicit dark/system-dark shell colors.
- Dark-mode app/onboarding overrides currently use coral #E06A5F for the Shu action family, while the dark logo uses indigo #A8B5D8. Existing theme-parity tests encode the coral behavior. This is a real brand inconsistency; reconcile the shared stylesheet, theme-bootstrap.js, and tests together after the open design-system work, rather than patching one file in isolation.
- The manifest icons are listed as “any maskable.” Keep their full-bleed square safe background; this is an intentional platform behavior, not a logo inconsistency.
- The companion SVG is added as a reusable source asset. Its UI placement is deliberately deferred until the in-flight service-worker integrity change can add it to the authoritative shell precache, and the onboarding/design-system work can consume it without competing edits.
- The design-system foundation and integration PRs were open during this audit. This pass does not edit their shared React token files, onboarding component, dark-theme parity test, service worker, or design-system document.

### Change set in this increment
1. Brand usage rules and audit findings consolidated here.
2. Added a reusable, scalable cat companion SVG.
3. Aligned the static startup shell with Plus Jakarta Sans/Vazirmatn and light/dark/system-dark colors without changing startup or learning behavior.
4. Added an automatically discovered source-contract test for the startup theme and companion asset.

### Follow-up order
1. Merge/reconcile the active semantic design-system and UX changes; review the dark-mode accent contract.
2. Add the companion SVG to the service-worker shell precache, then test offline startup before wiring it into the UI.
3. Introduce the cat only on a small number of deliberate onboarding/true-empty/recovery states.
4. Replace the oversized fatal-error glyph and finish empty/loading/error copy review.
5. Run Playwright visual captures for Persian/English at the listed breakpoints in Light, Dark, and System-Light/System-Dark, then inspect screenshots rather than relying on source assertions alone.

Compatibility constraints remain unchanged: localStorage keys, runtime contracts, backup identifiers, database/schema names, bundle paths, service-worker cache prefixes, and the relative PWA id/start_url/scope are not brand assets and must not be renamed.
