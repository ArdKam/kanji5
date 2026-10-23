import assert from 'node:assert/strict';
import { DOMAIN_SCHEMA_VERSION, DOMAINS, legacyEducationDefinition, canonicalContentId, parseContentId, canonicalCardId, buildIdentity } from '../v2-domain-core.js';

assert.equal(DOMAIN_SCHEMA_VERSION,1);
assert.deepEqual(DOMAINS,['kanji','vocabulary','context','grammar']);

assert.deepEqual(legacyEducationDefinition('vocabulary'),{
  domain:'kanji',
  skill:'word-completion',
  exercise:'word-completion'
});
assert.equal(canonicalContentId('kanji','日'),'kanji:日');
assert.equal(canonicalContentId('kanji','kanji:日'),'kanji:日');
assert.equal(canonicalContentId('vocabulary','jmdict:123'),'vocabulary:jmdict:123');
assert.equal(canonicalContentId('context','tatoeba:123'),'context:tatoeba:123');
assert.equal(canonicalContentId('grammar','pattern:te-form'),'grammar:pattern:te-form');
assert.deepEqual(parseContentId('vocabulary:jmdict:123'),{domain:'vocabulary',sourceId:'jmdict:123'});
assert.deepEqual(parseContentId('context:tatoeba:123'),{domain:'context',sourceId:'tatoeba:123'});

const cardId=canonicalCardId({
  domain:'vocabulary',
  contentId:'vocabulary:jmdict:123',
  skill:'reading',
  exercise:'type-answer'
});
assert.equal(cardId,'card:vocabulary:jmdict:123:reading:type-answer');
assert.notEqual(
  canonicalCardId({domain:'vocabulary',contentId:'vocabulary:jmdict:123',skill:'meaning',exercise:'free-recall'}),
  cardId,
  'different learning cards must have distinct identities for the same content'
);
assert.notEqual(
  canonicalCardId({domain:'context',contentId:'context:tatoeba:123',skill:'reading',exercise:'type-answer'}),
  cardId,
  'content domain must remain part of card identity'
);

const identity=buildIdentity({domain:'kanji',sourceId:'日'});
assert.equal(identity.identitySchemaVersion,1);
assert.equal(identity.domain,'kanji');
assert.equal(identity.contentId,'kanji:日');
assert.ok(identity.cardId.startsWith('card:kanji:日:'));
assert.equal(buildIdentity({domain:'kanji',contentId:identity.contentId,skill:'reading',exercise:'free-recall'}).contentId,'kanji:日');

assert.throws(()=>canonicalContentId('audio','x'));
assert.throws(()=>canonicalContentId('kanji',''));

console.log('Kanji 5 P0 domain identity contract passed.');
