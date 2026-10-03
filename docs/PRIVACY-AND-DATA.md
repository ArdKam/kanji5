# Kanji5 — Privacy & Data Notice

This document describes the current intended data model. It is not legal advice and requires a final legal review before broad public release.

## Stored locally

Kanji5 can store learner state, review history, session summaries, learner-model evidence, settings, prepared/personal mnemonic data, cached content, and Reading Lab text in browser storage when those features are used.

## Synchronized

Account synchronization is optional. When enabled, synchronization may transmit learner-state data required by the configured Supabase service. The application should never treat a third-party content provider as the authority for learner state.

## Raw learner input

The learning engine should persist educational outcomes and necessary evidence rather than retaining raw free-form learner input unless a feature explicitly requires it. Reading Lab text and personal annotations are feature-specific local data and must be treated as user-provided content.

## Backups

Backups are user-initiated JSON files containing the data represented by the backup schema. Users should treat backup files as sensitive because they can contain learning history and personal mnemonic content.

## Third parties currently represented in the runtime

The current repository/runtime includes:
- Supabase for optional authentication and learning-state synchronization;
- KanjiAPI for optional vocabulary content;
- Tatoeba for optional context-sentence content;
- KanjiVG data for stroke-order assets;
- a pinned Supabase browser-client CDN URL remains in the current sync implementation until vendoring is complete or a reviewed exception is approved.

The final public notice must state purposes, data flows, and applicable retention/deletion behavior for the exact production configuration.

## Account deletion and local data

The current production deletion endpoint removes the authenticated Supabase account; the related user_learning_state row is owned by that user and is deleted with the account relationship. The browser deliberately keeps local-first learning data after cloud-account deletion. Users therefore need an explicit local reset to remove data stored on a device.

The public release surface must explain these separate cloud-account and local-storage semantics.

## Export and restore

Settings provides versioned JSON backup export and restore with schema/checksum validation. Restore must not be described as a cloud export or as a complete deletion mechanism.

**Release requirement:** complete legal review against the actual target markets and production services before broad public release.
