import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const feature = fs.readFileSync(path.join(root, 'features/design-marketplace/index.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'features/design-marketplace/notification-worker.js'), 'utf8');
const botModel = fs.readFileSync(path.join(root, 'models/design-marketplace.js'), 'utf8');
const websiteModel = fs.readFileSync(path.join(root, 'portfolio-website/models.js'), 'utf8');
const websiteServer = fs.readFileSync(path.join(root, 'portfolio-website/server.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.js'), 'utf8');
const access = fs.readFileSync(path.join(root, 'features/access-control.js'), 'utf8');

test('push requires explicit private-chat opt-in and can be disabled by the designer', () => {
  assert.match(feature, /handlePortfolioPushPreferences/);
  assert.match(feature, /Pengaturan push notifikasi hanya dapat diubah melalui chat pribadi/);
  assert.match(feature, /profile\.whatsappPushEnabled = true/);
  assert.match(feature, /profile\.whatsappPushEnabled = false/);
  assert.match(feature, /profile\.whatsappPushJid = destination/);
  assert.match(feature, /whatsappPushEnabledAt = new Date\(\)/);
});

test('both bot and website share the same push preferences and outbox fields', () => {
  for (const source of [botModel, websiteModel]) {
    assert.match(source, /whatsappPushEnabled/);
    assert.match(source, /whatsappPushEnabledAt/);
    assert.match(source, /whatsappPushQuietHoursStart/);
    assert.match(source, /whatsappDeliveryStatus/);
    assert.match(source, /whatsappLeaseToken/);
  }
});

test('worker only targets private, allowlisted destinations and checks opt-in age', () => {
  assert.match(worker, /isPrivateWhatsAppJid\(destination\)/);
  assert.match(worker, /isDestinationAllowed\(destination\)/);
  assert.match(worker, /notification\.createdAt.*whatsappPushEnabledAt/s);
  assert.match(worker, /whatsappPushEnabled: true/);
});

test('worker has leases, quiet hours, bounded retries, and manual inbox fallback', () => {
  assert.match(worker, /whatsappLeaseUntil/);
  assert.match(worker, /getQuietHoursResumeAt/);
  assert.match(worker, /RETRY_DELAYS_MS/);
  assert.match(feature, /handlePortfolioNotifications/);
});

test('worker is attached to WhatsApp connection lifecycle and does not bypass outbound guard', () => {
  assert.match(index, /guardSocketOutbound\(sock\)/);
  assert.match(index, /createDesignerNotificationWorker/);
  assert.match(index, /activeDesignerNotificationWorker\?\.start/);
  assert.match(index, /activeDesignerNotificationWorker\?\.stop/);
});


test('linked designer private inbox exception is identity-scoped and does not grant group access', () => {
  assert.match(index, /privateNotificationCommand/);
  assert.match(index, /ownerJid: \{ \$in: \[sender, remote\] \}/);
  assert.match(index, /!isInboundChatAllowed[\s\S]*!linkedDesignerNotificationAccess/);
  assert.match(access, /registerLinkedDesignerDestination/);
  assert.match(access, /if \(!normalized\.endsWith\('@g\.us'\) && linkedDesignerDestinations\.has\(normalized\)\)/);
});


test('Designer Studio explains push opt-in/out and quiet-hour controls', () => {
  assert.match(websiteServer, /id="notification-push-settings"/);
  assert.match(websiteServer, /\.portfolio notifikasi push aktif/);
  assert.match(websiteServer, /\.portfolio notifikasi push nonaktif/);
  assert.match(websiteServer, /Jam tenang/);
});
