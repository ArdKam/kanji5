import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const api = read("frontend/src/app/account.ts");
const client = read("supabase-sync.js");
const dialog = read("frontend/src/app/AccountDialog.tsx");
const erasure = read("frontend/src/app/LocalDataErasure.tsx");
const deployedFunction = read("supabase/functions/delete-account/index.ts");
const privacy = read("docs/PRIVACY-AND-DATA.md");

assert.match(api, /deleteAccount:\s*\(\)\s*=>\s*Promise<void>/, "typed account API must expose deletion");
assert.match(client, /functions\.invoke\('delete-account'/, "the browser must call the reviewed account deletion function");
assert.match(client, /result\?\.data\?\.deleted\s*!==\s*true/, "the browser must require an explicit success response");
assert.match(client, /AUTH_ACCOUNT_DELETE_FAILED/, "account deletion errors must be reported distinctly");
assert.match(client, /auth\.signOut\(\{\s*scope:\s*'local'\s*\}\)/, "successful deletion must clear only this browser's auth session");
assert.match(client, /setState\(\{\s*status:\s*'signed-out'/, "the local account state must become signed out after deletion");
assert.match(dialog, /deleteConfirmationText\s*!==\s*"DELETE"/, "deletion must require exact typed confirmation");
assert.match(dialog, /disabled=\{busy\s*\|\|\s*deleteConfirmationText\s*!==\s*"DELETE"\}/, "the destructive button must remain disabled until confirmed");
assert.match(dialog, /permanently deletes your account and synced cloud data/i, "cloud deletion scope must be disclosed");
assert.match(dialog, /local browser data and downloaded backups are separate and remain/i, "local-data separation must be disclosed");
assert.match(erasure, /Clears this browser's learning progress/i, "local erasure must remain a distinct flow");
assert.match(erasure, /does not delete your account or synced cloud data/i, "local erasure must not imply cloud deletion");
assert.match(deployedFunction, /withSupabase\(\{\s*auth:\s*"user"\s*\}/, "function auth must require a verified user");
assert.match(deployedFunction, /const userId = ctx\.userClaims\?\.id/, "the target identity must come from verified claims");
assert.match(deployedFunction, /req\.method !== "POST"[\s\S]*?status: 405[\s\S]*?Allow: "POST"/, "account deletion must reject non-POST methods before deleting");
assert.doesNotMatch(deployedFunction, /req\.json\(\)[\s\S]{0,500}userId/, "the function must not trust a request-body user ID");
assert.match(deployedFunction, /deleteUser\(userId,\s*false\)/, "account deletion must be hard deletion, not soft deletion");
assert.match(deployedFunction, /\{ deleted: true \}/, "success must be explicit");
assert.match(privacy, /Account deletion/i, "privacy documentation must cover account deletion");

console.log("Self-service account deletion contract: PASS");
