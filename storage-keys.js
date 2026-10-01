(()=>{
'use strict';
if(window.__KANJI5_STORAGE_KEYS__)return;
const KEYS=Object.freeze({
  deviceId:'kanji5-device-id',
  state:'kanji5-v1',
  cards:'kanji5-v1-cards',
  reviews:'kanji5-v1-reviews',
  knowledge:'kanji5-v1.2-knowledge',
  components:'kanji5-v1.5-components',
  lastAttempt:'kanji5-v1.2-last-attempt',
  sessionHistory:'kanji5-v1.6-session-history',
  deck:'kanji5-deck',
  deckVersion:'kanji5-deck-version',
  educationSettings:'kanji5-v1.3-education-settings',
  snapshot:'kanji5-v1-snapshot',
  snapshotCommit:'kanji5-v1-snapshot-commit',
  syncMeta:'kanji5-v1.2-sync-meta'
});
Object.defineProperty(window,'__KANJI5_STORAGE_KEYS__',{value:KEYS,writable:false,configurable:false,enumerable:false});
})();
