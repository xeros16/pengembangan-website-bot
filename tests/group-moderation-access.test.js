import test from 'node:test';
import assert from 'node:assert/strict';
import { createGroupModeration } from '../features/group-moderation.js';

test('unapproved groups do not run XP tracking, level-up notices, or moderation', async () => {
  let databaseTouched = false;
  let messageSent = false;
  const moderation = createGroupModeration({
    getDbReady: () => true,
    Group: { findOneAndUpdate: () => { databaseTouched = true; throw new Error('must not query'); } },
    User: {}, Warning: {}, ModerationLog: {},
    isGroupJid: jid => jid.endsWith('@g.us'),
    normalizeJid: jid => jid,
    isGroupAdmin: async () => false,
    isBotAdmin: async () => false,
    getMessageText: () => 'hello',
    isChatAllowed: () => false,
  });
  const result = await moderation.processGroupModeration({ sendMessage: async () => { messageSent = true; } }, {
    key: { remoteJid: '12345@g.us', participant: '628123456789@s.whatsapp.net' },
    message: { conversation: 'hello' },
  });
  assert.equal(result, false);
  assert.equal(databaseTouched, false);
  assert.equal(messageSent, false);
});
