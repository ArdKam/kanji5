# Changelog

## [2.0.0] — 2026-09-18

### Added
- v2 presentation layer with a dedicated visual system, responsive layout, accessibility semantics, and reduced-motion support.
- Stable consumption of the v1.9 presentation boundary for session, exercise, feedback, learner-skill, session-summary, recent-outcome, and adaptive-reason data.
- Default-route v2 release smoke coverage and release contract checks.
- Continued full compatibility, offline, and browser coverage for the v1.9 learning engine.

### Changed
- The v2 presentation is now the default browser experience; the legacy v1 presentation requires the explicit `?legacy=1` compatibility path.
- Bumped the package version to `2.0.0`.
- Kept the v1.9 learning engine, grading authority, learner model, recovery engine, and FSRS scheduling semantics unchanged.
- Extended the release workflow with the v2 P5 release contract and default-route browser gate.

### Compatibility
- Existing v1.6/v1.7/v1.8/v1.9 learner and session data remains supported.
- The legacy presentation remains available only for compatibility/regression verification; it is not part of the default user-facing flow.

### Verification
- Release validation covers syntax, `npm test`, v1.7/v1.8/v1.9 browser regressions, v2 presentation/accessibility/visual coverage, offline/runtime contracts, and architecture boundaries.


## [1.9.0] — 2026-09-18

### Added
- Standardized, versioned educational outcomes across the five supported learning attributes.
- Evidence-aware learner model with attribute-level mastery, weakness, confidence, recency, momentum, and repeated-failure signals.
- Deterministic Adaptive Planner 3.0 with repair, reinforce, recover, maintain, and explore behaviors.
- Bounded recall recovery engine with wrong/unknown/near-miss feedback and one-retry recovery semantics.
- Learning Evaluation 2.0 with deterministic metrics, baseline comparison, and evidence sufficiency guards.
- Vocabulary/Context data-quality validation, deterministic selection/fallback, migration safeguards, and offline reliability coverage.
- v2 presentation contracts and a browser orchestration boundary for session, exercise, feedback, learner summary, session summary, and adaptive-reason view models.
- Extended service-worker precaching and browser/architecture coverage through the v1.9 P6 boundary.

### Changed
- Bumped the package version to `1.9.0`.
- Kept FSRS as the authoritative card-level scheduler; v1.9 attribute intelligence does not replace card scheduling.
- Preserved local-first persistence and deterministic migration behavior.
- Extended the active learning-engine workflow to validate v1.9 syntax, contracts, browser flows, and release gates.
- Updated documentation to describe v1.9 as the active pre-v2 learning-engine line.

### Compatibility
- Existing v1.6/v1.7/v1.8 learning and session data remains supported by the existing migration/session boundaries.
- Production, Vocabulary, and Context grading remains deterministic and does not delegate grading authority to external APIs.
- v2 presentation code can consume stable view-model contracts without importing persistence or planner internals.

### Verification
- Release gates require syntax validation, `npm test`, v1.7/v1.8 regressions, v1.9 browser flows, offline/runtime checks, architecture checks, and the v1.9 release contract.
- The repository keeps `npm test` as the single local aggregate entry point for `scripts/test-*.mjs`.

## [1.8.0] — 2026-09-15

### Added
- Learner-input Production Recall with a deterministic offline grader.
- Learner-input Vocabulary Recall with a deterministic offline grader.
- Learner-input Context Recall with a deterministic offline grader and safe network-backed content retrieval.
- Browser E2E coverage for Production, Vocabulary, and Context recall, including persistence and empty-answer behavior.
- v1.8 release-gate workflow covering syntax, aggregate contract tests, browser E2E, and runtime/offline contracts.

### Changed
- Bumped the package version to `1.8.0`.
- Closed P0-C Context Recall as the final P0 implementation milestone.
- Kept FSRS unchanged as the card-level scheduler; v1.8 operates through the existing education/session feedback boundary.
- Added v1.8 roadmap release gates so adaptive milestones are not declared complete without test-backed contracts.

### Compatibility
- Existing v1.6/v1.7 state and session data remains supported.
- External vocabulary/context APIs remain content providers only; grading stays deterministic and local.
- Production, Vocabulary, and Context outcomes continue to use separate education attributes.

### Verification
- The v1.8 workflow runs all repository contract/unit tests plus active v1.7/v1.8 browser suites.
- Release publication requires package version, runtime wiring, documentation, and release-contract checks to pass.

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
