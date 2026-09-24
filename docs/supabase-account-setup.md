# Kanji 5 — Account & cloud sync setup

This integration keeps Kanji 5 local-first while adding optional accounts and cloud synchronization. Google can be enabled later without changing the account boundary.

## 1. Create the Supabase project

Create a Supabase project and open its Authentication settings.

Run the SQL in [\`supabase/schema.sql\`](../supabase/schema.sql) in the Supabase SQL Editor. The table stores one JSON learning-state payload per authenticated user and is protected by Row Level Security.

## 2. Configure account sign-in

The Kanji5 account dialog currently supports:
- Email + password
- Magic link email sign-in
- Google (ready in the UI, but unavailable until the Google provider is configured)

Email/password and magic-link flows use Supabase Auth directly. Google can be enabled later by creating a Google OAuth client for a **Web application**, then entering its client ID and client secret in the Supabase Google provider configuration. Supabase Auth handles the Google callback before redirecting back to Kanji5.

For local development, register the local origin you actually use in the relevant redirect configuration.

## 3. Configure redirect URLs

In Supabase Authentication → URL Configuration:

- Set the production Site URL to the canonical Kanji 5 origin.
- Add the exact Kanji 5 production URL used by the app as an allowed redirect URL.
- Add the local development URL while testing locally.

The app sends \`location.origin + location.pathname\` as its OAuth \`redirectTo\`, so the configured redirect URL must match that deployed path.

## 4. Add the public browser configuration

Edit [\`supabase-config.js\`](../supabase-config.js) and replace the two placeholders:

\`\`\`js
window.KANJI5_SUPABASE = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};
\`\`\`

Do **not** put a service-role key in this file.

The public key is used only from the browser; database access is constrained by the RLS policies in [\`supabase/schema.sql\`](../supabase/schema.sql).

## 5. Verify the flow

A production smoke test should cover:

1. Open Kanji 5 while signed out.
2. Open the account control in the header.
3. Choose **Email & password** and test an existing account.
4. Test **Create account** with a new email.
5. Test **Magic link** and confirm the email returns to the same Kanji 5 URL.
6. Optionally configure Google and test **Continue with Google**.
7. Review a Kanji and confirm the account state becomes **Synced**.
8. Open Kanji 5 on a second device/browser, sign in with the same account, and verify that the learning state is restored.
9. Sign out and confirm the app remains usable in local guest mode.

## 6. Important architecture boundary

The React layer owns the account UI only.

\`\`\`
React account UI
      ↓
window.__KANJI5_ACCOUNT__
      ↓
Supabase Auth + sync transport
      ↓
v1.5/v1.6 merge + replay core
      ↓
existing local-first learning state
\`\`\`

The v1.9 engine, grading rules, learner model, adaptive planner, recovery, and FSRS remain authoritative.

## 7. Local data migration

A user can start as a guest. When that user signs in, the first sync merges the existing local learning state with the cloud state for that account. The sync core preserves concurrent review events rather than replacing the entire device state with a last-write-wins snapshot.
