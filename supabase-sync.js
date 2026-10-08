    sessionHistory: Array.isArray(history) ? history : [],
    components: components && typeof components === 'object' ? components : {},
    skillProfile: components?.v16SkillProfile && typeof components.v16SkillProfile === 'object' ? components.v16SkillProfile : null
  };
}

function safeJSON(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
}

function assertSyncPayloadWithinLimit(payload) {
  const json = JSON.stringify(stablePayload(payload || {}));
  const bytes = typeof TextEncoder === 'function' ? new TextEncoder().encode(json).byteLength : json.length;
  if (bytes > MAX_SYNC_PAYLOAD_BYTES) throw new Error('SYNC_PAYLOAD_TOO_LARGE');
  return payload;
}

function readSyncSummary() {
  const cards = safeJSON(storage.getItem(CARDS_STORAGE_KEY), {});
  const reviews = safeJSON(storage.getItem(REVIEWS_STORAGE_KEY), []);
  const reviewSummary = safeJSON(storage.getItem(REVIEW_SUMMARY_KEY), null);