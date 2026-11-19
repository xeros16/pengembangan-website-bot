import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { grantSubscription, getSubscription, listSubscriptions, revokeSubscription } from '../features/subscription-store.js';

async function withTempStore(run) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pir-subscriptions-'));
  const file = path.join(dir, 'subscriptions.json');
  try { await run(file); } finally { await fs.rm(dir, { recursive: true, force: true }); }
}

test('subscription grant, identity lookup, extension, and revoke work', async () => withTempStore(async file => {
  const now = Date.parse('2026-01-01T00:00:00.000Z');
  const first = await grantSubscription('628123456789', 30, 'owner', { file, now });
  assert.equal(first.jid, '628123456789@s.whatsapp.net');
  assert.equal((await getSubscription(['628123456789@s.whatsapp.net'], { file, now: now + 1 })).active, true);
  const extended = await grantSubscription('628123456789@s.whatsapp.net', 5, 'owner', { file, now: now + 1000 });
  assert.equal(Date.parse(extended.expiresAt), Date.parse(first.expiresAt) + 5 * 86400000);
  assert.equal((await listSubscriptions({ file, now })).length, 1);
  assert.equal((await revokeSubscription('628123456789', { file })).existed, true);
  assert.equal(await getSubscription(['628123456789@s.whatsapp.net'], { file, now }), null);
}));

test('subscription rejects invalid target and duration', async () => withTempStore(async file => {
  await assert.rejects(grantSubscription('abc', 30, 'owner', { file }), /nomor WhatsApp/);
  await assert.rejects(grantSubscription('628123456789', 0, 'owner', { file }), /1–3650 hari/);
}));

test('expired subscriptions do not grant access', async () => withTempStore(async file => {
  const now = Date.parse('2026-01-01T00:00:00.000Z');
  await grantSubscription('628123456789', 1, 'owner', { file, now });
  assert.equal(await getSubscription(['628123456789@s.whatsapp.net'], { file, now: now + 86400000 }), null);
}));
