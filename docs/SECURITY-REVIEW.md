# Kanji5 — Public Release Security Review

## Current boundary

The learning engine is authoritative and React is presentation-only. External content is data, not learning authority.

## Required checks

- untrusted external text must never be inserted into React HTML without an explicit trusted transformation
- legacy `innerHTML` paths remain isolated to compatibility/runtime UI and must not receive raw provider content
- Supabase Auth and RLS must be reviewed for unauthorized reads/writes
- backup files are integrity-checked before restore
- production secrets must not be shipped to the browser
- dependency and supply-chain risks must be reviewed
- third-party URLs/dependencies should remain explicit and documented

The release test suite includes a source-level boundary check for React code and keeps the legacy HTML paths visible for audit.

## Outstanding release evidence

A final security sign-off still requires review of the production Supabase project/RLS policies, dependency audit output, production headers/CSP policy, and the exact third-party services enabled in deployment.
