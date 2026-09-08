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

### Compatibility
- Existing v1.6 knowledge and session data remains supported.
- Production, vocabulary, and context recall prompts remain intentionally gated until real learner-facing exercises and graders are available.
