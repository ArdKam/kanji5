# Rinemi — Initial Brand Guide

**Status:** Initial implementation baseline for the product rename and identity rollout.

## Brand name

- Canonical display name: **Rinemi**
- Use the same Latin spelling in Persian and English interfaces. Localize descriptions and supporting copy, not the brand name.
- Keep the wordmark left-to-right (\`dir="ltr"\`) even inside the Persian RTL application.
- The repository and deployment path remain \`ArdKam/kanji5\` and \`/kanji5/\` for compatibility. These are implementation addresses, not the customer-facing brand.

## Logo and icon files

| File | Purpose |
| --- | --- |
| \`rinemi-logo.svg\` | Primary horizontal logo on light backgrounds |
| \`rinemi-logo-dark.svg\` | Logo for dark backgrounds |
| \`rinemi-logo-mono.svg\` | Single-color logo |
| \`rinemi-mark.svg\` | Standalone transparent brand mark |
| \`icon.svg\` | Browser favicon and in-product brand mark |
| \`icon-192.svg\` | PWA 192 px icon |
| \`icon-512.svg\` | PWA 512 px icon |

The mark combines an ink-like R with a restrained sakura accent. The logo SVG wordmark uses a text element and a system font fallback stack; for print or external design work, verify the rendered type and convert it to outlines in the final design tool when exact typography is required.

## Color tokens

| Token / role | Value | Use |
| --- | --- | --- |
| Warm Rice Paper | \`#F7F4EE\` | Main background and light icon field |
| Warm Surface | \`#FDFBF7\` | Cards and elevated surfaces |
| Sumi Charcoal | \`#292B2D\` | Primary text and dark neutral |
| Muted Indigo | \`#505F83\` | Primary brand accent, navigation and focus family |
| Dusty Sakura | \`#D6A1AA\` | Restrained brand accent |
| Desaturated Moss | \`#8C9B87\` | Positive/progress accents |
| Secondary Surface | \`#EEE9E0\` | Subtle surfaces and skeleton loading |
| Soft Border | \`#DED8CE\` | Dividers and control boundaries |

Error and destructive-action colors remain semantically red. Do not replace error states with the indigo brand accent merely to remove historical red branding. Verify text and interactive contrast whenever a color is changed.

## Typography

- Persian: Vazirmatn.
- English and Latin UI: Plus Jakarta Sans.
- Japanese kanji: Noto Serif JP for selected editorial/kanji surfaces, with the existing product stack retained for general Japanese text.
- Brand wordmark: Latin **Rinemi**, with an explicit LTR direction in RTL contexts.

## Product implementation

The initial rollout applies the mark and wordmark to the startup shell and main app header, updates browser/PWA metadata, and uses the new palette in the shared application stylesheet. The Service Worker caches the shipped brand assets so the initial shell can still resolve them offline.

## Compatibility rule

Do not rename the following as part of a visual-brand update unless a separate migration is approved and tested:

- Existing \`localStorage\` keys and legacy onboarding keys.
- \`__KANJI5_*\` runtime contracts, events and error codes.
- \`kanji5-backup\` backup format identifiers.
- Existing package/build asset names and service-worker cache prefixes.
- Supabase schema/table identifiers.
- GitHub Pages project URL and relative PWA \`id\`, \`start_url\`, and \`scope\`.

These are compatibility identifiers and are not customer-facing brand text.
