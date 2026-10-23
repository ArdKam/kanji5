# Rinemi Feature Roadmap — Kanji Bookmarks & Anki Deck Import

**Decision date:** 2026-10-18  
**Status:** Bookmark MVP is merged to `main` at `766f85c`; production deployment and release evidence are still pending. Anki remains research-gated and unimplemented.  
**Parent strategy:** [Product Strategy & Competitive Positioning](PRODUCT-STRATEGY-AND-COMPETITIVE-POSITIONING-2026-10-17.md)  
**Canonical execution/release authority:** [`ROADMAP.md`](../ROADMAP.md)

## Execution update — 2026-10-23

PR #616 currently implements the bookmark MVP through the existing persistence boundary and backup envelope, with timestamped per-Kanji records and removal tombstones for sync reconciliation. Its contract/E2E coverage targets save, reload, backup inclusion, filtering, unsave, and unchanged review/knowledge state. The same PR also connects Dictionary details to the existing public content-correction form; that public issue path is not a private privacy/account-request channel.

Do not mark bookmarks complete until the exact-head CI suite passes, the PR merges on current `main`, and the intended deployment is verified. Multi-device authenticated sync and backup/restore acceptance still require explicit evidence; unit merge tests do not establish live cross-device behavior.

## Purpose

Record two user-requested feature candidates with a deliberate scope and measurable acceptance criteria:

1. **Kanji bookmarks** — a low-complexity way to save kanji and return to them.
2. **Anki deck import** — a way for learners who already own Anki decks to try reviewing supported imported cards in Rinemi without manually recreating them.

The intent is to reduce friction while preserving Rinemi's focused Japanese-learning experience. These features must not be described as shipped until the implementation is merged and verified on current `main` and the intended deployment.

## Priority and sequencing

### 1. Kanji bookmarks — preferred first

**Priority:** High-value, low-relative-effort candidate.  
**Timing:** After current release-critical blockers are closed, provided the work does not delay Public Kanji readiness.

#### MVP scope

- Save and unsave a kanji from the Dictionary result/list and kanji detail view.
- Provide a discoverable saved-kanji list or Dictionary filter, with a useful empty state and an easy way to return to browsing.
- Show clear saved/unsaved state with keyboard support, accessible names/status announcements, and usable mobile touch targets.
- Preserve saved state across reloads and offline use through the existing persistence boundary.
- Define and test how bookmarks participate in the existing backup/restore and optional sync behavior. Reuse established seams; do not introduce a parallel storage or sync system. If any surface cannot preserve bookmarks, document that limitation before release.
- Keep the action quick: no confirmation dialog for routine save/unsave.

#### Acceptance criteria

- A learner can save from each supported entry point, navigate away, reload, and find the same kanji in Saved.
- Save/unsave changes are immediately reflected across visible Dictionary surfaces without a stale count or duplicate entries.
- Saved-list entries navigate to the canonical kanji detail and existing learning/practice actions.
- Empty, loading, storage-failure and restored-data states are understandable and accessible.
- Persian RTL, English LTR, light mode, dark mode, narrow mobile, keyboard-only navigation, and reduced-motion settings are covered by appropriate tests.
- Saving or removing a bookmark does **not** change kanji identity, card identity, FSRS parameters/due dates, ratings, review history, grading, evidence, Learner Model, Adaptive Planner, or Recovery behavior.
- Backup/restore and sync guarantees are asserted only after their exact paths are tested; no claim of cross-device synchronization is made from local persistence alone.

#### Success signals

Measure the proportion of active learners who save at least one kanji, revisit Saved, and move from a saved item into a useful existing learning/practice action. Use these as usability signals, not proof of better retention.

### 2. Anki deck import — validate demand and architecture first

**Priority:** Medium; potentially high for experienced learners with existing collections.  
**Timing:** After bookmark MVP and only when learner interviews or observed tasks confirm that rebuilding/leaving an Anki deck is a meaningful barrier to trying Rinemi. Do not delay release-critical work.

#### Feasibility gate before implementation

- Test representative real `.apkg` exports, including basic text cards, reversed cards, cloze cards, images, and audio, and record which content/state can be preserved faithfully.
- Confirm whether imported generic cards can use Rinemi's existing authoritative scheduling/review boundary. FSRS must remain the single scheduling authority; do not create an independent scheduler in React or a parallel review runtime merely for imported cards.
- Confirm a safe and maintainable way to parse the package and handle its archive/database/media contents within browser resource limits. Assess dependency size, licensing, maintenance, and vulnerability exposure before adding a parser.
- Define supported and unsupported content before promising broad Anki compatibility. A successful import must not silently omit fields or media.

#### Initial product scope to validate

- Select a local `.apkg` package and show a pre-import summary/preview: deck name when available, candidate note/card counts, sample front/back, and warnings.
- Import only the explicitly supported note/card types. Show unsupported card templates, fields, scheduling metadata, and media clearly; let users cancel rather than accepting silent data loss.
- Preserve sanitized text/HTML and any media types the first implementation explicitly supports. Never execute JavaScript or untrusted scripts from an imported deck.
- Give imported decks and cards stable identities separate from native kanji/card identities. Re-importing the same deck must have a documented duplicate policy and must not overwrite native learner data.
- Route reviews through the existing review/scheduling authority. Transfer of Anki intervals, due dates, review history, FSRS parameters, or learning steps is **not promised** until each mapped field and resulting behavior has been verified against representative files.
- Include size/decompression limits, malformed-package handling, cancellation/error recovery, and clear post-import reporting.
- Start with `.apkg`; do not imply support for complete Anki collection exports (`.colpkg`), live Anki sync, export back to Anki, every custom template, or every media type unless those are separately implemented and tested.

#### Acceptance criteria

- Each supported sample deck imports with exact counts and content fidelity against its source; unsupported content is reported and never silently dropped.
- Malformed, oversized, duplicate, partially supported, and media-heavy packages fail safely or produce an explicit preview warning.
- HTML is sanitized; imported JavaScript is never executed; media paths and archive extraction are bounded against unsafe or unexpected files.
- A user can cancel before mutation and receives an understandable success/failure summary afterward.
- Imported cards can be reviewed using the existing authoritative scheduling path, with stable per-card identity across refresh, backup/restore, and any supported sync path.
- No cross-domain collision or mutation occurs to native kanji identity, review history, learner evidence, persistence, or sync data.
- Browser tests cover the supported package matrix, unsupported features, error paths, import cancellation, duplicate handling, and keyboard/mobile flows.
- Documentation lists supported note/card types, media, known limitations, privacy/storage behavior, and whether prior Anki scheduling data is preserved.

#### Success signals

Measure import attempts, completion rate, cancellation and failure rates, unsupported-content frequency, and whether learners complete their first useful review session after import. Use interview/task evidence to decide whether to expand format coverage. Do not treat import count alone as retention or learning-effectiveness evidence.

## Shared architecture and product guardrails

- FSRS remains the only review-scheduling authority.
- The v1.9 Learner Model remains the learner-state authority; Adaptive Planner remains the practice-selection authority.
- Recovery, grading, persistence, evidence, and sync stay behind current engine/adapters and established boundaries. React remains presentation-only.
- No broad persistence migration, parallel scheduler, second review engine, or silent identity change.
- Keep the core Rinemi learning loop simple. Imported Anki content is a separate content source; do not falsely label arbitrary imported cards as canonical Rinemi kanji.
- Preserve the local-first/offline behavior. Make cloud/sync claims only for paths that have been verified.
- A passing unit test or feature branch is not release evidence. Verify exact current-main tests, actual rendered UI, and same-SHA deployment before calling either feature shipped.

## Implementation handoff

1. Finish current release-critical tasks and reconcile active documentation PRs.
2. Implement and verify Kanji Bookmarks as a bounded, isolated UI/data feature.
3. Conduct a short Anki import feasibility spike and user-demand check.
4. Agree on the supported `.apkg` compatibility matrix before implementation.
5. Implement Anki import only if the spike proves faithful import and review through existing authoritative seams are practical.
6. Update the canonical `ROADMAP.md` in a coordinated documentation change after its current active edit is reconciled.
