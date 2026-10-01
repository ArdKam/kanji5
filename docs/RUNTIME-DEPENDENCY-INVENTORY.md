# Kanji5 Runtime Dependency Inventory

As of the architecture/build cleanup branch on 2026-10-01.

## Production browser path

`index.html`
→ `app-bootstrap.js`
→ `v1.9-v2-boundary.js`
→ `react-entry.js`
→ generated `react-dist/kanji5-react.js`

React remains presentation-only.

## Runtime ownership

| Layer | Status | Owner / role |
| --- | --- | --- |
| `index.html` | active | Minimal browser shell, runtime wiring, startup UI shell |
| `app-bootstrap.js` | active | Single production bootstrap; SW registration and session runtime kick-off |
| `v1.5-state.js` | active | Persistence/state authority |
| `v1.3-p0.js` | active | Early data/FSRS bootstrap contracts consumed by review runtime |
| `review-runtime.js` | active | Review scheduling runtime and FSRS integration |
| `v1.6-session*.js` | active | Adaptive session runtime; loaded from bootstrap |
| `v1.4-education-*.js` | active lazy | Education migration/core runtime |
| `v1.5-education-ui.js` | active lazy | Legacy-compatible education interaction boundary used by current runtime |
| `v1.5-network.js` | active lazy | Network/content adapter |
| `v1.8-*.js` | active | Deterministic production/vocabulary/context graders |
| `v1.9-*.js` | active | Learner model, adaptive planner, recovery, evaluation, integrity and v2 boundary |
| `v1.9-v2-contract-core.js` | active | Structured presentation contract |
| `v1.9-v2-boundary.js` | active | Browser-facing runtime/presentation boundary |
| `v2-custom-study-core.js` | active lazy | Custom-study selection core |
| `supabase-sync.js` | active | Remote transport/sync only |
| `account-fallback.js` | active compatibility | Account fallback shell integration |
| `sw.js` | active | Single production service worker |
| `frontend/` | active source | Canonical React/TypeScript presentation |
| `react-dist/` | generated only | CI/local build output; not source-controlled |

## Compatibility path

`?legacy=1` intentionally loads the explicitly listed compatibility education/runtime modules in `index.html`.

The compatibility path is not the default renderer, but those modules are not dead until the compatibility contract is intentionally retired.

## Retired artifacts

The following have been proven outside the default production path and are retired from source:

- `app-bootstrap-release18.js`
- `app-bootstrap-release19.js`
- `react-entry-release18.js`
- `sw-release18.js`
- `sw-release19.js`
- tracked `react-dist/kanji5-react*.js`
- tracked `react-dist/kanji5-react*.css`
- tracked generated React fonts under `react-dist/assets/`

## Cleanup rule

A versioned filename is not sufficient evidence for deletion. Runtime imports, shell wiring, service-worker precache, compatibility routing, build/deploy workflows, and tests must be checked before retirement.

## Build rule

The React build is produced with:

```text
cd frontend
npm run typecheck
npm run build
```

The generated `react-dist/` directory is consumed by CI/deploy from the working tree and is intentionally ignored by Git.

Deployment cache provenance: the Pages workflow uses the exact triggering source commit SHA for React assets and the service-worker registration/cache name.
