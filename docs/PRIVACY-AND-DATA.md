# Kanji5 — Privacy & Data Notice

This document describes the current intended data model. It is not legal advice and requires a final legal review before broad public release.

## Stored locally

Kanji5 can store learner state, review history, session summaries, learner-model evidence, settings, prepared/personal mnemonic data, and cached content in browser storage.

## Synchronized

Account synchronization is optional. When enabled, synchronization may transmit learner-state data required by the configured sync service. The application should never treat a third-party content provider as the authority for learner state.

## Raw learner input

The learning engine should persist educational outcomes and necessary evidence rather than retaining raw free-form learner input unless a feature explicitly requires it.

## Backups

Backups are user-initiated JSON files containing the data represented by the backup schema. Users should treat backup files as sensitive because they can contain learning history and personal mnemonic content.

## Third parties

The final public notice must list the actual services/providers used in the production deployment, their purposes, and applicable retention/deletion behavior. This includes authentication/synchronization infrastructure and any optional content providers.

## Account deletion and export

The public release surface must document the exact account deletion, local-data deletion, and export semantics implemented by the production backend before launch.

**Release requirement:** complete legal review against the actual target markets and production services before broad public release.
