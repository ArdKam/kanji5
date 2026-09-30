# Kanji 5 — Project Structure

This file is the quickest way to orient yourself in the repository.

## Start here

For the current product, read these in order:

1. `README.md` — product, release status, and high-level capabilities.
2. `ARCHITECTURE.md` — runtime boundaries and dependency direction.
3. `frontend/src/main.tsx` — React presentation entry point.
4. `frontend/src/app/App.tsx` — current application shell and experience orchestration.
5. `frontend/src/app/engine.ts` — typed adapter between React and the authoritative runtime boundary.
6. `v1.9-v2-boundary.js` — browser-facing boundary that exposes structured state/actions to React.

## Which layer owns what?

| Area | Current source / authority | Notes |
| --- | --- | --- |
| React UI | `frontend/` | Source code for the current presentation. |
| React entry | `frontend/src/main.tsx` | Vite/React bootstrap. |
| Presentation adapter | `frontend/src/app/engine.ts` | Keeps React away from persistence, FSRS, and runtime internals. |
| Learning/runtime authority | Root `v1.*` runtime modules | Versioned names reflect the evolution of the engine; do not assume every `v1.*` file is legacy. |
| Presentation boundary | `v1.9-v2-contract-core.js`, `v1.9-v2-boundary.js` | Stable structured contracts consumed by React. |
| Review scheduling | `review-runtime.js` | Review/scheduling runtime; React consumes snapshots/actions. |
| Remote sync | `supabase-sync.js` | Transport/sync layer. |
| Offline runtime | `sw.js` | Current service-worker wiring and precache policy. |
| Runtime data | `kanji-data.json`, `kanji-components.json`, `kanji-radicals.json`, `kanji-radical-map.json` | Runtime data; inspect build scripts before editing. |
| Browser E2E | `e2e/` | Playwright browser/integration coverage. |
| Contract/unit tests | `scripts/test-*.mjs` | Repository-level contracts and unit/regression checks. |
| Generated React bundle | `react-dist/` | Built output. Do not edit these files manually; rebuild from `frontend/`. |
| Compatibility presentation | `?legacy=1` path in `index.html` | The legacy loader is explicitly gated; inspect the `legacyScripts` list before changing compatibility behavior. |

## Current browser path

The default browser path is:

`index.html`
→ `app-bootstrap.js`
→ `v1.9-v2-boundary.js`
→ `react-entry.js`
→ generated `react-dist/kanji5-react.js`

React source lives under:

`frontend/src`
→ `main.tsx`
→ `app/`

The learning engine stays outside the React tree.

## Directory guide

```text
.
├── frontend/                 # current React/TypeScript presentation source
│   └── src/
│       ├── main.tsx
│       ├── styles.css
│       └── app/              # presentation components + typed adapter/support code
├── e2e/                      # Playwright browser/integration tests
├── scripts/                  # contract/unit tests and maintenance/build helpers
├── docs/                     # focused documentation and setup guides
├── react-dist/               # generated React build artifacts
├── vendor/                   # vendored runtime dependency used offline
├── supabase/                 # Supabase schema assets
└── *.js                     # versioned learning/runtime modules and browser integration
```

## Important naming rule

A `v1.x-` filename does **not** automatically mean "dead code". Some versioned modules remain authoritative runtime dependencies because the learning engine evolved incrementally.

Conversely, a file being present in the repository does not mean it is part of the default browser presentation. For presentation questions, start from `frontend/`, `index.html`, and `react-entry.js`.

## Generated files

The React build is produced with:

```bash
cd frontend
npm run typecheck
npm run build
```

This writes the shipped bundle to `react-dist/`.

When investigating a UI bug, prefer changing the source under `frontend/` rather than editing generated JavaScript/CSS in `react-dist/`.
