# Security Policy

## Reporting a vulnerability

Do **not** disclose security vulnerabilities in a public GitHub issue.

Use GitHub’s private vulnerability-reporting/security-advisory mechanism when available. If private reporting is not available, use a maintainer-controlled private channel before publishing technical details. Do not include credentials, session tokens, private backups, or unnecessary personal data.

## In scope

- XSS or unsafe DOM execution
- authentication/session handling
- Supabase RLS or unauthorized reads/writes
- backup/restore tampering or privilege escalation
- dependency/supply-chain issues
- secret or source-map exposure
- third-party runtime injection
- service-worker/cache attacks
- privacy-sensitive data leakage

## Release handling

Security fixes should be focused, reviewed, regression-tested, and released through the frozen-SHA procedure. Do not make public claims about severity or remediation before verification.

**Privacy/account requests are not security reports.** The project currently has no dedicated private privacy/account-request channel; that remains a public-release blocker.
