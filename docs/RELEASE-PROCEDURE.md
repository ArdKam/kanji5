# Kanji5 — Release Procedure

This procedure is based on exact-SHA evidence rather than branch state or open PRs.

## 1. Prepare

- Start from current `main`.
- Keep the candidate scope explicit.
- Reconcile README, CHANGELOG, roadmap, product metadata, privacy/terms, third-party notices, and release evidence.
- Confirm no R11/R12/R13/Public Beta blocker is silently deferred.

## 2. Verify

Run the repository test suite and release-relevant checks required by the current roadmap. Do not turn local success into production evidence unless the same SHA passes CI.

## 3. Freeze

- Merge only intended release changes.
- Record the exact resulting SHA.
- Treat that SHA as immutable candidate input.
- Any subsequent fix creates a new candidate and repeats required gates.

## 4. Deploy and verify

Verify the exact-SHA Pages deployment, artifact equality, live smoke, offline smoke, stale-client/cache recovery, and applicable browser/device checks. Record results in `docs/RELEASE-EVIDENCE.md`.

## 5. Legal/governance gate

Before Public Beta/public release, verify:

- approved project LICENSE;
- final Privacy Policy;
- final Terms of Use;
- account deletion path and evidence;
- local-data deletion semantics;
- export/backup scope;
- approved retention policy;
- third-party/service disclosure;
- content licensing and attribution;
- private privacy/account request channel.

Unresolved legal decisions remain blockers.

## 6. Publish and rollback

Update CHANGELOG with user-visible changes and known limitations. Tag only the verified candidate SHA. Keep the previous known-good release available for rollback.

Do not release from a moving branch, treat green PR CI as deployment proof, publish legal language for unimplemented behavior, or use public issues for credentials/private backups/account or privacy requests.
