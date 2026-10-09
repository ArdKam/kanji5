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
| Runtime data | `kanji-data.json`, `kanji-components.json`, `kanji-visual-structure.json`, `kanji-radicals.json`, `kanji-radical-map.json` | Runtime data; inspect build scripts before editing. |
| Browser E2E | `e2e/` | Playwright browser/integration coverage. |
| Contract/unit tests | `scripts/test-*.mjs` | Repository-level contracts and unit/regression checks. |
| Generated React bundle | CI/working-tree output only (`react-dist/`) | Built from `frontend/`; not source-controlled. Do not edit manually. |
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
├── react-dist/               # generated locally/CI; ignored by Git
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

## CI/workflow guide

Workflow filenames preserve their historical names, so the filename alone is not always the best description of scope.

| Workflow file | Actual role |
| --- | --- |
| `.github/workflows/react-frontend.yml` | Current React presentation build, shipped-artifact validation, and React/browser release gates. |
| `.github/workflows/build-v1.8.yml` | Consolidated learning-engine compatibility, v1.9 validation, aggregate unit/contract gates, and release checks. |
| `.github/workflows/pages-deploy.yml` | Builds the current frontend, validates it, packages the generated output, and deploys GitHub Pages. It does not mutate `main`. |

Do not rename or move workflow files merely to make the names prettier without checking path filters, workflow references, and release automation first.

## Generated and compatibility artifacts

The primary generated React files are:

- `react-dist/kanji5-react.js`
- `react-dist/kanji5-react.css`

The canonical production build is generated into `react-dist/` during CI/development and is not source-controlled. Historical release-specific React/SW artifacts are retired after runtime-usage verification; they are not part of the production browser path.

The React build is produced with:

```bash
cd frontend
npm run typecheck
npm run build
```

This writes the current React bundle to `react-dist/`.

When investigating a UI bug, prefer changing the source under `frontend/` rather than editing generated JavaScript/CSS in `react-dist/`.

## GitHub presentation metadata

`.gitattributes` marks `react-dist/` as generated and `vendor/` as vendored for GitHub's repository presentation. This changes repository browsing/statistics only; it does not change runtime behavior.

## Test-tree entry points

For repository tests, start with [`scripts/README.md`](scripts/README.md) before reading the large versioned test tree.

For Playwright/browser coverage, start with [`e2e/README.md`](e2e/README.md) before opening individual specs.
