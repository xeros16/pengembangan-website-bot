import test from 'node:test';
import assert from 'node:assert/strict';
import { formatWebsiteNotificationRows, isPrivateNotificationContext } from '../features/design-marketplace/notifications.js';

test('website notification inbox rejects group contexts and permits private chats', () => {
  assert.equal(isPrivateNotificationContext({ isGroup: true, remoteJid: 'group@g.us' }), false);
  assert.equal(isPrivateNotificationContext({ isGroup: false, remoteJid: 'group@g.us' }), false);
  assert.equal(isPrivateNotificationContext({ isGroup: false, remoteJid: 'user@s.whatsapp.net' }), true);
});

test('notification renderer formats website events in Indonesian local time', () => {
  const message = formatWebsiteNotificationRows([
    { title: 'Karya disetujui', message: 'Portfolio kamu sudah dipublikasikan.', createdAt: '2026-11-13T08:00:00.000Z', readAt: null },
  ], 'Designer Test', 'unread', 2);
  assert.match(message, /NOTIFIKASI DESIGNER STUDIO/);
  assert.match(message, /Karya disetujui/);
  assert.match(message, /Portfolio kamu sudah dipublikasikan/);
  assert.match(message, /Sisa notifikasi belum dibaca: 2/);
});

test('notification renderer strips control characters and caps untrusted text', () => {
  const message = formatWebsiteNotificationRows([
    { title: 'A'.repeat(150) + '\nInjected', message: 'x'.repeat(700) + '\u0000', createdAt: 'invalid' },
  ], 'Designer\nTest', 'all', 0);
  assert.doesNotMatch(message, /\u0000/);
  assert.doesNotMatch(message, /Designer\nTest/);
  assert.ok(message.length < 900);
  assert.match(message, /Waktu tidak tersedia/);
});

test('notification history mode does not imply that notifications were marked read', () => {
  const message = formatWebsiteNotificationRows([
    { title: 'Pesan baru', message: 'Ada aktivitas di website.', createdAt: new Date(), readAt: null },
  ], 'Designer', 'all', 0);
  assert.match(message, /notifikasi terbaru/);
  assert.match(message, /Gunakan \.portfolio notifikasi/);
});
