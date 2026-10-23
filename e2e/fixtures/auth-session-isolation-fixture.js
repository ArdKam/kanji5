// Local-only mocked Supabase fixture for the auth-session race regression.
// This file intentionally avoids inline scripts to work under the application's CSP.
window.__KANJI5_STORAGE__ = localStorage;
window.__KANJI5_STORAGE_KEYS__ = Object.freeze({
  deviceId: "kanji5-device-id",
  state: "kanji5-v1",
  cards: "kanji5-v1-cards",
  reviews: "kanji5-v1-reviews",
  knowledge: "kanji5-v1.2-knowledge",
  components: "kanji5-v1.5-components",
  lastAttempt: "kanji5-v1.2-last-attempt",
  sessionHistory: "kanji5-v1.6-session-history",
  deck: "kanji5-deck",
  deckVersion: "kanji5-deck-version",
  educationSettings: "kanji5-v1.3-education-settings",
  snapshot: "kanji5-v1-snapshot",
  snapshotCommit: "kanji5-v1-snapshot-commit",
  syncMeta: "kanji5-v1.2-sync-meta",
  reviewSummary: "kanji5-v1-review-summary"
});

const accountA = { id: "account-A", email: "account-a@example.invalid", user_metadata: {} };
const accountB = { id: "account-B", email: "account-b@example.invalid", user_metadata: {} };
const matchedUpdatedAt = "2026-10-23T19:00:00.000Z";
const harness = {
  listener: null,
  reads: [],
  writes: [],
  matchedUpdatedAt,
  authUser: accountA,
  delayInitialSession: Boolean(window.__KANJI5_INITIAL_SESSION_DELAY__),
  initialSessionPending: false,
  resolveBootSession(user) {
    if (typeof this.resolveBootSessionRequest !== "function") throw new Error("INITIAL_SESSION_NOT_PENDING");
    const resolve = this.resolveBootSessionRequest;
    this.resolveBootSessionRequest = null;
    this.initialSessionPending = false;
    resolve({ data: { session: { user } }, error: null });
  },
  switchTo(user) {
    this.authUser = user;
    this.listener?.("SIGNED_IN", { user });
  },
  resolveRead(index, response) {
    this.reads[index].settled = true;
    this.reads[index].resolve(response);
  }
};

window.__KANJI5_SUPABASE = {
  url: "https://auth-session-test.supabase.co",
  anonKey: "sb_publishable_test_only"
};
window.__KANJI5_OBSERVABILITY__ = { capture() {} };
window.__KANJI5_AUTH_SESSION_HARNESS__ = harness;
window.__KANJI5_FIXTURE_DIAGNOSTICS__ = { loaded: true, scriptError: null };
window.addEventListener("error", event => {
  window.__KANJI5_FIXTURE_DIAGNOSTICS__.scriptError = String(event.message || "SCRIPT_ERROR");
});

window.supabase = {
  createClient() {
    return {
      auth: {
        onAuthStateChange(callback) {
          harness.listener = callback;
          return { data: { subscription: { unsubscribe() {} } } };
        },
        getSession() {
          if (harness.delayInitialSession) {
            harness.initialSessionPending = true;
            return new Promise(resolve => { harness.resolveBootSessionRequest = resolve; });
          }
          return Promise.resolve({ data: { session: { user: harness.authUser } }, error: null });
        },
        async signOut() { return { error: null }; }
      },
      from(tableName) {
        if (tableName !== "user_learning_state") throw new Error("Unexpected table");
        const request = { operation: "select", userId: null, expectedUpdatedAt: null, payload: null };
        return {
          select() { return this; },
          eq(column, value) {
            if (column === "user_id") request.userId = value;
            if (column === "updated_at") request.expectedUpdatedAt = value;
            return this;
          },
          update(values) {
            request.operation = "update";
            request.payload = structuredClone(values.payload);
            return this;
          },
          insert(values) {
            request.operation = "insert";
            request.userId = values.user_id;
            request.payload = structuredClone(values.payload);
            return this;
          },
          maybeSingle() {
            if (request.operation === "select") {
              return new Promise(resolve => {
                harness.reads.push({
                  userId: request.userId,
                  settled: false,
                  resolve
                });
              });
            }
            harness.writes.push({
              operation: request.operation,
              userId: request.userId,
              expectedUpdatedAt: request.expectedUpdatedAt,
              payload: structuredClone(request.payload)
            });
            const updateMatches = request.operation !== "update"
              || request.expectedUpdatedAt === matchedUpdatedAt;
            return Promise.resolve({
              data: updateMatches ? { updated_at: matchedUpdatedAt } : null,
              error: null
            });
          }
        };
      }
    };
  }
};
