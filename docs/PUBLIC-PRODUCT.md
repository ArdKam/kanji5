# Rinemi — Public Product Guide

Rinemi is a local-first Japanese kanji learning PWA built around a focused daily loop:

**Learn → Recall → Review → Recover → Improve**

The current product teaches the 2,136 Jōyō kanji set. The learning engine uses FSRS for spaced review and an adaptive practice layer to decide which learning activity is useful next. Learner state remains authoritative in the engine; the React UI presents that state.

## What you do

**Learning** introduces or reviews a kanji and presents its meaning, readings, examples, mnemonic support, and stroke information.

**Active Recall** is deliberate practice. It asks you to retrieve information rather than simply read it.

**Review** records an FSRS rating (Again / Hard / Good / Easy) and updates the authoritative learner state.

The app is designed for short, repeatable daily practice rather than long study sessions.

## Accounts

Rinemi is designed to work without mandatory sign-up. An account is optional and is intended for persistence/recovery and, where configured, cross-device synchronization.

Creating an account should not be required to start learning.

## Offline

Core learning is designed to continue offline after the required local assets have been cached. Network-dependent features such as account synchronization or optional external content providers may degrade gracefully while offline.

## Data

Learner progress is stored locally by default. Backup/Restore is available in Settings. Backups are versioned and integrity-checked before restore.

See [Privacy & Data](PRIVACY-AND-DATA.md) and [Browser Support](BROWSER-SUPPORT.md).

## Support

Use the public issue/feedback path described in [Feedback](FEEDBACK.md). Include the browser/platform and a short description; do not paste private learner data or account credentials.

## FSRS, briefly

FSRS is the scheduling authority for card review. Adaptive planning chooses practice content and skills; it does not replace FSRS with another scheduler.
