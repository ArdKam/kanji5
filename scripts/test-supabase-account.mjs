import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const index = read("index.html");
const sync = read("supabase-sync.js");
const core = read("v1.5-sync-core.js");
const account = read("frontend/src/app/account.ts");
const dialog = read("frontend/src/app/AccountDialog.tsx");
const schema = read("supabase/schema.sql");

assert.match(index, /supabase-config\.js/);
assert.match(index, /supabase-sync\.js/);
assert.match(sync, /signInWithOAuth\(\{\s*provider:\s*[\'\"]google[\'\"]/);
assert.match(sync, /__KANJI5_ACCOUNT__/);
assert.match(sync, /signInWithPassword/);
assert.match(sync, /signUpWithPassword/);
assert.match(sync, /signInWithOtp/);
assert.match(account, /signInWithPassword/);
assert.match(account, /sendMagicLink/);
assert.match(sync, /user_learning_state/);
assert.match(sync, /replaceRemote/);
assert.match(sync, /mergeSyncPayload/);
assert.doesNotMatch(sync, /querySelector\("header > div:last-child"\)/, "Auth/sync transport must not inject legacy DOM into the React shell");
assert.match(core, /sessionHistory/);
assert.match(core, /skillProfile/);
assert.match(core, /v16SyncSchemaVersion/);
assert.match(account, /getAccountApi/);
assert.match(dialog, /googleComingSoon/);
assert.match(dialog, /emailPassword/);
assert.match(dialog, /magicLink/);
assert.match(schema, /enable row level security/);
assert.match(schema, /auth\.uid\(\).*user_id/);

console.log("Kanji 5 Supabase account integration contract passed.");
\nassert.match(sync, /cdn\.jsdelivr\.net\/npm\/\@supabase\/supabase-js\@2\.57\.4\/\+esm/);
assert.match(sync, /dist\/umd\/supabase\.js/);\n