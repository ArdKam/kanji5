# Kanji 5 — e2e/

This directory contains Playwright browser/integration coverage. It validates shipped behavior at the browser boundary; it is not the source of product behavior.

## Start here

From the repository root:

```bash
npm run e2e
```

For interactive/headed runs:

```bash
npm run e2e:headed
npm run e2e:ui
```

## Naming guide

### Current React presentation

The `react-*.spec.mjs` suites are the main current browser coverage for the React presentation, including:

- presentation migration/parity
- Learning / Active Recall separation and session isolation
- mnemonic flows
- account shell
- accessibility
- PWA/offline behavior
- release matrix checks
- dictionary and learning-card interactions

The exact release gate is defined by `.github/workflows/react-frontend.yml`; not every React spec necessarily runs on every workflow invocation.

### Versioned suites

`v1.5-*.spec.mjs` through `v1.9-*.spec.mjs` preserve browser-level coverage for versioned engine/release layers. Keep them because the runtime evolved incrementally; do not move or delete them just because the current UI is React.

### Specialized coverage

`handwriting-*.spec.mjs` covers handwriting-specific browser/integration paths.

Other unprefixed specs such as `app-smoke.spec.mjs`, `education-discovery.spec.mjs`, and `stats-dialog.spec.mjs` cover focused application-level behavior.

`fixtures/` contains Playwright fixtures/support data. Snapshot assets live under the corresponding Playwright snapshot directory.

## Test ownership

Use `scripts/test-*.mjs` for deterministic contracts that do not need a browser.

Use `e2e/*.spec.mjs` when correctness depends on DOM state, user interaction, browser APIs, routing, PWA behavior, or visual/browser integration.

When a UI change is made under `frontend/`, check the current React workflow before adding or modifying a historical `v1.*` browser suite.
