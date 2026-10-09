# Rinemi — Terms of Use (Legal Review Draft)

**Draft for owner/counsel review. Not final legal text.**

## Product

Rinemi is an educational browser application for Japanese kanji study. The current product is local-first with optional account synchronization.

These draft terms do not create a contractual guarantee of availability, accuracy, or learning outcomes. Final legal text must be written for the actual business model and target markets.

## Accounts

Account creation is optional. The current account surface supports email/password, magic links, Google sign-in, password reset/change, profile display name, sign-out, and optional synchronization through Supabase.

Final terms must define account eligibility, user responsibilities, suspension/termination, and any requirements applicable to future paid or restricted services.

## Data and local-first behavior

Core learning data is stored locally by default. Optional synchronization can transmit the supported learner-state payload to the configured Supabase service.

The current application does **not** expose an end-user account-deletion operation. The Settings reset action resets learning progress within its defined scope and is not complete browser-data erasure.

Final terms must not promise deletion, retention, export rights, or other user rights beyond the approved production implementation and applicable law.

## Backups and restore

Users can create a versioned JSON backup and restore it locally. Backups are user-controlled files and may contain learning history and personal mnemonic content.

The backup is not a cloud backup service and is not a complete export of every browser-held datum.

## User-provided content

Users may create personal mnemonics and enter Reading Lab text/annotations. Final terms must define ownership, permissions needed to operate the product, prohibited content, and treatment of user content on account closure/deletion.

## External services and content

The current repository/runtime represents Supabase, Google OAuth when selected, KanjiAPI/EDRDG-derived content, Tatoeba, KanjiVG, GitHub Pages/Issues, and vendored runtime dependencies. Final public disclosures must match the actual production configuration.

Third-party services and content remain subject to their own terms and licenses.

## Availability and changes

Final terms must define any applicable availability commitments, service changes, suspension/termination rights, and notice obligations. The repository draft does not make those commitments.

## Intellectual property and licensing

The project-level software license has not yet been approved. Third-party software, fonts, datasets, and content remain under their own applicable licenses and attribution requirements.

## Disclaimers and legal terms

Final counsel review is required for warranties, learning-outcome disclaimers, limitation of liability, governing law, dispute handling, consumer protections, age/child-user treatment, privacy rights, and cross-border transfer requirements.

## Legal-release gate

Do not publish this draft as final Terms of Use until the production account flow, deletion path, retention model, third-party configuration, licensing, target markets, and required user-rights/request channels have been reviewed and approved.
