# Kanji5 — Browser Support

## Support policy

### Tier 1
Chrome on Android, Safari on iOS, Chrome on Windows/macOS, and Edge on Windows.

### Tier 2
Safari on macOS, Firefox desktop, and other current evergreen browsers where practical.

The project should document unsupported environments as unsupported rather than promising compatibility.

## Verification policy

Automated release gates currently exercise the Chromium path plus responsive, keyboard, accessibility, PWA, and offline contracts. Production Pages smoke coverage exercises the deployed core flow.

The remaining release evidence that cannot be produced by source/CI inspection alone is representative-device validation on actual Tier 1/Tier 2 hardware and browser combinations.

For each release candidate record:
- browser/version
- OS/device
- installability
- cold start
- repeat start
- learning/review
- offline
- reconnect/sync
- backup/restore
- major accessibility regressions

Do not record a platform as fully validated until it has been exercised in the supported environment.
