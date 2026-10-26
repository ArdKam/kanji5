import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("supabase-sync.js", "utf8");

function block(startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, label + " block must exist");
  return source.slice(start, end);
}

assert.match(source, /let authGeneration = 0;/, "Session changes must invalidate in-flight work");
assert.match(source, /function captureAuthSession\(\)[\s\S]*?userId: String\(user\.id\), generation: authGeneration/, "Each operation must capture immutable user identity and generation");
assert.match(source, /function assertCurrentAuthSession\(session\)[\s\S]*?AUTH_SESSION_CHANGED/, "A stale operation must fail closed");

const readRemote = block("async function readRemote(session)", "async function replaceRemote", "readRemote");
assert.match(readRemote, /assertCurrentAuthSession\(session\)/, "Remote reads must guard the active session");
assert.match(readRemote, /\.eq\(['"]user_id['"], session\.userId\)/, "Remote reads must be scoped to the captured identity");
assert.doesNotMatch(readRemote, /\.eq\(['"]user_id['"],\s*user\.id\)/, "Remote reads must not use the mutable global user");

const replaceRemote = block("async function replaceRemote(payload, session", "async function withSyncLock", "replaceRemote");
assert.match(replaceRemote, /\.eq\(['"]user_id['"], session\.userId\)/, "Remote updates must use the captured identity");
assert.match(replaceRemote, /insert\(\{\s*user_id:\s*session\.userId,\s*payload:/, "First remote writes must use the captured identity");
assert.match(replaceRemote, /assertCurrentAuthSession\(session\)/, "Remote writes must verify session validity around asynchronous work");
assert.doesNotMatch(replaceRemote, /user_id:\s*user\.id/, "Remote writes must not resolve ownership from the mutable global user");

const syncOnce = block("async function syncOnce(session)", "async function syncNow()", "syncOnce");
assert.match(syncOnce, /await readRemote\(session\)/, "A sync must pass its captured session through the read path");
assert.match(syncOnce, /await replaceRemote\(merged, session, remoteRow\.updatedAt\)/, "A sync must pass its captured session through the write path");
assert.match(syncOnce, /assertCurrentAuthSession\(session\);[\s\S]*?writeLocal\(merged, remoteRow\.updatedAt\)/, "Stale cloud results must not be applied to local learner data");
assert.match(syncOnce, /assertCurrentAuthSession\(session\);[\s\S]*?writeLocal\(local, result\.updatedAt\)/, "Initial sync results must be session-fenced before local persistence");

const lock = block("async function withSyncLock(task, generation)", "function setSyncStatus", "withSyncLock");
assert.match(lock, /activeSyncGeneration !== generation/, "A different account must not silently reuse the current sync task");
assert.match(lock, /pendingAuthSyncGeneration = generation/, "A new account must queue a follow-up sync behind the old task");
assert.match(lock, /authGeneration === nextGeneration[\s\S]*?scheduleSync\(\)/, "Only the still-current account may receive the queued sync");

const syncNow = block("async function syncNow()", "function scheduleSync()", "syncNow");
assert.match(syncNow, /const session = captureAuthSession\(\)/, "Sync must take a session snapshot");
assert.match(syncNow, /error\?\.code === 'AUTH_SESSION_CHANGED' \|\| !isCurrentAuthSession\(session\)/, "Session changes must cancel stale sync quietly");
assert.doesNotMatch(syncNow, /await syncOnce\(\)/, "Sync must not start without its session snapshot");

const authHandler = block("c.auth.onAuthStateChange((event, session) =>", "const { data, error } = await c.auth.getSession()", "auth-state callback");
assert.match(authHandler, /previousUserId !== nextUserId \|\| event === 'SIGNED_OUT' \|\| event === 'USER_DELETED'/, "Identity changes, sign-out, and deletion must invalidate prior work");
assert.match(authHandler, /authGeneration \+= 1/, "Auth transitions must advance the session generation");
assert.match(source, /const generationBeforeGetSession = authGeneration;[\s\S]*?if \(authGeneration === generationBeforeGetSession\) \{[\s\S]*?user = data\.session\?\.user \|\| null;/, "A late getSession response must not replace a newer auth-state event");

for (const [name, end] of [
  ["async updateProfile(name)", "async updatePassword"],
  ["async updatePassword(currentPassword, newPassword)", "async sendMagicLink"],
  ["async setPassword(newPassword)", "async signOut()"],
]) {
  const method = block(name, end, name);
  assert.match(method, /const session = captureAuthSession\(\)/, name + " must capture the active identity");
  assert.match(method, /assertCurrentAuthSession\(session\)/, name + " must not apply results from a stale session");
}

console.log("Auth session-isolation contract passed.");
