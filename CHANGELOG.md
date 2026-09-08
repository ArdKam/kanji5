# Changelog

## [1.7.0] — 2026-09-08

### Added
- Adaptive recall decisioning at the individual learning-attribute level.
- Per-attribute evaluation for accuracy, uncertainty, and recovery after errors.
- Persisted baseline comparison and evidence-gated tuning recommendations.
- Session continuity for adaptive recall intent across reload/resume flows.
- Learner-facing adaptive recall UX and browser E2E coverage.

### Changed
- Bumped the package version to `1.7.0`.
- Scoped the v1.7 CI workflow to `main` and pull requests instead of historical feature branches.
- Kept FSRS as the card-level scheduler; v1.7 only selects which learning attribute to probe.
- Removed obsolete v1.4/v1.6 runtime compatibility shims and their historical build/smoke scripts.
- Centralized the v1.3 storage bridge on the canonical state API and removed the committed raw Jōyō source from runtime distribution.
- Pinned the dataset build source to a fixed upstream commit and added unified `npm test` discovery for repository contract tests.
- Updated the architecture document to describe v1.7 as the current living runtime architecture.

### Compatibility
- Existing v1.6 knowledge and session data remains supported.
- Production, vocabulary, and context recall prompts remain intentionally gated until real learner-facing exercises and graders are available.
- Retired UI shims are no longer part of the runtime or offline shell; the v1.4 education migration boundary remains for data compatibility.

### Verification
- The v1.7 contract and browser test suites must pass on `main` before release publication.
