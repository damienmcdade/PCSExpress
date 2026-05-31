/*
 * Unit tests for the in-memory backend of the push subscription store
 * (server/lib/pushStore.js). The Postgres backend is exercised by an
 * integration check against the real Railway DB (not in CI), but the
 * memory backend — the no-DATABASE_URL default and the automatic
 * fallback path — is pure and tested here.
 *
 * Run: npm run test:unit
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPushStore } from '../../server/lib/pushStore.js';

const mkSub = (n) => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/endpoint-${n}`,
  keys: { p256dh: 'P'.repeat(80), auth: 'A'.repeat(24) },
});

test('createPushStore: no DATABASE_URL → memory backend', async () => {
  const store = createPushStore({});
  assert.equal(await store.backendKind(), 'memory');
});

test('memory store: upsert + get roundtrip preserves shape', async () => {
  const store = createPushStore({});
  const sub = mkSub(1);
  await store.upsert(sub);
  const got = await store.get(sub.endpoint);
  assert.deepEqual(got, { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
});

test('memory store: upsert is idempotent (no duplicate rows)', async () => {
  const store = createPushStore({});
  const sub = mkSub(2);
  await store.upsert(sub);
  await store.upsert(sub);
  assert.equal(await store.size(), 1);
});

test('memory store: upsert updates keys on re-subscribe', async () => {
  const store = createPushStore({});
  const sub = mkSub(3);
  await store.upsert(sub);
  await store.upsert({ endpoint: sub.endpoint, keys: { p256dh: 'Q'.repeat(80), auth: 'B'.repeat(24) } });
  const got = await store.get(sub.endpoint);
  assert.equal(got.keys.p256dh, 'Q'.repeat(80));
  assert.equal(await store.size(), 1);
});

test('memory store: all() returns every stored subscription', async () => {
  const store = createPushStore({});
  await store.upsert(mkSub(10));
  await store.upsert(mkSub(11));
  const all = await store.all();
  assert.equal(Array.isArray(all), true);
  assert.equal(all.length, 2);
  assert.equal(all.every(s => s.endpoint && s.keys?.p256dh && s.keys?.auth), true);
});

test('memory store: remove deletes the subscription', async () => {
  const store = createPushStore({});
  const sub = mkSub(20);
  await store.upsert(sub);
  await store.remove(sub.endpoint);
  assert.equal(await store.get(sub.endpoint), null);
  assert.equal(await store.size(), 0);
});

test('memory store: get on missing endpoint returns null (no throw)', async () => {
  const store = createPushStore({});
  assert.equal(await store.get('https://fcm.googleapis.com/fcm/send/nope'), null);
});

test('memory store: close() is a no-op that does not throw', async () => {
  const store = createPushStore({});
  await assert.doesNotReject(() => store.close());
});
