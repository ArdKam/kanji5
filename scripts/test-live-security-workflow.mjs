import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/live-security-audit.yml"), "utf8");
const scriptPath = path.join(root, "scripts/run-live-security-smoke.mjs");
const script = fs.readFileSync(scriptPath, "utf8");

assert.match(workflow, /^on:\s*\n\s+workflow_dispatch:/m, "Live security audit must be manually triggered");
assert.doesNotMatch(workflow, /^\s+(?:pull_request|push|schedule):/m, "Live probes must not run automatically on PRs or pushes");
assert.match(workflow, /KANJI5_LIVE_URL:\s*https:\/\/ardkam\.github\.io\/kanji5/);
assert.match(workflow, /node scripts\/run-live-security-smoke\.mjs/);
assert.match(workflow, /zap-baseline\.py/);
assert.match(workflow, /name: rinemi-zap-passive-baseline/);
assert.match(script, /user_learning_state\?select=user_id&limit=1/, "The Supabase check must remain a read-only limited query");
assert.match(script, /STRICT_SECURITY_AUDIT_FAILED/, "Confirmed security findings must produce a visible failing audit result");
assert.match(script, /Response contents suppressed|response body suppressed|contents suppressed/i, "Audit must suppress private response bodies from logs");

const syntax = spawnSync(process.execPath, ["--check", scriptPath], { cwd: root, encoding: "utf8" });
assert.equal(syntax.status, 0, "Live security script must parse: " + String(syntax.stderr || syntax.stdout));

console.log("Manual live-security workflow and read-only audit contracts passed.");
