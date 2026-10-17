# Rinemi — Product and Engineering Audit Handoff

**Audit date:** 2026-10-17  
**Repository:** ArdKam/kanji5  
**Product:** Rinemi  
**Audited current-main commit:** 085524dc58547e33e42fcaff75784b0c6d3fe6b3  
**Audit type:** Read-only repository, pull-request, workflow and release-readiness review. No application code, learner data, schema or production configuration was changed by this audit.

> **Purpose for future contributors and AI-assisted sessions:** Treat this document as a dated evidence handoff, not as an assertion that every listed issue is still present forever. First re-read the current main HEAD and relevant source/tests. Reconfirm whether each item remains open, was superseded, or was fixed after this date. Historical PR descriptions and old audit baselines are not evidence of current implementation.

## 1. Executive disposition

Rinemi has a substantial technical and educational foundation. The current-main source contains the complete 2,136-record Jōyō kanji corpus, a typed React-to-engine adapter, versioned v1.9 learning-engine boundaries, FSRS integration, a learner model, adaptive planner, recovery/evaluation contracts, and broad automated verification. Current main's React build and GitHub Pages deployment passed on 2026-10-16.

The highest-impact remaining work is **release acceptance, trusted Persian-first content, a small set of verified user-facing defects, and pull-request reconciliation**—not a broad rewrite and not feature-count expansion.

### Current-main and deployment evidence

- Main HEAD at the time of this audit: 085524dc58547e33e42fcaff75784b0c6d3fe6b3, commit message “Improve Learning-card answer hierarchy”.
- React presentation build: passed for that SHA in [workflow run 38964130926](https://github.com/ArdKam/kanji5/actions/runs/38964130926).
- GitHub Pages deployment: passed for that SHA in [workflow run 38965141947](https://github.com/ArdKam/kanji5/actions/runs/38965141947).
- The deployment workflow rebuilds from the verified commit, checks the deployed SHA is still main, validates the staged output, compares hashes of shipped assets and runs production/offline smoke checks.
- Repository metadata reported main branch protection disabled, with required status-check enforcement off. This is a confirmed repository-configuration issue.
- **Public-beta acceptance is not complete simply because build and deployment passed.** Educational, security-configuration, account/data-lifecycle and legal/privacy acceptance remain outstanding in the existing canonical evidence documents.

## 2. Ranked findings and dispositions

Severity: P0 means a public-beta blocker; P1 means high-impact product/engineering work; P2 means a worthwhile, lower-priority improvement. Confidence describes evidence strength, not impact size.

### P0 — Public-beta blockers

#### EDU-01 — Independent educational content review and placement validation remain open

**Evidence**
- Existing record: [docs/EDUCATIONAL-CONTENT-AUDIT.md](../EDUCATIONAL-CONTENT-AUDIT.md)
- Sample QA: [docs/C4-SAMPLE-CONTENT-QA.md](C4-SAMPLE-CONTENT-QA.md)
- Current implementation contract: scripts/test-c4-educational-validity.mjs and v1.9-learner-content-core.js
- The existing audit says the implementation provides learner-priority meanings/readings, deterministic example/context filtering, independent Production evidence semantics and a 20-item stratified placement implementation. It explicitly does not establish psychometric validity, production-item quality or real-user placement stability.
- The existing QA sample is implementer review, not independent sign-off. Remote KanjiAPI/Tatoeba data and high-risk meanings, readings, examples, context sentences and curated mnemonics still require representative human review against the frozen release candidate.

**Impact:** A functioning scheduler and green tests cannot compensate for misleading meanings, awkward examples, weak distractors or poor placement decisions.

**Disposition:** Keep the educational beta gate open until independent Japanese-language/content review and an appropriately designed placement validation are recorded against one frozen candidate SHA. Do not redo C4 from scratch; fix only demonstrated defects and add the missing acceptance evidence.

**Acceptance:** Record sample design, entries/items reviewed, reviewer, date, decisions/corrections and candidate SHA. Report placement uncertainty honestly. Do not claim adaptive superiority from implementation tests alone.

#### SEC-01 — Production security acceptance requires re-verification and closure

**Evidence**
- [docs/SECURITY-REVIEW.md](../SECURITY-REVIEW.md)
- [PR #554 — live security smoke harness](https://github.com/ArdKam/kanji5/pull/554)
- [Current-main deployment workflow](../../.github/workflows/pages-deploy.yml)

PR #554 records live tests dated 2026-10-16. The test report records positive CSP/XSS, unauthenticated endpoint and RLS/non-owner checks. It also reports missing HTTP X-Content-Type-Options: nosniff, missing effective HTTP framing protection, absent HTTP Permissions-Policy, CSP/Referrer-Policy delivered as meta policies instead of HTTP headers, and Supabase leaked-password protection disabled. The iframe test did not prove a working clickjacking exploit; exploitability was inconclusive.

These findings are **evidence from the recorded live smoke run, not automatic proof that every header is unchanged on every later deployment**. Re-run the checks against the exact current-main deployed SHA before release sign-off.

**Disposition:** Do not recreate the already-merged R12 security implementation unless a current-source regression is demonstrated. Treat the remaining work primarily as current-SHA acceptance plus applicable deployment/Supabase operational configuration. Resolve or formally disposition each finding.

**Acceptance:** Current-SHA HTTPS/header and security smoke evidence, dependency/source-map review, RLS verification, clear framing-control decision, and a recorded resolution for the production leaked-password-protection finding. The read-only smoke is not a full authenticated penetration test.

#### GOV-01 — Data lifecycle, privacy and public-release governance are incomplete

**Evidence**
- [docs/RELEASE-EVIDENCE.md](../RELEASE-EVIDENCE.md)
- [docs/LEGAL-REVIEW-CHECKLIST.md](../LEGAL-REVIEW-CHECKLIST.md)
- [docs/SECURITY-REVIEW.md](../SECURITY-REVIEW.md)

Current documentation records that the account API has no account-delete operation, Settings reset is scoped to learning progress rather than complete browser-data erasure, database cascade behavior is not a user-facing deletion workflow, the portable backup does not capture every datum stored in the browser, and no dedicated private privacy/account request channel is operational. Final retention, Terms/Privacy and third-party disclosures also require approval.

**Impact:** Account, local data, synced data, backups and provider-held records can have different lifecycle semantics. Users must not be told that a learning reset completely erases all of them.

**Disposition:** Keep the legal/governance gate open. Implement and verify deletion/export behavior or document and approve the alternative request workflow. Do not infer completed deletion from an SQL cascade.

**Acceptance:** Verified account and local-data lifecycle, accurate backup/export exclusions, approved retention and privacy documentation, appropriate private request channel, and reviewed third-party/license disclosures for enabled services.

### P1 — High-impact fixes and product work

#### UX-01 — Latest Learning-card stability candidate fails two compact/landscape bounds assertions

**Evidence:** [PR #558](https://github.com/ArdKam/kanji5/pull/558), candidate HEAD 61e22b12ae8a1880b6af303e452ded15ec737262; [failed React build/E2E run 38971761198](https://github.com/ArdKam/kanji5/actions/runs/38971761198).

The Learning-card browser run reported 21 passing and 2 failing tests. The two failures were:
- e2e/react-learning-card-flip.spec.mjs near line 360: “Learning meaning and structure stay reachable in compact and landscape layouts”.
- The same file near line 496: “learning card stays within a short desktop landscape viewport”.

Both reported the card top at -32px when the assertion required it to be at least -1px. The candidate's v1.8/v1.9 workflow and automated visual audit passed, but those passes do not erase the failed Learning-card gate.

**Important scope boundary:** This failure is on the unmerged PR #558 candidate, not on the current deployed main SHA. Do not describe current main as failing this particular run, and do not merge #558 without fixing or correctly resolving the failure on an updated head.

**Acceptance:** Rebase/port the required change to current main, preserve the kanji → meaning → readings → structure hierarchy and the 2D visual/card flip behavior, and pass the exact-head compact portrait/landscape, desktop landscape, accessibility, reduced-motion, browser compatibility and asset-budget checks. Ensure lower controls and fixed navigation remain reachable without overlap.

#### OFF-01 — Offline API failure can appear as a successful empty vocabulary result

**Evidence:** current-main sw.js; frontend/src/app/VocabularyExamples.tsx; frontend/src/app/StrokeOrderViewer.tsx.

In current main, the service worker's apiCacheFirst fallback can return a JSON empty array with HTTP 200 and an X-Kanji5-Offline-Fallback header when an uncached API request fails offline. VocabularyExamples renders the ordinary empty state when the resolved item list is empty and does not visibly distinguish that fallback. This can conflate “the provider confirmed no examples” with “the network/resource was unavailable.” The stroke-order component does have a retryable error state when its fetch throws, but cached and uncached offline behavior still needs integration-level verification.

**Disposition:** Make the narrowest change that preserves existing offline-cache and old-client behavior. Do not broadly rewrite cache storage or persistence.

**Acceptance:** No uncached transport failure is presented as a confirmed successful empty result; cached-but-stale content is described honestly; unavailable and truly empty states differ; reconnect-and-retry works; existing shell, offline learning and stale-client upgrade tests remain green.

#### LOC-01 — Persian-first value proposition is not yet matched by the core meaning data

**Evidence:** kanji-data.json contains 2,136 records with English source meanings; v1.9-learner-content-core.js prioritizes source glosses and keeps the reference meanings. frontend/src/app/DictionaryKanjiCard.tsx displays item.meanings directly. The latest Learning card can tier meanings but does not thereby translate those glosses to Persian.

**Impact:** Persian navigation and labels alone do not make the core kanji curriculum Persian-first. This is a major product differentiation opportunity, but unreviewed automatic translations could introduce errors.

**Disposition:** Add a separately versioned, provenance-bearing, human-reviewed Persian learner-content layer in stages. Preserve all source meanings and persisted learner data. Do not silently replace the source corpus or claim unreviewed entries are verified Persian translations.

**Acceptance:** Priority entries have reviewed Persian glosses, ambiguity handling and provenance/reviewer metadata; unreviewed source content stays available with honest disclosure. Use representative independent content review to determine quality, not just corpus coverage.

#### PR-01 — Open PR queue contains overlapping changes and stale base snapshots

**Evidence:** current open queue checked on 2026-10-17 included #558, #550, #554, #545, #548, #547, #535, #540, #538, #537, #533, #531, #530, #529, #522 and #517. Several Learning-card branches overlap (#558/#550/#545/#538); design-system/UX branches overlap (#548/#547/#535/#540); account-menu layering has overlapping candidates (#531/#529). Several bases point to older main SHAs.

**Impact:** Stale assumptions, duplicate fixes, regressions, unnecessary CI churn and inaccurate status reporting.

**Disposition:** Before starting a new change, compare each open PR's actual diff against current main. Rebuild/port unique required value to a single current branch, or close/supersede obsolete candidates. Open PRs alone are not completion evidence.

**Acceptance:** Every PR has an explicit keep/port/supersede/close disposition; active changes target current main; the final diff is narrow and current; exact-head gates pass before merge.

#### REL-01 — Main branch protection is disabled

**Evidence:** GitHub branch metadata for current main returned protected=false, protection.enabled=false and status-check enforcement off.

**Impact:** An otherwise extensive release workflow can be bypassed by a direct push or unreviewed merge.

**Disposition:** Configure branch rules to require the applicable build, engine-boundary, compatibility and release checks. Confirm the actual required-check names and deployment trigger behavior before enforcing rules.

**Acceptance:** A test PR cannot be merged while required checks are failing or missing; deployment remains tied to successful current-main artifacts. Record ruleset/branch-protection evidence.

### P2 — Medium-priority follow-ups

#### CONT-01 — Dictionary topic coverage is explicitly partial

**Evidence:** frontend/src/app/kanji-topics.json declares 24 curated topics, 1,156 assignments and 849 unique kanji in this audit. The taxonomy states that coverage remains partial and memberships are not inferred automatically. Counts can change; recalculate them whenever the dataset changes.

**Disposition:** Do not describe topic coverage as exhaustive. Expand topic assignments only with reviewed semantic associations and existing taxonomy tests.

**Acceptance:** Topic labels and coverage are honest; filters stay correct and accessible; assignment increases do not weaken precision or create a competing curriculum/scheduler.

#### UI-01 — Small text and design-system convergence need measured polish

**Evidence:** frontend/src/styles.css uses --text-xs:11px; the current source has an improved muted token (#62666A) and theme contrast tests. Open PRs propose overlapping design-system and UX work.

**Disposition:** Validate a 12px minimum for secondary text where layout permits and resolve theme/UI changes through one current-main integration candidate. Verify computed rendered colors, focus rings, modal/scrim behavior and responsive layouts rather than relying only on static CSS contracts.

**Acceptance:** Persian/English, Light/Dark/System, mobile/desktop, keyboard and compact landscape pass; no regression in touch targets, focus, navigation, Learning ratings or shipped CSS budget.

## 3. Current verified strengths — do not casually reopen

- Full source corpus: 2,136 Jōyō kanji records in kanji-data.json. Missing individual reading or JLPT metadata must be judged against source conventions, not automatically labeled defective.
- Current main's React build and GitHub Pages deploy passed on SHA 085524dc58547e33e42fcaff75784b0c6d3fe6b3.
- Deployment workflow rebuilds the verified commit, refuses to deploy a stale SHA, verifies staged production artifacts, compares live/staged hashes for selected shipped assets, and runs live/offline smoke.
- FSRS remains scheduling authority; v1.9 Learner Model remains learner-state authority; Adaptive Planner remains selection authority; Recovery/grading/persistence stay engine-owned; React remains presentation-only.
- Existing Dictionary already has search, JLPT/grade/mastery filters, 24-topic taxonomy, matrix/detailed views, keyboard grid behavior and card dialogs. Improve verified usability defects without assuming the feature does not exist.
- Existing dark-theme token and contrast regression tests exist. A fresh, rendered verification is preferable to introducing a parallel token system.
- Existing C4 learner-content and evidence-semantics code should be preserved unless a current-main regression is demonstrated.
- R12 repository-side security hardening is documented as landed. Do not recreate it from scratch; work the current-SHA/production acceptance gaps instead.

## 4. Prioritized implementation roadmap

### Stage 0 — Release control and auditability
1. Protect main and enforce the intended required checks.
2. Reconcile the open PR queue against current main.
3. Record one dated, frozen release candidate and status evidence for all gates.

**Exit criteria:** one source-of-truth branch, no accidental bypass, active PRs use current bases, and the release status distinguishes code complete from acceptance complete.

### Stage 1 — Critical release blockers
1. Re-verify and close production security acceptance gaps (SEC-01).
2. Complete account/local-data deletion, export semantics, retention, Privacy/Terms and service disclosures (GOV-01).
3. Complete independent content and placement acceptance (EDU-01).

**Exit criteria:** all applicable P0 gates have current-SHA evidence, explicit ownership and documented closure or an approved, non-blocking disposition.

### Stage 2 — Core interaction reliability
1. Resolve candidate Learning-card bounds failures (UX-01).
2. Correct offline empty/failure ambiguity (OFF-01).
3. Test theme/rating semantics and navigation/modal/accessibility states on rendered builds.

**Exit criteria:** exact-head typecheck/build, contracts, Learning E2E, offline/stale-client, accessibility, responsive/landscape, WebKit, performance and visual gates pass.

### Stage 3 — Persian-first content and discovery
1. Add reviewed Persian learner meanings to a high-utility subset with provenance/versioning (LOC-01).
2. Expand Dictionary topics by review, not automatic gloss inference (CONT-01).
3. Measure how learners use Learning → Practice → Dictionary/Reading Lab; avoid adding duplicate screens.

**Exit criteria:** source data and learner overlay remain separate; sample review is signed off; topic/navigation behavior remains accessible and stable.

### Stage 4 — Measured learning and retention
1. Evaluate delayed independent recall, not just streaks, activity or completion.
2. Keep recognition, assisted response, revealed self-report and independent production distinct in evidence.
3. Run small, privacy-conscious usability/learning studies before making efficacy or monetization claims.

**Exit criteria:** predefined measures, sample limitations and results are documented; claims match evidence.

## 5. Top five changes by expected combined impact

1. Clear production security/privacy/data-lifecycle blockers and protect main.
2. Complete independent educational content and placement acceptance.
3. Deliver a carefully reviewed Persian meaning layer without overwriting source records.
4. Fix and verify Learning-card compact/landscape behavior on current main.
5. Fix offline transport semantics so unavailable content cannot masquerade as verified empty content.

The order of release gates takes precedence over the numeric ranking: P0 security/privacy and educational acceptance must be cleared before public-beta invitation, while low-risk engineering fixes can proceed alongside evidence collection.

## 6. Architecture and scope guardrails for future work

- Do not implement a second FSRS scheduler or shadow learner model.
- Do not move selection authority, grading, recovery or persistence into React.
- Do not migrate or rewrite learner data absent a demonstrated defect and explicit migration/rollback tests.
- Do not equate a green CI run, feature coverage or full 2,136-item corpus coverage with educational efficacy.
- Do not trust PR body text over actual branch diffs, current HEAD, exact-head workflow results and production evidence.
- Do not use historical SHAs in claims about current main without comparing them to current HEAD.
- Every future audit should refresh this status from the actual repository and either preserve an open finding, add a dated resolution with evidence, or supersede it with a specific newer finding.
- Once a finding is fixed, update this handoff and ROADMAP.md with the fix's merge SHA, exact verification run(s), remaining acceptance-only items, and an explicit DO NOT REOPEN unless regression is observed.

## 7. Evidence index

- Current main commit: https://github.com/ArdKam/kanji5/commit/085524dc58547e33e42fcaff75784b0c6d3fe6b3
- Current-main React build: https://github.com/ArdKam/kanji5/actions/runs/38964130926
- Current-main Pages deployment: https://github.com/ArdKam/kanji5/actions/runs/38965141947
- Learning-card failed candidate gate: https://github.com/ArdKam/kanji5/actions/runs/38971761198
- Learning-card current-main candidate PR: https://github.com/ArdKam/kanji5/pull/558
- Live security smoke/acceptance candidate: https://github.com/ArdKam/kanji5/pull/554
- Educational acceptance record: ../EDUCATIONAL-CONTENT-AUDIT.md
- Security acceptance record: ../SECURITY-REVIEW.md
- Data lifecycle/governance evidence: ../RELEASE-EVIDENCE.md and ../LEGAL-REVIEW-CHECKLIST.md

**No application code was changed in the 2026-10-17 audit.** The findings above are a documented assessment and ordered plan, not assertions that proposed fixes have been implemented.
