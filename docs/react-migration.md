## React/TypeScript presentation migration

This PR completes the React/TypeScript presentation migration into the existing Kanji 5 static shell while keeping the existing learning/runtime boundaries authoritative.

### Completed
- React 19 + TypeScript + Vite frontend under `frontend/`
- Typed presentation adapter over the existing Kanji 5 v1.9/v2 boundaries
- Learning / Review / Exercise / Feedback / Insights / Stats / Settings implemented in React
- Sumi Play / Kanjis Bloom visual language, responsive layout, accessibility, and reduced-motion support
- React production bundle tracked under `react-dist/`
- Static-shell integration through `app-bootstrap.js`
- React is now the default `/` renderer
- Explicit rollback routes:
  - `?v2=1` or `?react=0` → existing v2 DOM renderer
  - `?legacy=1` → legacy v1 runtime
- Service-worker cache includes the React bundle
- Migration boundary, React E2E, authoritative snapshot parity, offline boot, current-v2 compatibility, and legacy release-suite verification

### Architecture invariant
React remains presentation-only. Scheduling, grading, learner modeling, recovery, persistence, session state, and offline authority remain in the existing Kanji 5 runtime/boundaries. The frontend does not directly access `localStorage`, FSRS, or learner internals.

### Verification
Latest verified branch head: `2683b6ab7c0470de2fa220ef5e240e76ef64d1ff`

- React typecheck: PASS
- Production build: PASS
- Migration boundary contract: PASS
- React presentation E2E: PASS
- React authoritative snapshot parity: PASS
- React offline boot: PASS
- Current-v2 compatibility: PASS
- v1.6 browser suite: 13/13 PASS
- v1.7 active-release browser suite: PASS
- v1.8/v1.9 contract + browser coverage: PASS

### Renderer transition
The old `v2-presentation.js` is no longer on the default route and is retained only behind the explicit `?v2=1` / `?react=0` rollback path. Physical deletion is intentionally a separate cleanup step after the rollback path is retired; the React layer does not duplicate learning-engine authority.