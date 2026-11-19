import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDesignerNotificationWorker,
  getQuietHoursResumeAt,
  isPrivateWhatsAppJid,
} from '../features/design-marketplace/notification-worker.js';

function fakeModels({ profile, notification, updates = [] }) {
  const DesignerProfile = {
    findOne() {
      return { select() { return { lean: async () => profile }; } };
    },
  };
  let delivered = false;
  const DesignerNotification = {
    findOneAndUpdate() {
      return {
        lean: async () => {
          if (delivered || !notification) return null;
          delivered = true;
          return { ...notification, whatsappAttempts: notification.whatsappAttempts ?? 1 };
        },
      };
    },
    async updateOne(filter, update) {
      updates.push({ filter, update });
      return { modifiedCount: 1 };
    },
  };
  return { DesignerProfile, DesignerNotification, updates };
}

test('private WhatsApp destinations reject group and malformed JIDs', () => {
  assert.equal(isPrivateWhatsAppJid('628123456789@s.whatsapp.net'), true);
  assert.equal(isPrivateWhatsAppJid('abc123@lid'), true);
  assert.equal(isPrivateWhatsAppJid('123@g.us'), false);
  assert.equal(isPrivateWhatsAppJid('not-a-jid'), false);
});

test('quiet hours support midnight-crossing windows and resume at configured end', () => {
  const now = new Date('2026-11-13T16:00:00.000Z'); // 23:00 WIB
  const resume = getQuietHoursResumeAt(now, '22:00', '08:00');
  assert.ok(resume);
  assert.equal(resume.toISOString(), '2026-11-14T01:00:00.000Z');
  assert.equal(getQuietHoursResumeAt(now, '08:00', '21:00'), null);
  assert.equal(getQuietHoursResumeAt(now, '08:00', '08:00'), null);
});

test('worker sends opted-in notification only to an allowlisted private JID', async () => {
  const updates = [];
  const notification = {
    notificationId: 'NTF-1', designerId: 'DSN-1', title: 'Project update',
    message: 'Ada update baru', whatsappAttempts: 1, createdAt: new Date('2026-11-13T04:30:00.000Z'),
  };
  const profile = {
    displayName: 'Designer', ownerJid: '628123456789@s.whatsapp.net',
    whatsappPushJid: '628123456789@s.whatsapp.net', whatsappPushEnabled: true,
    whatsappPushQuietHoursEnabled: false,
    whatsappPushEnabledAt: new Date('2026-11-13T04:00:00.000Z'),
  };
  const models = fakeModels({ profile, notification, updates });
  const sent = [];
  const worker = createDesignerNotificationWorker({
    ...models,
    sendMessage: async (jid, payload) => { sent.push({ jid, payload }); return { key: { id: 'msg-1' } }; },
    isDestinationAllowed: jid => jid === profile.whatsappPushJid,
    now: () => new Date('2026-11-13T05:00:00.000Z'),
    maxBatch: 1,
  });
  await worker.tick();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].jid, profile.whatsappPushJid);
  assert.match(sent[0].payload.text, /Designer Studio/i);
  assert.equal(updates[0].update.$set.whatsappDeliveryStatus, 'sent');
});

test('worker skips notifications when the owner has not opted in', async () => {
  const updates = [];
  const models = fakeModels({
    profile: { whatsappPushEnabled: false },
    notification: { notificationId: 'NTF-2', designerId: 'DSN-1', whatsappAttempts: 1 },
    updates,
  });
  let sent = 0;
  const worker = createDesignerNotificationWorker({
    ...models, sendMessage: async () => { sent += 1; return {}; }, maxBatch: 1,
  });
  await worker.tick();
  assert.equal(sent, 0);
  assert.equal(updates[0].update.$set.whatsappDeliveryStatus, 'skipped');
});

test('worker skips group destinations even if a permissive allowlist callback is supplied', async () => {
  const updates = [];
  const models = fakeModels({
    profile: {
      whatsappPushEnabled: true, whatsappPushJid: '123@g.us',
      whatsappPushQuietHoursEnabled: false,
    },
    notification: { notificationId: 'NTF-3', designerId: 'DSN-1', whatsappAttempts: 1 },
    updates,
  });
  let sent = 0;
  const worker = createDesignerNotificationWorker({
    ...models, sendMessage: async () => { sent += 1; return {}; },
    isDestinationAllowed: () => true, maxBatch: 1,
  });
  await worker.tick();
  assert.equal(sent, 0);
  assert.equal(updates[0].update.$set.whatsappDeliveryStatus, 'skipped');
});

test('worker retries failed delivery with a bounded delay', async () => {
  const updates = [];
  const models = fakeModels({
    profile: {
      whatsappPushEnabled: true, whatsappPushJid: '628123456789@s.whatsapp.net',
      whatsappPushQuietHoursEnabled: false,
      whatsappPushEnabledAt: new Date('2026-11-13T04:00:00.000Z'),
    },
    notification: { notificationId: 'NTF-4', designerId: 'DSN-1', whatsappAttempts: 1, createdAt: new Date('2026-11-13T04:30:00.000Z') },
    updates,
  });
  const now = new Date('2026-11-13T05:00:00.000Z');
  const worker = createDesignerNotificationWorker({
    ...models, sendMessage: async () => { throw new Error('temporary failure'); },
    isDestinationAllowed: () => true, now: () => now, maxBatch: 1, logger: { warn() {}, error() {} },
  });
  await worker.tick();
  assert.equal(updates[0].update.$set.whatsappDeliveryStatus, 'pending');
  assert.equal(updates[0].update.$set.whatsappNextAttemptAt.getTime(), now.getTime() + 60_000);
});

test('worker remains idle while the database is disconnected', async () => {
  let calls = 0;
  const models = fakeModels({ profile: {}, notification: null });
  const original = models.DesignerNotification.findOneAndUpdate;
  models.DesignerNotification.findOneAndUpdate = (...args) => { calls += 1; return original(...args); };
  const worker = createDesignerNotificationWorker({
    ...models, sendMessage: async () => ({}), isDatabaseReady: () => false, maxBatch: 1,
  });
  assert.equal(await worker.tick(), 0);
  assert.equal(calls, 0);
});


test('worker does not send backlog notifications created before the opt-in timestamp', async () => {
  const updates = [];
  const models = fakeModels({
    profile: {
      whatsappPushEnabled: true,
      whatsappPushJid: '628123456789@s.whatsapp.net',
      whatsappPushEnabledAt: new Date('2026-11-13T05:00:00.000Z'),
      whatsappPushQuietHoursEnabled: false,
    },
    notification: {
      notificationId: 'NTF-OLD', designerId: 'DSN-1', whatsappAttempts: 1,
      createdAt: new Date('2026-11-13T04:59:59.000Z'),
    },
    updates,
  });
  let sent = 0;
  const worker = createDesignerNotificationWorker({
    ...models, sendMessage: async () => { sent += 1; return {}; },
    isDestinationAllowed: () => true, maxBatch: 1,
  });
  await worker.tick();
  assert.equal(sent, 0);
  assert.equal(updates[0].update.$set.whatsappDeliveryStatus, 'skipped');
});


test('worker marks delivery failed after five total attempts', async () => {
  const updates = [];
  const models = fakeModels({
    profile: {
      whatsappPushEnabled: true,
      whatsappPushJid: '628123456789@s.whatsapp.net',
      whatsappPushEnabledAt: new Date('2026-11-13T04:00:00.000Z'),
      whatsappPushQuietHoursEnabled: false,
    },
    notification: {
      notificationId: 'NTF-5', designerId: 'DSN-1', whatsappAttempts: 5,
      createdAt: new Date('2026-11-13T04:30:00.000Z'),
    },
    updates,
  });
  const worker = createDesignerNotificationWorker({
    ...models,
    sendMessage: async () => { throw new Error('permanent failure'); },
    isDestinationAllowed: () => true,
    now: () => new Date('2026-11-13T05:00:00.000Z'),
    maxBatch: 1,
    logger: { warn() {}, error() {} },
  });
  await worker.tick();
  assert.equal(updates[0].update.$set.whatsappDeliveryStatus, 'failed');
});
