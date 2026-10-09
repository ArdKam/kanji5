# Rinemi — PWA and Native App Readiness Plan

Status: execution plan / initial source audit  
Scope: existing web app → installable PWA with reliable offline learning → Android and iOS store candidates  
Strategy: incremental changes, one production service worker, one learning engine, no parallel scheduler or persistence authority.

## Product decisions

- Targets: PWA plus Android and iOS store applications.
- Offline requirement: users can continue learning and reviewing, persist progress locally, and reconcile changes when connectivity returns.
- Store timing: only after the PWA passes its release gate.
- Architecture invariant: `index.html → app-bootstrap.js → v1.9-v2-boundary.js → react-entry.js → React presentation`; FSRS, grading, learner model, recovery, persistence and adaptive planner remain owned by the existing engine.
- Deployment invariant: generated `react-dist/` is built and validated in CI; do not commit generated output as a workaround.

## Initial repository evidence (source inspection)

- `manifest.webmanifest` already defines Rinemi, `display: standalone`, relative start/scope, theme/background colors and SVG icons.
- `sw.js` is the current service worker. It precaches the shell and Vite React asset graph, separately caches canonical data and selected API responses, and removes old `kanji5-*` caches during activation.
- `scripts/test-service-worker-shell.mjs`, `e2e/react-presentation-offline.spec.mjs`, `e2e/react-pwa-stale-client.spec.mjs`, and `e2e/react-pwa-release.spec.mjs` already provide useful shell/offline/cache regression gates.
- `v2-storage-core.js` currently adapts `localStorage`; `supabase-sync.js` uses that storage and provides optional remote sync.
- Existing CI already runs the React offline, stale-client and PWA release browser gates.
- No native `android/` or `ios/` project was verified during this initial file-level inspection. Confirm via repository tree before deciding how to scaffold native targets.
- This is source inspection, not proof of live installability, real-device behavior, offline mutation durability, or store readiness.

## Phase 0 — Establish baseline and guardrails

1. Record the exact main SHA and current deployed Pages SHA/URL.
2. Run the existing root contract suite, frontend typecheck/build, generated artifact contracts and PWA/offline Playwright tests.
3. Inspect the full service-worker lifecycle, all storage write paths, Supabase sync/replay behavior, and the current build/deploy workflows.
4. Run the live Pages smoke checks; distinguish a source/CI pass from actual device verification.
5. Preserve all unrelated changes and do not merge directly into `main`.

Exit criteria:
- Baseline SHA, commands, results and known environment limitations are recorded.
- Any pre-existing failures are distinguished from regressions.

## Phase 1 — PWA shell and installability

1. Verify manifest references, icon dimensions/formats, scope, start URL, theme, display mode, HTTPS and registration path against the actual deployed site.
2. Validate every precached URL against the built release artifact, not only the source tree.
3. Test first install, repeat launch, update activation, stale-cache eviction and rollback/recovery behavior.
4. Keep one production service worker; never add a competing worker or indiscriminately clear user data during an upgrade.
5. Add/extend automated assertions for manifest, icon fetches, worker registration and built-artifact consistency only where existing coverage is insufficient.

Exit criteria:
- Installability checks pass on the deployed artifact and no required shell asset returns 404.
- Existing release, stale-client and offline shell gates pass.

## Phase 2 — Offline learning and durable local changes

1. Trace each learning/review/grading path from authoritative engine mutation through persistence; identify all writes that can occur offline.
2. Test actual learning and review mutations while offline, close/reload, then reconnect; verify progress survives and the engine remains authoritative.
3. Define a durable, idempotent sync/outbox contract only if the existing sync implementation does not already guarantee it. Each queued mutation needs a stable event identity, schema/version metadata, retry behavior, and observable failure state.
4. Ensure replay/merge is deterministic and duplicate events cannot double-count reviews or regress FSRS state.
5. Keep local-first learning available when Supabase is unavailable or the user is a guest.
6. Do not replace `localStorage` wholesale or introduce IndexedDB/SQLite migration without evidence from the traced write paths and tests. If stronger storage is needed, design a versioned migration with rollback and preservation tests.
7. Add browser tests for: offline review write → reload → reconnect → sync; duplicate retry; conflicting-device merge; expired session; failed sync; and upgrade with unsynced local events.

Exit criteria:
- Offline learning/review writes survive reload and app restart in the supported browser.
- Reconnection syncs without loss or duplication; failures remain recoverable and visible.
- FSRS, grading and adaptive selection semantics are unchanged.

## Phase 3 — PWA release candidate and device matrix

- Validate Android Chrome, iOS Safari, desktop Chrome/Edge and the documented secondary browser tier.
- Test installation, cold/warm start, safe areas, keyboard, RTL/LTR, audio/data availability, offline/reconnect, storage retention and update.
- Record real-device evidence separately from CI results.
- Verify privacy, data export/deletion and account/guest behavior for offline and synced users.

Exit criteria:
- All P0 PWA/offline defects are closed or explicitly release-blocking.
- The release checklist includes browser/device, OS version, commit SHA, test result and evidence.

## Phase 4 — Native wrapper evaluation and scaffolding (after PWA gate)

Default candidate: evaluate the current stable Capacitor release against the repository's actual Node/frontend toolchain. Do not add it until Phase 3 is green.

1. Confirm compatible Node, Vite build output, asset base paths, CSP, authentication redirect URLs, deep links and offline storage behavior in a WebView.
2. Add Android and iOS shells on a dedicated branch; pin compatible package versions and commit only source/configuration, not generated secrets or machine-specific build products.
3. Reuse the existing web UI and engine. Add native plugins only for a concrete requirement (status bar, keyboard, share, secure storage, etc.).
4. Separate browser PWA behavior from native WebView behavior behind capability detection; no platform-specific duplicate learning engine.
5. Test native persistence separately. WebView storage may have different eviction/lifecycle characteristics; do not assume browser storage guarantees transfer unchanged.
6. Configure package IDs, icons/splash assets, signing, deep links, privacy manifests/disclosures and store metadata without committing signing secrets.

Exit criteria:
- Debug builds install and pass core learning/review, offline/restart, update and account flows on real Android and iOS devices.
- iOS build is produced on macOS/Xcode or a verified CI/cloud build; a source-only configuration is not considered a successful build.

## Phase 5 — Store release

- Use internal/beta tracks before production.
- Complete store privacy disclosures, content rating, screenshots, support URL, deletion/account policies and reviewer instructions.
- Confirm store policies and review eligibility for the actual app experience; a WebView wrapper alone does not guarantee acceptance.
- Release gradually and monitor crashes, startup failures, sync failures and update adoption.
- Keep web/PWA deployment independent from store review and native binary release.

## Required verification record

For every phase, record:
- branch/PR and exact base/head SHA;
- files changed and why;
- exact test commands and pass/fail output;
- live deployment URL and deployed SHA where relevant;
- manual device/browser matrix and any unverified platforms;
- rollback path and data-loss assessment.

Never claim “live”, “installed”, “synced” or “store-ready” based only on a successful source edit or GitHub commit.
