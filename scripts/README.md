# Kanji 5 — scripts/

This directory contains repository-level tests plus a small number of maintenance/build helpers.

## Start here

For the normal root contract/unit suite:

```bash
npm test
```

That runs `scripts/test-all.mjs`. The runner discovers every `scripts/test-*.mjs`, sorts them, executes them one by one, and reports failures at the end.

The runner intentionally excludes six retired v2 probes:

- `test-v2-custom-study.mjs`
- `test-v2-lovable-visual-contract.mjs`
- `test-v2-mobile-polish.mjs`
- `test-v2-motion-contract.mjs`
- `test-v2-p6-index-boundary.mjs`
- `test-v2-stroke-order.mjs`

Those filenames are still checked explicitly so they cannot disappear silently from the repository.

## How to read the test tree

### Current cross-cutting contracts

Files such as:

- `test-react-*.mjs`
- `test-prepared-mnemonics.mjs`
- `test-mnemonic-support.mjs`
- `test-kanji-radical-system.mjs`
- `test-floating-experience-nav.mjs`
- `test-service-worker-shell.mjs`
- `test-startup-runtime-boundary.mjs`

cover current presentation/runtime boundaries and release contracts.

### Versioned engine contracts

`test-v1.4-*.mjs` through `test-v1.9-*.mjs` are not automatically dead tests. They encode contracts for engine layers that evolved incrementally and are still used by the current release gates.

The consolidated `.github/workflows/build-v1.8.yml` is the authoritative engine gate; `handwriting.yml`, `react-frontend.yml`, and `pages-deploy.yml` own their specialized/browser/release checks.

### v2 tests

`test-v2-*.mjs` contains a mixture of active v2/runtime checks and explicitly retired historical probes. Do not assume the filename prefix alone tells you whether a test is active; `test-all.mjs` is the authoritative exclusion point for the six retired probes.

### Helpers

Non-test helpers include:

- `build-kanji-data.mjs` — data/build maintenance.
- `build-kanji-components.mjs` — component-data maintenance.
- `serve-static.mjs` — local static serving.
- `v1.5-maintenance*.mjs` — historical/targeted maintenance utilities; inspect before use.

Do not run maintenance scripts casually against the working tree; inspect the script before using it.

## Where should a new check go?

A repository-wide invariant or engine contract normally belongs in `scripts/test-*.mjs`.

Browser behavior belongs in `e2e/`.

A check that only exists for a retired release should remain clearly identified as historical rather than being silently added to the main aggregate suite.
