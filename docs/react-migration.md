## React/TypeScript presentation migration

The React/TypeScript frontend is now the **sole production browser presentation** for Kanji 5. The learning/runtime boundaries remain authoritative.

### Completed
- React 19 + TypeScript + Vite frontend under `frontend/`
- Typed presentation adapter over the v1.9 learning/runtime boundaries
- Learning / Review / Exercise / Feedback / Insights / Stats / Settings implemented in React
- Sumi Play / Kanjis Bloom visual language, responsive layout, accessibility, and reduced-motion support
- React production bundle generated into `react-dist/` during build/deploy; generated output is not committed
- Static-shell integration through `app-bootstrap.js` (session/bootstrap/language/SW startup)
- React is the only `/` renderer; legacy/v2 DOM presentation routes have been retired
- Retired presentation assets removed from the production shell and service-worker manifest
- React E2E, authoritative snapshot, offline, accessibility and visual-system verification retained

### Architecture invariant
React remains presentation-only. Scheduling, grading, learner modeling, recovery, persistence, session state, and offline authority remain in the existing Kanji 5 runtime/boundaries. The frontend does not directly access `localStorage`, FSRS, or learner internals.

### Renderer transition
The former `v2-presentation.js`, `v2-components.js`, `v2-presentation.css`, and legacy presentation shell have been retired. The React layer consumes the existing structured v1.9 boundary; it does not duplicate learning-engine authority.


## Current experience navigation

The React presentation exposes Review and Practice as explicit, independent user-facing experiences. Review is the fast retention loop; Practice is the active-learning loop. Both consume the same authoritative v1.9 engine through the typed presentation boundary.


## Learner-facing polish

The production shell keeps implementation details out of the learner-facing copy and presents Learning/Active Recall as the primary navigation choices.
